# wallet2
Connect to multiple Lightning Nodes via LNURL and NOSTR. 

Built with React and Ionic allowing builds for [PWA](https://test.shockwallet.app), [Android APK](https://dl.shockwallet.app/shockwallet.apk), or iOS. 
* iOS: Contact us for Testflight access

![image](https://shockwallet.b-cdn.net/wnp%20banner.png)

This is a reference wallet client for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub) and also contains the beginnings of a node management dashboard. 

<p style="text-align: center;"><img src="https://shockwallet.b-cdn.net/pub_home_ss.png" alt="Pub Dashboard" width="240"></p>

#### ShockWallet and Lightning.Pub are free software. If you would like to see continued development, please show your [support](https://github.com/sponsors/shocknet) :)


# Try It

A development instance of the PWA is up at https://test.shockwallet.app 

or [Download Android APK](https://dl.shockwallet.app/shockwallet.apk)

The bootstrap node is on mainnet, but has minimal liquidity.

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
* (Requires Android Studio)

Build APK

```
ionic cap build android --release
```
### iOS

```
ionic cap build ios
cd ios
pod --install
```

Set your signing certificate and update the Bundle Identifier to match your Apple Developer account
