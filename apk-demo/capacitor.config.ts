import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amtech.bestbazaar',
  appName: 'Best Bazaar',
  webDir: 'out',
  // Load from dev server - APK is WebView wrapper
  server: {
    url: 'https://dev.bestbazaar.in',
    cleartext: false,
    androidScheme: 'https'
  },
  // Performance optimizations for smooth scrolling
  android: {
    // Enable hardware acceleration
    allowMixedContent: false,
    // Optimize WebView settings
    webContentsDebuggingEnabled: true, // Set to true for debugging
  },
  // Plugin configurations
  plugins: {
    PushNotifications: {
      presentationOptions: ['badge', 'sound', 'alert']
    }
  }
};

export default config;