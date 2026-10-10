// robots.txt: crawl every page but not the live board's data, and find the pages in the sitemap.
import type { APIRoute } from 'astro';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const txt = [
    'User-agent: *',
    'Disallow: /api/',
    '',
    `Sitemap: ${new URL('/sitemap.xml', site)}`,
    '',
  ].join('\n');
  return new Response(txt, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  });
};
