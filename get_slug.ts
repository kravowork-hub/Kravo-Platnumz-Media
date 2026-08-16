import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";

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

async function run() {
  const q = query(collection(db, "articles"), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    console.log(snap.docs[0].data().slug);
  } else {
    console.log("no-articles");
  }
}
run();
