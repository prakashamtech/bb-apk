# Best Bazaar APK - Implementation Roadmap

## Overview

This roadmap provides a prioritized, actionable plan to address all identified issues and implement recommended improvements. Each task includes effort estimation, dependencies, and expected outcomes.

---

## Priority Matrix

| Priority | Count | Total Effort | Timeline |
|----------|-------|--------------|----------|
| 🔴 Critical | 6 | 32-48 hours | Week 1 |
| 🟡 High | 11 | 56-80 hours | Weeks 2-3 |
| 🟢 Medium | 11 | 32-48 hours | Week 4 |
| ⚪ Low | 6 | 48-72 hours | Ongoing |
| **Total** | **34** | **168-248 hours** | **6-8 weeks** |

---

## PHASE 1: CRITICAL FIXES (Week 1)

**Goal**: Fix security vulnerabilities and broken core features  
**Effort**: 32-48 hours  
**Success Criteria**: App is secure and core features work

### Task 1.1: Remove Exposed Service Account Key 🔴

**Issue**: SEC-001  
**Effort**: 2 hours  
**Priority**: IMMEDIATE

**Steps**:
```bash
# 1. Delete the file
cd app/
rm best-bazaar-92dd6-7d5e83eb8fe5.json

# 2. Remove from git
git rm best-bazaar-92dd6-7d5e83eb8fe5.json
git commit -m "security: Remove exposed Firebase service account key"

# 3. Update .gitignore
echo "*.json" >> .gitignore
echo "!package.json" >> .gitignore
echo "!package-lock.json" >> .gitignore
echo "!tsconfig.json" >> .gitignore
```

**Firebase Console**:
1. Go to Firebase Console → Project Settings → Service Accounts
2. Delete key with ID: `7d5e83eb8fe5b51155711f4f62140f1fa85cd70b`
3. Generate new key (download and store on backend server only)

**Backend Setup** (if not exists):
```typescript
// backend/firebase-admin.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});
```

**Verification**:
- [ ] File deleted from repository
- [ ] File not in git history (or history rewritten)
- [ ] Old key revoked in Firebase
- [ ] New key generated and stored securely
- [ ] Backend can send push notifications with new key

---

### Task 1.2: Secure Firebase Configuration 🔴

**Issue**: SEC-002  
**Effort**: 3 hours  
**Priority**: HIGH

**Steps**:

1. **Move VAPID key to environment**:
```typescript
// app/firebase.ts
export const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

if (!VAPID_KEY && typeof window !== 'undefined') {
  console.error('VAPID_KEY not configured');
}
```

2. **Create .env.local**:
```bash
# .env.local (add to .gitignore)
NEXT_PUBLIC_VAPID_KEY=BPAXcJgOiVm9xR-SPL3sOUBpb9luh8AxY4IAODgbwF1RLnf_2Lv6yMGlsORWXE7B_Mrj-H56tC8Ko_LO_tlkkxU
```

3. **Implement Firebase App Check**:
```bash
npm install firebase/app-check
```

```typescript
// app/firebase.ts
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider(process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY || ''),
    isTokenAutoRefreshEnabled: true,
  });
}
```

4. **Set Firebase Security Rules**:
```javascript
// Firebase Console → Firestore → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

**Verification**:
- [ ] VAPID key in environment variable
- [ ] App Check enabled
- [ ] Security rules deployed
- [ ] FCM still works

---

### Task 1.3: Secure Database Configuration 🔴

**Issue**: SEC-003  
**Effort**: 6 hours  
**Priority**: HIGH

**Steps**:

1. **Create dedicated database user**:
```sql
-- Connect to MSSQL as admin
CREATE LOGIN fcm_app_user WITH PASSWORD = 'GenerateStrongRandomPassword123!';
CREATE USER fcm_app_user FOR LOGIN fcm_app_user;

-- Grant minimal permissions
USE bestbazaar;
GRANT SELECT, INSERT, UPDATE ON fcm_tokens TO fcm_app_user;

-- Test connection
-- sqlcmd -S server -U fcm_app_user -P password -d bestbazaar
```

2. **Update database config**:
```typescript
// app/api/save-fcm-token/route.ts
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER, // fcm_app_user (not sa)
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV === 'development',
    connectTimeout: 30000,
    requestTimeout: 30000,
  },
};

// Validate config
if (!config.server || !config.password) {
  throw new Error('Database configuration incomplete');
}
```

3. **Implement connection pooling**:
```typescript
// lib/db.ts (create new file)
import * as sql from 'mssql';

const poolConfig = {
  server: process.env.DB_SERVER!,
  database: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV === 'development',
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool: sql.ConnectionPool | null = null;

export const getDbPool = async () => {
  if (!pool) {
    pool = await sql.connect(poolConfig);
    pool.on('error', (err) => {
      console.error('Database pool error:', err);
      pool = null;
    });
  }
  return pool;
};
```

4. **Update API route**:
```typescript
// app/api/save-fcm-token/route.ts
import { getDbPool } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const pool = await getDbPool();
    // ... use pool (don't close it)
  } catch (error) {
    // Handle error
  }
}
```

**Verification**:
- [ ] New database user created
- [ ] Old sa credentials removed
- [ ] trustServerCertificate false in production
- [ ] Connection pooling works
- [ ] API still saves tokens

---

### Task 1.4: Fix FCM Permission UI 🔴

**Issue**: ARCH-002  
**Effort**: 3 hours  
**Priority**: CRITICAL

**Steps**:

1. **Add PermissionsGate to layout**:
```typescript
// app/layout.tsx
import PermissionsGate from "./PermissionsGate";
import BackButtonHandler from "./BackButtonHandler";

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <PermissionsGate />
        <BackButtonHandler />
        {children}
      </body>
    </html>
  );
}
```

2. **Remove duplicate FCM logic from page.tsx**:
```typescript
// app/page.tsx
// Delete the entire registerFCM useEffect (lines 9-99)
// Keep only the UI display code
```

3. **Improve PermissionsGate**:
```typescript
// app/PermissionsGate.tsx
const requestAll = async () => {
  setError("");
  setStep("requesting");
  
  try {
    // Request permissions sequentially with user feedback
    await Camera.requestPermissions();
    await Geolocation.requestPermissions();
    
    // Filesystem (optional)
    try {
      if ((Filesystem as any).requestPermissions) {
        await (Filesystem as any).requestPermissions();
      }
    } catch (_) {}
    
    // FCM with delay
    setTimeout(async () => {
      try {
        await registerFCMToken();
      } catch (error) {
        console.error("FCM registration failed:", error);
      }
    }, 1000);
    
    markDone();
  } catch (e: any) {
    setError(e?.message || "Permission request failed");
    setStep("denied");
  }
};
```

**Verification**:
- [ ] Permission dialog shows on first launch
- [ ] All permissions requested
- [ ] FCM token generated after permissions granted
- [ ] Dialog doesn't show on subsequent launches

---

### Task 1.5: Implement Google SSO 🔴

**Issue**: ARCH-001  
**Effort**: 12 hours  
**Priority**: CRITICAL

**Option 1: Capacitor Browser + Custom URL Scheme** (Recommended)

**Steps**:

1. **Install dependencies**:
```bash
npm install @capacitor/browser
```

2. **Configure Android deep linking**:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<activity
  android:name=".MainActivity"
  ...>
  
  <!-- Existing intent filter -->
  <intent-filter>
    <action android:name="android.intent.action.MAIN" />
    <category android:name="android.intent.category.LAUNCHER" />
  </intent-filter>
  
  <!-- Add OAuth callback intent filter -->
  <intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data 
      android:scheme="com.apkdemo.app"
      android:host="oauth" />
  </intent-filter>
</activity>
```

3. **Create OAuth service**:
```typescript
// app/services/auth.ts
import { Browser } from '@capacitor/browser';
import { App } from '@capacitor/app';

export class AuthService {
  private static instance: AuthService;
  
  private constructor() {}
  
  static getInstance() {
    if (!AuthService.instance) {
      AuthService.instance = new AuthService();
    }
    return AuthService.instance;
  }
  
  async loginWithGoogle(): Promise<{ token: string; user: any }> {
    return new Promise((resolve, reject) => {
      // Google OAuth URL
      const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      const redirectUri = 'com.apkdemo.app://oauth';
      
      const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
        `client_id=${clientId}&` +
        `redirect_uri=${encodeURIComponent(redirectUri)}&` +
        `response_type=code&` +
        `scope=email profile&` +
        `access_type=offline`;
      
      // Open OAuth in browser
      Browser.open({ url: authUrl });
      
      // Listen for callback
      const listener = App.addListener('appUrlOpen', async (data) => {
        try {
          // Close browser
          await Browser.close();
          
          // Parse URL
          const url = new URL(data.url);
          const code = url.searchParams.get('code');
          
          if (!code) {
            throw new Error('No authorization code received');
          }
          
          // Exchange code for token on backend
          const response = await fetch('/api/auth/google', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ code, redirectUri }),
          });
          
          const result = await response.json();
          
          // Remove listener
          listener.remove();
          
          resolve(result);
        } catch (error) {
          listener.remove();
          reject(error);
        }
      });
    });
  }
}
```

4. **Create backend API route**:
```typescript
// app/api/auth/google/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const { code, redirectUri } = await request.json();
    
    // Exchange code for tokens
    const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID,
        client_secret: process.env.GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });
    
    const tokens = await tokenResponse.json();
    
    // Get user info
    const userResponse = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
    });
    
    const user = await userResponse.json();
    
    // Create session (implement your session logic)
    // const session = await createSession(user);
    
    return NextResponse.json({
      token: tokens.access_token,
      user,
    });
  } catch (error) {
    console.error('Google OAuth error:', error);
    return NextResponse.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}
```

5. **Update Header component**:
```typescript
// app/Header.tsx
import { AuthService } from './services/auth';

const Header = () => {
  const [user, setUser] = useState(null);
  
  const handleGoogleLogin = async () => {
    try {
      const result = await AuthService.getInstance().loginWithGoogle();
      setUser(result.user);
      // Store token
      localStorage.setItem('authToken', result.token);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please try again.');
    }
  };
  
  return (
    <button onClick={handleGoogleLogin}>
      Login with Google
    </button>
  );
};
```

6. **Configure Google Cloud Console**:
   - Go to Google Cloud Console
   - Create OAuth 2.0 credentials
   - Add authorized redirect URI: `com.apkdemo.app://oauth`
   - Get Client ID and Secret

**Verification**:
- [ ] Google login button works
- [ ] Opens Google OAuth in browser
- [ ] Returns to app after login
- [ ] User info retrieved
- [ ] Session created

---

### Task 1.6: Disable Cleartext Traffic 🔴

**Issue**: SEC-005  
**Effort**: 2 hours  
**Priority**: HIGH

**Steps**:

1. **Update AndroidManifest.xml**:
```xml
<!-- android/app/src/main/AndroidManifest.xml -->
<application
  android:allowBackup="true"
  android:icon="@mipmap/ic_launcher"
  android:label="@string/app_name"
  android:roundIcon="@mipmap/ic_launcher_round"
  android:supportsRtl="true"
  android:theme="@style/AppTheme"
  android:networkSecurityConfig="@xml/network_security_config"
  android:usesCleartextTraffic="false"
  android:hardwareAccelerated="true">
```

2. **Update capacitor.config.ts**:
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',
  appName: 'Best Bazaar',
  webDir: 'out',
  server: {
    url: 'https://bestbazaar.in',
    cleartext: false, // Enforce HTTPS
    androidScheme: 'https'
  },
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};
```

3. **Update network_security_config.xml**:
```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  
  <!-- Only for local development -->
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
    <domain includeSubdomains="true">192.168.1.107</domain>
  </domain-config>
</network-security-config>
```

**Verification**:
- [ ] App only makes HTTPS requests
- [ ] HTTP requests blocked
- [ ] Localhost still works for development

---

### Phase 1 Checklist

- [ ] Task 1.1: Service account key removed
- [ ] Task 1.2: Firebase configuration secured
- [ ] Task 1.3: Database configuration secured
- [ ] Task 1.4: FCM permission UI fixed
- [ ] Task 1.5: Google SSO implemented
- [ ] Task 1.6: Cleartext traffic disabled
- [ ] All critical security issues resolved
- [ ] App tested on real device
- [ ] No regressions in existing features

**Phase 1 Deliverables**:
- Secure, production-ready authentication
- Working FCM notifications
- No exposed credentials
- HTTPS-only communication

---

## PHASE 2: HIGH PRIORITY (Weeks 2-3)

**Goal**: Improve architecture, code quality, and performance  
**Effort**: 56-80 hours

### Task 2.1: Implement Offline Support 🟡

**Issue**: ARCH-003  
**Effort**: 12 hours

**Steps**:

1. **Switch to static export mode**:
```typescript
// capacitor.config.ts
const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',
  appName: 'Best Bazaar',
  webDir: 'out',
  // Remove server.url to use bundled files
  android: {
    allowMixedContent: false,
    webContentsDebuggingEnabled: false,
  },
};
```

2. **Update Next.js config**:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  images: {
    unoptimized: true,
  },
  trailingSlash: true,
};
```

3. **Build and sync**:
```bash
npm run build
npx cap sync android
```

4. **Implement Service Worker** (optional, for advanced caching):
```typescript
// public/sw.js
const CACHE_NAME = 'bestbazaar-v1';
const urlsToCache = [
  '/',
  '/offline.html',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Verification**:
- [ ] App works without internet
- [ ] Static pages load instantly
- [ ] API calls still work when online

---

### Task 2.2: Add Error Boundaries 🟡

**Issue**: ARCH-004  
**Effort**: 2 hours

**Steps**:

1. **Create error boundary**:
```typescript
// app/error.tsx
'use client';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-8 text-center">
        <div className="text-red-500 text-6xl mb-4">⚠️</div>
        <h2 className="text-2xl font-bold text-gray-900 mb-4">
          Something went wrong!
        </h2>
        <p className="text-gray-600 mb-6">
          {error.message || 'An unexpected error occurred'}
        </p>
        <button
          onClick={reset}
          className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
```

2. **Create global error boundary**:
```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Application Error</h2>
        <p>{error.message}</p>
        <button onClick={reset}>Try again</button>
      </body>
    </html>
  );
}
```

**Verification**:
- [ ] Error boundary catches component errors
- [ ] User sees friendly error message
- [ ] Reset button works

---

### Task 2.3: Implement State Management 🟡

**Issue**: ARCH-005  
**Effort**: 6 hours

**Steps**:

1. **Install Zustand**:
```bash
npm install zustand
```

2. **Create app store**:
```typescript
// app/store/appStore.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface User {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

interface AppStore {
  // FCM
  fcmToken: string | null;
  setFcmToken: (token: string) => void;
  
  // Permissions
  permissionsGranted: boolean;
  setPermissionsGranted: (granted: boolean) => void;
  
  // Auth
  user: User | null;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  logout: () => void;
  
  // UI State
  isLoading: boolean;
  setIsLoading: (loading: boolean) => void;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set) => ({
      // FCM
      fcmToken: null,
      setFcmToken: (token) => set({ fcmToken: token }),
      
      // Permissions
      permissionsGranted: false,
      setPermissionsGranted: (granted) => set({ permissionsGranted: granted }),
      
      // Auth
      user: null,
      isAuthenticated: false,
      setUser: (user) => set({ user, isAuthenticated: !!user }),
      logout: () => set({ user: null, isAuthenticated: false }),
      
      // UI
      isLoading: false,
      setIsLoading: (loading) => set({ isLoading: loading }),
    }),
    {
      name: 'app-storage',
      partialize: (state) => ({
        user: state.user,
        permissionsGranted: state.permissionsGranted,
      }),
    }
  )
);
```

3. **Use in components**:
```typescript
// app/PermissionsGate.tsx
import { useAppStore } from './store/appStore';

export default function PermissionsGate() {
  const { permissionsGranted, setPermissionsGranted, setFcmToken } = useAppStore();
  
  const markDone = () => {
    setPermissionsGranted(true);
    setStep("done");
  };
  
  // ... rest of component
}
```

**Verification**:
- [ ] State persists across app restarts
- [ ] Components share state
- [ ] No prop drilling

---

### Task 2.4: Fix TypeScript Errors 🟡

**Issue**: CODE-001  
**Effort**: 8 hours

**Steps**:

1. **Remove ignore flags**:
```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  images: { unoptimized: true },
  trailingSlash: true,
  // Remove these:
  // eslint: { ignoreDuringBuilds: true },
  // typescript: { ignoreBuildErrors: true },
};
```

2. **Enable strict mode**:
```json
// tsconfig.json
{
  "compilerOptions": {
    "strict": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

3. **Fix errors one by one**:
```bash
npm run build
# Fix each error reported
```

**Common fixes**:
```typescript
// Before
const value = (window as any).Capacitor;

// After
interface WindowWithCapacitor extends Window {
  Capacitor?: any;
}
const value = (window as WindowWithCapacitor).Capacitor;
```

**Verification**:
- [ ] `npm run build` succeeds
- [ ] No TypeScript errors
- [ ] Strict mode enabled

---

### Task 2.5: Add Input Validation 🟡

**Issue**: SEC-004, CODE-003  
**Effort**: 4 hours

**Steps**:

1. **Install Zod**:
```bash
npm install zod
```

2. **Create validation schemas**:
```typescript
// lib/validation.ts
import { z } from 'zod';

export const fcmTokenSchema = z.object({
  fcmToken: z.string().regex(/^[a-zA-Z0-9_-]{100,200}$/, 'Invalid FCM token'),
  platform: z.enum(['android', 'ios', 'web']),
  deviceId: z.string().uuid().optional(),
});

export type FcmTokenInput = z.infer<typeof fcmTokenSchema>;
```

3. **Update API route**:
```typescript
// app/api/save-fcm-token/route.ts
import { fcmTokenSchema } from '@/lib/validation';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validatedData = fcmTokenSchema.parse(body);
    
    // ... rest of implementation
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    // ... handle other errors
  }
}
```

**Verification**:
- [ ] Invalid inputs rejected
- [ ] Proper error messages
- [ ] Valid inputs accepted

---

### Task 2.6: Implement Logging System 🟡

**Issue**: ARCH-007  
**Effort**: 3 hours

**Steps**:

1. **Create logger utility**:
```typescript
// lib/logger.ts
enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
}

const CURRENT_LEVEL = process.env.NODE_ENV === 'production' 
  ? LogLevel.WARN 
  : LogLevel.DEBUG;

class Logger {
  constructor(private context: string) {}

  private log(level: LogLevel, message: string, ...args: any[]) {
    if (level < CURRENT_LEVEL) return;

    const timestamp = new Date().toISOString();
    const levelName = LogLevel[level];
    const prefix = `[${timestamp}][${levelName}][${this.context}]`;

    switch (level) {
      case LogLevel.DEBUG:
        console.log(prefix, message, ...args);
        break;
      case LogLevel.INFO:
        console.info(prefix, message, ...args);
        break;
      case LogLevel.WARN:
        console.warn(prefix, message, ...args);
        break;
      case LogLevel.ERROR:
        console.error(prefix, message, ...args);
        break;
    }
  }

  debug(message: string, ...args: any[]) {
    this.log(LogLevel.DEBUG, message, ...args);
  }

  info(message: string, ...args: any[]) {
    this.log(LogLevel.INFO, message, ...args);
  }

  warn(message: string, ...args: any[]) {
    this.log(LogLevel.WARN, message, ...args);
  }

  error(message: string, ...args: any[]) {
    this.log(LogLevel.ERROR, message, ...args);
  }
}

export const createLogger = (context: string) => new Logger(context);
```

2. **Use in components**:
```typescript
// app/PermissionsGate.tsx
import { createLogger } from '@/lib/logger';

const logger = createLogger('PermissionsGate');

export default function PermissionsGate() {
  const requestAll = async () => {
    logger.info('Requesting permissions');
    try {
      await Camera.requestPermissions();
      logger.info('Camera permission granted');
    } catch (error) {
      logger.error('Permission request failed', error);
    }
  };
}
```

**Verification**:
- [ ] Logs have consistent format
- [ ] Production logs filtered
- [ ] Easy to search logs

---

### Task 2.7: Optimize Images 🟡

**Issue**: PERF-001  
**Effort**: 3 hours

**Steps**:

1. **Install sharp**:
```bash
npm install --save-dev sharp
```

2. **Optimize images at build time**:
```bash
# Create script to optimize images
# scripts/optimize-images.js
const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const optimizeImage = async (inputPath, outputPath) => {
  await sharp(inputPath)
    .resize(1200, 1200, { fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 80 })
    .toFile(outputPath);
};

// Run on all images in public/
```

3. **Use optimized images**:
```typescript
// Use WebP format
<img src="/image.webp" alt="..." />

// Or use Capacitor Camera with optimization
const photo = await Camera.getPhoto({
  quality: 80,
  width: 1200,
  resultType: CameraResultType.Uri
});
```

**Verification**:
- [ ] Images compressed
- [ ] WebP format used
- [ ] Faster page loads

---

### Task 2.8: Implement Code Splitting 🟡

**Issue**: PERF-002  
**Effort**: 3 hours

**Steps**:

1. **Dynamic imports for heavy modules**:
```typescript
// app/page.tsx
const registerFCM = async () => {
  // Lazy load FCM modules
  const { PushNotifications } = await import("@capacitor/push-notifications");
  const { getMessaging, getToken } = await import("firebase/messaging");
  const { VAPID_KEY } = await import("./firebase");
  
  // ... rest of code
};
```

2. **Lazy load components**:
```typescript
// app/layout.tsx
import dynamic from 'next/dynamic';

const Header = dynamic(() => import('./Header'), {
  loading: () => <div>Loading...</div>,
});

const Footer = dynamic(() => import('./Footer'), {
  ssr: false,
});
```

**Verification**:
- [ ] Smaller initial bundle
- [ ] Faster app startup
- [ ] Modules loaded on demand

---

### Phase 2 Checklist

- [ ] Task 2.1: Offline support implemented
- [ ] Task 2.2: Error boundaries added
- [ ] Task 2.3: State management implemented
- [ ] Task 2.4: TypeScript errors fixed
- [ ] Task 2.5: Input validation added
- [ ] Task 2.6: Logging system implemented
- [ ] Task 2.7: Images optimized
- [ ] Task 2.8: Code splitting implemented
- [ ] All high-priority issues resolved
- [ ] Performance improved
- [ ] Code quality improved

---

## PHASE 3: MEDIUM PRIORITY (Week 4)

**Goal**: Polish, cleanup, and best practices  
**Effort**: 32-48 hours

### Quick Wins (8-12 hours total)

1. **Add Security Headers** (1h)
2. **Clean Up Dead Code** (1h)
3. **Standardize Naming** (2h)
4. **Add Constants File** (1h)
5. **Fix Scroll Optimization** (2h)
6. **Database Connection Pooling** (2h)
7. **Add Component Documentation** (3h)

---

## PHASE 4: LOW PRIORITY (Ongoing)

**Goal**: Long-term improvements  
**Effort**: 48-72 hours

1. **Add Unit Tests** (16h)
2. **Implement Analytics** (4h)
3. **Add Biometric Auth** (8h)
4. **Push Notification Click Handling** (6h)
5. **CI/CD Pipeline** (6h)
6. **Code Formatting** (1h)
7. **Bundle Analysis** (1h)

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ Zero critical security vulnerabilities
- ✅ Google SSO working
- ✅ FCM notifications working
- ✅ All credentials secured
- ✅ HTTPS enforced

### Phase 2 Success Criteria
- ✅ App works offline
- ✅ No TypeScript errors
- ✅ Centralized state management
- ✅ 50% faster initial load
- ✅ Proper error handling

### Phase 3 Success Criteria
- ✅ Code quality score > 90%
- ✅ All best practices followed
- ✅ Comprehensive documentation
- ✅ Performance optimized

### Phase 4 Success Criteria
- ✅ 80% test coverage
- ✅ Automated deployments
- ✅ Analytics tracking
- ✅ Production-ready

---

## Risk Management

### High-Risk Tasks
| Task | Risk | Mitigation |
|------|------|------------|
| Google SSO | Complex OAuth flow | Test thoroughly, have fallback |
| Offline Support | Breaking changes | Feature flag, gradual rollout |
| TypeScript Strict | Many errors | Fix incrementally |
| Database Migration | Data loss | Backup first, test on staging |

### Dependencies
```
Phase 1 → Phase 2 (Security must be fixed first)
Task 1.5 (SSO) → Task 2.3 (State management)
Task 2.1 (Offline) → Task 2.8 (Code splitting)
```

---

## Testing Strategy

### Per Phase Testing

**Phase 1**:
- [ ] Manual testing on real device
- [ ] Security audit
- [ ] Penetration testing
- [ ] OAuth flow testing

**Phase 2**:
- [ ] Offline mode testing
- [ ] Performance benchmarks
- [ ] Error boundary testing
- [ ] State persistence testing

**Phase 3**:
- [ ] Code quality checks
- [ ] Performance profiling
- [ ] Accessibility testing

**Phase 4**:
- [ ] Unit test suite
- [ ] Integration tests
- [ ] E2E tests
- [ ] Load testing

---

## Rollout Plan

### Week 1: Critical Fixes
- Deploy security fixes immediately
- Limited beta testing
- Monitor for issues

### Week 2-3: Architecture Updates
- Feature flags for new features
- Gradual rollout to users
- A/B testing for offline mode

### Week 4: Polish
- Full rollout
- Monitor metrics
- Gather feedback

### Ongoing: Improvements
- Continuous deployment
- Regular updates
- Feature iterations

---

## Monitoring & Maintenance

### Post-Deployment Monitoring

**Week 1**:
- Monitor error rates
- Check FCM delivery
- Verify OAuth success rate
- Database performance

**Week 2-4**:
- User feedback
- Performance metrics
- Security scans
- Dependency updates

**Ongoing**:
- Monthly security audits
- Quarterly dependency updates
- Continuous performance monitoring
- User analytics review

---

## Resource Requirements

### Team
- 1 Senior Developer (full-time, 6-8 weeks)
- 1 QA Engineer (part-time, 2-4 weeks)
- 1 Security Reviewer (1 week)

### Infrastructure
- Development environment
- Staging environment
- Production environment
- CI/CD pipeline
- Monitoring tools

### Budget Estimate
- Development: 200-250 hours @ $X/hour
- QA: 40-60 hours @ $Y/hour
- Security: 40 hours @ $Z/hour
- Tools & Services: $500-1000/month

---

## Conclusion

This roadmap provides a clear, actionable path to transform the Best Bazaar APK from its current state to a production-ready, enterprise-grade application. By following this phased approach, you'll:

1. **Immediately** fix critical security issues
2. **Quickly** implement missing core features
3. **Systematically** improve code quality and performance
4. **Continuously** enhance the application

**Next Steps**:
1. Review and approve this roadmap
2. Allocate resources
3. Begin Phase 1 immediately
4. Track progress weekly
5. Adjust plan as needed

---

**Document Version**: 1.0  
**Created**: February 2025  
**Owner**: Development Team  
**Review Frequency**: Weekly during implementation
