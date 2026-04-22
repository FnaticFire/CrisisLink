import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getAnalytics, isSupported } from "firebase/analytics";

const firebaseConfig = {
  apiKey: "AIzaSyDb8q9fXdoPaB18s4Pmq-fbsxjs8tSatzg",
  authDomain: "crisislink-2b499.firebaseapp.com",
  projectId: "crisislink-2b499",
  storageBucket: "crisislink-2b499.firebasestorage.app",
  messagingSenderId: "808682552811",
  appId: "1:808682552811:web:7182042e4bc5e1d39cedae",
  measurementId: "G-L7MEVKQQFZ"
};

// Initialize Firebase
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);

// Analytics is only supported in browser environment
export const initAnalytics = async () => {
  if (typeof window !== "undefined" && await isSupported()) {
    return getAnalytics(app);
  }
  return null;
};

export default app;
