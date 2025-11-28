
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// Try to get config from localStorage first (set via Site Settings UI)
const savedConfig = typeof window !== 'undefined' ? localStorage.getItem('jk_buddy_firebase_config') : null;

const defaultConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

const firebaseConfig = savedConfig ? JSON.parse(savedConfig) : defaultConfig;

// Flag to check if legitimate configuration is present
export const isConfigured = !!savedConfig;

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);
