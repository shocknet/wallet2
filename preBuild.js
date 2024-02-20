// preBuild.js
const fs = require('fs');
const path = require('path');
const xml2js = require('xml2js');

// Read environment variables
require('dotenv').config({ path: '.env.development' });

// Path to the strings.xml file
const androidStringsXmlPath = path.resolve(__dirname, 'android', 'app', 'src', 'main', 'res', 'values', 'strings.xml');
const iosConfigXmlPath = path.resolve(__dirname, 'ios', 'App', 'App', 'config.xml');

fs.readFile(androidStringsXmlPath, 'utf-8', (readErr, data) => {
  if (readErr) {
    console.error('Error reading string.xml:', readErr);
    return;
  }

  // Parse the XML data
  xml2js.parseString(data, (parseErr, result) => {
    if (parseErr) {
      console.error('Error parsing string.xml:', parseErr);
      return;
    }

    // Modify the parsed XML object to update string values
    result.resources.string.find((item) => item.$.name === 'app_name')._ = 'SHOCKWALLET';
    result.resources.string.find((item) => item.$.name === 'app_url')._ = process.env.VITE_APP_URL;

    // Convert the modified object back to XML
    const builder = new xml2js.Builder();
    const modifiedXml = builder.buildObject(result);

    // Write the modified XML back to the string.xml file
    fs.writeFile(androidStringsXmlPath, modifiedXml, (writeErr) => {
      if (writeErr) {
        console.error('Error writing modified string.xml:', writeErr);
        return;
      }
      console.log('string.xml updated');
    });
  });
});

fs.readFile(iosConfigXmlPath, 'utf-8', (err, data) => {
  if (err) {
    console.error('Error reading config.xml:', err);
    return;
  }

  xml2js.parseString(data, (parseErr, result) => {
    if (parseErr) {
      console.error('Error parsing config.xml:', parseErr);
      return;
    }

    // Modify the parsed XML object to set CFBundleURLTypes
    const cfBundleURLTypes = result.widget.platform[0]['config-file'].find((item) => item.$.parent === 'CFBundleURLTypes').array[0].dict[0];
    cfBundleURLTypes.key = ['CFBundleURLSchemes', 'CFBundleURLName'];
    cfBundleURLTypes.array = [
      { string: ['https'] },
      { string: [process.env.VITE_APP_URL] }
    ];

    // Convert the modified object back to XML
    const builder = new xml2js.Builder();
    const modifiedXml = builder.buildObject(result);

    // Write the modified XML back to the config.xml file
    fs.writeFile(iosConfigXmlPath, modifiedXml, (writeErr) => {
      if (writeErr) {
        console.error('Error writing modified config.xml:', writeErr);
        return;
      }
      console.log('CFBundleURLTypes set in config.xml');
    });
  });
});
