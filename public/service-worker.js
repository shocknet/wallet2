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
self.addEventListener('launch', (event) => {
    // Get the URL from the launch event.
    const url = new URL(event.request.url);
    
    // Check if the URL is an LNURL link.
    if (url.protocol === 'lightning:') {
    // Decode the LNURL link and get the query parameters.
    const lnurl = decodeURIComponent(url.href.slice(6));
    const params = new URLSearchParams(lnurl);
    
    // Perform the appropriate action based on the LNURL type.
    switch (params.get('tag')) {
        case 'withdrawRequest':
        // Handle LNURL-withdraw requests.
        break;
        case 'login':
        // Handle LNURL-auth requests.
        break;
        case 'payRequest':
        // Handle LNURL-pay requests.
        break;
        case 'channelRequest':
        // Handle LNURL-channel requests.
        break;
        default:
        // Handle unknown or invalid LNURL requests.
        break;
    }
    } else {
        // Handle other URLs as normal.
    }
});