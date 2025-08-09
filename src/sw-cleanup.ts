import { Capacitor } from '@capacitor/core';

const CLEAN_FLAG = 'sw_cleanup_done_2';
const KEEP_FILENAME = 'sw.js';

export async function cleanupStaleServiceWorkers() {
	if (!('serviceWorker' in navigator)) {
		console.log("CLEANUP: no serviceWorker in browser");
		return;
	}



	if (localStorage.getItem(CLEAN_FLAG)) {
		console.log("CLEANUP: already ran before");
		return;
	}

	const isNative = Capacitor.isNativePlatform();
	const regs = await navigator.serviceWorker.getRegistrations();


	const toRemove: ServiceWorkerRegistration[] = [];
	const toKeep: ServiceWorkerRegistration[] = [];

	for (const reg of regs) {

		const url = reg.active?.scriptURL || reg.installing?.scriptURL || reg.waiting?.scriptURL || '';
		const filename = url.split('/').pop() || '';
		console.log("CLEANUP: one of sw registrations: ", JSON.stringify(reg))


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
		} catch (err) {
			console.error("CLEANUP: update toKeep error ", err);
		}
	}


	for (const reg of toRemove) {
		try {
			reg.waiting?.postMessage('SKIP_WAITING');
			reg.active?.postMessage('SKIP_WAITING');
		} catch (err) {
			console.error("CLEANUP: toRemove skip_waiting error ", err);
		}
		try {
			await reg.unregister();
		} catch (err) {
			console.error("CLEANUP: toRemove unregiser error ", err);
		}
	}

	try {
		const keys = await caches.keys();
		await Promise.all(
			keys.map((k) => {
				if (isNative) return caches.delete(k);

			})
		);
	} catch (err) {
		console.error("CLEANUP: caches delete error", err);
	}

	localStorage.setItem(CLEAN_FLAG, '1');


	location.reload();

}
