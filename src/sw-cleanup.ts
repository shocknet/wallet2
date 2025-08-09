import { Capacitor } from '@capacitor/core';

const CLEAN_FLAG = 'sw_cleanup_done';
const KEEP_FILENAME = 'sw.js';

export async function cleanupStaleServiceWorkers() {
	if (!('serviceWorker' in navigator)) return;


	if (localStorage.getItem(CLEAN_FLAG)) return;

	const isNative = Capacitor.isNativePlatform();
	const regs = await navigator.serviceWorker.getRegistrations();


	const toRemove: ServiceWorkerRegistration[] = [];
	const toKeep: ServiceWorkerRegistration[] = [];

	for (const reg of regs) {

		const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
		const filename = url.split('/').pop() || '';


		if (isNative) {
			toRemove.push(reg);
			continue;
		}


		if (filename === KEEP_FILENAME) {
			toKeep.push(reg);
		} else {
			toRemove.push(reg);
		}
	}


	for (const reg of toKeep) {
		try {
			await reg.update();
			reg.waiting?.postMessage('SKIP_WAITING');
		} catch {/*  */ }
	}


	for (const reg of toRemove) {
		try {
			reg.waiting?.postMessage('SKIP_WAITING');
			reg.active?.postMessage('SKIP_WAITING');
		} catch {/*  */ }
		try {
			await reg.unregister();
		} catch {/*  */ }
	}

	try {
		const keys = await caches.keys();
		await Promise.all(
			keys.map((k) => {
				if (isNative) return caches.delete(k);

			})
		);
	} catch {/*  */ }

	localStorage.setItem(CLEAN_FLAG, '1');

	if (toRemove.length > 0) {
		location.reload();
	}
}
