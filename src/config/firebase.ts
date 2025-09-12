import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: (import.meta as any).env?.VITE_FIREBASE_API_KEY || 'AIzaSyCub_sI6gJCp_zqgzn4NUnNzNvHVo2Mm3s',
  authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || 'genc-a8f49.firebaseapp.com',
  projectId: (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID || 'genc-a8f49',
  storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || 'genc-a8f49.firebasestorage.app',
  messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '1042110898042',
  appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '1:1042110898042:web:a36a55defc8926d9d000c3',
  measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Connect to emulators in development (optional)
if ((import.meta as any).env?.DEV && (import.meta as any).env?.VITE_USE_FIREBASE_EMULATOR === 'true') {
  try {
    connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
    connectFirestoreEmulator(db, 'localhost', 8080);
  } catch (error) {
    // Emulators might already be connected, ignore the error
    console.warn('Firebase emulators already connected or unavailable');
  }
}

export default app;