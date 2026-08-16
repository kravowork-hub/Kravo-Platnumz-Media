import type { VercelRequest, VercelResponse } from '@vercel/node';
import { initializeApp, getApps } from 'firebase/app';
import { initializeFirestore, collection, query, where, getDocs } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyCSWnRJ84srEDu9VuMh-qGOZnGiE6jRAaU",
  authDomain: "gen-lang-client-0328705124.firebaseapp.com",
  projectId: "gen-lang-client-0328705124",
  storageBucket: "gen-lang-client-0328705124.firebasestorage.app",
  messagingSenderId: "1090119514750",
  appId: "1:1090119514750:web:5c4df084357b429e9c362f",
};

let dbInstance: ReturnType<typeof initializeFirestore> | null = null;

function getDb() {
  if (dbInstance) return dbInstance;
  const app = getApps().length ? getApps()[0] : initializeApp(firebaseConfig);
  // Serverless functions (short-lived, no persistent connections) frequently
  // hang or silently fail on Firestore's default gRPC transport. Forcing
  // long-polling makes it use plain HTTP requests instead, which is reliable
  // in this environment.
  dbInstance = initializeFirestore(app, { experimentalForceLongPolling: true }, "ai-studio-6b064c02-fc9c-4f48-819d-8341cd76fcbc");
  return dbInstance;
}

const DEFAULT_TITLE = "Platnumz Cuesport Official Website";
const DEFAULT_DESC = "Breaking news, live results, and rankings from the world of pool, snooker, and billiards - plus exclusive photography and videography from Kravo Platnumz Media.";
const DEFAULT_IMAGE = "https://i.imgur.com/2QVQb4w.png";

function escapeHtml(str: string) {
  return str
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const path = typeof req.query.path === 'string' ? req.query.path : '/';

  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;
  let type = 'website';

  try {
    if (path.startsWith('/article/')) {
      const slug = path.split('/')[2];
      if (slug) {
        const db = getDb();
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          title = data.title ? `${data.title} - ${DEFAULT_TITLE}` : title;
          description = data.excerpt || (data.content || '').replace(/<[^>]+>/g, '').substring(0, 150) + '...';
          image = data.coverImage || image;
          type = 'article';
        }
      }
    }
  } catch (e) {
    console.error('OG metadata fetch failed:', e);
  }

  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const pageUrl = `${proto}://${host}${path}`;

  const safeTitle = escapeHtml(title);
  const safeDesc = escapeHtml(description);
  const safeImage = escapeHtml(image);
  const safeUrl = escapeHtml(pageUrl);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<title>${safeTitle}</title>
<meta property="og:title" content="${safeTitle}" />
<meta property="og:description" content="${safeDesc}" />
<meta property="og:type" content="${type}" />
<meta property="og:image" content="${safeImage}" />
<meta property="og:url" content="${safeUrl}" />
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${safeTitle}" />
<meta name="twitter:description" content="${safeDesc}" />
<meta name="twitter:image" content="${safeImage}" />
<meta http-equiv="refresh" content="0; url=${safeUrl}" />
</head>
<body>
<p><a href="${safeUrl}">${safeTitle}</a></p>
</body>
</html>`;

  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('Cache-Control', 's-maxage=600, stale-while-revalidate');
  res.status(200).send(html);
}
