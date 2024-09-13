// preBuild.js
const fs = require('fs');
require('dotenv').config();
const path = require('path');

// Read and modify the AndroidManifest.xml file
const androidManifestPath = 'android/app/src/main/AndroidManifest.xml';
let androidManifest = fs.readFileSync(androidManifestPath, 'utf8');

// Replace the app URL
androidManifest = androidManifest.replace(
  /<data android:scheme="https" android:host="[^"]+"/,
  `<data android:scheme="https" android:host="${process.env.VITE_APP_URL}"`
);

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

// Update the build.gradle file
function updateBuildGradle(version, versionCode, applicationId, appName) {
  const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
  let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
  
  buildGradle = buildGradle.replace(
    /applicationId "[^"]+"/,
    `applicationId "${applicationId}"`
  );
  
  buildGradle = buildGradle.replace(
    /namespace "[^"]+"/,
    `namespace "${applicationId}"`
  );
  
  // Remove this replacement as we'll use project properties instead
  // buildGradle = buildGradle.replace(
  //   /resValue "string", "app_name", "[^"]+"/,
  //   `resValue "string", "app_name", "${appName}"`
  // );
  
  fs.writeFileSync(buildGradlePath, buildGradle);
}

const version = process.env.VERSION || '0.0.0';
const versionCode = process.env.VERSION_CODE || '1';
const applicationId = process.env.VITE_ANDROID_APPLICATION_ID || 'app.shockwallet.test';
const appName = process.env.VITE_APP_NAME || 'missing env';

console.log('Pre-build variables:');
console.log(`Version: ${version}`);
console.log(`Version Code: ${versionCode}`);
console.log(`Application ID: ${applicationId}`);
console.log(`App Name: ${appName}`);

updateBuildGradle(version, versionCode, applicationId, appName);

// Pass version information and app name to Gradle
process.env.ORG_GRADLE_PROJECT_versionCode = versionCode;
process.env.ORG_GRADLE_PROJECT_versionName = version;
process.env.ORG_GRADLE_PROJECT_appName = appName;

console.log('Pre-build script completed');