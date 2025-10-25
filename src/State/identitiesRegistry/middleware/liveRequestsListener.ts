import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { addManageRequest, addDebitRequest } from "@/State/Slices/modalsSlice";
import { NprofileView, selectHealthyNprofileViews } from "@/State/scoped/backups/sources/selectors";
import { RootState } from "@/State/store/store";
import { getNostrClient } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";

export const addLiveRequestsListener = (startAppListening: AppstartListening) => {
	startAppListening({
		actionCreator: identityLoaded,
		effect: async (_action, listenerApi) => {
			listenerApi.unsubscribe();

			const activeManageSubs = new Set<string>();
			const activeDebitSubs = new Set<string>();

			const ensureManageSub = async (sourceView: NprofileView) => {
				const { sourceId, lpk, relays, keys } = sourceView;
				if (activeManageSubs.has(sourceId)) return;

				logger.info("[manageReq] subscribing to", sourceId, lpk);

				try {
					const nostrClient = await getNostrClient(
						{ pubkey: lpk, relays },
						keys
					);

					await nostrClient.GetLiveManageRequests((manageReq: any) => {
						logger.info("[manageReq] got request", manageReq);

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
				} catch (err) {
					logger.error(
						"[manageReq] failed to establish subscription for",
						sourceId,
						err
					);
				}
			};

			const ensureDebitSub = async (sourceView: NprofileView) => {
				const { sourceId, lpk, relays, keys } = sourceView;
				if (activeDebitSubs.has(sourceId)) return;

				logger.info("[debitReq] subscribing to", sourceId, lpk);

				try {
					const nostrClient = await getNostrClient(
						{ pubkey: lpk, relays },
						keys
					);

					await nostrClient.GetLiveDebitRequests((debitReq: any) => {
						logger.info("[debitReq] got request", debitReq);

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
				} catch (err) {
					logger.error(
						"[debitReq] failed to establish subscription for",
						sourceId,
						err
					);
				}
			};

			const reconcileAll = async () => {
				const state = listenerApi.getState() as RootState;

				if (!state.appState.bootstrapped) {
					return;
				}

				const eligible = selectHealthyNprofileViews(state);

				for (const sv of eligible) {
					await ensureManageSub(sv);
					await ensureDebitSub(sv);
				}
			};

			await reconcileAll();

			const liveTask = listenerApi.fork(async () => {
				try {
					for (; ;) {
						await listenerApi.take(
							(action) =>
								sourcesActions._createDraftDoc.match(action) ||
								sourcesActions.applyRemoteSource.match(action) ||
								sourcesActions.markDeleted.match(action) ||
								sourcesActions.setBeacon.match(action)
						);

						await reconcileAll();
					}
				} catch (err) {
					logger.info("[liveReq] task error", err);
				} finally {
					activeManageSubs.clear();
					activeDebitSubs.clear();
				}
			});

			await listenerApi.condition(identityUnloaded.match);

			liveTask.cancel();

			listenerApi.subscribe();
		},
	});
};
