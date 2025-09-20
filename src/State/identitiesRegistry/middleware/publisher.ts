import { startAppListening } from "@/State/store/listenerMiddleware";
import { isAnyOf, TaskAbortError } from "@reduxjs/toolkit";
import { IdentityType } from "../types";


import { identityActions, selectIdentityDraft, selectIsIdentityDirty } from "@/State/scoped/backups/identity/slice";
import { selectIsSourceDocDirty, sourcesActions, sourcesSelectors } from "@/State/scoped/backups/sources/slice";
import { identityLoaded, identityUnloaded, publisherFlushRequested } from "./actions";
import { getIdentityDocDtag, getSourceDocDtag } from "./helpers";


const DEBOUNCE_MS = 900;
const MAX_BACKOFF_MS = 15_000;
function nextBackoff(ms: number) {
	return Math.min(ms * 2, MAX_BACKOFF_MS)
}



const isIdentityDirtying = isAnyOf(
	identityActions.updateIdentityLabel,
	identityActions.setFavoriteSource,
	identityActions.setBridgeUrl,
	identityActions.addSourceId,
	identityActions.removeSourceId,
	identityActions.applyRemoteIdentity,
)

const isSourceDirtying = isAnyOf(
	sourcesActions._createDraftDoc,
	sourcesActions.updateSourceLabel,
	sourcesActions.setRelayPresence,
	sourcesActions.applyRemoteSource,
)





const publishTasks = new Map<string, { cancel: () => void }>();

startAppListening({
	actionCreator: identityLoaded,
	effect: async (action, listenerApi) => {
		const identity = action.payload.identity;
		if (identity.type !== IdentityType.LOCAL_KEY) return;
		listenerApi.unsubscribe();

		const task = listenerApi.fork(async () => {
			const scheduleIdentity = () => {
				const key = "identity"
				publishTasks.get(key)?.cancel();
				const task = listenerApi.fork(async (fa) => {
					try {
						await listenerApi.condition(publisherFlushRequested.match, DEBOUNCE_MS);
						const s = listenerApi.getState()
						if (!selectIsIdentityDirty(s)) return

						const draft = selectIdentityDraft(s);
						const dTag = getIdentityDocDtag(identity.pubkey)

						let backoff = 1000
						for (; ;) {
							try {
								await publishNip78Doc({
									relays: active.relays,
									identity: active.identity,
									dTag,
									plaintextJson: JSON.stringify(draft),
								})
								listenerApi.dispatch(identityActions.ackPublished({ when: Date.now() }))
								return
							} catch {
								await fa.delay(backoff)
								backoff = nextBackoff(backoff)
								const st = listenerApi.getState()
								if (!selectIsIdentityDirty(st)) return
							}
						}
					} catch (err) {
						if (!(err instanceof TaskAbortError)) console.error("identity publish error", err)
					} finally {
						publishTasks.delete(key)
					}
				})
				publishTasks.set(key, task)
			}

			const scheduleSource = (sourceId: string) => {
				const key = sourceId
				publishTasks.get(key)?.cancel()
				const task = listenerApi.fork(async (fa) => {
					try {
						await listenerApi.condition(publisherFlushRequested.match, DEBOUNCE_MS);
						const s = listenerApi.getState()
						if (!selectIsSourceDocDirty(s, sourceId)) return

						const e = sourcesSelectors.selectById(s, sourceId)!
						const draft = e.draft
						const dTag = await getSourceDocDtag(identity.pubkey, sourceId)

						let backoff = 1000
						for (; ;) {
							try {
								await publishNip78Doc({
									relays: active.relays,
									identity: active.identity,
									dTag,
									plaintextJson: JSON.stringify(draft),
								})
								listenerApi.dispatch(sourcesActions.ackPublished({ sourceId, when: Date.now() }))
								return
							} catch {
								await fa.delay(backoff)
								backoff = nextBackoff(backoff)
								const st = listenerApi.getState()
								if (!selectIsSourceDocDirty(st, sourceId)) return
							}
						}
					} catch (err) {
						if (!(err instanceof TaskAbortError)) console.error("source publish error", err)
					} finally {
						publishTasks.delete(key);
					}
				})
				publishTasks.set(key, task);
			}

			for (; ;) {
				const result = await listenerApi.take(
					(action) => isIdentityDirtying(action) || isSourceDirtying(action)
				);
				if (isIdentityDirtying(result[0])) {
					scheduleIdentity();
				} else if (isSourceDirtying(result[0])) {
					scheduleSource(result[0].payload.sourceId)
				}
			}
		});

		await listenerApi.condition(identityUnloaded.match);
		for (const t of publishTasks.values()) t.cancel();
		publishTasks.clear();
		task.cancel();
		listenerApi.subscribe();


	},
})
