import { initializeApp, getApps, FirebaseApp } from "firebase/app";
import { getAuth, Auth } from "firebase/auth";
import { getFirestore, Firestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
if (!apiKey && typeof window !== 'undefined') {
  console.warn('Firebase API Key missing! Check environment variables.');
}

const firebaseConfig = {
  apiKey: apiKey || 'placeholder-key',
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase — graceful fallback when keys are missing
let app: FirebaseApp;
try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
} catch (e) {
  console.warn('Firebase initialization failed — running in offline mode.', e);
  app = initializeApp({ ...firebaseConfig, apiKey: 'offline-placeholder' }, 'offline-fallback');
}

export const auth: Auth = getAuth(app);
export const db: Firestore = getFirestore(app);

// Analytics is only supported in browser environment
export const initAnalytics = async () => {
  try {
    if (typeof window !== "undefined" && apiKey && await isSupported()) {
      return getAnalytics(app);
    }
  } catch (e) {
    console.warn('Analytics unavailable:', e);
  }
  return null;
};

export default app;
