import { createApi, BaseQueryFn } from "@reduxjs/toolkit/query/react";
import type { BeaconUpdate } from "@/Api/nostrHandler";
import { subToBeacons } from "@/Api/nostr";


export type BeaconEntry = BeaconUpdate & {
	lastSeenAtMs: number;
	stale: boolean;
};

export type BeaconState = {
	byPub: Record<string, BeaconEntry>;
	lastEventAtMs: number;
	staleMs: number;
};

const NOOP_BASE: BaseQueryFn<unknown, unknown, { message: string }> = async () => ({ data: undefined });

export const beaconApi = createApi({
	reducerPath: "beaconApi",
	baseQuery: NOOP_BASE,


	// We only want a single cache entry for the stream
	serializeQueryArgs: () => "all",

	endpoints: (build) => ({
		streamBeacons: build.query<BeaconState, { staleMs?: number } | void>({


			queryFn: (arg) => {
				const staleMs = arg?.staleMs ?? 150_000;
				const initial: BeaconState = { byPub: {}, lastEventAtMs: 0, staleMs };
				return { data: initial };
			},

			async onCacheEntryAdded(arg, { updateCachedData, cacheEntryRemoved }) {
				// Recompute staleness immediately (useful after rehydration)
				const effectiveStaleMs = arg?.staleMs ?? 150_000;
				updateCachedData(draft => {
					const now = Date.now();
					for (const pub in draft.byPub) {
						draft.byPub[pub].stale = now - draft.byPub[pub].lastSeenAtMs > effectiveStaleMs;
					}
				});

				// 1) Subscribe to beacon updates
				const unsubscribe = subToBeacons((b: BeaconUpdate) => {
					const seen = Math.max(Date.now(), (b.updatedAtUnix || 0) * 1000);
					updateCachedData(draft => {
						const was = draft.byPub[b.createdByPub];

						draft.byPub[b.createdByPub] = {
							...b,
							lastSeenAtMs: seen,
							stale: false,
						};
						draft.lastEventAtMs = seen;

						if (was && was.stale) {

							// TODO: react to recovered pub
						}

					});
				});

				// 2) Heartbeat to flip stale flags
				const heartbeat = setInterval(() => {
					const now = Date.now();
					updateCachedData(draft => {
						const staleMs = arg?.staleMs ?? draft.staleMs ?? 150_000;
						for (const pub in draft.byPub) {
							const was = draft.byPub[pub].stale;
							const is = now - draft.byPub[pub].lastSeenAtMs > staleMs;
							draft.byPub[pub].stale = is;
							if (!was && is) {
								// TODO: handle "pub went stale"
							}
						}
					});
				}, 15_000);

				// 3) Cleanup
				await cacheEntryRemoved;
				clearInterval(heartbeat);
				unsubscribe?.();
			},
		}),
	}),
});

export const { useStreamBeaconsQuery } = beaconApi;
