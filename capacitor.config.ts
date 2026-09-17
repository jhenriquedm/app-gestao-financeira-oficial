import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.gestaofinanceira.app',
  appName: 'Gestão Financeira',
  webDir: 'dist',
  bundledWebRuntime: false,
  android: {
    allowMixedContent: true,
    backgroundColor: '#0f172a',
  },
  server: {
    androidScheme: 'https',
  },
  plugins: {
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '901690992750-jbuc5p2bebr2940uaorqtn5qcp72q6cp.apps.googleusercontent.com',
      forceCodeForRefreshToken: false,
    },
  },
};

export default config;
