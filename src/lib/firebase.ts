import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore';
import { getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged } from 'firebase/auth';

const firebaseConfig = {
  apiKey: "AIzaSyCSWnRJ84srEDu9VuMh-qGOZnGiE6jRAaU",
  authDomain: "gen-lang-client-0328705124.firebaseapp.com",
  projectId: "gen-lang-client-0328705124",
  storageBucket: "gen-lang-client-0328705124.firebasestorage.app",
  messagingSenderId: "1090119514750",
  appId: "1:1090119514750:web:5c4df084357b429e9c362f",
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-6b064c02-fc9c-4f48-819d-8341cd76fcbc");
const auth = getAuth(app);

export { app, db, auth, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, query, where, orderBy, serverTimestamp };
