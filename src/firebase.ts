import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import firebaseConfig from "../firebase-applet-config.json";

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (with custom database ID from config if present)
const db = getFirestore(app, (firebaseConfig as any).firestoreDatabaseId || "(default)");

// We do not use Firebase Auth for our key-based real-time synchronization.
// Return a simple resolved ID to maintain full compatibility with any callers.
export const getUserId = (): Promise<string> => {
  return Promise.resolve("local_user");
};

export { app, db };
