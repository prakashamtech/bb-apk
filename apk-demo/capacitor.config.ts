import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amtech.BestBazaar',
  appName: 'Best Bazaar',
  webDir: 'out',
  server: {
    url: 'https://stage.bestbazaar.in/',
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
    GoogleAuth: {
      scopes: ['profile', 'email'],
      serverClientId: '766642882419-vspal5vjje9ucun6qkd3p9gmod3np428.apps.googleusercontent.com',
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;