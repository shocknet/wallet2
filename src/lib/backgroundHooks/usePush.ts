import { useEffect } from 'react';
import { Capacitor, PluginListenerHandle } from '@capacitor/core';
import { PushNotifications, Token, PushNotificationSchema, ActionPerformed } from '@capacitor/push-notifications';
import { initializeApp } from 'firebase/app';
import { getMessaging, getToken, onMessage, isSupported } from 'firebase/messaging';
import { selectNostrSpends, useSelector } from '@/State/store';
import { parseNprofile } from '../nprofile';
import { getNostrClient } from '@/Api/nostr';
import { getDeviceId, FIREBASE_CONFIG, FIREBASE_VAPID_KEY } from '@/constants';
import { useToast } from '../contexts/useToast';

type Handlers = {
	onForegroundMessage?: (payload: any) => void;
	onNotificationTap?: (data: any) => void;
	onToken?: (token: string) => void;
	onError?: (err: any) => void;
};

let nativeInited = false;
let webInited = false;

async function initWebFCM(handlers: Handlers) {
	if (webInited) return () => { };
	webInited = true;

	const supported = await isSupported();
	if (!supported) {
		handlers.onError?.(new Error('Web Push/FCM not supported in this browser.'));
		return () => { webInited = false; };
	}

	if (!('Notification' in window)) {
		handlers.onError?.(new Error('Notifications API not available'));
		return () => { webInited = false; };
	}

	try {
		const firebaseApp = initializeApp(JSON.parse(FIREBASE_CONFIG));
		const messaging = getMessaging(firebaseApp);

		const permission = await Notification.requestPermission();
		if (permission !== 'granted') {
			handlers.onError?.(new Error(`Notification permission: ${permission}`));
			return () => { webInited = false; };
		}

		const swReg = await navigator.serviceWorker.ready;
		const token = await getToken(messaging, { vapidKey: FIREBASE_VAPID_KEY, serviceWorkerRegistration: swReg }).catch((e) => {
			handlers.onError?.(e);
			return;
		});

		if (token) handlers.onToken?.(token);

		const unsubscribe = onMessage(messaging, (payload) => {
			handlers.onForegroundMessage?.(payload);
		});
		return () => {
			unsubscribe();
			webInited = false;
		}
	} catch (error) {
		console.warn('Firebase initialization failed, push notifications disabled:', error);
		handlers.onError?.(new Error('Firebase configuration not available'));
		return () => { webInited = false; };
	}
}

async function initNative(handlers: Handlers) {
	if (nativeInited) return () => { }; // idempotent
	nativeInited = true;
	
	try {
		let permStatus = await PushNotifications.checkPermissions();

		if (permStatus.receive === 'prompt') {
			permStatus = await PushNotifications.requestPermissions();
		}

		if (permStatus.receive !== 'granted') {
			handlers.onError?.(new Error('Push permission not granted'));
			return () => { nativeInited = false; };
		}
		// Register with APNs/FCM
		await PushNotifications.register();

		const handles: PluginListenerHandle[] = [];

		handles.push(
			await PushNotifications.addListener('registration', (token: Token) => {
				handlers.onToken?.(token.value);
			})
		);
		handles.push(
			await PushNotifications.addListener('registrationError', (err) => {
				handlers.onError?.(err);
			})
		);
		handles.push(
			await PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
				handlers.onForegroundMessage?.(notification);
			})
		);
		handles.push(
			await PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
				handlers.onNotificationTap?.(action.notification.data);
			})
		);

		// Cleanup
		return () => {
			handles.forEach(h => {
				try { h.remove(); } catch { /*  */ }
			});
			nativeInited = false;
		};
	} catch (error) {
		console.warn('Native push notification initialization failed:', error);
		handlers.onError?.(new Error('Push notification service not available'));
		return () => { nativeInited = false; };
	}
}

async function initPush(handlers: Handlers = {}) {
	if (Capacitor.isNativePlatform()) {
		return initNative(handlers);
	} else {
		return initWebFCM(handlers);
	}
}



export const usePush = () => {
	const nostrSpends = useSelector(selectNostrSpends);
	const nodedUp = !!useSelector(state => state.nostrPrivateKey);
	const { showToast } = useToast();


	useEffect(() => {
		if (!nodedUp) return;
		const enrollToken = async (token: string) => {
			for (const source of nostrSpends) {
				if (!source.keys || !source.pubSource) continue;
				const { pubkey, relays } = parseNprofile(source.pasteField)
				const c = await getNostrClient({ pubkey, relays }, source.keys)
				const res = await c.EnrollMessagingToken({ device_id: getDeviceId(), firebase_messaging_token: token })
				if (res.status === "OK") {
					console.log("enrolled token for", source.label)
				} else {
					console.error("error enrolling token for", source.label, res.reason)
				}
			}
		}

		let cleanup: (() => void) | undefined;
		(async () => {
			cleanup = await initPush({
				onToken: enrollToken,
				onForegroundMessage: (msg) => {
					alert("forground message");
					console.log({ msg })
				},
				onNotificationTap: (data) => {
					alert("notification tap");
					console.log({ data })
				},
				onError: (e) => {
					// Only show toast for user-facing errors, not Firebase initialization failures
					if (e?.message && !e.message.includes('Firebase') && !e.message.includes('Push notification service not available')) {
						showToast({
							message: e?.message || "",
							color: "danger"
						})
					}
					console.error('Push init error', e);
				},
			});
		})();

		return () => cleanup && cleanup();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [nodedUp, nostrSpends]);

}
