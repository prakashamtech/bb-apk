"use client";

import { useState, useEffect, useCallback } from 'react';
import { Capacitor } from '@capacitor/core';
import { PushNotifications } from '@capacitor/push-notifications';

// Types for Capacitor push notification management
export interface PushSubscriptionState {
  isSupported: boolean;
  isSubscribed: boolean;
  isPermissionGranted: boolean;
  fcmToken: string | null;
  isLoading: boolean;
  error: string | null;
}

export interface PushNotificationOptions {
  title: string;
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  data?: Record<string, unknown>;
  requireInteraction?: boolean;
  actions?: NotificationAction[];
}

// Define NotificationAction interface since it's not available in all environments
interface NotificationAction {
  action: string;
  title: string;
  icon?: string;
}

// Custom hook for Capacitor push notification management
export function usePushNotificationsCapacitor() {
  const [state, setState] = useState<PushSubscriptionState>({
    isSupported: false,
    isSubscribed: false,
    isPermissionGranted: false,
    fcmToken: null,
    isLoading: false,
    error: null,
  });

  // Check if push notifications are supported (Capacitor native platform)
  const checkSupport = useCallback(() => {
    const supported = Capacitor.isNativePlatform();
    setState((prev) => ({ ...prev, isSupported: supported }));
    return supported;
  }, []);

  // Check current permission status
  const checkPermission = useCallback(async () => {
    if (!Capacitor.isNativePlatform()) return false;

    try {
      const permission = await PushNotifications.checkPermissions();
      const isGranted = permission.receive === 'granted';
      setState((prev) => ({ ...prev, isPermissionGranted: isGranted }));
      return isGranted;
    } catch (error) {
      console.warn('[Capacitor Push Hook] Error checking permission:', error);
      return false;
    }
  }, []);

  // Get device info for Capacitor
  const getDeviceInfo = useCallback(async () => {
    try {
      return {
        platform: Capacitor.getPlatform(),
        userAgent: navigator.userAgent,
        language: navigator.language,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      console.warn('[Capacitor Push Hook] Error getting device info:', error);
      return {
        platform: Capacitor.getPlatform(),
        userAgent: 'Unknown',
        language: 'Unknown',
        timestamp: new Date().toISOString(),
      };
    }
  }, []);

  // Request notification permission
  const requestPermission = useCallback(async (): Promise<boolean> => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported on this platform');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      const permission = await PushNotifications.requestPermissions();

      const isGranted = permission.receive === 'granted';
      setState((prev) => ({
        ...prev,
        isPermissionGranted: isGranted,
        isLoading: false,
      }));

      if (isGranted) {
        console.log('[Capacitor Push Hook] Notification permission granted');
      } else {
        console.warn('[Capacitor Push Hook] Notification permission denied');
      }

      return isGranted;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to request permission';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [state.isSupported]);

  // Subscribe to Firebase push notifications via Capacitor
  const subscribe = useCallback(async (): Promise<string> => {
    if (!state.isSupported) {
      throw new Error('Push notifications not supported on this platform');
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      console.log('[Capacitor Push Hook] Starting subscription process');

      // Check current permission status first
      const currentPermission = await checkPermission();
      console.log('[Capacitor Push Hook] Current permission status:', currentPermission);

      // Request permission if not already granted
      if (!currentPermission) {
        console.log('[Capacitor Push Hook] Requesting permission');
        const granted = await requestPermission();
        if (!granted) {
          throw new Error('Notification permission denied');
        }
      }

      console.log('[Capacitor Push Hook] Permission granted, registering push notifications');

      // Register with FCM (this will trigger the registration event)
      await PushNotifications.register();

      // Wait for the registration event to get the token
      const token = await new Promise<string>((resolve, reject) => {
        let registrationListener: any;
        let errorListener: any;
        let timeoutId: NodeJS.Timeout;

        const setupListeners = async () => {
          registrationListener = await PushNotifications.addListener(
            'registration',
            (token) => {
              console.log('[Capacitor Push Hook] FCM token received:', token.value.substring(0, 20) + '...');
              clearTimeout(timeoutId);
              resolve(token.value);
            }
          );

          errorListener = await PushNotifications.addListener(
            'registrationError',
            (error) => {
              console.error('[Capacitor Push Hook] Registration error:', error);
              clearTimeout(timeoutId);
              reject(new Error('Failed to register for push notifications'));
            }
          );
        };

        setupListeners();

        // Set timeout to prevent hanging
        timeoutId = setTimeout(() => {
          console.error('[Capacitor Push Hook] Registration timeout');
          if (registrationListener) registrationListener.remove();
          if (errorListener) errorListener.remove();
          reject(new Error('Registration timeout - please check your internet connection and Firebase configuration'));
        }, 60000); // 60 second timeout
      });

      if (!token) {
        throw new Error('Failed to get FCM token');
      }

      console.log('[Capacitor Push Hook] FCM token obtained successfully, registering with backend');

      // Get device info
      const deviceInfo = await getDeviceInfo();

      // Generate anonymous user ID (similar to web version)
      const anonymousUserId = `anon_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

      console.log('[Capacitor Push Hook] Sending token to backend API');

      // Register device with API
      const response = await fetch('https://bestbazaar.in/api/chat/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: token,
          clientType: Capacitor.getPlatform() === 'android' ? 'Android' : 'iOS',
          platform: deviceInfo.platform,
          deviceName: deviceInfo.userAgent,
          deviceModel: Capacitor.getPlatform(),
          anonymousUserId,
          attributes: {
            userAgent: deviceInfo.userAgent,
            language: deviceInfo.language,
            timestamp: deviceInfo.timestamp,
          },
        }),
      });

      console.log('[Capacitor Push Hook] API response status:', response.status);

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[Capacitor Push Hook] API error response:', errorText);
        throw new Error(`Failed to register device: ${response.status} ${response.statusText}`);
      }

      const result = await response.json();
      console.log('[Capacitor Push Hook] Device registered successfully:', result);

      setState((prev) => ({
        ...prev,
        isPermissionGranted: true,
        isSubscribed: true,
        fcmToken: token,
        isLoading: false,
      }));

      return token;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to subscribe';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [state.isSupported, checkPermission, requestPermission, getDeviceInfo]);

  // Unsubscribe from push notifications
  const unsubscribe = useCallback(async (): Promise<void> => {
    if (!state.fcmToken) {
      console.warn('[Capacitor Push Hook] No FCM token to unsubscribe');
      return;
    }

    setState((prev) => ({ ...prev, isLoading: true, error: null }));

    try {
      // Note: Capacitor doesn't have a direct unsubscribe method like web
      // We just remove the token from our backend
      const response = await fetch('https://bestbazaar.in/api/chat/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          fcmToken: state.fcmToken,
        }),
      });

      if (!response.ok) {
        console.error('[Capacitor Push Hook] Failed to unregister device');
      }

      console.log('[Capacitor Push Hook] Unsubscribed successfully');

      setState((prev) => ({
        ...prev,
        isSubscribed: false,
        fcmToken: null,
        isLoading: false,
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unsubscribe';
      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));
      throw error;
    }
  }, [state.fcmToken]);

  // Listen for push notifications
  useEffect(() => {
    if (!state.isSubscribed || !Capacitor.isNativePlatform()) {
      console.log('[Capacitor Push Hook] Skipping notification listeners - not subscribed or not native');
      return;
    }

    let receivedListener: any;
    let actionListener: any;

    const setupListeners = async () => {
      console.log('[Capacitor Push Hook] Setting up notification listeners');

      try {
        // Listen for received notifications
        receivedListener = await PushNotifications.addListener(
          'pushNotificationReceived',
          (notification) => {
            console.log('[Capacitor Push Hook] Push notification received:', notification);

            // Handle foreground notifications
            // On Capacitor, foreground notifications are automatically shown
            // You can add custom handling here if needed
          }
        );

        // Listen for notification actions (when user taps notification)
        actionListener = await PushNotifications.addListener(
          'pushNotificationActionPerformed',
          (notification) => {
            console.log('[Capacitor Push Hook] Push notification action performed:', notification);

            // Handle notification tap
            const data = notification.notification.data;
            if (data && data.url) {
              // Navigate to the specified URL
              window.location.href = data.url;
            }
          }
        );
        
        console.log('[Capacitor Push Hook] Notification listeners set up successfully');
      } catch (error) {
        console.error('[Capacitor Push Hook] Error setting up listeners:', error);
      }
    };

    setupListeners();

    return () => {
      console.log('[Capacitor Push Hook] Cleaning up notification listeners');
      if (receivedListener) receivedListener.remove();
      if (actionListener) actionListener.remove();
    };
  }, [state.isSubscribed]);

  // Initialize hook
  useEffect(() => {
    const init = async () => {
      console.log('[Capacitor Push Hook] Initializing push notifications');
      const supported = checkSupport();
      console.log('[Capacitor Push Hook] Platform supported:', supported);
      
      if (supported) {
        const permissionGranted = await checkPermission();
        console.log('[Capacitor Push Hook] Initial permission status:', permissionGranted);
        
        setState((prev) => ({ 
          ...prev, 
          isPermissionGranted: permissionGranted 
        }));
      }
    };

    init();
  }, [checkSupport, checkPermission]);

  // Clear error state
  const clearError = useCallback(() => {
    setState((prev) => ({ ...prev, error: null }));
  }, []);

  return {
    ...state,
    requestPermission,
    subscribe,
    unsubscribe,
    clearError,
  };
}
