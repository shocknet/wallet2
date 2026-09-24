import { registerSW } from 'virtual:pwa-register';

const UPDATE_CHECK_MS = 60 * 60 * 1000;

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

// The plugin only reloads for updates it found at startup; hourly checks
// find the rest, so reload when the new worker takes this page.
export function applyUpdate() {
	navigator.serviceWorker.addEventListener("controllerchange", reloadOnce, { once: true });
	void refresh?.();
}

function reloadOnce() {
	if (reloading) return;
	reloading = true;
	window.location.reload();
}

function markReady() {
	ready = true;
	listeners.forEach((listener) => listener());
}

function checkHourly(_url: string, registration?: ServiceWorkerRegistration) {
	if (!registration) return;
	setInterval(() => void registration.update(), UPDATE_CHECK_MS);
}
