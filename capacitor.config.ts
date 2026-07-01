import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
	appId: 'app.shockwallet.my',
	appName: 'SHOCKWALLET',
	webDir: 'dist',
	server: {
		androidScheme: 'https',
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
			insetsHandling: "css",
			animation: "NONE"
		},
		SplashScreen: {
			backgroundColor: "#16191c",
			androidScaleType: "CENTER_CROP",
			launchAutoHide: false,
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
	}
};

export default config;
