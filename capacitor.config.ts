import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'io.ionic.wallet',
  appName: 'SHOCKWALLET',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
