// app/PermissionsGate.tsx (updated)
"use client";
import { useEffect, useState } from "react";
import { Capacitor } from '@capacitor/core';
import { Camera } from "@capacitor/camera";
import { Geolocation } from "@capacitor/geolocation";
import { PushNotifications } from "@capacitor/push-notifications";
import { Filesystem } from "@capacitor/filesystem";

type Step = "idle" | "prompt" | "requesting" | "done" | "denied";

export default function PermissionsGate() {
  console.log("📱 PermissionsGate rendered");
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");

  useEffect(() => {
    try {
      const checked = typeof window !== "undefined" && localStorage.getItem("permChecked2");
      console.log("📱 PermissionsGate useEffect, permChecked:", checked);
      if (!checked) setStep("prompt");
    } catch (_) {
      // ignore
    }
  }, []);

  const markDone = () => {
    try {
      localStorage.setItem("permChecked", "1");
    } catch (_) { }
    setStep("done");
  };

  const registerFCMToken = async () => {
    // FCM registration logic (unchanged, enabled)
    try {
      console.log("📱 [SAFE] Starting isolated FCM registration...");
      if (typeof localStorage !== 'undefined' && localStorage.getItem('fcmRegistered')) {
        console.log("📱 [SAFE] FCM already registered, skipping");
        return;
      }
      if (typeof window === 'undefined' || !(window as any).Capacitor) {
        console.log("📱 [SAFE] Not in Capacitor, skipping FCM");
        return;
      }
      await new Promise(resolve => setTimeout(resolve, 2000));
      console.log("📱 [SAFE] Capacitor detected, initializing FCM...");
      const { PushNotifications } = await import("@capacitor/push-notifications");
      const { getMessaging, getToken } = await import("firebase/messaging");
      const { VAPID_KEY } = await import("./firebase");
      console.log("📱 [SAFE] Firebase modules loaded");
      const permResult = await PushNotifications.requestPermissions();
      console.log("📱 [SAFE] Permission result:", permResult);
      if (permResult.receive !== "granted") {
        console.log("📱 [SAFE] Permission denied, skipping FCM");
        return;
      }
      console.log("📱 [SAFE] Permission granted, registering...");
      await PushNotifications.register();
      console.log("📱 [SAFE] Push notifications registered");
      PushNotifications.addListener("registration", async (token) => {
        try {
          console.log("📱 ===== CAPACITOR FCM TOKEN =====");
          console.log("📱 Mobile FCM Token:", token.value);
          const messaging = getMessaging();
          const firebaseToken = await getToken(messaging, { vapidKey: VAPID_KEY });
          if (firebaseToken) {
            console.log("📱 ===== FIREBASE FCM TOKEN =====");
            console.log("📱 Firebase FCM Token:", firebaseToken);
            console.log("📱 ===== TOKENS SUCCESSFULLY OBTAINED =====");
          } else {
            console.log("📱 [SAFE] Firebase token was null");
          }
        } catch (innerError) {
          console.error("📱 [SAFE] Error in token processing:", innerError);
        }
      });
      PushNotifications.addListener("registrationError", (error) => {
        console.error("📱 [SAFE] Registration error:", error);
      });
      console.log("📱 [SAFE] FCM setup completed successfully");
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('fcmRegistered', '1');
      }
      if (typeof window !== 'undefined') {
        (window as any).updateFcmStatus = (status: string) => {
          console.log("📱 FCM Status Update:", status);
        };
      }
    } catch (outerError) {
      console.error("📱 [SAFE] FCM registration failed:", outerError);
    }
  };

  const requestAll = async () => {
    setError("");
    setStep("requesting");
    try {
      if (Capacitor.isNativePlatform()) {
        try { await Camera.requestPermissions(); } catch (_) { }
        try { await Geolocation.requestPermissions(); } catch (_) { }
        try {
          if (Filesystem.requestPermissions) {
            await Filesystem.requestPermissions();
          }
        } catch (_) { }
        try { await PushNotifications.requestPermissions(); } catch (_) { }  // Requests notification permission
        setTimeout(async () => {
          try {
            await registerFCMToken();  // Initializes FCM after permission
          } catch (error) {
            console.error("📱 FCM registration failed:", error);
          }
        }, 3000);
      }
      markDone();
    } catch (e: any) {
      setError(e?.message || "Permission request failed");
      setStep("denied");
    }
  };

  if (step === "idle" || step === "done") return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/40">
      <div className="bg-white w-[90%] max-w-md rounded-xl p-5 shadow-xl">
        <h2 className="text-lg font-semibold mb-2">Permissions required</h2>
        <p className="text-sm text-gray-600 mb-4">
          To give you the best experience, allow access to Camera, Location, Notifications, and Files. You can change this anytime in Settings.
        </p>
        {error ? (
          <div className="text-red-600 text-sm mb-3">{error}</div>
        ) : null}
        <div className="flex gap-3 justify-end">
          {step === "prompt" && (
            <>
              <button className="px-4 py-2 rounded-md border" onClick={markDone}>Not now</button>
              <button className="px-4 py-2 rounded-md bg-black text-white" onClick={requestAll}>Allow now</button>
            </>
          )}
          {step === "requesting" && (
            <button className="px-4 py-2 rounded-md bg-black text-white opacity-80" disabled>Requesting…</button>
          )}
          {step === "denied" && (
            <>
              <button className="px-4 py-2 rounded-md border" onClick={requestAll}>Retry</button>
              <button className="px-4 py-2 rounded-md" onClick={markDone}>Continue</button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}