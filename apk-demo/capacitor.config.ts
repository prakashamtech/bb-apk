import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',
  appName: 'Best Bazaar',
  webDir: 'out',
  // Load from local dev server for testing
  server: {
    url: 'http://192.168.1.111:3000',
    cleartext: true,
    androidScheme: 'http'
  },
  // Performance optimizations for smooth scrolling
  android: {
    // Enable hardware acceleration
    allowMixedContent: true,
    // Optimize WebView settings
    webContentsDebuggingEnabled: true, // Set to true for debugging
  },
  // General performance settings
  plugins: {
    // Add any performance-related plugin configurations here
  }
};

export default config;