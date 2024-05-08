# ShockWallet
![image](https://shockwallet.b-cdn.net/wnp%20banner.png)

![GitHub last commit](https://img.shields.io/github/last-commit/shocknet/wallet2?style=flat-square)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com) 
[![Chat](https://img.shields.io/badge/chat-on%20Telegram-blue?style=flat-square)](https://t.me/ShockBTC)
![X (formerly Twitter) Follow](https://img.shields.io/twitter/follow/ShockBTC?style=flat-square&logo=bitcoin)

### A revolutionary Lightning Wallet for connecting to nodes over Nostr.

Mobile nodes have proven slow and unreliable, while channel costs are too prohibitive and unscalable to be confined to a single app on a single device. 

Node sharing with friends and family, "Uncle Jim", has lacked adequate tooling to simplify networking and account setup... until now.

ShockWallet is the first wallet to use Nostr based accounts for Lightning Network connections, providing a new, open, and secure way to connect to the Lightning Network.

ShockWallet features multi-sourcing and automation, allowing you to connect to legacy LNURL accounts and manage your balances through a single interface. 

As a Nostr-native wallet, ShockWallet also provides a sync service via NIP78, enabling a shared wallet state across multiple-devices, like Desktop and Phone.

Built with React and Ionic, builds for [Web Browser](https://my.shockwallet.app), [Android APK](https://dl.shockwallet.app/shockwallet.apk), or [Apple iOS](https://testflight.apple.com/join/soZAKZWj) are available from a single code-base.

This is a reference wallet client for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub) and also contains the beginnings of a node management dashboard. 

<p style="text-align: center;"><img src="https://shockwallet.b-cdn.net/pub_home_ss.png" alt="Pub Dashboard" width="240"></p>

- ShockWallet and Lightning.Pub make connecting to your node as easy as pasting an nprofile
- Or use a link to share your nprofile with friends and family

    <img src="https://cdn.shockwallet.app/add_src_sm.png" height="20%" alt="Connect Wallet"> <img src="https://cdn.shockwallet.app/src_invite_sm.png" height="20%" alt="Invite Guests">

> [!IMPORTANT]  
> ShockWallet and Lightning.Pub are free software. If you would like to see continued development, please show your [**support**](https://github.com/sponsors/shocknet) 😊<br>

<img src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" alt="License">
<br>



# Try It

An instance of the PWA is up at https://my.shockwallet.app 

[Download Android APK](https://dl.shockwallet.app/shockwallet.apk) or [Testflight](https://testflight.apple.com/join/soZAKZWj)

The bootstrap node is live on mainnet allowing for the lay-away of a self-custodied channel for your own node with an LSP. 

# From Source

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

### Self-Hosting the PWA

Run dev server

```
ionic serve
```
or 

Build for production as static files

```
ionic build --prod
```

Serve behind a reverse-proxy like `Caddy`

### Build for Android

```
npm run build
```

Choose the Android platform in the prompt, and sign and build with Android Studio

### iOS

```
npm run build
```
Choose the iOS platform in the prompt, and sign and build with Xcode

Set your signing certificate and update the Bundle Identifier to match your Apple Developer account
