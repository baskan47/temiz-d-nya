// Reads Firebase config from Vite env vars (VITE_FIREBASE_...)
const hasEnv = !!import.meta.env.VITE_FIREBASE_API_KEY
export const FIREBASE_CONFIG = hasEnv ? {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
} : null

export const isFirebaseConfigured = () => !!FIREBASE_CONFIG
