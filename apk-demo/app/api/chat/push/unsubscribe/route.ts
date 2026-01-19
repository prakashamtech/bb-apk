import { NextRequest, NextResponse } from 'next/server';
import admin from 'firebase-admin';

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
    console.log('[Push Unsubscribe] Request received');

    const body = await request.json();
    console.log('[Push Unsubscribe] Request body:', body);

    // Parse request data
    const { fcmToken } = body;

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

    console.log('[Push Unsubscribe] Unsubscribing FCM token:', fcmToken.substring(0, 20) + '...');

    // Find and update the device to mark it as inactive
    const deviceQuery = await dbInstance
      .collection('pushDevices')
      .where('fcmToken', '==', fcmToken)
      .limit(1)
      .get();

    if (!deviceQuery.empty) {
      const docRef = deviceQuery.docs[0].ref;
      await docRef.update({
        isActive: false,
        updatedAt: new Date(),
      });

      console.log('[Push Unsubscribe] Device deactivated successfully');
    } else {
      console.warn('[Push Unsubscribe] Device not found for FCM token:', fcmToken.substring(0, 20) + '...');
    }

    return NextResponse.json({ ok: true });
  } catch (e: unknown) {
    console.error('[Push Unsubscribe] Error:', e);

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
