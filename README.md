# ShockWallet
![image](https://shockwallet.b-cdn.net/wnp%20banner.png)

![GitHub last commit](https://img.shields.io/github/last-commit/shocknet/wallet2?style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) 
[![Chat](https://img.shields.io/badge/chat-on%20Telegram-blue?style=flat-square)](https://t.me/ShockBTC)
![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/ShockBTC?style=flat-square&logo=bitcoin)

## ⚡ A revolutionary Lightning Wallet for connecting to nodes over Nostr. ⚡

Mobile nodes have proven slow and unreliable, fake Layer 2's that rely on centralized swaps from Lightning gateways are expensive, and opening a channel to every app and device is cost prohibitive and unscalable. Both solutions still don't let you receive payments while offline trustlessly. 

Sharing an always-online self-custodial node with friends and family, the "Uncle Jim" method, has lacked adequate tooling to simplify networking and account setup... until now.

ShockWallet is the first wallet to use Nostr based accounts for Lightning Network connections, providing a new, open, and secure way to connect to the Lightning Network.

Additionally, ShockWallet supports connecting to multiple-nodes simultaneously, and is leading the way in automation by allowing you setup recurring payments or pre-authorize external applications or services requesting a payment. 

As a Nostr-native wallet, ShockWallet provides [multi-device sync abilities](https://x.com/shocknet_justin/status/1823111069486735530) via NIP78, enabling for example a shared wallet state between a Desktop and Phone. 

We're also pushing the boundries of Nostr and Lightning integration with [CLINK](https://github.com/shocknet/CLINK) that create more secure app connections with better UX than is currently available.

**For new users, an optional Bootstrap node is default on mainnet allowing for the lay-away of a self-custodied channel for your own node with a partner LSP.** [*Service subject to Terms*](https://docs.shock.network/terms)

- ShockWallet and Lightning.Pub make connecting to your node as easy as pasting an nprofile
- You can even use a link to share your nprofile with friends and family

    <img src="https://cdn.shockwallet.app/add_src_sm.png" height="20%" alt="Connect Wallet"> <img src="https://cdn.shockwallet.app/src_invite_sm.png" height="20%" alt="Invite Guests">


- Built with React and Ionic, builds for [Web Browser](https://my.shockwallet.app), [Android APK](https://github.com/shocknet/wallet2/releases/latest), or [Apple iOS](https://testflight.apple.com/join/soZAKZWj) are available from a single code-base.

- This is a reference wallet client for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub) and also contains the beginnings of a node management dashboard.
    - This will be both hidden and secured from your guests, tap the logo 3 times in the wallet to preview it.

         <img src="https://shockwallet.b-cdn.net/pub_home_ss.png" alt="Pub Dashboard" width="240"></p>

# Try It Now

## [Web Browser/PWA](https://my.ShockWallet.app) | [Download Android APK](https://github.com/shocknet/wallet2/releases/latest) | [Apple Testflight](https://testflight.apple.com/join/soZAKZWj)

> [!WARNING]  
> There will be bugs and bad UX decisions, please report any that you may find. 

> [!IMPORTANT]  
> ShockWallet and Lightning.Pub are free software. If you would like to see continued development, please show your [**support**](https://github.com/sponsors/shocknet) 😊
>
> <img src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" alt="License">


#### Build from source
Clone the repo and install

```bash
git clone https://github.com/shocknet/wallet2
cd wallet2 && npm i
npm install -g @ionic/cli native-run cordova-res
cp .env.production.example .env
```
* `nano .env` to customize

#### Self-Hosting the PWA

Run dev server

- `npm run dev`

or, build for production as static files

- `npm run build:web`

Example Caddy configuration for serving:
```caddy
your-domain.com {
    encode zstd gzip

    handle {
        root * /path/to/your/wallet2/dist
        try_files {path} /index.html
        file_server
    }

    header {
        # Prevent clickjacking
        X-Frame-Options "SAMEORIGIN"
        Content-Security-Policy "frame-ancestors 'self'"
    }
}
```

#### Build for Android

- `npm run build:android`

#### iOS

- `npm run build:ios`


