import { initializeApp } from "https://www.gstatic.com/firebasejs/13.2.0/firebase-app.js";

import {
  getAuth,
  GoogleAuthProvider
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-auth.js";

import {
  getFirestore
} from "https://www.gstatic.com/firebasejs/13.2.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyA05sZWM33OudGrKyXn2mgPv7X8yOXWZ8g",
  authDomain: "quick-service-e6e54.firebaseapp.com",
  projectId: "quick-service-e6e54",
  storageBucket: "quick-service-e6e54.firebasestorage.app",
  messagingSenderId: "426576333634",
  appId: "1:426576333634:web:a955357a140715291556db",
  measurementId: "G-V4C1XFYVPD"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);

export const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({
  prompt: "select_account"
});
