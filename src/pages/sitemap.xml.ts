// Sitemap: every station on the line, at the same URL as its canonical link.
import type { APIRoute } from 'astro';
import { STATIONS } from '../data/stations';

export const prerender = true;

export const GET: APIRoute = ({ site }) => {
  const urls = STATIONS.map(
    (s) => `  <url><loc>${new URL(s.href, site)}</loc></url>`,
  );
  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...urls,
    '</urlset>',
    '',
  ].join('\n');
  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};
