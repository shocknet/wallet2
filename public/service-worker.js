// service-worker.js
self.addEventListener('click', event => {
    console.log(event);
    event.waitUntil(
      caches.open('Wallet2')
        .then(cache => cache.addAll([
          '/',
          '/index.html',
          '/manifest.json',
          // Add more URLs to cache here
        ]))
    );
});

self.addEventListener('fetch', event => {
    event.respondWith(
        caches.match(event.request)
        .then(response => response || fetch(event.request))
    );
});

self.addEventListener('beforeinstallprompt', event => {
    event.preventDefault();
    const installButton = document.getElementById('install-button');
    if (installButton) {
        installButton.style.display = 'none';
        installButton.addEventListener('click', () => {
        event.prompt();
        event.userChoice.then(choiceResult => {
            if (choiceResult.outcome === 'accepted') {
            console.log('User accepted the install prompt');
            } else {
            console.log('User dismissed the install prompt');
            }
            installButton.style.display = 'none';
        });
        });
    }
});
  