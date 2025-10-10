/// <reference types="@capawesome/capacitor-android-edge-to-edge-support" />
import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'app.shockwallet',
	appName: 'SHOCKWALLET',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
	},
	android: {
		adjustMarginsForEdgeToEdge: 'force',
	},
	plugins: {
		App: {
			iosScheme: "shockwallet",
			androidScheme: "shockwallet"
		},
		BarcodeScanning: {
			photoLibraryUsageDescription: "To scan QR codes using the camera"
		},
		StatusBar: {
			overlaysWebView: false,
			backgroundColor: '#16191c',
		},
		SplashScreen: {
			backgroundColor: "#16191c",
			androidScaleType: "CENTER_CROP",
			launchAutoHide: true,
			splashFullScreen: true,
		},
		LocalNotifications: {
			smallIcon: "ic_notification",
			iconColor: "#29abe2",
		},
		PushNotifications: {
			presentationOptions: ["badge", "sound", "alert"]
		},
		CapacitorHttp: {
			enabled: true
		},
		"EdgeToEdge": {
			"backgroundColor": "#16191c"
		}
	}
};

export default config;
