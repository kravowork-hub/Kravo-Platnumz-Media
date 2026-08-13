const html = `<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>PLATNUMZ CUESPORT by Kravo</title>
    <meta property="og:title" content="PLATNUMZ CUESPORT by Kravo" />
    <meta property="og:description" content="Your premier source." />
    <meta property="og:type" content="website" />
    <meta name="twitter:card" content="summary_large_image" />
  </head>
  <body>
  </body>
</html>`;

function replaceMetaTags(html, meta) {
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

console.log(replaceMetaTags(html, { title: "New Title", description: "New Desc", image: "https://example.com/img.png" }));
