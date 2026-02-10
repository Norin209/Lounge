import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { getStorage } from "firebase/storage"; // 🆕 Enabled for all hub uploads

const firebaseConfig = {
  apiKey: "AIzaSyAgzsd35x5IRakHBCdNM57pXWJwYnx0NR8",
  authDomain: "glistenlounge-f217f.firebaseapp.com",
  projectId: "glistenlounge-f217f",
  storageBucket: "glistenlounge-f217f.firebasestorage.app",
  messagingSenderId: "1032321641646",
  appId: "1:1032321641646:web:411362c32c0d1e67c3913f",
  measurementId: "G-6QR1M74ERB"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const storage = getStorage(app); // 🆕 Initialize Storage

export { db, auth, storage };