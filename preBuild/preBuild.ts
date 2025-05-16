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

// Update AndroidManifest.xml
const androidManifestPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'AndroidManifest.xml');
let androidManifest = fs.readFileSync(androidManifestPath, 'utf8');

androidManifest = androidManifest.replace(
  /package="[^"]+"/,
  `package="${process.env.VITE_ANDROID_APPLICATION_ID}"`
);
androidManifest = androidManifest.replace(
  /(?:android:|)name="[^"]*MainActivity"/,
  `android:name="${process.env.VITE_ANDROID_APPLICATION_ID}.MainActivity"`
);
androidManifest = androidManifest.replace(
  /<data android:scheme="https" android:host="[^"]+"/,
  `<data android:scheme="https" android:host="${process.env.VITE_APP_URL}"`
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
  /namespace .+/,
  `namespace "${process.env.VITE_ANDROID_APPLICATION_ID}"`
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

// Update or create MainActivity.java
const mainActivityDir = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'java');
const packagePath = process.env.VITE_ANDROID_APPLICATION_ID.split('.').join(path.sep);
const mainActivityPath = path.join(mainActivityDir, packagePath, 'MainActivity.java');

try {
  // Ensure the directory structure exists
  fs.mkdirSync(path.dirname(mainActivityPath), { recursive: true });

  let mainActivity;
  if (fs.existsSync(mainActivityPath)) {
    mainActivity = fs.readFileSync(mainActivityPath, 'utf8');
    mainActivity = mainActivity.replace(
      /package .+;/,
      `package ${process.env.VITE_ANDROID_APPLICATION_ID};`
    );
  } else {
    // Create a basic MainActivity.java if it doesn't exist
    mainActivity = `
package ${process.env.VITE_ANDROID_APPLICATION_ID};

import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {}
`;
  }

  fs.writeFileSync(mainActivityPath, mainActivity);
  console.log('MainActivity.java updated or created successfully at:', mainActivityPath);
} catch (error) {
  console.error('Error updating MainActivity.java:', error);
}

// Update strings.xml
const stringsXmlPath = path.join(__dirname, '..', 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
let stringsXml = fs.readFileSync(stringsXmlPath, 'utf8');

stringsXml = stringsXml.replace(
  /<string name="app_name">[^<]+<\/string>/,
  `<string name="app_name">${process.env.VITE_APP_NAME}</string>`
);

fs.writeFileSync(stringsXmlPath, stringsXml);
console.log('strings.xml updated successfully');

// Update capacitor.config.json or capacitor.config.ts
const capacitorConfigPath = path.join(__dirname, '..', 'capacitor.config.json');
if (fs.existsSync(capacitorConfigPath)) {
  let capacitorConfig = JSON.parse(fs.readFileSync(capacitorConfigPath, 'utf8'));
  capacitorConfig.android = capacitorConfig.android || {};
  capacitorConfig.android.packageName = process.env.VITE_ANDROID_APPLICATION_ID;
  fs.writeFileSync(capacitorConfigPath, JSON.stringify(capacitorConfig, null, 2));
  console.log('capacitor.config.json updated successfully');
} else {
  console.log('capacitor.config.json not found. Make sure to update it manually if needed.');
}

console.log('Prebuild script completed');
