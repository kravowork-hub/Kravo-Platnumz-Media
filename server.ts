import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index.js";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc, collection, query, where, getDocs } from "firebase/firestore";

dotenv.config();

const firebaseConfig = {
  apiKey: "AIzaSyCSWnRJ84srEDu9VuMh-qGOZnGiE6jRAaU",
  authDomain: "gen-lang-client-0328705124.firebaseapp.com",
  projectId: "gen-lang-client-0328705124",
  storageBucket: "gen-lang-client-0328705124.firebasestorage.app",
  messagingSenderId: "1090119514750",
  appId: "1:1090119514750:web:5c4df084357b429e9c362f",
};
const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, "ai-studio-6b064c02-fc9c-4f48-819d-8341cd76fcbc");

const app = express();
const PORT = 3000;

// Mount API routes
app.use(apiApp);

const DEFAULT_TITLE = "Platnumz Cuesport Official Website";
const DEFAULT_DESC = "Breaking news, live results, and rankings from the world of pool, snooker, and billiards - plus exclusive photography and videography from Kravo Platnumz Media.";
const DEFAULT_IMAGE = "https://i.imgur.com/2QVQb4w.png";

async function getPageMetadata(urlPath: string) {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;

  try {
    const pathOnly = urlPath.split('?')[0];
    if (pathOnly.startsWith('/article/')) {
      const slug = pathOnly.split('/')[2];
      if (slug) {
        const q = query(collection(db, 'articles'), where('slug', '==', slug));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const data = snapshot.docs[0].data();
          title = data.title ? `${data.title} - Platnumz Cuesport Official Website` : title;
          description = data.excerpt || (data.content || "").substring(0, 150).replace(/<[^>]+>/g, '') + "...";
          image = data.coverImage || image;
        }
      }
    } else if (pathOnly.startsWith('/scores')) {
      title = "Live Scores - Platnumz Cuesport Official Website";
      description = "Follow live scores and tournament updates.";
    } else if (pathOnly.startsWith('/videos')) {
      title = "Live Videos - Platnumz Cuesport Official Website";
      description = "Watch live streams and featured cue sport videos.";
    } else if (pathOnly.startsWith('/search')) {
      title = "Search - Platnumz Cuesport Official Website";
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  return { title, description, image };
}

function replaceMetaTags(html: string, meta: { title: string, description: string, image: string }) {
  const safeTitle = meta.title.replace(/"/g, '&quot;');
  const safeDesc = meta.description.replace(/"/g, '&quot;');
  
  html = html.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);
  
  // Replace Open Graph tags
  html = html.replace(/<meta\s+property="og:title"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:title" content="${safeTitle}" />`);
  html = html.replace(/<meta\s+property="og:description"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:description" content="${safeDesc}" />`);
  
  if (html.match(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i)) {
    html = html.replace(/<meta\s+property="og:image"\s+content="[^"]*"\s*\/?>/i, `<meta property="og:image" content="${meta.image}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:image" content="${meta.image}" />\n  </head>`);
  }

  // Replace Twitter tags
  if (html.match(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i)) {
    html = html.replace(/<meta\s+name="twitter:title"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:title" content="${safeTitle}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:title" content="${safeTitle}" />\n  </head>`);
  }

  if (html.match(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i)) {
    html = html.replace(/<meta\s+name="twitter:description"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:description" content="${safeDesc}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:description" content="${safeDesc}" />\n  </head>`);
  }
  
  if (html.match(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i)) {
    html = html.replace(/<meta\s+name="twitter:image"\s+content="[^"]*"\s*\/?>/i, `<meta name="twitter:image" content="${meta.image}" />`);
  } else {
    html = html.replace('</head>', `  <meta name="twitter:image" content="${meta.image}" />\n  </head>`);
  }

  return html;
}

async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "custom",
    });
    app.use(vite.middlewares);

    app.use('*', async (req, res, next) => {
      const url = req.originalUrl;
      try {
        let template = await fs.promises.readFile(path.resolve('index.html'), 'utf-8');
        template = await vite.transformIndexHtml(url, template);
        const meta = await getPageMetadata(url);
        const html = replaceMetaTags(template, meta);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        vite.ssrFixStacktrace(e as Error);
        next(e);
      }
    });

  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath, { index: false }));
    app.get('*', async (req, res) => {
      try {
        let template = await fs.promises.readFile(path.join(distPath, 'index.html'), 'utf-8');
        const url = req.originalUrl;
        const meta = await getPageMetadata(url);
        const html = replaceMetaTags(template, meta);
        res.status(200).set({ 'Content-Type': 'text/html' }).end(html);
      } catch (e) {
        res.status(500).end(e.toString());
      }
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
