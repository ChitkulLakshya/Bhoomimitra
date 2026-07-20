import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyB4WQ7TLndp-3gUlHLb-7XvkcumKVDAYqA",
  authDomain: "bhoomimitra-4a101.firebaseapp.com",
  projectId: "bhoomimitra-4a101",
  storageBucket: "bhoomimitra-4a101.firebasestorage.app",
  messagingSenderId: "621264211938",
  appId: "1:621264211938:web:cef095ebbc340f72fff3bb",
  measurementId: "G-389JN5J2VE"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
