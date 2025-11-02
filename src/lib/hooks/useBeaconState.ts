import { BEACON_SEMI_STALE_OLDER_THAN, BEACON_STALE_OLDER_THAN } from "@/State/scoped/backups/sources/state";
import { useMemo } from "react";

export const useBeaconState = (beaconLastSeenAtMs: number) => {
	return useMemo(() => {
		if (beaconLastSeenAtMs === 0) return null;

		const now = Date.now();

		const diff = now - beaconLastSeenAtMs;

		if (diff > BEACON_STALE_OLDER_THAN) {
			return "stale"
		} else if (diff > BEACON_SEMI_STALE_OLDER_THAN) {
			return "semi-stale"
		} else {
			return "healthy"
		}
	}, [beaconLastSeenAtMs])
}
