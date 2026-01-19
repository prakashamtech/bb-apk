import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyC2FV2K4f35p8fXeMoYhpKyTdLgCd_XR3Y",
  authDomain: "best-bazaar-92dd6.firebaseapp.com",
  projectId: "best-bazaar-92dd6",
  storageBucket: "best-bazaar-92dd6.firebasestorage.app",
  messagingSenderId: "857299892800",
  appId: "1:857299892800:android:1c346a3f9589adb8233da5",
  measurementId: "G-Q1ENCH5R4R"
};
const app = initializeApp(firebaseConfig);

// Initialize Analytics only on client-side (if needed)
if (typeof window !== 'undefined') {
  // Analytics would be initialized here if needed
}

// Export function to get messaging instance
export const getMessagingInstance = () => {
  if (typeof window === 'undefined') return null;
  return getMessaging(app);
};

// VAPID Key for FCM - This should match the key from Firebase Console
export const VAPID_KEY = "BPAXcJgOiVm9xR-SPL3sOUBpb9luh8AxY4IAODgbwF1RLnf_2Lv6yMGlsORWXE7B_Mrj-H56tC8Ko_LO_tlkkxU";