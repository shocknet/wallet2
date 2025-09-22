import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { equalSet, identityActions, selectIdentityDraft } from "@/State/scoped/backups/identity/slice";

import { docsSelectors, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { subscribeToNip78Events } from "../helpers/nostr";
import getIdentityNostrApi from "../helpers/identityNostrApi";
import { getIdentityDocDtag, getSourceDocDtag, processRemoteDoc } from "../helpers/processDocs";
import { RootState } from "@/State/store/store";
import { toast } from "react-toastify";


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

async function computeWantedDtags(state: RootState, pubkey: string) {
	const idDoc = selectIdentityDraft(state)!;
	const identityD = getIdentityDocDtag(pubkey);

	const localIds = docsSelectors.selectIds(state);
	const localDtags = await Promise.all(localIds.map(id => getSourceDocDtag(pubkey, id)));

	const remoteDtags = idDoc.sources;


	return new Set<string>([identityD, ...localDtags, ...remoteDtags]);
}




export const addDocsPullerListener = (startAppListening: AppstartListening) => {
	startAppListening({
		actionCreator: identityLoaded,
		effect: async (action, listnerApi) => {
			listnerApi.unsubscribe();
			const identity = action.payload.identity;
			const pubkey = identity.pubkey;


			const identityApi = await getIdentityNostrApi(identity);

			// Current subscription state
			let currentDtags = new Set<string>();
			let subCloser: SubCloser | null = null;

			const q = createEventQueue<string>();

			async function resubscribe(nextDtags: Set<string>) {
				// no-op if unchanged
				if (equalSet(currentDtags, nextDtags)) return;

				// close previous
				try { subCloser?.close(); } catch (err) { toast.error(`${err}`) }
				subCloser = null;

				// open new
				console.log({ nextDtags })
				const filters = [{ kinds: [30078], authors: [pubkey], "#d": Array.from(nextDtags) }];
				subCloser = await subscribeToNip78Events(identityApi, filters, (decrypted) => {
					console.log("Got event", JSON.parse(decrypted))
					q.push(decrypted)
				});
				currentDtags = nextDtags;
			}

			// initial subscribe
			try {
				const wanted = await computeWantedDtags(listnerApi.getState(), pubkey);
				console.log({ wanted })
				await resubscribe(wanted);
			} catch {
				toast.error("Initial docs subscribe failed:");
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
				} catch (err) {
					console.log("STOPPED?", err)

				} finally {
					try { subCloser?.close(); } catch (err) { console.error(err) }

					q.clear();
				}
			});

			const watchTask = listnerApi.fork(async () => {
				let timer: ReturnType<typeof setTimeout> | null = null;
				let pending = false;

				const schedule = () => {
					if (pending) return;
					pending = true;
					timer = setTimeout(async () => {
						pending = false;
						try {
							console.log("HERE MAYBE?")
							const wanted = await computeWantedDtags(listnerApi.getState(), pubkey);
							await resubscribe(wanted);
						} catch (err) {
							console.error(err);
						}
					}, 150);
				};

				try {
					for (; ;) {
						const action = await listnerApi.take((action) => {
							return sourcesActions._createDraftDoc.match(action) || identityActions.addSourceDocDTag.match(action)
						});
						console.log("matched actions:::::", action)
						schedule();
					}
				} finally {
					if (timer) clearTimeout(timer);
				}
			});


			// Tear down on identity unload
			await listnerApi.condition(identityUnloaded.match);
			applyTask.cancel();
			watchTask.cancel();
			listnerApi.subscribe();
		}
	});
}
