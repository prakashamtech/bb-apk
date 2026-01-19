import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';
import { randomUUID } from 'crypto';

const getFirebaseAdmin = () => {
  if (!admin.apps.length) {
    const serviceAccount = {
      type: 'service_account',
      project_id: process.env.FIREBASE_PROJECT_ID,
      private_key: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
      client_email: process.env.FIREBASE_CLIENT_EMAIL,
    };

    if (!serviceAccount.project_id || !serviceAccount.private_key || !serviceAccount.client_email) {
      throw new Error('Missing Firebase Admin environment variables');
    }

    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount as any),
    });
  }
  return admin;
};

export async function POST(request: NextRequest) {
  const adminInstance = getFirebaseAdmin();
  const dbInstance = adminInstance.firestore();
  try {
    console.log('[Push Subscribe] Request received');

    const body = await request.json();
    console.log('[Push Subscribe] Request body:', body);

    // Parse request data
    const {
      fcmToken,
      clientType = 'Android',
      platform,
      deviceName,
      deviceModel,
      anonymousUserId,
      attributes,
    } = body;

    // Validate required fields
    if (!fcmToken || typeof fcmToken !== 'string') {
      return NextResponse.json(
        {
          error: 'Validation failed',
          message: 'FCM token is required and must be a string',
        },
        { status: 400 }
      );
    }

    console.log('[Push Subscribe] Firebase subscription request:', {
      clientType,
      platform: platform || 'unknown',
      hasAnonymousUserId: !!anonymousUserId,
    });

    const now = new Date();
    const deviceId = randomUUID();

    // Check if device already exists
    const existingDeviceQuery = await dbInstance
      .collection('pushDevices')
      .where('fcmToken', '==', fcmToken)
      .limit(1)
      .get();

    let device;
    if (!existingDeviceQuery.empty) {
      // Update existing device
      const existingDoc = existingDeviceQuery.docs[0];
      device = {
        id: existingDoc.id,
        ...existingDoc.data(),
      };

      await dbInstance.collection('pushDevices').doc(existingDoc.id).update({
        clientType,
        platform: platform || 'Unknown',
        deviceName: deviceName || 'Unknown Device',
        deviceModel: deviceModel || null,
        anonymousUserId: anonymousUserId || null,
        attributes: attributes ? JSON.stringify(attributes) : null,
        isActive: true,
        updatedAt: now,
        lastSeenAt: now,
      });

      console.log('[Push Subscribe] Device updated successfully:', device.id);
    } else {
      // Create new device
      const deviceData = {
        fcmToken,
        clientType,
        platform: platform || 'Unknown',
        deviceName: deviceName || 'Unknown Device',
        deviceModel: deviceModel || null,
        anonymousUserId: anonymousUserId || null,
        attributes: attributes ? JSON.stringify(attributes) : null,
        isActive: true,
        createdAt: now,
        updatedAt: now,
        lastSeenAt: now,
      };

      const docRef = await dbInstance.collection('pushDevices').add(deviceData);
      device = {
        id: docRef.id,
        ...deviceData,
      };

      console.log('[Push Subscribe] Device created successfully:', device.id);
    }

    return NextResponse.json({
      ok: true,
      authenticated: false, // Capacitor app doesn't have auth yet
      deviceId: device.id,
    });
  } catch (e: unknown) {
    console.error('[Push Subscribe] Error:', e);

    const errorMessage = e instanceof Error ? e.message : 'Unknown error';
    return NextResponse.json(
      {
        error: 'Internal Server Error',
        message: process.env.NODE_ENV === 'development' ? errorMessage : undefined,
      },
      { status: 500 }
    );
  }
}
