const LOCK_NAME = "sanctum-token-refresh";

// Sanctum rotates refresh tokens and revokes the whole session when a used one comes back,
// so every tab must refresh under this one lock.
export async function withSanctumRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
	if (!navigator.locks) return fn();
	return navigator.locks.request(LOCK_NAME, fn);
}
