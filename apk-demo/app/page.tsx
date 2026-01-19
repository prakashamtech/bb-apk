"use client";

import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { usePushNotificationsCapacitor } from "../hooks/usePushNotificationsCapacitor";

export default function Home() {
  const {
    isSupported,
    isSubscribed,
    isPermissionGranted,
    fcmToken,
    isLoading,
    error,
    requestPermission,
    subscribe,
    clearError,
  } = usePushNotificationsCapacitor();

  useEffect(() => {
    const initPush = async () => {
      if (!isSupported) {
        console.log("Push notifications not supported on this platform");
        return;
      }

      // Auto-subscribe if permission is already granted
      if (isPermissionGranted && !isSubscribed && !isLoading) {
        try {
          await subscribe();
        } catch (err) {
          console.error("Auto-subscription failed:", err);
        }
      }
    };

    initPush();
  }, [isSupported, isPermissionGranted, isSubscribed, isLoading, subscribe]);

  const handleEnableNotifications = async () => {
    try {
      clearError();

      if (!isPermissionGranted) {
        const granted = await requestPermission();
        if (!granted) {
          return;
        }
      }

      await subscribe();
    } catch (err) {
      console.error("Failed to enable notifications:", err);
    }
  };

  const getStatusMessage = () => {
    if (!isSupported) {
      return Capacitor.isNativePlatform()
        ? "Push notifications are not supported on this device"
        : "Push notifications require native mobile platform";
    }

    if (error) {
      return `Error: ${error}`;
    }

    if (isLoading) {
      return "Loading...";
    }

    if (isSubscribed) {
      return "Push notifications are enabled";
    }

    if (isPermissionGranted) {
      return "Permission granted - ready to enable notifications";
    }

    return "Push notifications are disabled";
  };

  return (
    <div style={{ padding: 20, maxWidth: 600, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 20 }}>Best Bazaar</h1>

      <div style={{ marginBottom: 20 }}>
        <h2>Push Notification Status</h2>
        <p style={{ marginBottom: 10 }}>{getStatusMessage()}</p>

        {isSupported && (
          <div style={{ marginBottom: 20 }}>
            {!isSubscribed ? (
              <button
                onClick={handleEnableNotifications}
                disabled={isLoading}
                style={{
                  padding: "12px 24px",
                  backgroundColor: isLoading ? "#ccc" : "#007bff",
                  color: "white",
                  border: "none",
                  borderRadius: 4,
                  cursor: isLoading ? "not-allowed" : "pointer",
                  fontSize: 16,
                }}
              >
                {isLoading ? "Enabling..." : "Enable Push Notifications"}
              </button>
            ) : (
              <div style={{ color: "green", fontWeight: "bold" }}>
                ✓ Notifications Enabled
              </div>
            )}
          </div>
        )}
      </div>

      {fcmToken && (
        <div style={{ marginBottom: 20 }}>
          <h3>FCM Token</h3>
          <textarea
            style={{
              width: "100%",
              height: 80,
              padding: 8,
              fontSize: 12,
              fontFamily: "monospace",
              border: "1px solid #ccc",
              borderRadius: 4,
            }}
            value={fcmToken}
            readOnly
          />
        </div>
      )}

      <div style={{ marginBottom: 20 }}>
        <h3>Debug Info</h3>
        <ul style={{ fontSize: 14 }}>
          <li>Platform: {Capacitor.getPlatform()}</li>
          <li>Is Native: {Capacitor.isNativePlatform() ? "Yes" : "No"}</li>
          <li>Supported: {isSupported ? "Yes" : "No"}</li>
          <li>Permission Granted: {isPermissionGranted ? "Yes" : "No"}</li>
          <li>Subscribed: {isSubscribed ? "Yes" : "No"}</li>
          <li>Loading: {isLoading ? "Yes" : "No"}</li>
        </ul>
      </div>
    </div>
  );
}
