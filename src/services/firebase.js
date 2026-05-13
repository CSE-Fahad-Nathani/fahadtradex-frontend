import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyAc57H68ZCA4PS6XZ-2tfM1B_9pOR10h5U",
  authDomain: "fahadtradex.firebaseapp.com",
  projectId: "fahadtradex",
  storageBucket: "fahadtradex.firebasestorage.app",
  messagingSenderId: "715754798387",
  appId: "1:715754798387:web:3def604c3a72e22005d246"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Services
export const auth = getAuth(app);
export const db = getFirestore(app);