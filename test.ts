import { db } from './src/lib/firebase';
import { doc, getDoc } from 'firebase/firestore';
async function run() {
  const q = doc(db, 'articles', 'nonexistent');
  try {
    const res = await getDoc(q);
    console.log("Success:", res.exists());
  } catch (e) {
    console.error("Error:", e);
  }
}
run();
