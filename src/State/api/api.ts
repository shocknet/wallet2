import { getAllNostrClients, subToBeacons } from "@/Api/nostr";
import { createApi, fakeBaseQuery } from "@reduxjs/toolkit/query/react";
import { selectNprofileViews, selectNprofileViewsByLpk } from "../scoped/backups/sources/selectors";
import { sourcesActions } from "../scoped/backups/sources/slice";
import { fetchNostrUserMetadataEvent, type BeaconUpdate } from "@/Api/nostrHandler";
import { RootState } from "../store/store";
import { App } from "@capacitor/app";



export type NostrProfile = {
	pubkey: string;
	name?: string;
	display_name?: string;
	picture?: string;
	about?: string;
	nip05?: string;
};

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


		getProfile: b.query<NostrProfile | null, string>({
			// argument is hex pubkey (or npub you normalize to hex inside)
			queryFn: async (pubkey) => {
				try {
					const meta = await fetchNostrUserMetadataEvent(pubkey, [
						"strfry.shock.network",
						"vault.iris.to",
						"relay.damus.io",
						"relay.nostr.band",
						"relay.snort.social",
						"temp.iris.to"
					]);
					console.log({ meta, pubkey })
					return { data: JSON.parse(meta!.content!) ?? null };
				} catch (e: any) {
					return { error: { status: 'CUSTOM_ERROR', error: e?.message ?? 'failed' } as any };
				}
			},
			// cache per pubkey
			keepUnusedDataFor: 300, // 5 min
			// optional: provide tags if you later want to invalidate on updates
		}),



	}),
});


export const { useGetProfileQuery } = appApi;
