"use client";
import { useEffect, useState } from "react";
import { Device } from "@capacitor/device";
import { PushNotifications } from "@capacitor/push-notifications";

type Step = "idle" | "prompt" | "requesting" | "done" | "denied";

export default function UnifiedPermissionsGate() {
  const [step, setStep] = useState<Step>("idle");
  const [error, setError] = useState<string>("");
  const [fcmToken, setFcmToken] = useState<string>("");

  useEffect(() => {
    try {
      const checked = typeof window !== "undefined" && localStorage.getItem("permChecked");
      if (!checked) setStep("prompt");
    } catch (_) {
      // ignore
    }
  }, []);

  const markDone = () => {
    try {
      localStorage.setItem("permChecked", "1");
    } catch (_) {}
    setStep("done");
  };

  const generateDeviceId = () => {
    return 'device_' + Math.random().toString(36).substr(2, 9) + Date.now();
  };

  const saveTokenToDatabase = async (token: string) => {
    try {
      const deviceInfo = await Device.getInfo();
      const deviceId = generateDeviceId();
      
      console.log('📱 Saving token to database...');
      console.log('📱 Device info:', deviceInfo);
      
      const response = await fetch('https://bestbazaar.in/api/chat/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: token,
          clientType: 'Android',
          platform: deviceInfo.platform || 'Android',
          deviceName: 'Best Bazaar App',
          deviceModel: deviceInfo.model || 'Android Device',
          anonymousUserId: deviceId,
          attributes: {
            source: 'capacitor-apk',
            manufacturer: deviceInfo.manufacturer,
            osVersion: deviceInfo.osVersion,
            appVersion: '1.0.0',
            timestamp: new Date().toISOString()
          }
        }),
      });

      console.log('📱 API Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('📱 API Error Response:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const result = await response.json();
      console.log('📱 Device registered successfully:', result);
      console.log('📱 Device ID:', result.deviceId);
      return result;
    } catch (error) {
      console.error('📱 Failed to save token:', error);
      throw error;
    }
  };

  const requestPermissionsAndRegister = async () => {
    setError("");
    setStep("requesting");
    
    try {
      console.log('📱 Starting unified permission flow...');
      
      // Step 1: Request push notification permission
      console.log('📱 Requesting push notification permissions...');
      const permResult = await PushNotifications.requestPermissions();
      console.log('📱 Permission result:', permResult);
      
      if (permResult.receive !== "granted") {
        throw new Error("Push notification permission denied");
      }
      
      // Step 2: Register for push notifications
      console.log('📱 Registering for push notifications...');
      await PushNotifications.register();
      
      // Step 3: Get FCM token
      console.log('📱 Getting FCM token...');
      
      // Add listener for registration
      return new Promise((resolve, reject) => {
        PushNotifications.addListener('registration', async (token) => {
          try {
            console.log('📱 FCM Token received:', token.value);
            setFcmToken(token.value);
            
            // Step 4: Save to database
            console.log('📱 Saving token to unified database...');
            const result = await saveTokenToDatabase(token.value);
            console.log('📱 ✅ Successfully registered device!');
            
            markDone();
            resolve(result);
          } catch (error) {
            console.error('📱 ❌ Registration failed:', error);
            reject(error);
          }
        });
        
        PushNotifications.addListener('registrationError', (error) => {
          console.error('📱 Registration error:', error);
          reject(new Error(error.error || 'Registration failed'));
        });
        
        // Trigger token retrieval
        console.log('📱 Triggering token retrieval...');
      });
      
    } catch (error) {
      console.error('📱 Permission flow failed:', error);
      setError(error instanceof Error ? error.message : "Permission request failed");
      setStep("denied");
    }
  };

  if (step === "idle" || step === "done") {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h2 className="text-xl font-semibold mb-4">Enable Notifications</h2>
        
        {step === "prompt" && (
          <>
            <p className="text-gray-600 mb-6">
              Stay updated with the latest listings and messages. We'll send you important notifications about your activities.
            </p>
            <button
              onClick={requestPermissionsAndRegister}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Allow Notifications
            </button>
          </>
        )}
        
        {step === "requesting" && (
          <div className="text-center py-4">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-4 text-gray-600">Setting up notifications...</p>
          </div>
        )}
        
        {step === "denied" && (
          <>
            <p className="text-red-600 mb-4">{error}</p>
            <button
              onClick={requestPermissionsAndRegister}
              className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Try Again
            </button>
          </>
        )}
        
        {fcmToken && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <p className="font-semibold text-gray-700">Debug Info:</p>
            <p className="text-gray-600 break-all">FCM: {fcmToken.substring(0, 50)}...</p>
          </div>
        )}
      </div>
    </div>
  );
}
