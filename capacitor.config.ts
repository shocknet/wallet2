import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.shockwallet',
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
    SplashScreen: {
      backgroundColor: "#16191c",
      androidScaleType: "CENTER_CROP",
      launchAutoHide: false,
      splashFullScreen: true,
    },
    LocalNotifications: {
      smallIcon: "ic_notification",
      iconColor: "#29abe2",
    }
  }
};

export default config;
