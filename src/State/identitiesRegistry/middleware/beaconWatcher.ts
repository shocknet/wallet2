import type { AppstartListening } from "@/State/store/listenerMiddleware";
import { identityLoaded, identityUnloaded } from "./actions";
import { selectNprofileViews, selectNprofileViewsByLpk } from "@/State/scoped/backups/sources/selectors";
import { App } from "@capacitor/app";
import { getAllNostrClients, subToBeacons } from "@/Api/nostr";
import logger from "@/Api/helpers/logger";
import { sourcesActions } from "@/State/scoped/backups/sources/slice";
import { BeaconUpdate } from "@/Api/nostrHandler";
import { Capacitor, PluginListenerHandle } from "@capacitor/core";

const STALE_TICK_MS = 1.5 * 60 * 1000; // 1.5 minutes


export const addBeaconWatcherListener = (startAppListening: AppstartListening) => {
	startAppListening({
		actionCreator: identityLoaded,
		effect: async (_action, listenerApi) => {

			listenerApi.unsubscribe();

			let intervalId: ReturnType<typeof setInterval> | null = null;
			let prevStaleLpks = new Set<string>();


			const runHealthTick = () => {
				const nowMs = Date.now();

				listenerApi.dispatch(sourcesActions.recomputeStale({ nowMs }));


				const state = listenerApi.getState();
				const views = selectNprofileViews(state);

				const currentStaleLpks = new Set(
					views
						.filter(v => v.beaconStale)
						.map(v => v.lpk)
				);



				const newlyStaleLpks: string[] = [];
				currentStaleLpks.forEach(lpk => {
					if (!prevStaleLpks.has(lpk)) {
						newlyStaleLpks.push(lpk);
					}
				});


				if (newlyStaleLpks.length) {
					console.log("getting it")
					const clients = getAllNostrClients();
					clients
						.filter(c => newlyStaleLpks.includes(c.pubDestination))
						.forEach(c => {
							try {
								c.disconnectCalls("Stale beacon from pub");
							} catch {
								/* noop */
							}
						});
				}


				prevStaleLpks = currentStaleLpks;
			};


			const startInterval = () => {
				if (intervalId !== null) return;


				runHealthTick();

				intervalId = setInterval(() => {
					console.log("interval hit")
					runHealthTick();
				}, STALE_TICK_MS);
			};


			const stopInterval = () => {
				if (intervalId === null) return;
				clearInterval(intervalId);
				intervalId = null;
			};



			logger.info("[beaconWatcher] starting beacon subscription");


			const unsubscribeBeacons = subToBeacons((beacon: BeaconUpdate) => {

				const seenAtMs = (beacon.updatedAtUnix || 0) * 1000;
				const sources = selectNprofileViewsByLpk(listenerApi.getState(), beacon.createdByPub);
				if (!sources.length) return;

				for (const s of sources) {

					listenerApi.dispatch(
						sourcesActions.recordBeaconForSource({
							sourceId: s.sourceId,
							name: beacon.name,
							seenAtMs,
							lpk: beacon.createdByPub

						})
					);
				}

				console.log("from beacon sub")
				runHealthTick();

				logger.info("[beaconWatcher] beacon from", beacon.createdByPub);
			});




			logger.info("[beaconWatcher] attaching appStateChange listener");
			let appListenerPromise: Promise<PluginListenerHandle> | null = null;

			if (Capacitor.isNativePlatform()) {
				appListenerPromise = App.addListener("appStateChange", ({ isActive }) => {
					console.log("no in web brotherman")
					if (isActive) {
						logger.info("[beaconWatcher] foreground -> startInterval");
						startInterval();
					} else {
						logger.info("[beaconWatcher] background -> stopInterval");
						stopInterval();
					}
				});
			}


			startInterval();


			await listenerApi.condition(identityUnloaded.match);


			logger.info("[beaconWatcher] cleaning up");


			stopInterval();

			try {
				if (appListenerPromise) {
					const appListener = await appListenerPromise;
					await appListener.remove();
				}
			} catch {
				/*  */
			}

			try {
				unsubscribeBeacons?.();
			} catch {
				/*  */
			}


			listenerApi.subscribe();
		},
	});
};
