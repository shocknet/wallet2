import { getAllNostrClients, subToBeacons } from "@/Api/nostr";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectNprofileViews, selectNprofileViewsByLpk } from "../scoped/backups/sources/selectors";
import { sourcesActions } from "../scoped/backups/sources/slice";
import type { BeaconUpdate } from "@/Api/nostrHandler";
import { RootState } from "../store/store";
import { App } from "@capacitor/app";
export const appApi = createApi({
	reducerPath: "appApi",
	baseQuery: fakeBaseQuery(),
	endpoints: (b) => ({
		streamBeacons: b.query<void, void>({
			queryFn: () => ({ data: undefined }),
			async onCacheEntryAdded(_arg, { dispatch, getState, cacheEntryRemoved }) {
				let prevStale = new Set<string>();

				const unsub = subToBeacons((beacon: BeaconUpdate) => {

					const state = getState() as RootState;

					const sources = selectNprofileViewsByLpk(state, beacon.createdByPub);
					if (!sources.length) return;

					const seenMs = Math.max(Date.now(), (beacon.updatedAtUnix || 0) * 1000);

					for (const s of sources) {
						dispatch(
							sourcesActions.setBeacon({
								sourceId: s.sourceId,
								beacon: {
									name: beacon.name,
									lastSeenAtMs: seenMs,
									stale: false,
								},
							})
						)
					}
				});

				let intervalId: ReturnType<typeof setInterval> | undefined = undefined;

				const startInterval = () => {
					if (intervalId) return;
					intervalId = setInterval(() => {

						dispatch(sourcesActions.recomputeStale());


						const state = getState() as RootState;
						const nprofileViews = selectNprofileViews(state);
						const currentStale = new Set(
							nprofileViews
								.filter(np => np.beaconStale)
								.map(np => np.lpk)
						);


						const newlyStaleLpks: string[] = [];
						currentStale.forEach(lpk => {
							if (!prevStale.has(lpk)) newlyStaleLpks.push(lpk);
						});

						if (newlyStaleLpks.length) {
							const clients = getAllNostrClients();

							clients
								.filter(c => newlyStaleLpks.includes(c.pubDestination))
								.forEach(c => {
									try { c.disconnectCalls(); } catch { /* noop */ }
								});
						}

						prevStale = currentStale;
					}, 2 * 60 * 1000);
				}

				startInterval();



				const appListener = App.addListener("appStateChange", ({ isActive }) => {
					if (!isActive) {
						clearInterval(intervalId)
						intervalId = undefined;
					} else {
						startInterval();
					}
				})

				await cacheEntryRemoved;
				await (await appListener).remove();
				clearInterval(intervalId);
				try {
					unsub?.();
				} catch {
					/* noop */
				}
			},
		}),
	}),
});


