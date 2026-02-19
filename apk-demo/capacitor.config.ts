import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',
  appName: 'Best Bazaar',
  webDir: 'out',
  server: {
    url: 'https://bestbazaar.in',
    cleartext: true,
    androidScheme: 'https'
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