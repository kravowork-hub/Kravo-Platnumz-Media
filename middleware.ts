import { rewrite } from '@vercel/edge';

const BOT_UA_REGEX = /facebookexternalhit|Facebot|Twitterbot|Slackbot|WhatsApp|TelegramBot|LinkedInBot|Discordbot|Pinterest|redditbot|SkypeUriPreview|vkShare|W3C_Validator|Applebot|Googlebot|bingbot/i;

export default function middleware(request: Request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA_REGEX.test(ua)) {
    return; // Real visitors pass through untouched to the normal SPA
  }

  const url = new URL(request.url);
  const isHome = url.pathname === '/';
  const isArticle = url.pathname.startsWith('/article/');
  if (!isHome && !isArticle) {
    return;
  }

  const ogUrl = new URL('/api/og', url.origin);
  ogUrl.searchParams.set('path', url.pathname);
  return rewrite(ogUrl);
}

export const config = {
  matcher: ['/', '/article/:path*'],
};
