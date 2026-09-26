import { registerSW } from 'virtual:pwa-register';
import { withSanctumRefreshLock } from './lib/sanctumRefreshLock';

const UPDATE_CHECK_MS = 60 * 60 * 1000;
const RELOAD_LOCK_RELEASE_MS = 10_000;

let refresh: (() => Promise<void>) | null = null;
let ready = false;
let reloading = false;
const listeners = new Set<() => void>();

export function startServiceWorker() {
	refresh = registerSW({
		immediate: true,
		onNeedRefresh: markReady,
		onNeedReload: reloadOnce,
		onRegisteredSW: checkHourly,
	});
}

export function subscribeUpdateReady(listener: () => void) {
	listeners.add(listener);
	return () => {
		listeners.delete(listener);
	};
}

export function isUpdateReady() {
	return ready;
}

export function applyUpdate() {
	void refresh?.();
}

function reloadOnce() {
	if (reloading) return;
	reloading = true;
	void withSanctumRefreshLock(reloadHoldingLock);
}

// Keeps the lock until the page unloads so no refresh can start and die mid-request;
// the timeout frees other tabs if the reload never happens.
function reloadHoldingLock() {
	window.location.reload();
	return new Promise<void>((resolve) => setTimeout(resolve, RELOAD_LOCK_RELEASE_MS));
}

function markReady() {
	ready = true;
	listeners.forEach((listener) => listener());
}

function checkHourly(_url: string, registration?: ServiceWorkerRegistration) {
	if (!registration) return;
	setInterval(() => void registration.update(), UPDATE_CHECK_MS);
}
