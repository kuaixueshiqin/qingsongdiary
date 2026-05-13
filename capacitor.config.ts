import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.qingsongshu.app',
  appName: '轻松书',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
