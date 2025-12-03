import { historyFetchSourceRequested } from "@/State/listeners/actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { addManageRequest, addDebitRequest } from "@/State/Slices/modalsSlice";
import { selectSourceViewById } from "@/State/scoped/backups/sources/selectors";

import { getNostrClient } from "@/Api/nostr";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { isAnyOf, TaskResult } from "@reduxjs/toolkit";
import { SourceType } from "@/State/scoped/common";
import { createDeferred } from "@/lib/deferred";

const activeManageSubs = new Set<string>();
const activeDebitSubs = new Set<string>();
const activeOperationsSubs = new Set<string>();
export const liveRequestsListenerSpec: ListenerSpec = {
	name: "liveRequestsListener",
	listeners: [
		(add) =>
			add({
				predicate: (action) => isAnyOf(sourcesActions._createDraftDoc, sourcesActions.applyRemoteSource, sourcesActions.markDeleted)(action),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload;

					const state = listenerApi.getState();

					const sourceView = selectSourceViewById(state, sourceId);

					if (
						!sourceView ||
						sourceView.type !== SourceType.NPROFILE_SOURCE ||
						sourceView.beaconStale
					) {
						activeManageSubs.delete(sourceId);
						activeDebitSubs.delete(sourceId);
						activeOperationsSubs.delete(sourceId);

						return;
					}

					const client = await getNostrClient({ pubkey: sourceView.lpk, relays: sourceView.relays }, sourceView.keys);

					if (!activeManageSubs.has(sourceId)) {
						client.GetLiveManageRequests((manageReq) => {
							if (manageReq.status === "OK") {
								listenerApi.dispatch(
									addManageRequest({
										request: manageReq,
										sourceId,
									})
								);
							}
						});

						activeManageSubs.add(sourceId);
					}

					if (!activeDebitSubs.has(sourceId)) {
						client.GetLiveDebitRequests((debitReq) => {
							if (debitReq.status === "OK") {
								listenerApi.dispatch(
									addDebitRequest({
										request: debitReq,
										sourceId,
									})
								);
							}
						});

						activeDebitSubs.add(sourceId);
					}

					if (!activeOperationsSubs.has(sourceId)) {
						client.GetLiveUserOperations((newOp) => {

							if (newOp.status === "OK") {
								listenerApi.dispatch(
									sourcesActions.ingestLive({ sourceId, operation: newOp.operation })
								);

								listenerApi.dispatch(historyFetchSourceRequested({ sourceId, deferred: createDeferred<TaskResult<void>>() }));
							}
						});

						activeDebitSubs.add(sourceId);
					}
				}
			})
	]
}
