// preBuild.js
const fs = require('fs');
require('dotenv').config();

// Read and modify the AndroidManifest.xml file
const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
let androidManifest = fs.readFileSync('preBuild/AndroidManifest.copy.xml', 'utf8');
androidManifest = androidManifest.replace('${appUrl}', process.env.VITE_APP_URL);
fs.writeFileSync(androidManifestPath, androidManifest);

// Read and modify the Info.plist file
const infoPlistPath = 'ios/App/App/Info.plist';
let infoPlist = fs.readFileSync('preBuild/Info.copy.plist', 'utf8');
console.log(infoPlist);

infoPlist = infoPlist.replace('${appUrl}', process.env.VITE_APP_URL);
fs.writeFileSync(infoPlistPath, infoPlist);

console.log('Pre-build script completed');