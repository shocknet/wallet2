import { ForkedTask, isAnyOf, TaskAbortError } from "@reduxjs/toolkit";
import { identityActions, selectIdentityDraft, } from "@/State/scoped/backups/identity/slice";
import { docsSelectors, sourcesActions } from "@/State/scoped/backups/sources/slice";
import { saveNip78Event, saveSourceDocEvent } from "@/State/identitiesRegistry/helpers/nostr";
import getIdentityNostrApi from "@/State/identitiesRegistry/helpers/identityNostrApi";
import { getSourceDocDtag, identityDocDtag } from "../../identitiesRegistry/helpers/processDocs";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { selectActiveIdentity, } from "@/State/identitiesRegistry/slice";
import { publisherFlushRequested } from "../actions";
import { createDeferred } from "@/lib/deferred";
import dLogger from "@/Api/helpers/debugLog";



const DEBOUNCE_MS = 900;


const isIdentityDirtying = isAnyOf(
	identityActions.setFavoriteSource,
	identityActions.applyRemoteIdentity,
)

const isSourceDirtying = isAnyOf(
	sourcesActions._createDraftDoc,
	sourcesActions.updateSourceLabel,
	sourcesActions.markDeleted,
	sourcesActions.setRelayPresence,
	sourcesActions.applyRemoteSource,
)

const publishTasks = new Map<string, ForkedTask<void>>();
const identityKey = "identity";


export const publisherSpec: ListenerSpec = {
	name: "publisher",
	listeners: [
		(add) =>
			add({
				predicate: (action, state) => {
					if (!isSourceDirtying(action)) return false;
					const { sourceId } = action.payload;
					const source = docsSelectors.selectById(state, sourceId);
					if (!source || source.draft.deleted.value || !source.dirty) {
						return false;
					}

					return true;
				},
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };
					const log = dLogger.withContext({
						procedure: "publisher-source",
						data: { sourceId }
					});

					log.info("started");
					const state = listenerApi.getState();
					const identity = selectActiveIdentity(state)!;

					const identityApi = await getIdentityNostrApi(identity);

					const d = docsSelectors.selectById(listenerApi.getState(), sourceId).draft;

					const dTag = await getSourceDocDtag(identity.pubkey, sourceId);
					publishTasks.get(sourceId)?.cancel(); // cancel previous buffered write, if any
					const task = listenerApi.fork(async forkApi => {
						try {

							await forkApi.pause(listenerApi.condition(publisherFlushRequested.match, DEBOUNCE_MS));

							/* not forkApi.pause'd, because it's just a network write we don't care about */
							await saveSourceDocEvent(identityApi, JSON.stringify(d), dTag);

							if (!forkApi.signal.aborted)
								listenerApi.dispatch(sourcesActions.ackPublished({ sourceId, when: Date.now() }));

						} catch (err) {
							if (err instanceof TaskAbortError) {
								log.info("task aborted", { error: err });
							} else {
								log.error("publisher error", { error: err });
							}
						} finally {
							publishTasks.delete(sourceId);
						}
					});
					publishTasks.set(sourceId, task);
					await task.result;
				}
			}),
		(add) =>
			add({
				predicate: (action, state) => {
					if (!isIdentityDirtying(action)) return false;

					if (!state.scoped!.identity.dirty) return false;

					return true
				},
				effect: async (_, listenerApi) => {
					const log = dLogger.withContext({
						procedure: "publisher-identity"
					});
					log.info("started");

					const state = listenerApi.getState();
					const identity = selectActiveIdentity(state)!;

					const identityApi = await getIdentityNostrApi(identity);
					const draft = selectIdentityDraft(state)!;


					publishTasks.get(identityKey)?.cancel(); // cancel previous buffered write, if any

					const task = listenerApi.fork(async forkApi => {
						try {
							await forkApi.pause(listenerApi.condition(publisherFlushRequested.match, DEBOUNCE_MS));

							/* not forkApi.pause'd, because it's just a network write we don't care about */
							await saveNip78Event(identityApi, JSON.stringify(draft), identityDocDtag);

							if (!forkApi.signal.aborted)
								listenerApi.dispatch(identityActions.ackPublished({ when: Date.now() }));

						} catch (err) {
							if (err instanceof TaskAbortError) {
								log.info("task aborted", { error: err });
							} else {
								log.error("publisher error", { error: err });
							}
						} finally {
							publishTasks.delete(identityKey);
						}
					});
					publishTasks.set(identityKey, task);
					await task.result;
				}
			}),

		(add) =>
			add({
				actionCreator: publisherFlushRequested,
				effect: async (action) => {
					const { deferred } = action.payload;
					for (const [_, task] of publishTasks) {
						try {

							await task.result;
						} catch {
							/* noop */
						}
					}

					deferred.resolve();
				}
			})
	],
	beforeUnload: async ({ dispatch }) => {
		const deferred = createDeferred<void>();
		dispatch(publisherFlushRequested({ deferred }));
		return deferred;
	}
}

