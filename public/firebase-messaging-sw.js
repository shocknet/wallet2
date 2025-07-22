import { initializeApp } from 'firebase/app';
import { getMessaging } from 'firebase/messaging/sw';
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
let self//: ServiceWorkerGlobalScope;
const firebaseApp = initializeApp(firebaseConfig);
if (Notification.permission === 'granted') {
    getMessaging(firebaseApp);
}
console.info('Firebase messaging service worker is set up');
// If we don't include a point to inject the manifest the plugin will fail.
// Using just a variable will not work because it is tree-shaked, we need to make it part of a side effect to prevent it from being removed
console.log(self.__WB_MANIFEST);