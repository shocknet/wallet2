// preBuild.js
const fs = require('fs');
require('dotenv').config({ path: '.env.development' });

// Read and modify the AndroidManifest.xml file
const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
let androidManifest = fs.readFileSync(androidManifestPath, 'utf8');
androidManifest = androidManifest.replace('${appUrl}', process.env.VITE_APP_URL);
fs.writeFileSync(androidManifestPath, androidManifest);

// Read and modify the Info.plist file
const infoPlistPath = 'ios/App/App/Info.plist';
let infoPlist = fs.readFileSync(infoPlistPath, 'utf8');
infoPlist = infoPlist.replace('${appUrl}', process.env.VITE_APP_URL);
fs.writeFileSync(infoPlistPath, infoPlist);

console.log('Pre-build script completed');