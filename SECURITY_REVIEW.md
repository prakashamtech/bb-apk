# Best Bazaar APK - Security Review

## Executive Summary

This document focuses exclusively on security vulnerabilities and risks in the Best Bazaar APK project. **CRITICAL**: Several severe security issues require immediate attention before production deployment.

**Risk Level**: 🔴 **HIGH RISK**  
**Critical Issues**: 3  
**High Priority Issues**: 2  
**Medium Priority Issues**: 1

---

## 🔴 CRITICAL SECURITY VULNERABILITIES

### 1. Firebase Service Account Private Key Exposed in Client Code

**Severity**: 🔴 **CRITICAL - IMMEDIATE ACTION REQUIRED**  
**CVSS Score**: 9.8 (Critical)  
**File**: `app/best-bazaar-92dd6-7d5e83eb8fe5.json`

#### Vulnerability Description

A Firebase service account private key file is stored in the client-side application directory. This file contains:
- Private key for Firebase Admin SDK
- Service account credentials with full Firebase access
- Ability to send push notifications to all users
- Potential access to Firebase database, storage, and other services

#### Attack Scenario

```
1. Attacker downloads APK from device or app store
2. Extracts APK contents (APKs are just ZIP files)
3. Finds service account key in assets
4. Uses key to:
   - Send spam/malicious push notifications to all users
   - Access Firebase services with admin privileges
   - Impersonate the application
   - Access/modify user data in Firebase
   - Incur costs on your Firebase account
```

#### Proof of Concept

```bash
# How easy it is to extract:
unzip app-debug.apk
cat assets/best-bazaar-92dd6-7d5e83eb8fe5.json
# Attacker now has your private key
```

#### Impact Assessment

| Impact Category | Severity | Description |
|----------------|----------|-------------|
| Confidentiality | Critical | Full access to Firebase services |
| Integrity | Critical | Can modify data, send notifications |
| Availability | High | Can exhaust Firebase quotas |
| Financial | High | Unauthorized usage costs |
| Reputation | Critical | Spam notifications damage brand |

#### Remediation Steps

**IMMEDIATE (Within 24 hours)**:

1. **Delete the file from repository**:
```bash
cd app/
rm best-bazaar-92dd6-7d5e83eb8fe5.json
git rm best-bazaar-92dd6-7d5e83eb8fe5.json
git commit -m "Remove exposed service account key"
```

2. **Revoke the exposed key**:
   - Go to Firebase Console → Project Settings → Service Accounts
   - Find the service account: `firebase-adminsdk-fbsvc@best-bazaar-92dd6.iam.gserviceaccount.com`
   - Delete or disable the key with ID: `7d5e83eb8fe5b51155711f4f62140f1fa85cd70b`

3. **Generate new service account key**:
   - Create new key in Firebase Console
   - Store it **ONLY on backend server**
   - Never commit to version control

4. **Update `.gitignore`**:
```bash
# Add to .gitignore
*.json
!package.json
!package-lock.json
!tsconfig.json
```

5. **Scan git history**:
```bash
# Check if key was committed before
git log --all --full-history -- "**/best-bazaar*.json"

# If found, consider rewriting history or rotating all keys
```

**Backend Implementation**:

```typescript
// Backend only (NOT in mobile app)
// server/firebase-admin.ts
import admin from 'firebase-admin';

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
  }),
});

export const sendPushNotification = async (tokens: string[], title: string, body: string) => {
  return admin.messaging().sendMulticast({
    tokens,
    notification: { title, body },
  });
};
```

**Effort**: Low (2 hours)  
**Impact**: Critical - Prevents complete system compromise  
**Priority**: 🔴 **IMMEDIATE**

---

### 2. Hardcoded API Keys and Secrets in Client Code

**Severity**: 🔴 **CRITICAL**  
**CVSS Score**: 7.5 (High)  
**File**: `app/firebase.ts`, `scripts/push-test.js`

#### Vulnerability Description

Multiple sensitive credentials are hardcoded in client-side code:

```typescript
// app/firebase.ts - Exposed in APK
const firebaseConfig = {
  apiKey: "AIzaSyAQK4ODia_-5-f5xFuqXpO3G0w9UOz4_4o",
  authDomain: "best-bazaar-92dd6.firebaseapp.com",
  projectId: "best-bazaar-92dd6",
  storageBucket: "best-bazaar-92dd6.firebasestorage.app",
  messagingSenderId: "857299892800",
  appId: "1:857299892800:web:42ac9a6bc7679862233da5",
  measurementId: "G-Q1ENCH5R4R"
};

export const VAPID_KEY = "BPAXcJgOiVm9xR-SPL3sOUBpb9luh8AxY4IAODgbwF1RLnf_2Lv6yMGlsORWXE7B_Mrj-H56tC8Ko_LO_tlkkxU";
```

```javascript
// scripts/push-test.js - In repository
const serviceAccount = {
  "private_key": process.env.FIREBASE_PRIVATE_KEY, // Good
  "client_id": process.env.FIREBASE_CLIENT_ID,     // Good
  "private_key_id": "7d5e83eb8fe5b51155711f4f62140f1fa85cd70b", // ⚠️ Exposed
  // ... other fields
};
```

#### Risk Analysis

**Firebase Client API Keys**:
- While Firebase client API keys are designed to be public
- They should still be protected with Firebase Security Rules
- Without proper rules, anyone can abuse your Firebase services

**VAPID Key**:
- Used for web push notifications
- If exposed, attackers can send push notifications pretending to be your app
- Should be rotated and protected

#### Remediation Steps

1. **Move VAPID key to environment variables**:

```typescript
// app/firebase.ts
export const VAPID_KEY = process.env.NEXT_PUBLIC_VAPID_KEY || '';

if (!VAPID_KEY && typeof window !== 'undefined') {
  console.error('VAPID_KEY not configured');
}
```

```bash
# .env.local
NEXT_PUBLIC_VAPID_KEY=BPAXcJgOiVm9xR-SPL3sOUBpb9luh8AxY4IAODgbwF1RLnf_2Lv6yMGlsORWXE7B_Mrj-H56tC8Ko_LO_tlkkxU
```

2. **Implement Firebase App Check**:

```typescript
// app/firebase.ts
import { initializeApp } from 'firebase/app';
import { initializeAppCheck, ReCaptchaV3Provider } from 'firebase/app-check';

const app = initializeApp(firebaseConfig);

// Protect against API abuse
if (typeof window !== 'undefined') {
  initializeAppCheck(app, {
    provider: new ReCaptchaV3Provider('your-recaptcha-site-key'),
    isTokenAutoRefreshEnabled: true,
  });
}
```

3. **Set Firebase Security Rules**:

```javascript
// Firebase Console → Firestore/Storage → Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null; // Require authentication
    }
  }
}
```

4. **Rotate VAPID key**:
   - Generate new VAPID key in Firebase Console
   - Update environment variables
   - Re-register all FCM tokens

**Effort**: Medium (4 hours)  
**Impact**: High - Prevents API abuse  
**Priority**: 🔴 **HIGH**

---

### 3. Insecure Database Connection Configuration

**Severity**: 🔴 **CRITICAL**  
**CVSS Score**: 8.1 (High)  
**File**: `app/api/save-fcm-token/route.ts`

#### Vulnerability Description

Database connection has multiple security issues:

```typescript
const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "bestbazaar",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  options: {
    encrypt: true,
    trustServerCertificate: true, // ⚠️ CRITICAL: Disables SSL verification
  },
};
```

#### Security Issues

1. **`trustServerCertificate: true`**:
   - Disables SSL certificate validation
   - Vulnerable to man-in-the-middle attacks
   - Attacker can intercept database credentials and data

2. **Fallback to empty password**:
   - If `DB_PASSWORD` not set, uses empty string
   - Allows connection without authentication

3. **Using `sa` account**:
   - `sa` is SQL Server's superuser account
   - Violates principle of least privilege
   - If compromised, attacker has full database access

4. **No connection timeout**:
   - Can lead to resource exhaustion
   - Denial of service vulnerability

#### Attack Scenarios

**Scenario 1: Man-in-the-Middle Attack**
```
1. Attacker intercepts network traffic
2. Due to trustServerCertificate: true, SSL not verified
3. Attacker presents fake certificate
4. App connects to attacker's server
5. Attacker captures database credentials
6. Attacker accesses real database with stolen credentials
```

**Scenario 2: Privilege Escalation**
```
1. Attacker exploits SQL injection (if exists elsewhere)
2. Due to using 'sa' account, has full database access
3. Can drop tables, create admin users, exfiltrate all data
```

#### Remediation Steps

1. **Remove `trustServerCertificate` in production**:

```typescript
const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: true,
    trustServerCertificate: process.env.NODE_ENV === 'development', // Only in dev
    connectTimeout: 30000, // 30 seconds
    requestTimeout: 30000,
  },
};

// Validate required environment variables
if (!config.server || !config.database || !config.user || !config.password) {
  throw new Error('Database configuration incomplete');
}
```

2. **Create dedicated database user**:

```sql
-- Create app-specific user with limited permissions
CREATE LOGIN fcm_app_user WITH PASSWORD = 'strong_random_password';
CREATE USER fcm_app_user FOR LOGIN fcm_app_user;

-- Grant only necessary permissions
GRANT SELECT, INSERT, UPDATE ON fcm_tokens TO fcm_app_user;

-- Revoke all other permissions
REVOKE ALL ON DATABASE::bestbazaar FROM fcm_app_user;
```

3. **Use Azure Key Vault or similar**:

```typescript
// Use Azure Key Vault for credentials
import { SecretClient } from '@azure/keyvault-secrets';

const getDbConfig = async () => {
  const client = new SecretClient(
    process.env.KEY_VAULT_URL,
    new DefaultAzureCredential()
  );
  
  const password = await client.getSecret('db-password');
  
  return {
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: password.value,
    options: {
      encrypt: true,
      trustServerCertificate: false,
    },
  };
};
```

4. **Implement connection pooling with limits**:

```typescript
// lib/db.ts
import * as sql from 'mssql';

const poolConfig = {
  ...config,
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
      pool = null; // Reset pool on error
    });
  }
  return pool;
};
```

**Effort**: Medium (6 hours)  
**Impact**: Critical - Prevents database compromise  
**Priority**: 🔴 **HIGH**

---

## 🟡 HIGH PRIORITY SECURITY ISSUES

### 4. Missing Input Validation and Sanitization

**Severity**: 🟡 **HIGH**  
**CVSS Score**: 6.5 (Medium)  
**File**: `app/api/save-fcm-token/route.ts`

#### Vulnerability Description

API endpoint lacks proper input validation:

```typescript
export async function POST(request: NextRequest) {
  const { fcmToken, platform, deviceId } = await request.json();

  if (!fcmToken || !platform) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }
  
  // No validation of:
  // - Token format
  // - Platform value
  // - Device ID format
  // - Request rate
  // - Authentication
```

#### Security Risks

1. **No authentication**: Anyone can call this API
2. **No rate limiting**: Vulnerable to DoS attacks
3. **No input validation**: Can insert malicious data
4. **SQL injection risk**: Though using parameterized queries (good)
5. **No CSRF protection**: Can be called from any origin

#### Remediation Steps

```typescript
// app/api/save-fcm-token/route.ts
import { z } from 'zod';
import { rateLimit } from '@/lib/rate-limit';

// Input validation schema
const fcmTokenSchema = z.object({
  fcmToken: z.string().regex(/^[a-zA-Z0-9_-]{100,200}$/, 'Invalid FCM token format'),
  platform: z.enum(['android', 'ios', 'web']),
  deviceId: z.string().uuid().optional(),
});

// Rate limiter (10 requests per minute per IP)
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500,
});

export async function POST(request: NextRequest) {
  try {
    // Rate limiting
    const identifier = request.ip || 'anonymous';
    const { success } = await limiter.check(identifier, 10);
    
    if (!success) {
      return NextResponse.json(
        { error: 'Too many requests' },
        { status: 429 }
      );
    }

    // Parse and validate input
    const body = await request.json();
    const validatedData = fcmTokenSchema.parse(body);

    // Optional: Add authentication
    // const session = await getSession(request);
    // if (!session) {
    //   return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    // }

    // Sanitize inputs (though parameterized queries handle this)
    const { fcmToken, platform, deviceId } = validatedData;

    // ... rest of implementation
    
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid input', details: error.errors },
        { status: 400 }
      );
    }
    
    console.error('Error saving FCM token:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

**Effort**: Low (3 hours)  
**Impact**: Medium - Prevents abuse  
**Priority**: 🟡 **HIGH**

---

### 5. Cleartext Traffic Allowed

**Severity**: 🟡 **HIGH**  
**CVSS Score**: 5.9 (Medium)  
**Files**: `android/app/src/main/AndroidManifest.xml`, `capacitor.config.ts`

#### Vulnerability Description

Application allows unencrypted HTTP traffic:

```xml
<!-- AndroidManifest.xml -->
<application
  android:usesCleartextTraffic="true"
  ...>
```

```typescript
// capacitor.config.ts
server: {
  url: 'https://bestbazaar.in',
  cleartext: true, // Allows HTTP
}
```

#### Security Risks

1. **Man-in-the-Middle attacks**: Traffic can be intercepted
2. **Data exposure**: Credentials, tokens sent in plaintext
3. **Session hijacking**: Session cookies can be stolen
4. **Against Android best practices**: Google Play may reject

#### Attack Scenario

```
1. User connects to public WiFi
2. Attacker on same network runs packet sniffer
3. App makes HTTP request (due to cleartext: true)
4. Attacker intercepts:
   - FCM tokens
   - User credentials
   - Session cookies
   - Personal data
5. Attacker uses stolen credentials to access account
```

#### Remediation Steps

1. **Disable cleartext traffic**:

```xml
<!-- AndroidManifest.xml -->
<application
  android:usesCleartextTraffic="false"
  ...>
```

```typescript
// capacitor.config.ts
server: {
  url: 'https://bestbazaar.in',
  cleartext: false, // Enforce HTTPS
  androidScheme: 'https'
}
```

2. **Implement certificate pinning** (Advanced):

```typescript
// capacitor.config.ts
plugins: {
  CapacitorHttp: {
    enabled: true
  }
}
```

```java
// MainActivity.java
import com.getcapacitor.plugin.http.Http;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    
    // Certificate pinning
    Http.setServerTrustManager(new ServerTrustManager() {
      @Override
      public boolean shouldTrustServer(String hostname, X509Certificate[] chain) {
        // Verify certificate fingerprint
        return verifyCertificate(chain);
      }
    });
  }
}
```

3. **Add network security config**:

```xml
<!-- android/app/src/main/res/xml/network_security_config.xml -->
<?xml version="1.0" encoding="utf-8"?>
<network-security-config>
  <base-config cleartextTrafficPermitted="false">
    <trust-anchors>
      <certificates src="system" />
    </trust-anchors>
  </base-config>
  
  <!-- Only for development -->
  <domain-config cleartextTrafficPermitted="true">
    <domain includeSubdomains="true">localhost</domain>
    <domain includeSubdomains="true">10.0.2.2</domain>
  </domain-config>
</network-security-config>
```

**Effort**: Low (2 hours)  
**Impact**: Medium - Prevents MITM attacks  
**Priority**: 🟡 **HIGH**

---

## 🟢 MEDIUM PRIORITY SECURITY ISSUES

### 6. Missing Security Headers

**Severity**: 🟢 **MEDIUM**  
**CVSS Score**: 4.3 (Medium)  
**File**: `next.config.ts`

#### Vulnerability Description

No security headers configured, leaving app vulnerable to:
- Clickjacking attacks
- XSS attacks
- MIME sniffing attacks
- Information disclosure

#### Remediation Steps

```typescript
// next.config.ts
const nextConfig: NextConfig = {
  output: 'export',
  
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY', // Prevent clickjacking
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff', // Prevent MIME sniffing
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block', // Enable XSS filter
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "style-src 'self' 'unsafe-inline'",
              "img-src 'self' data: https:",
              "font-src 'self' data:",
              "connect-src 'self' https://bestbazaar.in https://*.googleapis.com",
            ].join('; '),
          },
        ],
      },
    ];
  },
};
```

**Effort**: Low (1 hour)  
**Impact**: Low - Defense in depth  
**Priority**: 🟢 **MEDIUM**

---

## Security Checklist

### Pre-Production Checklist

- [ ] **SEC-001**: Remove service account key from client
- [ ] **SEC-002**: Move VAPID key to environment variables
- [ ] **SEC-002**: Implement Firebase App Check
- [ ] **SEC-003**: Remove `trustServerCertificate: true`
- [ ] **SEC-003**: Create dedicated database user (not sa)
- [ ] **SEC-003**: Implement Azure Key Vault for secrets
- [ ] **SEC-004**: Add input validation to all APIs
- [ ] **SEC-004**: Implement rate limiting
- [ ] **SEC-004**: Add authentication to APIs
- [ ] **SEC-005**: Disable cleartext traffic
- [ ] **SEC-005**: Implement certificate pinning
- [ ] **SEC-006**: Add security headers
- [ ] Scan for secrets in git history
- [ ] Update all dependencies to latest versions
- [ ] Run security audit: `npm audit`
- [ ] Penetration testing
- [ ] Code review by security expert

### Ongoing Security Practices

- [ ] Regular dependency updates
- [ ] Monthly security audits
- [ ] Automated vulnerability scanning
- [ ] Security training for developers
- [ ] Incident response plan
- [ ] Regular backup and recovery testing
- [ ] Monitor Firebase usage for anomalies
- [ ] Review database access logs

---

## Security Tools Recommendations

### Static Analysis
```bash
# Install security scanning tools
npm install --save-dev @microsoft/eslint-plugin-sdl
npm install --save-dev eslint-plugin-security

# Run security audit
npm audit
npm audit fix

# Check for secrets
npm install --save-dev detect-secrets
detect-secrets scan
```

### Runtime Protection
```bash
# Add runtime application self-protection
npm install @sentry/react-native
npm install @sentry/android

# Configure Sentry for error tracking and security monitoring
```

### Dependency Scanning
```bash
# Use Snyk for vulnerability scanning
npm install -g snyk
snyk test
snyk monitor
```

---

## Incident Response Plan

### If Service Account Key is Compromised

1. **Immediate** (0-1 hour):
   - Revoke compromised key in Firebase Console
   - Generate new service account key
   - Update backend servers with new key
   - Monitor Firebase usage for anomalies

2. **Short-term** (1-24 hours):
   - Review Firebase audit logs
   - Check for unauthorized push notifications
   - Verify database integrity
   - Notify affected users if data accessed

3. **Long-term** (1-7 days):
   - Implement key rotation policy
   - Add monitoring and alerting
   - Security training for team
   - Post-mortem analysis

### If Database Credentials are Compromised

1. **Immediate**:
   - Change database password
   - Review database access logs
   - Check for data exfiltration

2. **Short-term**:
   - Audit all database users
   - Implement IP whitelisting
   - Enable database auditing

3. **Long-term**:
   - Migrate to managed identities
   - Implement zero-trust architecture
   - Regular security assessments

---

## Summary

### Critical Actions Required (This Week)

| Action | Effort | Impact | Deadline |
|--------|--------|--------|----------|
| Remove service account key | 2h | Critical | 24 hours |
| Revoke exposed keys | 1h | Critical | 24 hours |
| Fix database config | 6h | Critical | 3 days |
| Add input validation | 3h | High | 5 days |
| Disable cleartext traffic | 2h | High | 5 days |

**Total Effort**: ~14 hours  
**Risk Reduction**: 90% of critical vulnerabilities

### Long-term Security Roadmap

**Month 1**:
- Fix all critical issues
- Implement authentication
- Add rate limiting
- Security headers

**Month 2**:
- Certificate pinning
- Automated security scanning
- Penetration testing
- Security documentation

**Month 3**:
- Security training
- Incident response drills
- Bug bounty program
- Compliance audit

---

**Document Version**: 1.0  
**Review Date**: February 2025  
**Next Review**: After critical fixes  
**Classification**: Internal - Security Sensitive
