# wallet2
Connect to multiple Lightning Nodes via LNURL and NOSTR. This is a reference wallet for [Lightning.Pub](https://github.com/shocknet/Lightning.Pub)

Under heavy development

Update src/constants.ts

## Run PWA

First, clone the repo via git:

```bash
git clone https://github.com/shocknet/wallet2
```
```bash
cd wallet2 && npm i --force
npm install -g @ionic/cli native-run cordova-res
ionic serve
```
## Android
(Requires Android Studio)

Install Ionic CLI

`npm install -g @ionic/cli native-run cordova-res`

Build APK

`ionic cap run android --release`

### Debug Mode

From to send screen, type `howdoyouturnthison` into on the destination and press send

This will cause the "Help/About" button in the menu to instead show the debug modal

To disable, go back to send screen and type `howdoyouturnthisoff` int othe destination and press send
