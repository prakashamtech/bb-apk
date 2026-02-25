# Best Bazaar APK - Architecture Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Architecture Pattern](#architecture-pattern)
4. [Folder Structure](#folder-structure)
5. [Application Lifecycle](#application-lifecycle)
6. [Request/Response Flow](#requestresponse-flow)
7. [Module Responsibilities](#module-responsibilities)
8. [Native Integration](#native-integration)
9. [Data Flow Diagrams](#data-flow-diagrams)

---

## Project Overview

**Best Bazaar APK** is a hybrid mobile application built using **Capacitor** that wraps a Next.js web application into a native Android app. The app loads the hosted website (`https://bestbazaar.in`) in a WebView, providing a native app experience while maintaining web-based content delivery.

### Key Characteristics
- **Hybrid Architecture**: Web content (Next.js) + Native container (Capacitor)
- **Server Mode**: Loads remote website in WebView (not static export)
- **Platform**: Android (minSdk 23, targetSdk 35)
- **Framework**: Next.js 15.5.5 with React 19.1.0
- **Build Tool**: Capacitor 7.4.3

---

## Technology Stack

### Frontend Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.5.5 | React framework with App Router |
| React | 19.1.0 | UI library |
| TypeScript | 5.x | Type safety |
| Tailwind CSS | 4.x | Styling |

### Native Layer
| Technology | Version | Purpose |
|------------|---------|---------|
| Capacitor | 7.4.3 | Native bridge |
| Android SDK | 35 | Android platform |
| Gradle | 8.13.1 | Build system |
| Java | 17 | Android development |

### Capacitor Plugins
| Plugin | Version | Purpose |
|--------|---------|---------|
| @capacitor/app | 7.1.0 | App lifecycle, back button |
| @capacitor/camera | 7.0.2 | Camera access |
| @capacitor/filesystem | 7.1.4 | File operations |
| @capacitor/geolocation | 7.1.5 | Location services |
| @capacitor/push-notifications | 7.0.3 | Push notifications |
| @capacitor-firebase/messaging | 7.4.0 | FCM integration |

### Backend Integration
| Technology | Purpose |
|------------|---------|
| Firebase | Push notifications, analytics |
| MSSQL | FCM token storage |
| Next.js API Routes | Token management endpoints |

---

## Architecture Pattern

### Hybrid WebView Architecture

```
┌─────────────────────────────────────────────┐
│           Android Native Layer              │
│  ┌───────────────────────────────────────┐  │
│  │      MainActivity.java                │  │
│  │  - Hardware acceleration              │  │
│  │  - WebView optimization               │  │
│  │  - Native permissions                 │  │
│  └───────────────────────────────────────┘  │
│                    ▲                         │
│                    │ Capacitor Bridge        │
│                    ▼                         │
│  ┌───────────────────────────────────────┐  │
│  │         Capacitor WebView             │  │
│  │  - Loads: https://bestbazaar.in       │  │
│  │  - JavaScript Bridge                  │  │
│  │  - Plugin Communication               │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ▲
                    │ HTTPS
                    ▼
┌─────────────────────────────────────────────┐
│         Hosted Next.js Application          │
│  ┌───────────────────────────────────────┐  │
│  │      React Components (TSX)           │  │
│  │  - PermissionsGate                    │  │
│  │  - BackButtonHandler                  │  │
│  │  - Header, Footer                     │  │
│  │  - Page Components                    │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │      Capacitor Client APIs            │  │
│  │  - PushNotifications                  │  │
│  │  - Camera, Geolocation                │  │
│  │  - App lifecycle hooks                │  │
│  └───────────────────────────────────────┘  │
│  ┌───────────────────────────────────────┐  │
│  │      Next.js API Routes               │  │
│  │  - /api/save-fcm-token                │  │
│  └───────────────────────────────────────┘  │
└─────────────────────────────────────────────┘
                    ▲
                    │
                    ▼
┌─────────────────────────────────────────────┐
│         External Services                   │
│  - Firebase Cloud Messaging                 │
│  - MSSQL Database                           │
└─────────────────────────────────────────────┘
```

---

## Folder Structure

```
bb-apk/apk-demo/
├── android/                          # Native Android project
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/com/apkdemo/app/
│   │   │   │   └── MainActivity.java # Main activity with WebView config
│   │   │   ├── res/                  # Android resources (icons, splash)
│   │   │   └── AndroidManifest.xml   # App permissions & config
│   │   ├── build.gradle              # App-level build config
│   │   └── google-services.json      # Firebase config (if exists)
│   ├── build.gradle                  # Project-level build config
│   ├── variables.gradle              # SDK versions & dependencies
│   └── gradle/                       # Gradle wrapper
│
├── app/                              # Next.js application
│   ├── layout.tsx                    # Root layout
│   ├── page.tsx                      # Home page with FCM demo
│   ├── globals.css                   # Global styles
│   ├── firebase.ts                   # Firebase configuration
│   ├── PermissionsGate.tsx           # Permission request UI
│   ├── BackButtonHandler.tsx         # Android back button handler
│   ├── Header.tsx                    # App header component
│   ├── Footer.tsx                    # App footer component
│   ├── scroll-optimization.js        # Scroll performance utilities
│   ├── api/
│   │   └── save-fcm-token/
│   │       └── route.ts              # FCM token storage API
│   └── best-bazaar-92dd6-*.json      # Firebase service account
│
├── public/                           # Static assets
│   ├── index.html                    # Fallback HTML
│   └── *.svg                         # Icons and images
│
├── resources/                        # Capacitor assets
│   ├── icon-*.png                    # App icons
│   └── splash*.png                   # Splash screens
│
├── scripts/
│   └── push-test.js                  # FCM testing script
│
├── capacitor.config.ts               # Capacitor configuration
├── next.config.ts                    # Next.js configuration
├── package.json                      # Dependencies
├── tsconfig.json                     # TypeScript config
└── README.md                         # Project documentation
```

### Key Directory Responsibilities

| Directory | Purpose | Critical Files |
|-----------|---------|----------------|
| `android/` | Native Android project | MainActivity.java, AndroidManifest.xml |
| `app/` | Next.js application code | layout.tsx, page.tsx, firebase.ts |
| `app/api/` | Backend API routes | save-fcm-token/route.ts |
| `public/` | Static web assets | index.html |
| `resources/` | Native app assets | Icons, splash screens |
| `scripts/` | Utility scripts | push-test.js |

---

## Application Lifecycle

### 1. App Installation & First Launch

```
┌─────────────────────────────────────────────────────────────┐
│ 1. User installs APK                                        │
│    └─> Android extracts and installs app                    │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 2. User taps app icon                                       │
│    └─> Android launches MainActivity                        │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 3. MainActivity.onCreate()                                  │
│    ├─> Enable hardware acceleration                         │
│    ├─> Initialize Capacitor bridge                          │
│    └─> Load WebView with URL: https://bestbazaar.in        │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 4. MainActivity.onStart()                                   │
│    └─> Configure WebView for smooth scrolling               │
│        ├─> Set hardware layer                               │
│        ├─> Enable GPU acceleration                          │
│        ├─> Optimize rendering priority                      │
│        └─> Configure touch scrolling                        │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 5. WebView loads remote website                             │
│    ├─> HTTPS request to bestbazaar.in                       │
│    ├─> Download HTML, CSS, JS                               │
│    └─> Initialize Capacitor JS bridge                       │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 6. React App Initialization                                 │
│    ├─> layout.tsx renders                                   │
│    │   ├─> Loads BackButtonHandler                          │
│    │   └─> Loads scroll-optimization.js                     │
│    └─> page.tsx renders                                     │
│        └─> Starts FCM registration flow                     │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 7. Permission Request (First Launch Only)                   │
│    ├─> PermissionsGate checks localStorage                  │
│    ├─> Shows permission dialog if not checked               │
│    └─> Requests:                                            │
│        ├─> Camera                                           │
│        ├─> Location                                         │
│        ├─> Notifications (FCM)                              │
│        └─> Filesystem                                       │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 8. FCM Token Registration                                   │
│    ├─> PushNotifications.register()                         │
│    ├─> Receive Capacitor FCM token                          │
│    ├─> Get Firebase FCM token                               │
│    └─> Send to /api/save-fcm-token                          │
│        └─> Store in MSSQL database                          │
└─────────────────────────────────────────────────────────────┘
                         ▼
┌─────────────────────────────────────────────────────────────┐
│ 9. App Ready                                                │
│    └─> User can interact with the app                       │
└─────────────────────────────────────────────────────────────┘
```

### 2. Subsequent Launches

```
App Launch → MainActivity → WebView Load → React Render → App Ready
(Permissions already granted, FCM token already registered)
```

### 3. Background/Foreground Transitions

```
┌─────────────────────────────────────────────────────────────┐
│ User presses Home button                                    │
│    └─> App.addListener('appStateChange')                    │
│        └─> state: 'background'                              │
│            └─> WebView paused, connections maintained        │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ User returns to app                                         │
│    └─> App.addListener('appStateChange')                    │
│        └─> state: 'active'                                  │
│            └─> WebView resumed                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Request/Response Flow

### FCM Token Registration Flow

```
┌──────────────┐
│  React App   │
│  (page.tsx)  │
└──────┬───────┘
       │ 1. useEffect() triggers
       │    registerFCM()
       ▼
┌──────────────────────────┐
│ PushNotifications Plugin │
└──────┬───────────────────┘
       │ 2. requestPermissions()
       │ 3. register()
       ▼
┌──────────────────────────┐
│  Android System          │
│  (FCM Service)           │
└──────┬───────────────────┘
       │ 4. Returns device token
       ▼
┌──────────────────────────┐
│ registration listener    │
│ (PermissionsGate.tsx)    │
└──────┬───────────────────┘
       │ 5. Get Firebase token
       ▼
┌──────────────────────────┐
│ Firebase Messaging       │
│ getToken(vapidKey)       │
└──────┬───────────────────┘
       │ 6. Returns Firebase token
       ▼
┌──────────────────────────┐
│ POST /api/save-fcm-token │
└──────┬───────────────────┘
       │ 7. Save to database
       ▼
┌──────────────────────────┐
│  MSSQL Database          │
│  fcm_tokens table        │
└──────────────────────────┘
```

### Push Notification Delivery Flow

```
┌──────────────────────────┐
│  Admin/Backend           │
│  (push-test.js)          │
└──────┬───────────────────┘
       │ 1. Query MSSQL for tokens
       │ 2. Call Firebase Admin SDK
       ▼
┌──────────────────────────┐
│  Firebase Cloud          │
│  Messaging               │
└──────┬───────────────────┘
       │ 3. Send to device
       ▼
┌──────────────────────────┐
│  Android System          │
│  (FCM Service)           │
└──────┬───────────────────┘
       │ 4. Deliver notification
       ▼
┌──────────────────────────┐
│  App (Foreground)        │
│  - Show in-app alert     │
│  OR                      │
│  App (Background)        │
│  - Show system tray      │
└──────────────────────────┘
```

### Page Navigation Flow

```
┌──────────────────────────┐
│  User clicks link/button │
└──────┬───────────────────┘
       │ 1. router.push('/path')
       ▼
┌──────────────────────────┐
│  Next.js Router          │
│  (Client-side)           │
└──────┬───────────────────┘
       │ 2. Fetch page from server
       ▼
┌──────────────────────────┐
│  bestbazaar.in server    │
└──────┬───────────────────┘
       │ 3. Return HTML/JS
       ▼
┌──────────────────────────┐
│  WebView renders         │
│  new page                │
└──────────────────────────┘
```

### Android Back Button Flow

```
┌──────────────────────────┐
│  User presses back       │
└──────┬───────────────────┘
       │ 1. Android system event
       ▼
┌──────────────────────────┐
│  App.addListener         │
│  ('backButton')          │
│  (BackButtonHandler.tsx) │
└──────┬───────────────────┘
       │ 2. Check canGoBack
       ▼
┌──────────────────────────┐
│  If canGoBack = true     │
│  └─> window.history.back()│
│                          │
│  If canGoBack = false    │
│  └─> Do nothing (stay)   │
│      (or minimize app)   │
└──────────────────────────┘
```

---

## Module Responsibilities

### Core Modules

#### 1. **MainActivity.java**
**Location**: `android/app/src/main/java/com/apkdemo/app/MainActivity.java`

**Responsibilities**:
- Initialize Capacitor bridge
- Configure WebView for optimal performance
- Enable hardware acceleration
- Set rendering priorities
- Configure scroll behavior
- Manage WebView lifecycle

**Key Methods**:
- `onCreate()`: Initialize activity, enable hardware acceleration
- `onStart()`: Configure WebView settings for smooth scrolling
- `configureWebViewForSmoothScrolling()`: Optimize WebView performance

#### 2. **PermissionsGate.tsx**
**Location**: `app/PermissionsGate.tsx`

**Responsibilities**:
- Request runtime permissions on first launch
- Handle permission grant/deny states
- Register FCM tokens after permission grant
- Manage localStorage for permission tracking
- Display permission request UI

**Key Functions**:
- `requestAll()`: Request all permissions (camera, location, notifications, files)
- `registerFCMToken()`: Initialize FCM registration flow
- Permission state management (idle, prompt, requesting, done, denied)

#### 3. **BackButtonHandler.tsx**
**Location**: `app/BackButtonHandler.tsx`

**Responsibilities**:
- Handle Android hardware back button
- Navigate browser history
- Prevent app exit at root level

**Key Functions**:
- `App.addListener('backButton')`: Listen for back button events
- Check `canGoBack` and navigate or stay

#### 4. **firebase.ts**
**Location**: `app/firebase.ts`

**Responsibilities**:
- Initialize Firebase app
- Export Firebase messaging instance
- Store Firebase configuration
- Provide VAPID key for FCM

**Exports**:
- `getMessagingInstance()`: Get Firebase Messaging instance
- `VAPID_KEY`: Public VAPID key for FCM web push

#### 5. **scroll-optimization.js**
**Location**: `app/scroll-optimization.js`

**Responsibilities**:
- Optimize scroll performance
- Add passive event listeners
- Throttle scroll events
- Manage scroll state classes
- Provide React hooks for scroll handling

**Key Classes/Functions**:
- `ScrollOptimizer`: Global scroll optimization manager
- `useOptimizedScroll()`: React hook for scroll events
- `throttle()`, `debounce()`: Performance utilities

#### 6. **/api/save-fcm-token/route.ts**
**Location**: `app/api/save-fcm-token/route.ts`

**Responsibilities**:
- Receive FCM tokens from client
- Validate token data
- Check for duplicate tokens
- Store tokens in MSSQL database
- Handle database connections

**API Endpoint**:
- **POST** `/api/save-fcm-token`
- **Body**: `{ fcmToken, platform, deviceId }`
- **Response**: Success/error message

#### 7. **push-test.js**
**Location**: `scripts/push-test.js`

**Responsibilities**:
- Send test push notifications
- Query MSSQL for active tokens
- Use Firebase Admin SDK
- Support targeted or broadcast notifications

**Usage**:
```bash
node scripts/push-test.js "Title" "Body" [optional-token]
```

---

## Native Integration

### Capacitor Bridge Communication

```
JavaScript (Web)  ←→  Capacitor Bridge  ←→  Native Android

Example: Camera Access
─────────────────────────────────────────────────────────
Web Code:
  import { Camera } from '@capacitor/camera';
  await Camera.getPhoto({ quality: 90 });
                    ↓
Capacitor Bridge:
  - Serializes JS call
  - Routes to native plugin
                    ↓
Native Android:
  - CameraPlugin.java executes
  - Opens camera intent
  - Returns image data
                    ↓
Capacitor Bridge:
  - Serializes response
  - Returns to JS
                    ↓
Web Code:
  - Receives image data
```

### Permission Flow

```
┌─────────────────────────────────────────────────────────┐
│ JavaScript Request                                      │
│   Camera.requestPermissions()                           │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Capacitor Bridge                                        │
│   - Checks AndroidManifest.xml for permission          │
│   - Routes to PermissionManager                         │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Android System                                          │
│   - Shows permission dialog                             │
│   - User grants/denies                                  │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ Capacitor Bridge                                        │
│   - Returns result to JS                                │
└─────────────────┬───────────────────────────────────────┘
                  ▼
┌─────────────────────────────────────────────────────────┐
│ JavaScript Callback                                     │
│   - Handle granted/denied state                         │
└─────────────────────────────────────────────────────────┘
```

### Current Permissions in AndroidManifest.xml

```xml
<uses-permission android:name="android.permission.INTERNET" />
```

**Note**: Other permissions (Camera, Location, Notifications) are added automatically by Capacitor plugins.

---

## Data Flow Diagrams

### Overall System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     User Device                             │
│  ┌───────────────────────────────────────────────────────┐  │
│  │              Best Bazaar APK                          │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │         WebView (Capacitor)                     │  │  │
│  │  │  ┌───────────────────────────────────────────┐  │  │  │
│  │  │  │     Next.js App (React)                   │  │  │  │
│  │  │  │  - UI Components                          │  │  │  │
│  │  │  │  - Business Logic                         │  │  │  │
│  │  │  │  - Capacitor Plugin Calls                 │  │  │  │
│  │  │  └───────────────────────────────────────────┘  │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │     Native Android Layer                        │  │  │
│  │  │  - MainActivity                                 │  │  │
│  │  │  - Capacitor Plugins                            │  │  │
│  │  │  - Android System APIs                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ▲ │
                         │ │ HTTPS
                         │ ▼
┌─────────────────────────────────────────────────────────────┐
│              Remote Server (bestbazaar.in)                  │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Next.js Server                                       │  │
│  │  - SSR/SSG Pages                                      │  │
│  │  - API Routes                                         │  │
│  │  - Static Assets                                      │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                         ▲ │
                         │ │
                         │ ▼
┌─────────────────────────────────────────────────────────────┐
│                  External Services                          │
│  ┌──────────────────┐  ┌──────────────────┐                 │
│  │  Firebase FCM    │  │  MSSQL Database  │                 │
│  │  - Push Delivery │  │  - Token Storage │                 │
│  └──────────────────┘  └──────────────────┘                 │
└─────────────────────────────────────────────────────────────┘
```

### Component Interaction Map

```
┌────────────────┐
│   layout.tsx   │ (Root Layout)
└────────┬───────┘
         │ Renders
         ├─────────────────┐
         ▼                 ▼
┌────────────────┐  ┌──────────────────┐
│BackButtonHandler│  │  page.tsx       │
│  - Back button │  │  - Home page    │
│    handling    │  │  - FCM demo     │
└────────────────┘  └──────┬───────────┘
                           │ Uses
                           ▼
                    ┌──────────────────┐
                    │ PermissionsGate  │
                    │  - Permission UI │
                    │  - FCM register  │
                    └──────┬───────────┘
                           │ Calls
                           ▼
                    ┌──────────────────┐
                    │   firebase.ts    │
                    │  - Firebase init │
                    │  - VAPID key     │
                    └──────────────────┘
```

---

## Summary

This architecture documentation provides a comprehensive understanding of the Best Bazaar APK project:

1. **Hybrid Architecture**: Combines Next.js web app with Capacitor native container
2. **Server-Dependent**: Loads remote website, not a standalone static app
3. **Permission-Driven**: Requests permissions on first launch
4. **FCM Integration**: Full push notification support with token management
5. **Performance Optimized**: Hardware acceleration, scroll optimization
6. **Modular Design**: Clear separation between web layer, bridge, and native layer

### Key Takeaways for Developers

- **Web Development**: Work in `app/` directory using Next.js/React
- **Native Customization**: Modify `MainActivity.java` for Android-specific behavior
- **Plugin Integration**: Use Capacitor plugins for native features
- **Build Process**: `npm run build` → `npx cap sync` → `./gradlew assembleDebug`
- **Testing**: Use Android Studio for native debugging, browser DevTools for web layer

---

**Document Version**: 1.0  
**Last Updated**: February 2025  
**Maintained By**: Development Team
