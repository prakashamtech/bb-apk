# Unified Push Notification Implementation Plan
## Web + Capacitor Mobile App with Real FCM Tokens

**Date:** February 20, 2026  
**Objective:** Implement real FCM token generation for Capacitor mobile app while maintaining unified approach with web application

---

## Current State Analysis

### ✅ What's Working (Web Desktop)
- Push notification modal appears after 7 seconds
- FCM token generation via Firebase SDK
- Device registration with `/api/chat/push/subscribe` endpoint
- Token storage in database
- Service worker registration
- Push notification delivery

### ⚠️ What's Implemented (Capacitor Mobile)
- Push notification modal appears correctly
- Capacitor environment detection working
- Mock FCM token generation (`capacitor_mock_${timestamp}_${random}`)
- Device registration with same API endpoint
- Modal flow completes successfully

### ❌ What's Missing (Capacitor Mobile)
- **Real FCM token generation** (currently using mock tokens)
- Native push notification permission handling
- Actual push notification delivery to mobile device
- FCM integration with Capacitor native plugins

---

## Architecture Overview

### Unified Approach Strategy

```
┌─────────────────────────────────────────────────────────────┐
│                    Next.js Web Application                   │
│                  (bb-nextjs-sxa repository)                  │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  ┌──────────────┐      ┌──────────────┐                     │
│  │   Web View   │      │  Capacitor   │                     │
│  │   (Chrome)   │      │   WebView    │                     │
│  └──────┬───────┘      └──────┬───────┘                     │
│         │                     │                              │
│         │  Same UI & Logic    │                              │
│         ▼                     ▼                              │
│  ┌─────────────────────────────────┐                        │
│  │   usePushNotifications Hook     │                        │
│  │   - Detects environment         │                        │
│  │   - Generates FCM token         │                        │
│  │   - Calls unified API           │                        │
│  └────────────┬────────────────────┘                        │
│               │                                              │
│               ▼                                              │
│  ┌─────────────────────────────────┐                        │
│  │  /api/chat/push/subscribe       │                        │
│  │  - Stores device token          │                        │
│  │  - Same for web & mobile        │                        │
│  └─────────────────────────────────┘                        │
│                                                               │
└─────────────────────────────────────────────────────────────┘
         │                              │
         │ Web: Service Worker          │ Mobile: Native Plugin
         │ + Firebase Messaging         │ + Capacitor Push
         ▼                              ▼
┌──────────────────┐          ┌──────────────────┐
│  Firebase Cloud  │          │  Firebase Cloud  │
│    Messaging     │          │    Messaging     │
│   (Web Push)     │          │  (Native Push)   │
└──────────────────┘          └──────────────────┘
```

---

## Implementation Plan

### Phase 1: Install Capacitor Push Notification Plugin
**Repository:** `bb-apk/apk-demo`

#### 1.1 Install Required Packages
```bash
cd /Users/mac/Documents/src/bb-apk/apk-demo
npm install @capacitor/push-notifications
npx cap sync android
```

#### 1.2 Update `capacitor.config.ts`
```typescript
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.amtech.bestbazaar', // Update from com.apkdemo.app
  appName: 'Best Bazaar',
  webDir: 'out',
  server: {
    url: 'http://192.168.1.111:3000',
    cleartext: true,
    androidScheme: 'http'
  },
  android: {
    allowMixedContent: true,
    webContentsDebuggingEnabled: true,
  },
  plugins: {
    PushNotifications: {
      presentationOptions: ["badge", "sound", "alert"]
    }
  }
};

export default config;
```

#### 1.3 Update Android Manifest
**File:** `bb-apk/apk-demo/android/app/src/main/AndroidManifest.xml`

Add FCM service configuration:
```xml
<application>
  <!-- Existing content -->
  
  <!-- FCM Configuration -->
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_icon"
    android:resource="@mipmap/ic_launcher" />
  
  <meta-data
    android:name="com.google.firebase.messaging.default_notification_color"
    android:resource="@color/colorPrimary" />
</application>
```

#### 1.4 Add `google-services.json`
**File:** `bb-apk/apk-demo/android/app/google-services.json`

Download from Firebase Console for Android app configuration.

---

### Phase 2: Create Capacitor Push Service Bridge
**Repository:** `bb-nextjs-sxa`

#### 2.1 Create Capacitor Push Service
**File:** `src/lib/capacitor/pushService.ts`

```typescript
/**
 * Capacitor Push Notification Service
 * Bridges native Capacitor push notifications with web FCM flow
 */

import { Capacitor } from '@capacitor/core';
import { PushNotifications, Token, ActionPerformed } from '@capacitor/push-notifications';

export interface CapacitorPushService {
  isSupported: () => boolean;
  requestPermission: () => Promise<boolean>;
  registerDevice: () => Promise<string | null>;
  addListeners: () => void;
  removeListeners: () => void;
}

class CapacitorPushServiceImpl implements CapacitorPushService {
  private registrationToken: string | null = null;

  /**
   * Check if Capacitor push notifications are supported
   */
  isSupported(): boolean {
    return Capacitor.isNativePlatform();
  }

  /**
   * Request push notification permission
   */
  async requestPermission(): Promise<boolean> {
    if (!this.isSupported()) {
      console.log('[Capacitor Push] Not on native platform');
      return false;
    }

    try {
      console.log('[Capacitor Push] Requesting permission...');
      const result = await PushNotifications.requestPermissions();
      
      if (result.receive === 'granted') {
        console.log('[Capacitor Push] Permission granted');
        return true;
      } else {
        console.warn('[Capacitor Push] Permission denied');
        return false;
      }
    } catch (error) {
      console.error('[Capacitor Push] Permission request failed:', error);
      return false;
    }
  }

  /**
   * Register device and get FCM token
   */
  async registerDevice(): Promise<string | null> {
    if (!this.isSupported()) {
      console.log('[Capacitor Push] Not on native platform');
      return null;
    }

    try {
      console.log('[Capacitor Push] Registering device...');
      
      // Register with FCM
      await PushNotifications.register();
      
      // Wait for registration token
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          console.error('[Capacitor Push] Registration timeout');
          resolve(null);
        }, 10000); // 10 second timeout

        PushNotifications.addListener('registration', (token: Token) => {
          clearTimeout(timeout);
          console.log('[Capacitor Push] Registration success, token:', token.value);
          this.registrationToken = token.value;
          resolve(token.value);
        });

        PushNotifications.addListener('registrationError', (error: any) => {
          clearTimeout(timeout);
          console.error('[Capacitor Push] Registration error:', error);
          resolve(null);
        });
      });
    } catch (error) {
      console.error('[Capacitor Push] Registration failed:', error);
      return null;
    }
  }

  /**
   * Add push notification listeners
   */
  addListeners(): void {
    if (!this.isSupported()) return;

    console.log('[Capacitor Push] Adding listeners...');

    // Notification received while app is in foreground
    PushNotifications.addListener('pushNotificationReceived', (notification) => {
      console.log('[Capacitor Push] Notification received:', notification);
      // Handle foreground notification
      // You can show a custom UI or use the notification data
    });

    // Notification action performed (user tapped on notification)
    PushNotifications.addListener('pushNotificationActionPerformed', (action: ActionPerformed) => {
      console.log('[Capacitor Push] Notification action performed:', action);
      // Handle notification tap
      // Navigate to specific screen based on notification data
      const data = action.notification.data;
      if (data.url) {
        window.location.href = data.url;
      }
    });
  }

  /**
   * Remove all listeners
   */
  async removeListeners(): Promise<void> {
    if (!this.isSupported()) return;
    
    console.log('[Capacitor Push] Removing listeners...');
    await PushNotifications.removeAllListeners();
  }

  /**
   * Get current registration token
   */
  getToken(): string | null {
    return this.registrationToken;
  }
}

// Export singleton instance
export const capacitorPushService = new CapacitorPushServiceImpl();
```

---

### Phase 3: Update Web Push Hook to Use Real Capacitor Tokens
**Repository:** `bb-nextjs-sxa`

#### 3.1 Update `usePushNotifications.ts`
**File:** `src/hooks/usePushNotifications.ts`

Replace the mock token implementation (lines 168-225) with real Capacitor integration:

```typescript
// Subscribe to Firebase push notifications
const subscribe = useCallback(async (): Promise<string | null> => {
  if (!state.isSupported) {
    throw new Error('Push notifications not supported');
  }

  // Check if we're in Capacitor environment
  const isCapacitor = typeof window !== 'undefined' && !!(window as any).Capacitor;

  if (isCapacitor) {
    // ============================================================
    // CAPACITOR: Use native push notification plugin
    // ============================================================
    console.log('[Push Hook] Capacitor environment - using native FCM registration');
    
    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Import Capacitor push service
      const { capacitorPushService } = await import('../lib/capacitor/pushService');

      // Check if supported
      if (!capacitorPushService.isSupported()) {
        throw new Error('Capacitor push notifications not supported');
      }

      // Request permission
      console.log('[Push Hook] Requesting native permission...');
      const permissionGranted = await capacitorPushService.requestPermission();
      
      if (!permissionGranted) {
        console.warn('[Push Hook] Native permission denied');
        setState((prev) => ({ ...prev, isLoading: false }));
        return null;
      }

      // Register device and get FCM token
      console.log('[Push Hook] Registering device with FCM...');
      const fcmToken = await capacitorPushService.registerDevice();
      
      if (!fcmToken) {
        throw new Error('Failed to get FCM token from native plugin');
      }

      console.log('[Push Hook] FCM token obtained:', fcmToken);

      // Add notification listeners
      capacitorPushService.addListeners();

      // Register device with backend API (same endpoint as web)
      const response = await fetch('/api/chat/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: fcmToken,
          clientType: 'Android', // or 'iOS' based on platform
          platform: 'Android',
          deviceName: 'Capacitor App',
          deviceModel: await getDeviceModel(), // Helper function
          anonymousUserId: getAnonymousId(),
          attributes: {
            source: 'capacitor-native',
            timestamp: new Date().toISOString(),
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }

      const data = await response.json();
      console.log('[Push Hook] Device registered successfully:', data);

      setState((prev) => ({
        ...prev,
        fcmToken: fcmToken,
        isSubscribed: true,
        isLoading: false,
      }));

      return fcmToken;
    } catch (error) {
      console.error('[Push Hook] Capacitor registration error:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to register device';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }

  // ============================================================
  // WEB: Use service worker + Firebase messaging (existing code)
  // ============================================================
  // ... rest of existing web implementation
}, [state.isSupported]);

// Helper function to get device model
async function getDeviceModel(): Promise<string> {
  try {
    const { Device } = await import('@capacitor/device');
    const info = await Device.getInfo();
    return `${info.manufacturer} ${info.model}`;
  } catch {
    return 'Unknown Device';
  }
}
```

---

### Phase 4: Update Backend to Handle Both Token Types
**Repository:** `bb-microservices` (if needed)

The existing `/api/chat/push/subscribe` endpoint should already handle both web and mobile tokens since they're both FCM tokens. Verify:

1. Token format validation accepts both web and native FCM tokens
2. `clientType` field properly distinguishes between 'Web' and 'Android'/'iOS'
3. Database schema supports storing both token types

---

### Phase 5: Testing & Verification

#### 5.1 Build and Install Updated App
```bash
cd /Users/mac/Documents/src/bb-apk/apk-demo
npx cap sync android
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

#### 5.2 Test Flow
1. Clear app data: `adb shell pm clear com.amtech.bestbazaar`
2. Launch app: `adb shell am start -n com.amtech.bestbazaar/.MainActivity`
3. Wait for modal (7 seconds)
4. Click "Allow"
5. Verify logs show real FCM token (not mock)
6. Check database for stored token
7. Send test push notification from backend
8. Verify notification appears on device

#### 5.3 Verification Commands
```bash
# Monitor logs
adb logcat | grep -E "Capacitor Push|Push Hook|FCM"

# Check Chrome DevTools
chrome://inspect

# Verify token in database
# Query: SELECT * FROM push_devices WHERE clientType = 'Android'
```

---

## File Changes Summary

### bb-apk Repository
- ✏️ `apk-demo/package.json` - Add `@capacitor/push-notifications`
- ✏️ `apk-demo/capacitor.config.ts` - Update appId and add plugin config
- ✏️ `apk-demo/android/app/src/main/AndroidManifest.xml` - Add FCM metadata
- ➕ `apk-demo/android/app/google-services.json` - Firebase Android config

### bb-nextjs-sxa Repository
- ➕ `src/lib/capacitor/pushService.ts` - New Capacitor push service
- ✏️ `src/hooks/usePushNotifications.ts` - Replace mock with real implementation
- ✏️ `src/lib/firebase/client.ts` - Already supports Capacitor (no changes)
- ✏️ `src/hooks/usePushOptIn.ts` - Already supports Capacitor (no changes)

---

## Key Benefits of This Approach

✅ **Unified API:** Same `/api/chat/push/subscribe` endpoint for web and mobile  
✅ **Unified UI:** Same modal and user experience  
✅ **Unified Logic:** Same `usePushNotifications` hook with environment detection  
✅ **Real FCM Tokens:** Native tokens for mobile, web tokens for desktop  
✅ **Minimal Changes:** Only add Capacitor bridge, no backend changes needed  
✅ **Maintainable:** Single codebase for push notification logic  

---

## Next Steps

1. **Install Capacitor Push Plugin** in bb-apk repository
2. **Create Capacitor Push Service** in bb-nextjs-sxa repository
3. **Update usePushNotifications Hook** to use real tokens
4. **Test on Android Emulator** with real FCM token
5. **Deploy to Production** after successful testing

---

## Notes

- Firebase configuration already exists in both repositories
- Service account keys are already configured
- Web push notifications are fully functional
- Only mobile needs real token implementation
- No backend API changes required
- Database schema already supports both token types
