import { BEACON_STALE_OLDER_THAN } from "@/constants";


export const useBeaconState = (beaconLastSeenAtMs: number) => {
	if (beaconLastSeenAtMs === 0) return null;

	const now = Date.now();

	const diff = now - beaconLastSeenAtMs;

	if (diff > BEACON_STALE_OLDER_THAN) {
		return "stale"
	} else {
		return "healthy"
	}

}
