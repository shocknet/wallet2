import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.shockwallet',
  appName: 'SHOCKWALLET',
  webDir: 'dist',
  server: {
    androidScheme: 'https'/* ,
    url: "http://192.168.1.125:8100",
    cleartext: true */
  },
  plugins: {
    App: {
      iosScheme: "shockwallet",
      androidScheme: "shockwallet"
    },
    BarcodeScanning: {
      photoLibraryUsageDescription: "To scan QR codes using the camera"
    }
  }
};

export default config;
