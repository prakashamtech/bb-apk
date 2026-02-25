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
  console.log('📱 Handler called with method:', request.method);

  if (request.method !== 'POST') {
    return new NextResponse(null, { status: 405, headers: { Allow: 'POST' } });
  }

  try {
    const body = await request.json();
    const { fcmToken, platform, deviceId } = body;
    console.log('📱 Received body:', { fcmToken: !!fcmToken, platform, deviceId: !!deviceId });

    if (!fcmToken || !platform) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    pool = await sql.connect(config);

    // Check if token already exists
    const checkRequest = new sql.Request();
    checkRequest.input('fcmToken', sql.VarChar, fcmToken);
    checkRequest.input('platform', sql.VarChar, platform);
    const checkResult = await checkRequest.query(`
      SELECT COUNT(*) as count FROM fcm_tokens
      WHERE fcm_token = @fcmToken AND platform = @platform
    `);

    if (checkResult.recordset[0].count > 0) {
      return NextResponse.json({ message: "Token already exists" });
    }

    // Insert new token
    const insertRequest = new sql.Request();
    insertRequest.input('deviceId', sql.VarChar, deviceId);
    insertRequest.input('fcmToken', sql.VarChar, fcmToken);
    insertRequest.input('platform', sql.VarChar, platform);
    await insertRequest.query(`
      INSERT INTO fcm_tokens (user_id, device_id, fcm_token, platform, is_active, created_at)
      VALUES (NULL, @deviceId, @fcmToken, @platform, 1, GETDATE())
    `);

    return NextResponse.json({ message: "Token saved successfully" });
  } catch (error) {
    console.error("📱 Error saving token:", error);
    return NextResponse.json({ error: "Failed to save token" }, { status: 500 });
  }
}