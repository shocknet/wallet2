import { historyFetchSourceRequested, listenerKick } from "@/State/listeners/actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { addManageRequest, addDebitRequest } from "@/State/Slices/modalsSlice";
import { NprofileView, selectHealthyNprofileViews, selectSourceViewById } from "@/State/scoped/backups/sources/selectors";

import { Client, getClientById, getNostrClient } from "@/Api/nostr";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { isAnyOf, ListenerEffectAPI, TaskResult } from "@reduxjs/toolkit";
import { createDeferred } from "@/lib/deferred";
import { becameFresh, exists, isNprofile, justAdded, justDeleted } from "../predicates";
import { AppDispatch, RootState } from "@/State/store/store";


const GET_LIVE_MANAGE_REQUESTS_RPC_NAME = "GetLiveManageRequests";
const GET_LIVE_DEBIT_REQUESTS_RPC_NAME = "GetLiveDebitRequests";
const GET_LIVE_USER_OPERATIONS_RPC_NAME = "getLiveUserOperations";

const subscribeToStreams = (
	client: Client,
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
	sourceId: string
) => {
	client.GetLiveManageRequests((manageReq) => {
		if (manageReq.status === "OK") {
			listenerApi.dispatch(
				addManageRequest({
					request: manageReq,
					sourceId
				})
			);
		}
	});

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

	client.GetLiveUserOperations((newOp) => {
		if (newOp.status === "OK") {
			listenerApi.dispatch(
				sourcesActions.ingestLive({ sourceId, operation: newOp.operation })
			);

			listenerApi.dispatch(historyFetchSourceRequested({ sourceId, deferred: createDeferred<TaskResult<void>>() }));
		}
	});
};
export const liveRequestsListenerSpec: ListenerSpec = {
	name: "liveRequestsListener",
	listeners: [
		// When identity loads subscribe all healthy sources to streams
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {

					const state = listenerApi.getState();

					const sources = selectHealthyNprofileViews(state);

					for (const source of sources) {
						const client = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);
						subscribeToStreams(client, listenerApi, source.sourceId);
					}
				}
			}),

		// When a source gets deleted, remove it's stream subs
		(add) =>
			add({
				predicate: (action, curr, prev) =>
				(
					isAnyOf(sourcesActions.applyRemoteSource, sourcesActions.markDeleted)(action) &&
					isNprofile(curr, action.payload.sourceId) &&
					justDeleted(curr, prev, action.payload.sourceId)
				),
				effect: async (action) => {
					const { sourceId } = action.payload as { sourceId: string };

					getClientById(sourceId)?.removeStreamSub(GET_LIVE_MANAGE_REQUESTS_RPC_NAME);
					getClientById(sourceId)?.removeStreamSub(GET_LIVE_DEBIT_REQUESTS_RPC_NAME);
					getClientById(sourceId)?.removeStreamSub(GET_LIVE_USER_OPERATIONS_RPC_NAME);
				}
			}),

		// When a source gets added, or becomes fresh
		(add) =>
			add({
				predicate: (action, curr, prev) =>
				(
					(
						isAnyOf(sourcesActions.applyRemoteSource, sourcesActions._createDraftDoc)(action) &&
						isNprofile(curr, action.payload.sourceId) &&
						justAdded(curr, prev, action.payload.sourceId)
					)
					||
					(
						sourcesActions.recordBeaconForSource.match(action) &&
						exists(curr, action.payload.sourceId) &&
						becameFresh(curr, prev, action.payload.sourceId)
					)
				),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };

					const source = selectSourceViewById(listenerApi.getState(), sourceId) as NprofileView;

					const client = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);
					subscribeToStreams(client, listenerApi, source.sourceId);
				}
			}),
	]
}
