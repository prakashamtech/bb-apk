# Push Notification Unified Implementation Plan

## 🎯 Objective
Create a unified, maintainable push notification system that works seamlessly across both Next.js web and Capacitor APK applications.

---

## 📅 Implementation Timeline

### Week 1: Critical Fixes & Quick Win
**Goal**: Make APK functional with existing infrastructure

#### Day 1-2: Fix APK Permission Flow
```bash
# Tasks:
1. Add PermissionsGate to layout.tsx
2. Update API call to use web endpoint
3. Test complete flow
4. Verify database storage
```

#### Day 3-5: Stabilize & Monitor
```bash
# Tasks:
1. Add error handling
2. Implement retry logic
3. Add logging
4. Monitor registrations
```

### Week 2-3: Backend Unification
**Goal**: Create unified API and database structure

#### Day 1-3: Unified API Development
```typescript
// Create new unified endpoint
/api/push/devices/subscribe
/api/push/devices/unsubscribe
/api/push/devices/list
```

#### Day 4-5: Database Migration
```sql
-- Migration steps:
1. Export MSSQL fcm_tokens
2. Create PostgreSQL push_devices
3. Transform and import data
4. Validate data integrity
```

#### Day 6-7: Update Web App
```typescript
// Update web app to use unified API
- Change endpoint URLs
- Update payload structure
- Add backward compatibility
```

### Week 4: Capacitor App Enhancement
**Goal**: Full feature parity with web app

#### Day 1-3: Enhanced Push Hook
```typescript
// Create useCapacitorPushNotifications
- Match web functionality
- Add device info collection
- Implement proper error handling
```

#### Day 4-5: UI Improvements
```typescript
- Match PushOptInModal design
- Add permission explanations
- Implement better UX flow
```

---

## 🛠️ Detailed Implementation Steps

### Step 1: Quick Fix (APK Working Today)

#### 1.1 Add PermissionsGate to Layout
```typescript
// File: app/layout.tsx
import PermissionsGate from './PermissionsGate';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <PermissionsGate />
        {children}
      </body>
    </html>
  );
}
```

#### 1.2 Update API Call in PermissionsGate
```typescript
// In PermissionsGate.tsx, update registerFCMToken function
const saveToken = async (token: string) => {
  try {
    const deviceId = generateDeviceId(); // Helper function
    
    const response = await fetch('https://bestbazaar.in/api/chat/push/subscribe', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        fcmToken: token,
        clientType: 'Android',
        platform: 'Android',
        deviceName: 'Best Bazaar App',
        deviceModel: await getDeviceModel(), // Capacitor plugin
        anonymousUserId: deviceId,
        attributes: {
          source: 'capacitor-apk',
          version: '1.0.0',
          timestamp: new Date().toISOString()
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const result = await response.json();
    console.log('📱 Device registered:', result.deviceId);
    return result;
  } catch (error) {
    console.error('📱 Registration failed:', error);
    throw error;
  }
};
```

#### 1.3 Add Helper Functions
```typescript
// Add to PermissionsGate.tsx
import { Device } from '@capacitor/device';

const generateDeviceId = () => {
  return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
};

const getDeviceModel = async () => {
  try {
    const info = await Device.getInfo();
    return info.model || 'Unknown';
  } catch {
    return 'Android Device';
  }
};
```

### Step 2: Unified Backend Implementation

#### 2.1 Create Unified API Structure
```typescript
// File: pages/api/push/devices/subscribe.ts
import { z } from 'zod';
import { prisma } from '../../../server/db/clients';

const subscribeSchema = z.object({
  fcmToken: z.string(),
  clientType: z.enum(['Web', 'Android', 'iOS']),
  platform: z.string().optional(),
  deviceName: z.string().optional(),
  deviceModel: z.string().optional(),
  anonymousUserId: z.string().optional(),
  attributes: z.record(z.any()).optional(),
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const data = subscribeSchema.parse(req.body);
    
    const device = await prisma.pushDevices.upsert({
      where: { fcmToken: data.fcmToken },
      update: {
        ...data,
        lastSeenAt: new Date(),
      },
      create: {
        id: randomUUID(),
        ...data,
        createdAt: new Date(),
      },
    });

    res.status(201).json({
      success: true,
      deviceId: device.id,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
}
```

#### 2.2 Database Migration Script
```typescript
// File: scripts/migrate-push-tokens.ts
import { PrismaClient } from '@prisma/client';
import sql from 'mssql';

const prisma = new PrismaClient();

async function migrate() {
  // 1. Connect to MSSQL
  const pool = await sql.connect({
    server: process.env.MSSQL_SERVER,
    database: process.env.MSSQL_DATABASE,
    // ... config
  });

  // 2. Fetch existing tokens
  const result = await pool.request().query('SELECT * FROM fcm_tokens');
  
  // 3. Transform and insert
  for (const token of result.recordset) {
    await prisma.pushDevices.create({
      data: {
        fcmToken: token.fcm_token,
        clientType: 'Android', // Default for existing tokens
        platform: token.platform || 'Android',
        anonymousUserId: token.device_id,
        createdAt: token.created_at,
        lastSeenAt: new Date(),
      },
    });
  }

  console.log('Migration complete!');
}

migrate().catch(console.error);
```

### Step 3: Enhanced Capacitor Implementation

#### 3.1 Create Capacitor Push Hook
```typescript
// File: hooks/useCapacitorPushNotifications.ts
import { useState, useEffect } from 'react';
import { PushNotifications } from '@capacitor/push-notifications';
import { Device } from '@capacitor/device';
import { getMessaging, getToken } from 'firebase/messaging';

export function useCapacitorPushNotifications() {
  const [state, setState] = useState({
    isSupported: true,
    isSubscribed: false,
    isLoading: false,
    error: null,
  });

  const requestPermission = async () => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      // 1. Request permission
      const permission = await PushNotifications.requestPermissions();
      if (permission.receive !== 'granted') {
        throw new Error('Permission denied');
      }

      // 2. Register with Firebase
      const messaging = getMessaging();
      const fcmToken = await getToken(messaging, {
        vapidKey: process.env.NEXT_PUBLIC_VAPID_KEY,
      });

      // 3. Get device info
      const deviceInfo = await Device.getInfo();

      // 4. Register device
      const response = await fetch('/api/push/devices/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fcmToken,
          clientType: 'Android',
          platform: deviceInfo.platform,
          deviceName: 'Best Bazaar App',
          deviceModel: deviceInfo.model,
          anonymousUserId: generateDeviceId(),
          attributes: {
            manufacturer: deviceInfo.manufacturer,
            osVersion: deviceInfo.osVersion,
            appVersion: process.env.APP_VERSION,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Registration failed');
      }

      setState(prev => ({
        ...prev,
        isSubscribed: true,
        isLoading: false,
      }));

      return fcmToken;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error.message,
        isLoading: false,
      }));
      throw error;
    }
  };

  return {
    ...state,
    requestPermission,
  };
}
```

#### 3.2 Update PermissionsGate Component
```typescript
// File: components/PermissionsGate.tsx
'use client';

import { useCapacitorPushNotifications } from '../hooks/useCapacitorPushNotifications';

export default function PermissionsGate() {
  const { requestPermission, isLoading, error, isSubscribed } = useCapacitorPushNotifications();

  // Render UI similar to web PushOptInModal
  if (isSubscribed) return null;
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-sm mx-4">
        <h2 className="text-xl font-semibold mb-4">Enable Notifications</h2>
        <p className="text-gray-600 mb-6">
          Stay updated with the latest listings and messages
        </p>
        <button
          onClick={requestPermission}
          disabled={isLoading}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Enabling...' : 'Allow Notifications'}
        </button>
        {error && (
          <p className="text-red-500 text-sm mt-2">{error}</p>
        )}
      </div>
    </div>
  );
}
```

---

## 🧪 Testing Strategy

### Unit Tests
```typescript
// File: __tests__/push-notifications.test.ts
describe('Push Notifications', () => {
  test('Web registration', async () => {
    // Test web flow
  });
  
  test('Capacitor registration', async () => {
    // Test mobile flow
  });
  
  test('API validation', async () => {
    // Test API endpoints
  });
});
```

### Integration Tests
```typescript
// File: __tests__/integration/push-flow.test.ts
describe('Push Notification Flow', () => {
  test('End-to-end registration', async () => {
    // Test complete flow
  });
});
```

### Manual Testing Checklist
- [ ] Web Chrome: Permission request → Token registration
- [ ] Web Firefox: Permission request → Token registration
- [ ] Android Emulator: Permission dialog → Token registration
- [ ] Android Device: Permission dialog → Token registration
- [ ] Token refresh on app update
- [ ] Handle permission denial gracefully
- [ ] Test offline scenario

---

## 📊 Monitoring & Analytics

### Key Metrics to Track
1. **Opt-in Rate**: % users granting permission
2. **Registration Success**: % successful token registrations
3. **Platform Distribution**: Users per platform
4. **Error Rates**: Common errors and frequency

### Implementation
```typescript
// File: lib/analytics/pushAnalytics.ts
export class PushAnalytics {
  static trackPermissionGranted(platform: string) {
    // Track permission events
  }
  
  static trackRegistrationSuccess(deviceId: string) {
    // Track successful registrations
  }
  
  static trackRegistrationError(error: string, platform: string) {
    // Track errors for debugging
  }
}
```

---

## 🚨 Rollback Plan

If issues arise during deployment:

### Phase 1 Rollback (Quick Fix)
1. Revert API endpoint in APK to original
2. Restore original PermissionsGate
3. Clear cache and redeploy

### Phase 2 Rollback (Backend Unification)
1. Switch API router to old endpoints
2. Restore MSSQL connection
3. Verify data integrity

### Phase 3 Rollback (Capacitor Enhancements)
1. Revert to simple PermissionsGate
2. Remove new hooks
3. Test basic functionality

---

## ✅ Success Criteria

### Technical
- [ ] Both platforms use same API endpoint
- [ ] Unified database with all device data
- [ ] Consistent error handling
- [ ] 99% registration success rate

### Business
- [ ] No disruption to existing users
- [ ] Improved opt-in rates
- [ ] Better analytics insights
- [ ] Reduced maintenance overhead

---

## 📚 Resources

### Documentation
- [Firebase Cloud Messaging Guide](https://firebase.google.com/docs/cloud-messaging)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Web Push API](https://developer.mozilla.org/en-US/docs/Web/API/Push_API)

### Tools & Libraries
- Firebase Admin SDK
- Capacitor Plugins
- Prisma ORM
- Zod for validation

---

## 🎯 Next Steps

1. **Today**: Implement quick fix for APK
2. **Tomorrow**: Test and verify APK functionality
3. **Next Week**: Begin backend unification
4. **Following Week**: Complete migration

This plan ensures minimal disruption while working towards a unified, scalable solution.
