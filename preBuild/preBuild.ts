// preBuild.js
const fs = require('fs');
require('dotenv').config();

// Read and modify the AndroidManifest.xml file
const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
let androidManifest = fs.readFileSync('preBuild/AndroidManifest.copy.xml', 'utf8');
androidManifest = androidManifest.replace('${appUrl}', process.env.VITE_APP_URL);
androidManifest = androidManifest.replace('${appName}', process.env.VITE_APP_NAME);
fs.writeFileSync(androidManifestPath, androidManifest);

// Read and modify the Info.plist file
const infoPlistPath = 'ios/App/App/Info.plist';
let infoPlist = fs.readFileSync('preBuild/Info.copy.plist', 'utf8');

infoPlist = infoPlist.replace('${appUrl}', process.env.VITE_APP_URL);

fs.writeFileSync(infoPlistPath, infoPlist);

// Read and modify the App.entitlements file
const entitlementsPath = 'ios/App/App/App.entitlements';
let entitlements = fs.readFileSync('preBuild/App.entitlements.copy', 'utf8');
entitlements = entitlements.replace('${appUrl}', process.env.VITE_APP_URL);

fs.writeFileSync(entitlementsPath, entitlements);

console.log('Pre-build script completed');