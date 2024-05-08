# ShockWallet
![image](https://shockwallet.b-cdn.net/wnp%20banner.png)

A revolutionary Lightning Wallet for connecting to nodes over Nostr.

Mobile nodes have proven slow and unreliable, while channel costs are too prohibitive and unscalable to be confined to a single app on a single device. 

Node sharing with friends and family, "Uncle Jim", has lacked adequate tooling to simplify networking and account setup... until now.

ShockWallet is the first wallet to use Nostr based accounts for Lightning Network connections, providing a new, open, and secure way to connect to the Lightning Network.

ShockWallet also features multi-sourcing and automation, allowing you to connect to legacy LNURL accounts and manage your balances through a single interface.



Built with React and Ionic allowing builds for [PWA](https://my.shockwallet.app), [Android APK](https://dl.shockwallet.app/shockwallet.apk), or [iOS](https://testflight.apple.com/join/soZAKZWj) 


This is a reference wallet client for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub) and also contains the beginnings of a node management dashboard. 

<p style="text-align: center;"><img src="https://shockwallet.b-cdn.net/pub_home_ss.png" alt="Pub Dashboard" width="240"></p>

> [!IMPORTANT]  
> ShockWallet and Lightning.Pub are free software. If you would like to see continued development, please show your [**support**](https://github.com/sponsors/shocknet) 😊<br>

<img src="https://www.gnu.org/graphics/agplv3-with-text-162x68.png" alt="License">
<br>



# Try It

An instance of the PWA is up at https://my.shockwallet.app 

or [Download Android APK](https://dl.shockwallet.app/shockwallet.apk)

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
