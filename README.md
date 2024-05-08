# ShockWallet
![image](https://shockwallet.b-cdn.net/wnp%20banner.png)

![GitHub last commit](https://img.shields.io/github/last-commit/shocknet/wallet2?style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) 
[![Chat](https://img.shields.io/badge/chat-on%20Telegram-blue?style=flat-square)](https://t.me/ShockBTC)
![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/ShockBTC?style=flat-square&logo=bitcoin)

## ⚡ A revolutionary Lightning Wallet for connecting to nodes over Nostr. ⚡

Mobile nodes have proven slow and unreliable, while opening a channel to every app and device is cost prohibitive and unscalable.

Node sharing with friends and family, "Uncle Jim", has lacked adequate tooling to simplify networking and account setup... until now.

ShockWallet is the first wallet to use Nostr based accounts for Lightning Network connections, providing a new, open, and secure way to connect to the Lightning Network.

ShockWallet features node multi-sourcing and is pushing the boundaries of automation, allowing you to also connect to multiple accounts, including legacy LNURL ones, to manage your balances through a single interface. 

As a Nostr-native wallet, ShockWallet also provides multi-device sync abilities via NIP78, enabling for example a shared wallet state between a Desktop and Phone.

**For new users, an optional Bootstrap node is default on mainnet allowing for the lay-away of a self-custodied channel for your own node with a partner LSP.** [*Service subject to Terms*](https://docs.shock.network/terms)

- ShockWallet and Lightning.Pub make connecting to your node as easy as pasting an nprofile
- You can even use a link to share your nprofile with friends and family

    <img src="https://cdn.shockwallet.app/add_src_sm.png" height="20%" alt="Connect Wallet"> <img src="https://cdn.shockwallet.app/src_invite_sm.png" height="20%" alt="Invite Guests">


- Built with React and Ionic, builds for [Web Browser](https://my.shockwallet.app), [Android APK](https://dl.shockwallet.app/shockwallet.apk), or [Apple iOS](https://testflight.apple.com/join/soZAKZWj) are available from a single code-base.

- This is a reference wallet client for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub) and also contains the beginnings of a node management dashboard.
    - This will be both hidden and secured from your guests, tap the logo 3 times in the wallet to preview it.

         <img src="https://shockwallet.b-cdn.net/pub_home_ss.png" alt="Pub Dashboard" width="240"></p>

# Try It Now

## [Web Browser/PWA](https://my.ShockWallet.app) | [Download Android APK](https://dl.shockwallet.app/shockwallet.apk) | [Apple Testflight](https://testflight.apple.com/join/soZAKZWj)

> [!WARNING]  
> While already a more usable daily driver than most Lightning wallets, this software is still in alpha development. There will be bugs and bad UX decisions, please report any that you may find. 

> [!IMPORTANT]  
> ShockWallet and Lightning.Pub are free software. If you would like to see continued development, please show your [**support**](https://github.com/sponsors/shocknet) 😊
>
> <img src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" alt="License">


#### Build from source
Clone the repo

```bash
git clone https://github.com/shocknet/wallet2
```
Install

```bash
cd wallet2 && npm i
npm install -g @ionic/cli native-run cordova-res
```
* Update src/constants.ts to customize

#### Self-Hosting the PWA

Run dev server

- `ionic serve`

or, build for production as static files

- `ionic build --prod`

Serve either behind a reverse-proxy like Caddy

#### Build for Android

- `npm run build`

Choose the Android platform in the prompt, and sign and build with Android Studio

#### iOS

- `npm run build`

Choose the iOS platform in the prompt, and sign and build with Xcode

Set your signing certificate and update the Bundle Identifier to match your Apple Developer account
