import { historyFetchSourceRequested, listenerKick } from "@/State/listeners/actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { SourceView, selectSourceViewById, selectSourceViews } from "@/State/scoped/backups/sources/selectors";
import { getClientById, getNostrClient } from "@/Api/nostr";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { ListenerEffectAPI, TaskResult } from "@reduxjs/toolkit";
import { createDeferred } from "@/lib/deferred";
import { sourceJustAdded, sourceJustDeleted, sourceIdsThatBecameFresh } from "./predicates";
import { AppDispatch, RootState } from "@/State/store/store";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { clinkRequestsActions } from "@/State/clinkRequests/slice";
import { beaconsActions } from "@/State/scoped/beacons/slice";
import dLogger from "@/Api/helpers/debugLog";

const logger = dLogger.withContext({ component: "liveRequestsListener" });


const GET_LIVE_MANAGE_REQUESTS_RPC_NAME = "GetLiveManageRequests";
const GET_LIVE_DEBIT_REQUESTS_RPC_NAME = "GetLiveDebitRequests";
const GET_LIVE_USER_OPERATIONS_RPC_NAME = "getLiveUserOperations";

async function subscribeToStreams(
	source: SourceView,
	listenerApi: ListenerEffectAPI<RootState, AppDispatch>,
) {
	const sourceId = source.sourceId;
	const identityId = selectActiveIdentity(listenerApi.getState())!.pubkey;

	try {
		const client = await getNostrClient({ pubkey: source.lpk, relays: source.relays }, source.keys);


		client.GetLiveManageRequests((manageReq) => {
			if (manageReq.status !== "OK") {
				return;
			}

			listenerApi.dispatch(
				clinkRequestsActions.enqueuePendingClinkRequest({
					kind: "manage",
					identityId,
					sourceId,
					request: manageReq,
					enqueuedAtMs: Date.now(),
				}),
			);
		});

		client.GetLiveDebitRequests((debitReq) => {
			if (debitReq.status !== "OK") {
				return;
			}

			listenerApi.dispatch(
				clinkRequestsActions.enqueuePendingClinkRequest({
					kind: "debit",
					identityId,
					sourceId,
					request: debitReq,
					enqueuedAtMs: Date.now(),
				}),
			);
		});

		client.GetLiveUserOperations((newOp) => {
			if (newOp.status !== "OK") return;

			listenerApi.dispatch(
				sourcesActions.ingestLive({ sourceId, operation: newOp.operation })
			);
			listenerApi.dispatch(
				historyFetchSourceRequested({ sourceId, deferred: createDeferred<TaskResult<void>>() })
			);
		});
	} catch (error) {
		logger.error("Error subscribing to streams", { data: { sourceId: source.sourceId }, error });
	}
}


export const liveRequestsListenerSpec: ListenerSpec = {
	name: "liveRequestsListener",
	listeners: [
		// When identity loads subscribe all healthy sources to streams
		(add) =>
			add({
				actionCreator: listenerKick,
				effect: async (_, listenerApi) => {

					const state = listenerApi.getState();

					const sources = selectSourceViews(state);

					for (const source of sources) {
						subscribeToStreams(source, listenerApi);
					}
				}
			}),
		// When a source gets deleted, remove it's stream subs
		(add) =>
			add({
				predicate: (action, curr, prev) =>
					sourceJustDeleted(action, curr, prev),
				effect: async (action) => {
					const { sourceId } = action.payload as { sourceId: string };

					getClientById(sourceId)?.removeStreamSub(GET_LIVE_MANAGE_REQUESTS_RPC_NAME);
					getClientById(sourceId)?.removeStreamSub(GET_LIVE_DEBIT_REQUESTS_RPC_NAME);
					getClientById(sourceId)?.removeStreamSub(GET_LIVE_USER_OPERATIONS_RPC_NAME);
				}
			}),
		// When a source gets added
		(add) =>
			add({
				predicate: (action, curr, prev) => sourceJustAdded(action, curr, prev),
				effect: async (action, listenerApi) => {

					const { sourceId } = action.payload as { sourceId: string };
					const source = selectSourceViewById(listenerApi.getState(), sourceId);
					if (!source) return;
					subscribeToStreams(source, listenerApi);
				}
			}),
		// When sources become fresh
		(add) =>
			add({
				actionCreator: beaconsActions.recordBeacon,
				effect: async (action, listenerApi) => {
					const curr = listenerApi.getState();
					const prev = listenerApi.getOriginalState();
					for (const sourceId of sourceIdsThatBecameFresh(action.payload.lpk, curr, prev)) {
						const source = selectSourceViewById(curr, sourceId);
						if (!source) continue;
						subscribeToStreams(source, listenerApi);
					}
				}
			}),
	]
}
