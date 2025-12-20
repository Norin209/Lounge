import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth"; // 🆕 1. Import Auth

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyAgzsd35x5IRakHBCdNM57pXWJwYnx0NR8",
  authDomain: "glistenlounge-f217f.firebaseapp.com",
  projectId: "glistenlounge-f217f",
  storageBucket: "glistenlounge-f217f.firebasestorage.app",
  messagingSenderId: "1032321641646",
  appId: "1:1032321641646:web:411362c32c0d1e67c3913f",
  measurementId: "G-6QR1M74ERB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firestore (Database)
const db = getFirestore(app);

// Initialize Authentication (Security)
const auth = getAuth(app); // 🆕 2. Turn on Auth

// Export the database AND auth so other files can use them
export { db, auth }; // 🆕 3. Export Auth