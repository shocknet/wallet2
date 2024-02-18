// preBuild.js
const fs = require('fs');
const path = require('path');

// Read environment variables
require('dotenv').config({ path: '.env.development' });

// Path to the strings.xml file
const stringsXmlPath = path.resolve(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');

// Read the existing strings.xml content
const stringsXmlContent = fs.readFileSync(stringsXmlPath, 'utf-8');

// Update the "app_url" string in the strings.xml content
const updatedStringsXmlContent = stringsXmlContent.replace(
  /<string name="app_url">.*?<\/string>/,
  `<string name="app_url">${process.env.VITE_APP_URL}</string>`
);

// Write the updated content back to the strings.xml file
fs.writeFileSync(stringsXmlPath, updatedStringsXmlContent, 'utf-8');

console.log('strings.xml "app_url" line updated with the environment-specific value.');