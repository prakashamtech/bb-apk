// app/PermissionsGate.tsx
"use client";

import { useEffect, useState } from "react";
import { Capacitor } from "@capacitor/core";
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { Filesystem } from "@capacitor/filesystem";
import { Http } from "@capacitor-community/http";

type Step = "idle" | "prompt" | "requesting" | "done" | "denied";

export default function PermissionsGate() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");

  // Show permission gate only once
  useEffect(() => {
    try {
      const checked = localStorage.getItem("permChecked");
      if (!checked) setStep("prompt");
    } catch (_) {}
  }, []);

  const markDone = () => {
    try {
      localStorage.setItem("permChecked", "1");
    } catch (_) {}
    setStep("done");
  };

  // 🔔 REGISTER & SAVE FCM TOKEN (ANDROID ONLY)
  const registerFCMToken = async () => {
    try {
      if (!Capacitor.isNativePlatform()) {
        console.log("📱 Not native platform, skipping FCM registration");
        return;
      }

      if (localStorage.getItem("fcmRegistered")) {
        console.log("📱 FCM already registered");
        alert("📱 FCM already registered");
        return;
      }

      alert("📱 Starting FCM registration");
      console.log("📱 Starting FCM registration");

      // Import Firebase Messaging plugin
      const { FirebaseMessaging } = await import('@capacitor-firebase/messaging');

      // 1️⃣ Request notification permission
      console.log("📱 Requesting notification permission");
      const perm = await FirebaseMessaging.requestPermissions();
      console.log("📱 Permission result:", perm);
      
      if (perm.receive !== 'granted') {
        console.log("📱 Notification permission denied");
        alert("❌ Notification permission denied");
        return;
      }

      console.log("📱 Permission granted, getting token");
      alert("✅ Permission granted, getting FCM token");

      // 2️⃣ Get FCM token using Firebase Messaging plugin
      const tokenResult = await FirebaseMessaging.getToken();
      console.log("📱 FCM Token received:", tokenResult.token);
      alert("✅ FCM Token Generated:\n\n" + tokenResult.token);

      // 3️⃣ SEND TOKEN TO SERVER
      console.log("📱 Sending token to server");
      const response = await Http.request({
        method: "POST",
        url: "https://stage.bestbazaar.in/api/save-fcm-token",
        headers: {
          "Content-Type": "application/json",
        },
        data: {
          fcmToken: tokenResult.token,
          platform: "android",
          deviceId: "android",
        },
      });

      console.log("📱 Server response:", response);
      alert("✅ HTTP STATUS: " + response.status);
      alert("✅ SERVER RESPONSE:\n" + JSON.stringify(response.data));

      if (response.status === 200) {
        localStorage.setItem("fcmRegistered", "1");
        console.log("📱 FCM registration completed successfully");
      } else {
        console.error("📱 Server returned error:", response.status);
        alert("❌ Server returned error: " + response.status);
      }
    } catch (err) {
      console.error("❌ registerFCMToken error:", err);
      alert("❌ FCM setup failed:\n" + String(err));
    }
  };

  // 🚀 REQUEST ALL PERMISSIONS
  const requestAll = async () => {
    setError("");
    setStep("requesting");

    try {
      if (Capacitor.isNativePlatform()) {
        try {
          await Camera.requestPermissions();
        } catch (_) {}

        try {
          await Geolocation.requestPermissions();
        } catch (_) {}

        try {
          if (Filesystem.requestPermissions) {
            await Filesystem.requestPermissions();
          }
        } catch (_) {}

        // Delay slightly to avoid race conditions
        setTimeout(() => {
          registerFCMToken();
        }, 1500);
      }

      markDone();
    } catch (e: any) {
      setError(e?.message || "Permission request failed");
      setStep("denied");
    }
  };

  if (step === "idle" || step === "done") return null;

  // 🧩 UI
  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white w-[90%] max-w-md rounded-xl p-5 shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Permissions required</h2>
        <p className="text-sm text-gray-600 mb-4">
          To give you the best experience, allow access to Camera, Location,
          Notifications, and Files. You can change this anytime in Settings.
        </p>

        {error && <div className="text-red-600 text-sm mb-3">{error}</div>}

        <div className="flex gap-3 justify-end">
          {step === "prompt" && (
            <>
              <button
                className="px-4 py-2 rounded-md border"
                onClick={markDone}
              >
                Not now
              </button>
              <button
                className="px-4 py-2 rounded-md bg-black text-white"
                onClick={requestAll}
              >
                Allow now
              </button>
            </>
          )}

          {step === "requesting" && (
            <button
              className="px-4 py-2 rounded-md bg-black text-white opacity-80"
              disabled
            >
              Requesting…
            </button>
          )}

          {step === "denied" && (
            <>
              <button
                className="px-4 py-2 rounded-md border"
                onClick={requestAll}
              >
                Retry
              </button>
              <button className="px-4 py-2" onClick={markDone}>
                Continue
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
