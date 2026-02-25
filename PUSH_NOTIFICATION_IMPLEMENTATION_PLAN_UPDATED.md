# Push Notification Unified Implementation Plan (Updated)

## 🎯 Objective
Create a unified push notification system using MSSQL database that works seamlessly across both Next.js web and Capacitor APK applications.

**CORRECTION**: Both applications use MSSQL, not PostgreSQL.

---

## 📅 Updated Implementation Timeline

### Week 1: Critical Fixes ✅ (COMPLETED)
**Goal**: Make APK functional with existing infrastructure

#### ✅ Day 1-2: Fix APK Permission Flow
- [x] Add PermissionsGate to layout.tsx
- [x] Update API call to use web endpoint
- [x] Add device info collection
- [x] Build and install APK

#### ✅ Day 3-5: Test and Verify
- [x] APK now uses `/api/chat/push/subscribe`
- [x] Data stores in `PushDevices` table
- [x] Same schema as web application

### Week 2: Database Migration (Priority: High)
**Goal**: Migrate existing data from fcm_tokens to PushDevices

#### Day 1-2: Create Migration Script
```typescript
// File: scripts/migrate-fcm-tokens-to-pushdevices.ts
import { prisma } from '../src/server/db/clients';
import sql from 'mssql';

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  options: {
    encrypt: true,
    trustServerCertificate: true,
  },
};

export async function migrateFcmTokens() {
  const pool = await sql.connect(config);
  
  try {
    // Check if fcm_tokens table exists
    const tableCheck = await pool.request().query(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'fcm_tokens'
    `);
    
    if (tableCheck.recordset.length === 0) {
      console.log('fcm_tokens table does not exist. Migration not needed.');
      return;
    }
    
    // Fetch existing tokens
    const result = await pool.request().query('SELECT * FROM fcm_tokens');
    console.log(`Found ${result.recordset.length} tokens to migrate`);
    
    // Migrate each token
    for (const token of result.recordset) {
      await prisma.pushDevices.upsert({
        where: { FcmToken: token.fcm_token },
        update: {
          ClientType: 'Android',
          Platform: token.platform || 'Android',
          AnonymousUserId: token.device_id,
          IsActive: token.is_active,
          UpdatedAt: new Date(),
          LastSeenAt: new Date(),
        },
        create: {
          FcmToken: token.fcm_token,
          ClientType: 'Android',
          Platform: token.platform || 'Android',
          AnonymousUserId: token.device_id,
          IsActive: token.is_active,
          CreatedAt: token.created_at || new Date(),
          UpdatedAt: new Date(),
          LastSeenAt: new Date(),
        },
      });
    }
    
    console.log('Migration completed successfully!');
    
    // Optionally, backup and drop old table
    if (process.env.DROP_OLD_TABLE === 'true') {
      await pool.request().query(`
        EXEC sp_rename 'fcm_tokens', 'fcm_tokens_backup_${new Date().toISOString().replace(/[:.]/g, '-')}'
      `);
      console.log('Old table renamed to backup');
    }
  } finally {
    await pool.close();
  }
}
```

#### Day 3-4: Execute Migration
```bash
# Run migration
npm run migrate:fcm-tokens

# Verify data
SELECT COUNT(*) FROM PushDevices WHERE ClientType = 'Android';
SELECT * FROM PushDevices ORDER BY CreatedAt DESC;
```

#### Day 5: Update Monitoring
- Add logs to track registrations by platform
- Create dashboard to view device statistics

### Week 3: API Cleanup (Priority: Medium)
**Goal**: Remove deprecated endpoints and ensure single source of truth

#### Day 1-2: Update APK Configuration
```typescript
// capacitor.config.ts - Ensure server URL is correct
const config: CapacitorConfig = {
  appId: 'com.apkdemo.app',
  appName: 'Best Bazaar',
  webDir: 'out',
  server: {
    url: 'https://bestbazaar.in', // Production URL
    cleartext: true,
    androidScheme: 'https'
  },
};
```

#### Day 3-4: Deprecate Old API
```typescript
// /api/save-fcm-token - Add redirect
export default async function handler(req: NextRequest, res: NextResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }
  
  console.warn('DEPRECATED: /api/save-fcm-token is deprecated. Use /api/chat/push/subscribe');
  
  // Forward to new API
  const url = 'https://bestbazaar.in/api/chat/push/subscribe';
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(req.body),
  });
  
  const data = await response.json();
  return res.status(response.status).json(data);
}
```

#### Day 5: Update Documentation
- Update API documentation
- Add migration guide
- Update README files

### Week 4: Testing & Validation (Priority: Medium)
**Goal**: Ensure unified system works correctly

#### Test Matrix
```typescript
// Test cases to verify:
1. Web registration → PushDevices table
2. APK registration → PushDevices table  
3. Same device registers twice → Updates existing record
4. Token refresh → Updates existing record
5. Multiple platforms → Correct ClientType values
```

#### Automated Tests
```typescript
// /tests/push/unified-registration.test.ts
describe('Unified Push Registration', () => {
  test('Web registers with ClientType=Web', async () => {
    // Test web registration
  });
  
  test('APK registers with ClientType=Android', async () => {
    // Test APK registration
  });
  
  test('Duplicate tokens update existing record', async () => {
    // Test upsert behavior
  });
});
```

---

## 🛠️ Detailed Implementation Steps

### Step 1: Verify Current Implementation ✅

#### 1.1 Check Web App Registration
```sql
-- Query to verify web registrations
SELECT 
  ClientType,
  COUNT(*) as Count,
  MAX(CreatedAt) as LastRegistration
FROM PushDevices 
WHERE ClientType = 'Web'
GROUP BY ClientType;
```

#### 1.2 Check APK Registration
```sql
-- Query to verify APK registrations
SELECT 
  ClientType,
  Platform,
  COUNT(*) as Count,
  MAX(CreatedAt) as LastRegistration
FROM PushDevices 
WHERE ClientType = 'Android'
GROUP BY ClientType, Platform;
```

### Step 2: Database Migration

#### 2.1 Backup Current Data
```sql
-- Create backup of PushDevices
SELECT * INTO PushDevices_Backup FROM PushDevices;

-- Create backup of fcm_tokens if exists
SELECT * INTO fcm_tokens_Backup FROM fcm_tokens;
```

#### 2.2 Run Migration Script
```bash
cd /path/to/bb-nextjs-sxa
npm run migrate:fcm-tokens
```

#### 2.3 Validate Migration
```sql
-- Compare counts
SELECT 'PushDevices' as TableName, COUNT(*) as RecordCount FROM PushDevices
UNION ALL
SELECT 'fcm_tokens', COUNT(*) FROM fcm_tokens;

-- Check for duplicates
SELECT FcmToken, COUNT(*) as Count 
FROM PushDevices 
GROUP BY FcmToken 
HAVING COUNT(*) > 1;
```

### Step 3: Monitoring Setup

#### 3.1 Add Platform Tracking
```typescript
// /api/chat/push/subscribe.ts - Add logging
console.log('[Push Subscribe] Registration:', {
  clientType,
  platform,
  userAgent: req.headers['user-agent'],
  timestamp: new Date().toISOString(),
});
```

#### 3.2 Create Dashboard Query
```sql
-- Dashboard query for device statistics
SELECT 
  ClientType,
  Platform,
  IsActive,
  COUNT(*) as DeviceCount,
  COUNT(DISTINCT AnonymousUserId) as UniqueUsers,
  MIN(CreatedAt) as FirstSeen,
  MAX(LastSeenAt) as LastSeen
FROM PushDevices 
GROUP BY ClientType, Platform, IsActive
ORDER BY DeviceCount DESC;
```

---

## 📊 Success Metrics

### Technical Metrics
- [ ] 100% of registrations go to PushDevices table
- [ ] Zero errors in unified API
- [ ] Successful migration of all historical data
- [ ] No duplicate FCM tokens

### Business Metrics
- [ ] Track opt-in rates by platform
- [ ] Monitor notification delivery rates
- [ ] Measure user engagement by platform
- [ ] Track device retention over time

---

## 🚨 Rollback Plan

### If Migration Fails
```sql
-- Rollback PushDevices to backup
-- 1. DROP TABLE PushDevices;
-- 2. SELECT * INTO PushDevices FROM PushDevices_Backup;

-- Restore fcm_tokens if needed
-- 1. DROP TABLE fcm_tokens;
-- 2. SELECT * INTO fcm_tokens FROM fcm_tokens_Backup;
```

### If API Issues Occur
- Keep old API endpoint for 30 days
- Implement feature flags for gradual rollout
- Monitor error rates closely

---

## ✅ Current Status

### Completed
- ✅ APK uses unified API endpoint
- ✅ Data stored in PushDevices table
- ✅ Both platforms use MSSQL
- ✅ Schema alignment achieved

### In Progress
- 🔄 Database migration from fcm_tokens
- 🔄 API cleanup and deprecation
- 🔄 Comprehensive testing

### Next Steps
1. Execute database migration
2. Monitor unified system performance
3. Remove deprecated endpoints
4. Implement advanced features (analytics, A/B testing)

---

## 📚 Resources

### Documentation
- [MSSQL Provider for Prisma](https://www.prisma.io/docs/reference/database-reference/connection-urls#sql-server)
- [Capacitor Push Notifications](https://capacitorjs.com/docs/apis/push-notifications)
- [Firebase Cloud Messaging](https://firebase.google.com/docs/cloud-messaging)

### Tools & Libraries
- Prisma with SQL Server provider
- Capacitor plugins
- Firebase Admin SDK
- MSSQL Server Management Studio

---

## 🎯 Conclusion

The push notification system is now **partially unified**:
- Both applications use MSSQL database
- APK has been updated to use the web API
- Data is stored in the unified `PushDevices` table

The remaining work involves:
1. Migrating historical data
2. Cleaning up deprecated endpoints
3. Implementing comprehensive monitoring

This approach ensures minimal disruption while achieving a unified, maintainable system.
