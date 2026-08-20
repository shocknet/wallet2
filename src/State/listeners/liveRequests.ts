import { historyFetchSourceRequested, listenerKick } from "@/State/listeners/actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { NprofileView, selectHealthyNprofileViews, selectSourceViewById } from "@/State/scoped/backups/sources/selectors";
import { getClientById, getNostrClient } from "@/Api/nostr";
import { ListenerSpec } from "@/State/listeners/lifecycle/lifecycle";
import { ListenerEffectAPI, TaskResult } from "@reduxjs/toolkit";
import { createDeferred } from "@/lib/deferred";
import { nprofileBecameFresh, nprofileJustAdded, nprofileJustDeleted } from "./predicates";
import { AppDispatch, RootState } from "@/State/store/store";
import { selectActiveIdentity } from "@/State/identitiesRegistry/slice";
import { clinkRequestsActions } from "@/State/clinkRequests/slice";
import dLogger from "@/Api/helpers/debugLog";
import { SourceType } from "@/State/scoped/backups/sources/schema";

const logger = dLogger.withContext({ component: "liveRequestsListener" });


const GET_LIVE_MANAGE_REQUESTS_RPC_NAME = "GetLiveManageRequests";
const GET_LIVE_DEBIT_REQUESTS_RPC_NAME = "GetLiveDebitRequests";
const GET_LIVE_USER_OPERATIONS_RPC_NAME = "getLiveUserOperations";

async function subscribeToStreams(
	source: NprofileView,
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

					const sources = selectHealthyNprofileViews(state);

					for (const source of sources) {
						subscribeToStreams(source, listenerApi);
					}
				}
			}),
		// When a source gets deleted, remove it's stream subs
		(add) =>
			add({
				predicate: (action, curr, prev) =>
					nprofileJustDeleted(action, curr, prev),
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
					nprofileBecameFresh(action, curr, prev) ||
					nprofileJustAdded(action, curr, prev)
				),
				effect: async (action, listenerApi) => {
					const { sourceId } = action.payload as { sourceId: string };

					const source = selectSourceViewById(listenerApi.getState(), sourceId);

					if (!source || source.type !== SourceType.NPROFILE_SOURCE || source.beaconStale !== "fresh") {
						return;
					}

					subscribeToStreams(source, listenerApi);
				}
			}),
	]
}
