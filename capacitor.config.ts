import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.plannerextraordinario.app',
  appName: 'Planner',
  webDir: 'dist',
  server: {
    androidScheme: 'https'
  }
};

export default config;
