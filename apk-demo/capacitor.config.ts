import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amtech.BestBazaar',
  appName: 'Best Bazaar',
  // webDir: 'out',
  server: {
    url: 'https://stage.bestbazaar.in',
    cleartext: true,
    androidScheme: 'https'
  },
  // Performance optimizations for smooth scrolling
  android: {
    // Enable hardware acceleration
    allowMixedContent: true,
    // Optimize WebView settings
    webContentsDebuggingEnabled: false, // Set to true for debugging
  },
  // General performance settings
  plugins: {
    // Add any performance-related plugin configurations here
  }
};

export default config;