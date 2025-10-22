import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { subscribeToNip78Events } from "../helpers/nostr";
import getIdentityNostrApi from "../helpers/identityNostrApi";
import { identityDocDtag, processRemoteDoc } from "../helpers/processDocs";
import { toast } from "react-toastify";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { selectLiveSourceIds } from "@/State/scoped/backups/sources/selectors";
import { AppDispatch, RootState } from "@/State/store/store";
import { identityActions, selectFavoriteSourceId } from "@/State/scoped/backups/identity/slice";
import { getDeviceId } from "@/constants";
import { Filter } from "nostr-tools";



type SubCloser = { close: () => void };

function createEventQueue<T>() {
	const buf: T[] = [];
	const waiters: Array<(v: T) => void> = [];
	return {
		push(v: T) {
			const w = waiters.shift();
			if (w) w(v);
			else buf.push(v);
		},
		next(): Promise<T> {
			if (buf.length) return Promise.resolve(buf.shift()!);
			return new Promise<T>(res => waiters.push(res));
		},
		clear() { buf.length = 0; waiters.length = 0; }
	};
}





export const addDocsPullerListener = (startAppListening: AppstartListening) => {
	startAppListening({
		actionCreator: identityLoaded,
		effect: async (action, listnerApi) => {
			listnerApi.unsubscribe();
			const identity = action.payload.identity;
			const pubkey = identity.pubkey;


			const identityApi = await getIdentityNostrApi(identity);

			let subCloser: SubCloser | null = null;

			const q = createEventQueue<string>();



			const filters: Filter[] = [
				{ kinds: [30078], authors: [pubkey], "#d": [identityDocDtag] },

				// 30079: source docs
				{ kinds: [30079], authors: [pubkey] },
			];

			try {

				subCloser = await subscribeToNip78Events(identityApi, filters, (decrypted) => {
					q.push(decrypted)
				});
			} catch {
				toast.error("Puller: docs subscribe failed");
				listnerApi.subscribe();
				return;
			}

			const applyTask = listnerApi.fork(async fork => {
				try {
					for (; ;) {
						const decrypted = await fork.pause(q.next());
						let parsed: unknown;
						try { parsed = JSON.parse(decrypted); } catch { continue; }
						await processRemoteDoc(parsed, listnerApi.dispatch);
					}
				} finally {
					try { subCloser?.close(); } catch (err) { console.error(err) }

					q.clear();
				}
			});



			const favoriteSourceIdInvariantTask = listnerApi.fork(async () => {
				try {
					for (; ;) {
						await listnerApi.condition((action) =>
							sourcesActions._createDraftDoc.match(action) ||
							sourcesActions.markDeleted.match(action) ||
							sourcesActions.applyRemoteSource.match(action)
						)

						ensureFavorite(listnerApi.dispatch, listnerApi.getState);
					}
				} catch {/*  */ }
			})



			// Tear down on identity unload
			await listnerApi.condition(identityUnloaded.match);
			applyTask.cancel();
			favoriteSourceIdInvariantTask.cancel();
			listnerApi.subscribe();
		}
	});
}

function ensureFavorite(dispatch: AppDispatch, getState: () => RootState) {
	const deviceId = getDeviceId();
	const state = getState();
	const ids = selectLiveSourceIds(state);
	const fav = selectFavoriteSourceId(state);

	if (ids.length === 0) {
		if (fav !== null) dispatch(identityActions.setFavoriteSource({ sourceId: null, by: deviceId }));
		return;
	}


	if (!fav || !ids.includes(fav)) {
		dispatch(identityActions.setFavoriteSource({ sourceId: ids[0], by: deviceId }));
	}
}
