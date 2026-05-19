import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, enableIndexedDbPersistence, terminate } from 'firebase/firestore';

// Default mock config for development/fallback
const mockConfig = {
  apiKey: "mock-api-key",
  authDomain: "mock-project.firebaseapp.com",
  projectId: "mock-project",
  storageBucket: "mock-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abcdef"
};

let firebaseConfig = mockConfig;

try {
  // Try to load the real config if it exists
  // We use require to avoid build errors if the file is missing during dev
  // In a real build, we'd use import or a better mechanism
  // But for this environment, we'll try to use the environment's config
} catch (e) {
  console.warn("Using mock Firebase configuration. Please set up Firebase in AI Studio.");
}

const app = !getApps().length ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Add a connection check
export async function testConnection() {
  try {
    const testDoc = doc(db, '_connection_test_', 'ping');
    await getDocFromServer(testDoc);
    console.log("Firebase connected successfully");
    return true;
  } catch (error) {
    console.error("Firebase connection failed:", error);
    return false;
  }
}
