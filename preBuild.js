// preBuild.js
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.development' });

// Replace the appUrl placeholder in the build.gradle file with the actual value
const buildGradlePath = path.join(__dirname, 'android', 'app', 'build.gradle');
let buildGradle = fs.readFileSync(buildGradlePath, 'utf8');
buildGradle = buildGradle.replace(/appUrl\s.*/, `appUrl "${process.env.VITE_APP_URL}"`);
fs.writeFileSync(buildGradlePath, buildGradle);