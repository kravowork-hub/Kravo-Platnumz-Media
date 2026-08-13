import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import apiApp from "./api/index.js";
import dotenv from "dotenv";
import fs from "fs";
import { initializeApp } from "firebase/app";
import { getFirestore, doc, getDoc } from "firebase/firestore";

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

const DEFAULT_TITLE = "PLATNUMZ CUESPORT by Kravo";
const DEFAULT_DESC = "Your premier source for global cue sports news, tournament coverage, and player insights.";
const DEFAULT_IMAGE = "https://i.imgur.com/slFYB1w.png";

async function getPageMetadata(urlPath: string) {
  let title = DEFAULT_TITLE;
  let description = DEFAULT_DESC;
  let image = DEFAULT_IMAGE;

  try {
    if (urlPath.startsWith('/articles/')) {
      const articleId = urlPath.split('/')[2];
      if (articleId) {
        const articleRef = doc(db, "articles", articleId);
        const articleSnap = await getDoc(articleRef);
        if (articleSnap.exists()) {
          const data = articleSnap.data();
          title = data.title || title;
          description = (data.content || "").substring(0, 150).replace(/<[^>]+>/g, '') + "...";
          image = data.imageUrl || image;
        }
      }
    } else if (urlPath.startsWith('/scores')) {
      title = "Live Scores - PLATNUMZ CUESPORT";
      description = "Follow live scores and tournament updates.";
    } else if (urlPath.startsWith('/videos')) {
      title = "Live Videos - PLATNUMZ CUESPORT";
      description = "Watch live streams and featured cue sport videos.";
    } else if (urlPath.startsWith('/search')) {
      title = "Search - PLATNUMZ CUESPORT";
    }
  } catch (e) {
    console.error("Error fetching metadata:", e);
  }

  return { title, description, image };
}

function replaceMetaTags(html: string, meta: { title: string, description: string, image: string }) {
  html = html.replace(/<title>.*?<\/title>/i, `<title>${meta.title}</title>`);
  
  if (html.includes('property="og:title"')) {
    html = html.replace(/<meta property="og:title" content="[^"]*" \/>/i, `<meta property="og:title" content="${meta.title}" />`);
  }
  if (html.includes('property="og:description"')) {
    html = html.replace(/<meta property="og:description" content="[^"]*" \/>/i, `<meta property="og:description" content="${meta.description}" />`);
  }
  
  if (html.includes('property="og:image"')) {
    html = html.replace(/<meta property="og:image" content="[^"]*" \/>/i, `<meta property="og:image" content="${meta.image}" />`);
  } else {
    html = html.replace('</head>', `  <meta property="og:image" content="${meta.image}" />\n  </head>`);
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
