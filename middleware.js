// middleware.js
import { rewrite } from '@vercel/functions';

const BOT_UA = /googlebot|bingbot|yandex|baiduspider|facebookexternalhit|whatsapp|twitterbot|linkedinbot|telegrambot|slackbot|discordbot|applebot|pinterest|ia_archiver|redditbot/i;

// path yang BUKAN storefront toko — jangan di-rewrite ke og.js
const RESERVED = new Set([
  'login', 'dashboard', 'admin', 'blog', 'guides', 'showcase',
  'syarat-layanan', 'kebijakan-privasi', 'r', 'invoice',
]);

export const config = {
  matcher: ['/((?!api/|assets/|.*\\..*).*)'],
};

export default function middleware(request) {
  const ua = request.headers.get('user-agent') || '';
  if (!BOT_UA.test(ua)) return;

  const url = new URL(request.url);
  const [firstSegment] = url.pathname.replace(/^\//, '').split('/');
  if (!firstSegment || RESERVED.has(firstSegment)) return; // biarin normal

  const target = new URL('/api/og', request.url);
  target.searchParams.set('slug', firstSegment);
  const produk = url.searchParams.get('produk');
  if (produk) target.searchParams.set('produk', produk);

  return rewrite(target);
}
