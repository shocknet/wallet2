import { Capacitor } from '@capacitor/core';

const CLEAN_FLAG = 'sw_cleanup_done_2';
const KEEP_FILENAME = 'sw.js';
export async function cleanupStaleServiceWorkers() {
	if (!('serviceWorker' in navigator)) return;

	if (localStorage.getItem(CLEAN_FLAG)) return;

	const isNative = Capacitor.isNativePlatform();
	const regs = await navigator.serviceWorker.getRegistrations();

	console.log({ regs })


	const toRemove: ServiceWorkerRegistration[] = [];
	const toKeep: ServiceWorkerRegistration[] = [];


	for (const reg of regs) {
		const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
		const filename = url.split('/').pop() || '';

		console.log({ filename })

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

		console.log("updating", reg)
		try {
			await reg.update();
		} catch (err) {
			console.error("CLEANUP: update toKeep error ", err);
		}
	}

	let removedSomething = false;

	for (const reg of toRemove) {
		console.log("removing", reg)
		try {
			await reg.unregister();
			removedSomething = true;
		} catch (err) {
			console.error("CLEANUP: toRemove unregister error ", err);
		}
	}

	if (isNative) {
		try {
			const keys = await caches.keys();
			await Promise.all(keys.map(k => caches.delete(k)));
		} catch (err) {
			console.error("CLEANUP: caches delete error", err);
		}
	}

	localStorage.setItem(CLEAN_FLAG, '1');

	// Only reload if we actually removed something, and only on web
	if (!isNative && removedSomething) {
		//location.reload();
	}
}
