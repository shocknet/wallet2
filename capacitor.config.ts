import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.wallet',
  appName: 'SHOCKWALLET',
  webDir: 'dist',
  server: {
    androidScheme: 'https'/* ,
    url: "http://192.168.1.125:8100",
    cleartext: true */
  }
};

export default config;
