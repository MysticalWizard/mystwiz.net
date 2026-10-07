// Departure board data: every source fetched in parallel with short timeouts and cached per
// source, always answering with the last good values and an updatedAt per source.
// Runs on request on Cloudflare; the board polls it every minute.
import type { APIRoute } from 'astro';
import { getBoardSnapshot } from '../../lib/live';

export const prerender = false;

export const GET: APIRoute = async ({ isPrerendered }) => {
  const snapshot = await getBoardSnapshot(!isPrerendered);
  return Response.json(snapshot, {
    headers: {
      'Cache-Control': isPrerendered
        ? 'public, max-age=300'
        : 'public, max-age=30, s-maxage=30',
    },
  });
};
