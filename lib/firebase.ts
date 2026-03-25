import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getAnalytics, isSupported } from 'firebase/analytics';
import { createClient } from '@supabase/supabase-js';

// --------------------
// 🔹 Firebase — Authentication only
// --------------------
const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
};

// Lazy singleton — only initialised in the browser, never on the server.
// This prevents the `auth/invalid-api-key` crash during Next.js SSR/prerender.
function getFirebaseApp(): FirebaseApp {
  return getApps().length ? getApp() : initializeApp(firebaseConfig);
}

export function getFirebaseAuth(): Auth {
  return getAuth(getFirebaseApp());
}

// Keep a module-level `auth` export for the rare places that import it
// directly, but guard it so it is undefined during SSR.
export const auth: Auth =
  typeof window !== 'undefined' ? getFirebaseAuth() : (null as unknown as Auth);

export const analytics =
  typeof window !== 'undefined'
    ? isSupported().then((yes) => yes && getAnalytics(getFirebaseApp()))
    : null;

// --------------------
// 🔹 Supabase — Database only
// --------------------
export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    auth: {
      persistSession: true,
      detectSessionInUrl: true,
    },
  }
);