const path = require("path");
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

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
