import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amtech.bestbazaar',
  appName: 'Best Bazaar',
  webDir: 'out',
  // Load from server - APK is WebView wrapper
  // Uses environment variable for flexibility across environments
  server: {
    url: process.env.NEXT_PUBLIC_API_URL || 'https://dev.bestbazaar.in',
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