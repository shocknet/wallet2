const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

console.log('Starting prebuild script');
console.log('Environment variables:');
console.log('VITE_APP_NAME:', process.env.VITE_APP_NAME);
console.log('VITE_ANDROID_APPLICATION_ID:', process.env.VITE_ANDROID_APPLICATION_ID);
console.log('VITE_APP_URL:', process.env.VITE_APP_URL);
console.log('VERSION:', process.env.VERSION);
console.log('VERSION_CODE:', process.env.VERSION_CODE);

const androidManifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let androidManifest = fs.readFileSync(androidManifestPath, 'utf8');

// Replace the app URL
androidManifest = androidManifest.replace(
  /<data android:scheme="https" android:host="[^"]+"/,
  `<data android:scheme="https" android:host="${process.env.VITE_APP_URL}"`
);

// Replace the package name
androidManifest = androidManifest.replace(
  /package="[^"]+"/,
  `package="${process.env.VITE_ANDROID_APPLICATION_ID}"`
);

// Replace any remaining ${applicationId} placeholders
androidManifest = androidManifest.replace(
  /\${applicationId}/g,
  process.env.VITE_ANDROID_APPLICATION_ID || ''
);

fs.writeFileSync(androidManifestPath, androidManifest);
console.log('AndroidManifest.xml updated successfully');

// Update build.gradle
const buildGradlePath = path.join(__dirname, '..', 'android', 'app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');

buildGradle = buildGradle.replace(
  /applicationId .+/,
  `applicationId "${process.env.VITE_ANDROID_APPLICATION_ID}"`
);

buildGradle = buildGradle.replace(
  /versionCode .+/,
  `versionCode ${process.env.VERSION_CODE}`
);

buildGradle = buildGradle.replace(
  /versionName .+/,
  `versionName "${process.env.VERSION}"`
);

fs.writeFileSync(buildGradlePath, buildGradle);
console.log('build.gradle updated successfully');

console.log('Prebuild script completed');