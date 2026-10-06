import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.acewears.app',
  appName: 'AceWears',
  webDir: 'out', // Next.js static export directory
  server: {
    // Use the live URL for the web content (app loads from server, not bundled)
    url: 'https://preview-c-6ac065b8-14810412-b09fd25bbaf4.space-z.ai',
    cleartext: true,
  },
  android: {
    allowMixedContent: true,
    backgroundColor: '#0A1128',
  },
  plugins: {
    SplashScreen: {
      launchShowDuration: 3500,
      backgroundColor: '#0A1128',
      androidSplashResourceName: 'splash',
      showSpinner: false,
      androidScaleType: 'CENTER_CROP',
    },
    StatusBar: {
      style: 'LIGHT', // White text on dark background
      backgroundColor: '#0A1128',
    },
  },
};

export default config;
