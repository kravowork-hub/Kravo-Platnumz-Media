import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, limit, query } from "firebase/firestore";
const firebaseConfig = {
  apiKey: "AIzaSyCSWnRJ84srEDu9VuMh-qGOZnGiE6jRAaU",
  authDomain: "gen-lang-client-0328705124.firebaseapp.com",
  projectId: "gen-lang-client-0328705124",
};
const app = initializeApp(firebaseConfig);
const db = getFirestore(app, "ai-studio-6b064c02-fc9c-4f48-819d-8341cd76fcbc");

async function run() {
  const q = query(collection(db, "articles"), limit(1));
  const snap = await getDocs(q);
  if (!snap.empty) {
    const slug = snap.docs[0].data().slug;
    const fetch = (await import("node-fetch")).default;
    // test query param behavior
    const res = await fetch(`http://localhost:3000/article/${slug}?fbclid=123`);
    const text = await res.text();
    console.log("OUTPUT FOR FBCLID:");
    console.log(text.match(/<meta\s+property="og:image".*?>/i)?.[0]);
  }
  process.exit(0);
}
run();
