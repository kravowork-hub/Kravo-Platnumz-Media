import fetch from "node-fetch";
const html = await fetch("http://localhost:3000/").then(r => r.text());
console.log(html.includes("twitter:image"));
