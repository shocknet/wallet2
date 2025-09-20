import { startAppListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { IdentityType } from "../types";
import { selectIdentityDraft } from "@/State/scoped/backups/identity/slice";
import { getIdentityDocDtag, getSourceDocDtag, processRemoteDoc } from "./helpers";


import { TaskAbortError } from "@reduxjs/toolkit";
import { docsSelectors, sourcesActions } from "@/State/scoped/backups/sources/slice";


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
		}
	};
}


startAppListening({
	actionCreator: identityLoaded,
	effect: async (action, listnerApi) => {
		listnerApi.unsubscribe();
		const activeIdentity = action.payload.identity
		if (!activeIdentity || activeIdentity.type !== IdentityType.LOCAL_KEY) {
			listnerApi.subscribe();
			return;
		}

		const identity = selectIdentityDraft(listnerApi.getState())
		const indentityDocDtag = getIdentityDocDtag(activeIdentity.pubkey)

		const sourceIds = docsSelectors.selectIds(listnerApi.getState());
		const localDtags = await Promise.all(sourceIds.map(id => getSourceDocDtag(activeIdentity.pubkey, id)));

		const allDtags = new Set([...localDtags, ...identity!.sources]);

		const q = createEventQueue<string>();

		let subCloser;


		const listenForNewSourcesTask = listnerApi.fork(async (forkApi) => {

			for (; ;) {
				const result = await listnerApi.take((action, currentState, originalState) => {
					return sourcesActions._createDraftDoc.match(action) ||
						selectIdentityDraft(currentState)!.sources !== selectIdentityDraft(originalState)!.sources
				});
				const identity = selectIdentityDraft(result[1])!;
				const indentityDocDtag = getIdentityDocDtag(activeIdentity.pubkey)

				const sourceIds = docsSelecrtors.selectIds(result[1]);
				const localDtags = await Promise.all(sourceIds.map(id => getSourceDocDtag(activeIdentity.pubkey, id)));

				const allDtags = new Set([...localDtags, ...identity!.sources]);


			}

		})


		try {
			subCloser = await subscribeToNip78DocEvents(
				[
					{ kinds: [30078], authors: [activeIdentity.pubkey], '#d': [indentityDocDtag, ...allDtags] }
				],
				activeIdentity,
				(decrypted) => q.push(decrypted)
			);

		} catch (err) {
			console.error("Something went wrong with subbing to nostr docs: ", err);
			listnerApi.subscribe();
			return;
		}


		const subToNostrDocsTask = listnerApi.fork(async (forkApi) => {
			try {
				for (; ;) {
					const decrypted = await forkApi.pause(q.next());
					let parsed
					try {
						parsed = JSON.parse(decrypted)
					} catch {
						continue; // ignore
					}

					processRemoteDoc(parsed, listnerApi.dispatch);

				}
			} catch (err) {
				if (err instanceof TaskAbortError) {
					console.info("subToNostrDocsTask cancelled gracefully")
				}
			} finally {
				try { subCloser.close(); } catch { /*  */ }
			}
		})

		await listnerApi.condition(identityUnloaded.match);
		subToNostrDocsTask.cancel();
		listnerApi.subscribe();
	}
})

startAppListening({
	actionCreator: sourcesActions.markDeleted,
	effect: async (action, api) => {
		api.unsubscribe()
		api.dispatch(sourceTombstoned({ sourceId: action.payload.sourceId }))
	},
})

startAppListening({
	actionCreator: sourcesActions.applyRemoteSource,
	effect: async (action, listenerApi) => {
		const { sourceId } = action.payload
		const source = sourcesSelectors.selectById(listenerApi.getState(), sourceId);

		if (source && source.draft.deleted.value) {
			listenerApi.dispatch(sourceTombstoned({ sourceId }));
		}
	},
})
