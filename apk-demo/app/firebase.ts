import { initializeApp } from "firebase/app";
import { getMessaging } from "firebase/messaging";

const firebaseConfig = {
  apiKey: "AIzaSyAQK4ODia_-5-f5xFuqXpO3G0w9UOz4_4o",
  authDomain: "best-bazaar-92dd6.firebaseapp.com",
  projectId: "best-bazaar-92dd6",
  storageBucket: "best-bazaar-92dd6.firebasestorage.app",
  messagingSenderId: "857299892800",
  appId: "1:857299892800:web:42ac9a6bc7679862233da5",
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