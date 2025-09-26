import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { isAnyOf, TaskAbortError } from "@reduxjs/toolkit";
import { identityActions, selectIdentityDraft, selectIsIdentityDirty } from "@/State/scoped/backups/identity/slice";
import { docsSelectors, selectIsSourceDocDirty, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { checkDirtyRequested, identityLoaded, identityUnloaded, publisherFlushRequested } from "./actions";

import { saveNip78Event } from "../helpers/nostr";
import getIdentityNostrApi from "../helpers/identityNostrApi";
import { getIdentityDocDtag, getSourceDocDtag } from "../helpers/processDocs";



const DEBOUNCE_MS = 900;
const MAX_BACKOFF_MS = 15_000;
function nextBackoff(ms: number) {
	return ms * 1.5
}





const isIdentityDirtying = isAnyOf(
	identityActions.updateIdentityLabel,
	identityActions.setFavoriteSource,
	identityActions.setBridgeUrl,
	identityActions.addSourceDocDTag,
	identityActions.removeSourceId,
	identityActions.applyRemoteIdentity,
)

const isSourceDirtying = isAnyOf(
	sourcesActions._createDraftDoc,
	sourcesActions.updateSourceLabel,
	sourcesActions.markDeleted,
	sourcesActions.setRelayPresence,
	sourcesActions.applyRemoteSource,
)





const publishTasks = new Map<string, { cancel: () => void }>();

export const addPublisherListener = (startAppListening: AppstartListening) => {


	startAppListening({
		actionCreator: identityLoaded,
		effect: async (action, listenerApi) => {

			const identity = action.payload.identity;
			listenerApi.unsubscribe();

			const identityApi = await getIdentityNostrApi(identity);

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
									await saveNip78Event(identityApi, JSON.stringify(draft), dTag)
									listenerApi.dispatch(identityActions.ackPublished({ when: Date.now() }))
									return
								} catch {
									if (backoff >= MAX_BACKOFF_MS) throw new Error("Failed to publish doc update");
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

							const e = docsSelectors.selectById(s, sourceId)!
							const draft = e.draft
							const dTag = await getSourceDocDtag(identity.pubkey, sourceId)

							let backoff = 1000
							for (; ;) {
								try {
									await saveNip78Event(identityApi, JSON.stringify(draft), dTag)
									listenerApi.dispatch(sourcesActions.ackPublished({ sourceId, when: Date.now() }))
									return
								} catch {
									if (backoff >= MAX_BACKOFF_MS) throw new Error("Failed to publish doc update");
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
						(action) => isIdentityDirtying(action) || isSourceDirtying(action) || checkDirtyRequested.match(action)
					);


					if (isIdentityDirtying(result[0])) {
						scheduleIdentity();
					} else if (isSourceDirtying(result[0])) {
						scheduleSource(result[0].payload.sourceId)
					} else {

						if (selectIsIdentityDirty(result[1])) {
							scheduleIdentity();
						}

						docsSelectors.selectAll(result[1]).forEach(s => {
							if (s.dirty) {
								scheduleSource(s.draft.source_id);
							}
						})
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
}
