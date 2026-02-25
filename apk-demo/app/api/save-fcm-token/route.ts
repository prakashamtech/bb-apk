import { NextRequest, NextResponse } from "next/server";
import * as sql from "mssql";

const config = {
  server: process.env.DB_SERVER || "localhost",
  database: process.env.DB_NAME || "bestbazaar",
  user: process.env.DB_USER || "sa",
  password: process.env.DB_PASSWORD || "",
  options: {
    encrypt: true, // for Azure
    trustServerCertificate: true, // for local dev
  },
};

export async function POST(request: NextRequest) {
  let pool: sql.ConnectionPool | null = null;
  try {
    const { fcmToken, platform, deviceId } = await request.json();

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
  } finally {
    if (pool) {
      await pool.close();
    }
  }
}
