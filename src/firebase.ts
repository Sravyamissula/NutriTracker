// firebase.ts or firebaseConfig.ts
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyBGzzlOl9b2uQ-LWru1tkV27JUP0XApfAw",
  authDomain: "nutritrack-7136b.firebaseapp.com",
  projectId: "nutritrack-7136b",
  storageBucket: "nutritrack-7136b.firebasestorage.app",
  messagingSenderId: "789738543065",
  appId: "1:789738543065:web:d1b97da3b4bf28a1bbabc8",
  measurementId: "G-TBFMBVBGX9",
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
