import { getApp, getApps, initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey:
    import.meta.env.VITE_FIREBASE_API_KEY ||
    "AIzaSyCFf9PbQI9ggLoctj2ClS0-NdGz93pHJNY",
  authDomain:
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ||
    "northstarapp-55dfd.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "northstarapp-55dfd",
  storageBucket:
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ||
    "northstarapp-55dfd.firebasestorage.app",
  messagingSenderId:
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "1042533369826",
  appId:
    import.meta.env.VITE_FIREBASE_APP_ID ||
    "1:1042533369826:web:c7fb81a3125748c130dbbb",
  measurementId:
    import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-3NNB1KXZ3R",
};

const firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);
const firebaseAuth = getAuth(firebaseApp);
const googleAuthProvider = new GoogleAuthProvider();
googleAuthProvider.setCustomParameters({ prompt: "select_account" });

export { firebaseApp, firebaseAuth, googleAuthProvider };
