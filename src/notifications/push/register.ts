import { Capacitor } from "@capacitor/core";
import { registerNativePush } from "./nativeToken";
import { registerWebPush } from "./webToken";
import { PushRegistrationResult } from "./types";
import { AppThunk } from "@/State/store/store";
import { runtimeActions, selectNotificationsPermission } from "@/State/runtime/slice";
import { getCachedPushToken, setCachedPushToken } from "./tokenCache";
import { pushTokenUpdated } from "./actions";
import dLogger from "@/Api/helpers/debugLog";

const log = dLogger.withContext({ component: "push-register" });

let inFlight: Promise<void> | null = null;


export const refreshPushRegistration =
	(): AppThunk<Promise<void>> => (dispatch, getState) => {
		if (inFlight) {
			return inFlight;
		}

		inFlight = (async () => {
			try {
				const perm = selectNotificationsPermission(getState());
				if (perm == null) return;

				if (perm !== "granted") {
					dispatch(
						runtimeActions.setPushRuntimeStatus({
							pushStatus: { status: perm },
						}),
					);
					return;
				}

				let result: PushRegistrationResult;

				if (Capacitor.isNativePlatform()) {
					result = await registerNativePush();
				} else {
					result = await registerWebPush();
				}

				dispatch(runtimeActions.setPushRuntimeStatus({ pushStatus: result }));

				if (result.status === "registered") {
					const existingToken = await getCachedPushToken();
					if (existingToken !== result.token) {
						log.info("token_registered", {
							data: { tokenPrefix: result.token.substring(0, 12) + "…" },
						});
						await setCachedPushToken(result.token);
						dispatch(pushTokenUpdated({ token: result.token }));
					} else {
						log.debug("token_unchanged", {});
					}
				} else {
					log.warn("registration_result", {
						data: {
							status: result.status,
							error: result.status === "error" ? result.error : undefined,
						},
					});
				}
			} catch (err) {
				dispatch(
					runtimeActions.setPushRuntimeStatus({
						pushStatus: {
							status: "error",
							error:
								err instanceof Error
									? err.message
									: "Unknown error when registering push notifications",
						},
					}),
				);
			} finally {
				inFlight = null;
			}
		})();

		return inFlight;
	};
