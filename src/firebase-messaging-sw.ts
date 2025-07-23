import { initializeApp } from 'firebase/app';
import { getMessaging, onBackgroundMessage } from 'firebase/messaging/sw';
// Line below makes typescript happy by importing the definitions required for ServiceWorkerGlobalScope
import { precacheAndRoute as _ } from 'workbox-precaching';

const firebaseConfig = {
    apiKey: "AIzaSyA6YFA5tr2AHMVVXwLU00s_bVQekvXyN-w",
    authDomain: "shockwallet-11a9c.firebaseapp.com",
    projectId: "shockwallet-11a9c",
    storageBucket: "shockwallet-11a9c.firebasestorage.app",
    messagingSenderId: "73069543153",
    appId: "1:73069543153:web:048e09fb8a258acb7ab350",
    measurementId: "G-HQ89PZ3GPW"
};

// Extend ServiceWorkerGlobalScope to include the properties we need
declare let self: ServiceWorkerGlobalScope & {
    __WB_MANIFEST: any;
    registration: ServiceWorkerRegistration;
    clients: any;
    location: Location;
    addEventListener(type: string, listener: EventListener): void;
};
if (Notification.permission === 'granted') {
    console.info('Firebase messaging service worker is set up');
    const firebaseApp = initializeApp(firebaseConfig);
    const messaging = getMessaging(firebaseApp);

    // Handle background messages
    onBackgroundMessage(messaging, (payload) => {
        console.log('[firebase-messaging-sw.js] Received background message ', payload);

        const notificationTitle = payload.notification?.title || 'New Message';
        const notificationOptions: NotificationOptions = {
            body: payload.notification?.body || 'You have a new notification',
            data: payload.data
        };

        return self.registration.showNotification(notificationTitle, notificationOptions);
    });
}


// Handle notification clicks
self.addEventListener('notificationclick', (event: any) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');

    event.notification.close();

    if (event.action === 'close') {
        return;
    }

    // Default action or 'open' action
    event.waitUntil(
        self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList: any[]) => {
            // Check if there's already a window/tab open with the target URL
            for (const client of clientList) {
                if (client.url.includes(self.location.origin) && 'focus' in client) {
                    return client.focus();
                }
            }

            // If no window/tab is open, open a new one
            if (self.clients.openWindow) {
                return self.clients.openWindow('/');
            }
        })
    );
});

// Handle notification close
self.addEventListener('notificationclose', (event: any) => {
    console.log('[firebase-messaging-sw.js] Notification closed:', event.notification.tag);
});



// If we don't include a point to inject the manifest the plugin will fail.
// Using just a variable will not work because it is tree-shaked, we need to make it part of a side effect to prevent it from being removed
console.log(self.__WB_MANIFEST);