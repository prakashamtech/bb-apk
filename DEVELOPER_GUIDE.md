# Best Bazaar APK - Developer Guide

## Introduction

This guide is designed for developers who are new to the Best Bazaar APK project or new to Capacitor/hybrid mobile development. It explains how the app works, its architecture, and how to work with it effectively.

---

## Table of Contents

1. [What is This App?](#what-is-this-app)
2. [How Capacitor Works](#how-capacitor-works)
3. [Project Structure Explained](#project-structure-explained)
4. [Application Lifecycle](#application-lifecycle)
5. [Development Workflow](#development-workflow)
6. [Common Tasks](#common-tasks)
7. [Debugging Guide](#debugging-guide)
8. [Troubleshooting](#troubleshooting)
9. [FAQ](#faq)

---

## What is This App?

Best Bazaar APK is a **hybrid mobile application** that wraps a Next.js website into a native Android app using **Capacitor**.

### Key Concepts

**Hybrid App**: Combines web technologies (HTML, CSS, JavaScript) with native mobile capabilities.

```
┌─────────────────────────────────────┐
│      Native Android Container       │
│  ┌───────────────────────────────┐  │
│  │       WebView (Browser)       │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │   Your Next.js Website  │  │  │
│  │  │   (React Components)    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│         Capacitor Bridge            │
│  (Connects Web ↔ Native)           │
└─────────────────────────────────────┘
```

**Two Modes of Operation**:

1. **Server Mode** (Current): Loads remote website (`https://bestbazaar.in`)
   - Pros: Easy updates (just update website)
   - Cons: Requires internet, slower initial load

2. **Static Mode**: Bundles website into APK
   - Pros: Works offline, faster load
   - Cons: Need to rebuild APK for updates

---

## How Capacitor Works

### The Bridge Concept

Capacitor provides a **JavaScript bridge** that allows your web code to call native Android functions.

```javascript
// Web Code (JavaScript/TypeScript)
import { Camera } from '@capacitor/camera';

const photo = await Camera.getPhoto({
  quality: 90,
  allowEditing: false,
  resultType: CameraResultType.Uri
});

// ↓ Capacitor Bridge ↓

// Native Android Code (Java)
// CameraPlugin.java handles the request
// Opens Android camera
// Returns photo to JavaScript
```

### Available Plugins

| Plugin | Purpose | Example Use |
|--------|---------|-------------|
| `@capacitor/app` | App lifecycle, back button | Detect when app goes to background |
| `@capacitor/camera` | Camera access | Take photos |
| `@capacitor/geolocation` | GPS location | Get user's location |
| `@capacitor/push-notifications` | Push notifications | Receive FCM messages |
| `@capacitor/filesystem` | File operations | Save/read files |

### How to Use Plugins

```typescript
// 1. Import the plugin
import { Camera } from '@capacitor/camera';

// 2. Check if running in Capacitor (not browser)
if ((window as any).Capacitor) {
  // 3. Request permission
  const permission = await Camera.requestPermissions();
  
  if (permission.camera === 'granted') {
    // 4. Use the plugin
    const photo = await Camera.getPhoto({ quality: 90 });
  }
}
```

---

## Project Structure Explained

```
bb-apk/apk-demo/
├── android/                    # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/           # Java source code
│   │   │   │   └── MainActivity.java  # App entry point
│   │   │   ├── res/            # Android resources
│   │   │   └── AndroidManifest.xml    # App permissions
│   │   └── build.gradle        # Android build config
│   └── build.gradle            # Project build config
│
├── app/                        # Next.js application
│   ├── layout.tsx              # Root layout (wraps all pages)
│   ├── page.tsx                # Home page
│   ├── globals.css             # Global styles
│   │
│   ├── Components:
│   ├── PermissionsGate.tsx     # Permission request UI
│   ├── BackButtonHandler.tsx   # Android back button
│   ├── Header.tsx              # App header
│   ├── Footer.tsx              # App footer
│   │
│   ├── Configuration:
│   ├── firebase.ts             # Firebase setup
│   ├── scroll-optimization.js  # Performance utilities
│   │
│   └── api/                    # Backend API routes
│       └── save-fcm-token/
│           └── route.ts        # FCM token storage
│
├── public/                     # Static files
├── resources/                  # App icons & splash screens
├── scripts/                    # Utility scripts
│
├── Configuration Files:
├── capacitor.config.ts         # Capacitor settings
├── next.config.ts              # Next.js settings
├── package.json                # Dependencies
└── tsconfig.json               # TypeScript settings
```

### Key Files Explained

#### `capacitor.config.ts`
Controls how Capacitor behaves:

```typescript
const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',        // Android package name
  appName: 'Best Bazaar',          // App display name
  webDir: 'out',                   // Where built files are
  server: {
    url: 'https://bestbazaar.in',  // Remote website to load
    cleartext: true,               // Allow HTTP (dev only!)
    androidScheme: 'https'         // URL scheme
  }
};
```

#### `MainActivity.java`
The Android app's entry point:

```java
public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    // Capacitor automatically loads the WebView here
    // and initializes the bridge
  }
}
```

#### `layout.tsx`
The root React component:

```typescript
export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <BackButtonHandler />  {/* Handles Android back button */}
        {children}             {/* Page content goes here */}
      </body>
    </html>
  );
}
```

---

## Application Lifecycle

### What Happens When User Opens the App?

```
1. User taps app icon
   ↓
2. Android launches MainActivity.java
   ↓
3. MainActivity initializes Capacitor
   ↓
4. Capacitor creates WebView
   ↓
5. WebView loads website (from server or local files)
   ↓
6. Next.js app initializes
   ↓
7. React components render
   ↓
8. Capacitor bridge connects
   ↓
9. App is ready for user interaction
```

### Component Rendering Order

```
1. layout.tsx renders
   ├─> BackButtonHandler mounts (sets up back button listener)
   └─> {children} renders
       └─> page.tsx renders
           ├─> FCM registration starts
           └─> UI displays
```

### Permission Request Flow

```
1. App first launch
   ↓
2. PermissionsGate checks localStorage
   ↓
3. If not checked before, show permission dialog
   ↓
4. User clicks "Allow now"
   ↓
5. Request Camera permission → Android dialog
   ↓
6. Request Location permission → Android dialog
   ↓
7. Request Notification permission → Android dialog
   ↓
8. If notifications granted, register FCM token
   ↓
9. Save "permChecked" to localStorage
   ↓
10. Hide permission dialog
```

### FCM Token Registration Flow

```
1. PushNotifications.requestPermissions()
   ↓
2. User grants permission
   ↓
3. PushNotifications.register()
   ↓
4. Android FCM service generates token
   ↓
5. 'registration' listener fires with Capacitor token
   ↓
6. Get Firebase token using VAPID key
   ↓
7. POST both tokens to /api/save-fcm-token
   ↓
8. API saves tokens to MSSQL database
   ↓
9. Tokens ready for push notifications
```

---

## Development Workflow

### Initial Setup

```bash
# 1. Clone repository
cd bb-apk/apk-demo

# 2. Install dependencies
npm install

# 3. Install Android dependencies
cd android
./gradlew build
cd ..
```

### Development Cycle

#### For Web Development (Recommended for UI work)

```bash
# Start Next.js dev server
npm run dev

# Open in browser
# http://localhost:3000

# Make changes to files in app/
# Browser auto-refreshes
```

**Note**: Capacitor plugins won't work in browser. You'll see:
```
window.Capacitor is undefined
```

#### For Native Development (Testing Capacitor features)

```bash
# 1. Build Next.js app
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Open in Android Studio
npx cap open android

# 4. In Android Studio:
#    - Connect Android device or start emulator
#    - Click Run (green play button)
```

### Making Changes

#### Changing UI/Logic (TypeScript/React)

```bash
# 1. Edit files in app/
# Example: app/page.tsx

# 2. Build
npm run build

# 3. Sync to Android
npx cap sync android

# 4. Run in Android Studio
# (Or rebuild APK)
```

#### Changing Native Code (Java)

```bash
# 1. Edit files in android/app/src/main/java/
# Example: MainActivity.java

# 2. Open Android Studio
npx cap open android

# 3. Make changes in Android Studio

# 4. Build and run
```

#### Changing Capacitor Config

```bash
# 1. Edit capacitor.config.ts

# 2. Sync changes
npx cap sync android

# 3. Rebuild app
```

---

## Common Tasks

### Task 1: Add a New Page

```typescript
// 1. Create new file: app/products/page.tsx
export default function ProductsPage() {
  return (
    <div>
      <h1>Products</h1>
      {/* Your content */}
    </div>
  );
}

// 2. Navigate to it from another component
import { useRouter } from 'next/navigation';

const router = useRouter();
router.push('/products');

// 3. Build and sync
npm run build
npx cap sync android
```

### Task 2: Request a New Permission

```typescript
// 1. Install plugin (if needed)
npm install @capacitor/camera

// 2. Add to AndroidManifest.xml (usually auto-added by plugin)
// Check android/app/src/main/AndroidManifest.xml

// 3. Request permission in code
import { Camera } from '@capacitor/camera';

const permission = await Camera.requestPermissions();
if (permission.camera === 'granted') {
  // Use camera
}
```

### Task 3: Add a New Capacitor Plugin

```bash
# 1. Install plugin
npm install @capacitor/plugin-name

# 2. Sync to Android
npx cap sync android

# 3. Use in code
import { PluginName } from '@capacitor/plugin-name';

// Check if in Capacitor environment
if ((window as any).Capacitor) {
  const result = await PluginName.someMethod();
}
```

### Task 4: Change App Icon

```bash
# 1. Replace files in resources/
#    - icon-foreground.png (512x512)
#    - icon-background.png (512x512)

# 2. Generate icons
npx capacitor-assets generate

# 3. Sync to Android
npx cap sync android

# 4. Rebuild APK
```

### Task 5: Change Splash Screen

```bash
# 1. Replace files in resources/
#    - splash.png (2732x2732)
#    - splash-dark.png (optional, for dark mode)

# 2. Generate splash screens
npx capacitor-assets generate

# 3. Sync to Android
npx cap sync android
```

### Task 6: Build Release APK

```bash
# 1. Build Next.js
npm run build

# 2. Sync to Android
npx cap sync android

# 3. Build release APK
cd android
./gradlew assembleRelease

# 4. Find APK at:
# android/app/build/outputs/apk/release/app-release-unsigned.apk

# 5. Sign APK (for production)
# Use Android Studio or jarsigner
```

### Task 7: Test Push Notifications

```bash
# 1. Ensure FCM token is registered
# Check app logs or database

# 2. Run test script
cd scripts
node push-test.js "Test Title" "Test Message"

# 3. Check device for notification
```

### Task 8: Debug WebView Content

```bash
# 1. Enable WebView debugging in MainActivity.java
webContentsDebuggingEnabled: true

# 2. Build and run app

# 3. Open Chrome on desktop
chrome://inspect

# 4. Find your device and click "inspect"

# 5. Use Chrome DevTools to debug
```

---

## Debugging Guide

### Debugging Levels

#### 1. Browser Debugging (Web Code)

**When**: Debugging UI, React components, TypeScript logic

**How**:
```bash
npm run dev
# Open http://localhost:3000
# Use browser DevTools (F12)
```

**Limitations**: Capacitor plugins won't work

#### 2. Android Logcat (Native Logs)

**When**: Debugging Capacitor plugins, native code, FCM

**How**:
```bash
# In Android Studio:
# View > Tool Windows > Logcat

# Or via command line:
adb logcat | grep "Capacitor"
adb logcat | grep "📱"  # Our custom logs
```

**What to look for**:
```
📱 Starting FCM registration...
📱 ===== CAPACITOR FCM TOKEN =====
📱 Mobile FCM Token: eyJhbGc...
```

#### 3. Chrome Remote Debugging (WebView)

**When**: Debugging web code running inside the app

**How**:
```bash
# 1. Enable in capacitor.config.ts
android: {
  webContentsDebuggingEnabled: true
}

# 2. Connect device and run app

# 3. Open Chrome: chrome://inspect

# 4. Click "inspect" on your WebView
```

**Use cases**:
- Check console logs
- Inspect DOM
- Debug JavaScript
- Check network requests

#### 4. Android Studio Debugger (Java Code)

**When**: Debugging MainActivity.java or native plugins

**How**:
```bash
# 1. Open Android Studio
# 2. Set breakpoints in Java code
# 3. Click Debug (bug icon) instead of Run
# 4. App pauses at breakpoints
```

### Common Debug Scenarios

#### Scenario 1: FCM Token Not Generating

**Check**:
1. Logcat for errors
2. Permission granted?
3. `google-services.json` exists?
4. Internet connection?

**Debug**:
```bash
adb logcat | grep -E "(FCM|Firebase|Messaging)"
```

#### Scenario 2: Back Button Not Working

**Check**:
1. BackButtonHandler mounted?
2. Listener registered?
3. Check Logcat

**Debug**:
```typescript
// Add logs to BackButtonHandler.tsx
App.addListener("backButton", (event: any) => {
  console.log("Back button pressed", event);
  // ...
});
```

#### Scenario 3: Permission Dialog Not Showing

**Check**:
1. PermissionsGate rendered in layout?
2. localStorage cleared?
3. Check component state

**Debug**:
```typescript
// Add logs to PermissionsGate.tsx
useEffect(() => {
  const checked = localStorage.getItem("permChecked");
  console.log("Permission checked:", checked);
  if (!checked) setStep("prompt");
}, []);
```

#### Scenario 4: App Crashes on Launch

**Check**:
1. Logcat for stack trace
2. Build errors?
3. Missing dependencies?

**Debug**:
```bash
adb logcat | grep -E "(AndroidRuntime|FATAL)"
```

---

## Troubleshooting

### Issue: "Capacitor is not defined"

**Cause**: Running in browser, not in app

**Solution**: Check environment
```typescript
if (typeof window !== 'undefined' && (window as any).Capacitor) {
  // Capacitor code here
}
```

### Issue: "Permission denied" for Camera/Location

**Cause**: Permission not in AndroidManifest.xml

**Solution**:
```bash
# Sync plugins to update manifest
npx cap sync android

# Or manually add to AndroidManifest.xml
<uses-permission android:name="android.permission.CAMERA" />
```

### Issue: APK build fails

**Common causes**:
1. Java version mismatch
2. Gradle cache corrupted
3. Missing dependencies

**Solution**:
```bash
# Clear Gradle cache
cd android
./gradlew clean

# Rebuild
./gradlew assembleDebug

# If still fails, check Java version
java -version  # Should be Java 17
```

### Issue: WebView shows blank screen

**Causes**:
1. Network error (server mode)
2. Build failed
3. Wrong webDir path

**Solution**:
```bash
# Check Logcat
adb logcat | grep "WebView"

# Verify build output
ls out/  # Should have index.html

# Check capacitor.config.ts
webDir: 'out'  # Must match build output
```

### Issue: Push notifications not received

**Checklist**:
- [ ] Permission granted?
- [ ] FCM token generated?
- [ ] Token saved to database?
- [ ] `google-services.json` exists?
- [ ] Correct Firebase project?
- [ ] App in foreground or background?

**Debug**:
```bash
# Check token in database
SELECT * FROM fcm_tokens WHERE platform='android' AND is_active=1;

# Test notification
node scripts/push-test.js "Test" "Message" "your-token-here"
```

### Issue: Changes not reflecting in app

**Cause**: Forgot to build or sync

**Solution**:
```bash
# Always do this after changes:
npm run build
npx cap sync android

# Then rebuild in Android Studio
```

---

## FAQ

### Q: Do I need to rebuild the APK every time I change the website?

**A**: Depends on mode:
- **Server mode** (current): No, just update the website
- **Static mode**: Yes, need to rebuild APK

### Q: Can I use npm packages in this app?

**A**: Yes! Any npm package that works in Next.js will work here.

```bash
npm install package-name
```

### Q: How do I test on a real device?

**A**:
```bash
# 1. Enable USB debugging on Android device
# Settings > Developer Options > USB Debugging

# 2. Connect device via USB

# 3. Verify connection
adb devices

# 4. Run from Android Studio
# Select your device from dropdown
# Click Run
```

### Q: Can this app work on iOS?

**A**: Capacitor supports iOS, but you need:
- macOS computer
- Xcode installed
- Apple Developer account ($99/year)

```bash
# Add iOS platform
npx cap add ios
npx cap open ios
```

### Q: How do I update Capacitor version?

**A**:
```bash
# Update packages
npm install @capacitor/core@latest @capacitor/cli@latest
npm install @capacitor/android@latest

# Sync
npx cap sync android
```

### Q: Where are console.log messages?

**A**: Depends on where code runs:
- **Browser**: Browser console (F12)
- **WebView**: Chrome remote debugging
- **Native code**: Android Logcat

### Q: How do I add environment variables?

**A**:
```bash
# Create .env.local
DB_SERVER=localhost
DB_NAME=mydb

# Access in code
process.env.DB_SERVER
```

**Note**: For client-side, prefix with `NEXT_PUBLIC_`:
```bash
NEXT_PUBLIC_API_URL=https://api.example.com
```

### Q: Can I use this for production?

**A**: After fixing critical issues:
- Remove service account key from client
- Secure database credentials
- Implement Google SSO
- Fix FCM permission UI
- Enable offline support (recommended)

See `COMPREHENSIVE_REVIEW.md` for full list.

---

## Next Steps

1. **Read**: `ARCHITECTURE_DOCUMENTATION.md` for detailed architecture
2. **Review**: `COMPREHENSIVE_REVIEW.md` for issues and recommendations
3. **Fix**: Critical security issues first
4. **Implement**: Missing features (Google SSO, offline support)
5. **Test**: On real devices
6. **Deploy**: Build release APK

---

## Useful Commands Reference

```bash
# Development
npm run dev                    # Start Next.js dev server
npm run build                  # Build Next.js app
npx cap sync android          # Sync to Android
npx cap open android          # Open in Android Studio

# Building
cd android
./gradlew assembleDebug       # Build debug APK
./gradlew assembleRelease     # Build release APK

# Debugging
adb devices                   # List connected devices
adb logcat                    # View Android logs
adb logcat | grep "Capacitor" # Filter logs

# Cleaning
./gradlew clean               # Clean Android build
rm -rf node_modules           # Clean Node modules
npm install                   # Reinstall dependencies

# Testing
node scripts/push-test.js "Title" "Body"  # Test push notifications
```

---

## Resources

- **Capacitor Docs**: https://capacitorjs.com/docs
- **Next.js Docs**: https://nextjs.org/docs
- **Android Docs**: https://developer.android.com
- **Firebase Docs**: https://firebase.google.com/docs

---

**Document Version**: 1.0  
**Last Updated**: February 2025  
**For**: Developers new to the project
