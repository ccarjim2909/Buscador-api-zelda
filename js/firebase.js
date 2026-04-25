import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyD2ZRbssNy7KLWaysim9QcvwDvtILXWai0",
  authDomain: "api-zelda.firebaseapp.com",
  projectId: "api-zelda",
  storageBucket: "api-zelda.firebasestorage.app",
  messagingSenderId: "370884586128",
  appId: "1:370884586128:web:92f331118fa2f1cca44615"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { addDoc, collection, db, deleteDoc, doc, getDocs };
