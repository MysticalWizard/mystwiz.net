// Home screen icon for iOS: the MZ badge from the favicon, as a PNG on the page ground.
import type { APIRoute } from 'astro';
import sharp from 'sharp';
import badge from '../../public/favicon.svg?raw';

export const prerender = true;

export const GET: APIRoute = async () => {
  const png = await sharp(Buffer.from(badge), { density: 1200 })
    .resize(140, 140)
    .extend({ top: 20, bottom: 20, left: 20, right: 20, background: '#0b0b0a' })
    .flatten({ background: '#0b0b0a' })
    .png()
    .toBuffer();
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
