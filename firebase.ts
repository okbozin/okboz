
import firebase from "firebase/compat/app";
import "firebase/compat/firestore";

// Try to get config from localStorage first (set via Site Settings UI)
const savedConfig = typeof window !== 'undefined' ? localStorage.getItem('jk_buddy_firebase_config') : null;

// Placeholder config
const defaultConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};

let firebaseConfig = defaultConfig;
let validConfigFound = false;

// Robust parsing logic to prevent crash on reload if user enters bad data
if (savedConfig) {
  try {
     const parsed = JSON.parse(savedConfig);
     // Ensure critical fields exist before using custom config
     // Also ensure it is NOT the default placeholder string
     if (parsed.apiKey && parsed.projectId && parsed.apiKey !== "YOUR_API_KEY") {
        firebaseConfig = parsed;
        validConfigFound = true;
     } else {
        console.warn("JK Buddy: Saved config found but it appears invalid or is the default placeholder.", parsed);
     }
  } catch (e) {
     console.error("Failed to parse saved Firebase config", e);
  }
}

// Flag to check if legitimate configuration is present
export const isConfigured = validConfigFound;

// Initialize Firebase
// We wrap this in try-catch just in case the config object structure is somehow invalid for the SDK
let app;
if (!firebase.apps.length) {
  try {
    app = firebase.initializeApp(firebaseConfig);
    console.log("JK Buddy: Firebase Initialized.", validConfigFound ? "Using Custom Config" : "Using Default Config (Demo Mode)");
  } catch (e) {
    console.error("Firebase init failed with current config, falling back to default/safe mode.", e);
    app = firebase.initializeApp(defaultConfig, 'fallbackApp');
  }
} else {
  app = firebase.app();
}

// Initialize Cloud Firestore and get a reference to the service
export const db = app.firestore();
