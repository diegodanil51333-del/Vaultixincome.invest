import { initializeApp, getApps, getApp } from 'firebase/app';
import { getAuth, setPersistence, browserLocalPersistence, onAuthStateChanged, User as FirebaseUser } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, collection, getDocs, onSnapshot, query, where, updateDoc, limit, runTransaction } from 'firebase/firestore';
import { getStorage, ref, getDownloadURL, uploadBytes, uploadString } from 'firebase/storage';

const metaEnv = (import.meta as unknown as { env: Record<string, string> }).env || {};

const rawApiKey = metaEnv.VITE_FIREBASE_API_KEY || "AIzaSyD0UqOpQzQ3lM7kMcDclnkZIQXFS8s0xEE";
export const isFirebaseConfigured = Boolean(
  rawApiKey &&
  rawApiKey.length > 20 &&
  !rawApiKey.includes("VaultixProductionKey") &&
  !rawApiKey.includes("placeholder")
);

// Standard Firebase Production Applet Configuration
const firebaseConfig = {
  apiKey: rawApiKey,
  authDomain: metaEnv.VITE_FIREBASE_AUTH_DOMAIN || "vaultixincome.firebaseapp.com",
  projectId: metaEnv.VITE_FIREBASE_PROJECT_ID || "vaultixincome",
  storageBucket: metaEnv.VITE_FIREBASE_STORAGE_BUCKET || "vaultixincome.firebasestorage.app",
  messagingSenderId: metaEnv.VITE_FIREBASE_MESSAGING_SENDER_ID || "158283505064",
  appId: metaEnv.VITE_FIREBASE_APP_ID || "1:158283505064:web:d9997660ea2d085386919d"
};

// Initialize Firebase App Instance SAFELY without duplicate initializations
export const app = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Enforce Browser Local Auth Session Persistence
setPersistence(auth, browserLocalPersistence).catch(() => {
  // Graceful fallback if third-party cookies blocked
});

/**
 * Recursively removes any keys with `undefined` values from an object,
 * ensuring Firestore setDoc / updateDoc operations never fail due to `undefined` values.
 */
export function cleanFirestoreData<T extends Record<string, any>>(data: T): Record<string, any> {
  const cleaned: Record<string, any> = {};
  for (const [key, value] of Object.entries(data)) {
    if (key === 'passwordHash' || key === 'password') {
      continue;
    }
    if (value !== undefined) {
      if (value && typeof value === 'object' && !Array.isArray(value) && !(value instanceof Date)) {
        cleaned[key] = cleanFirestoreData(value);
      } else {
        cleaned[key] = value;
      }
    }
  }
  return cleaned;
}

export {
  setPersistence, browserLocalPersistence, onAuthStateChanged,
  doc, setDoc, getDoc, collection, getDocs, onSnapshot, query, where, updateDoc, limit,
  runTransaction,
  ref, getDownloadURL, uploadBytes, uploadString
};
export type { FirebaseUser };
