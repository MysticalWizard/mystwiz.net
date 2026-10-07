// Departure board data: every source fetched in parallel with short timeouts and cached per
// source, always answering with the last good values and an updatedAt per source.
//
// Live data needs a server: add an Astro adapter for the host and set prerender to false.
// Until then this is prerendered at build time as a snapshot, and the board doesn't poll it.
import type { APIRoute } from 'astro';
import { getBoardSnapshot } from '../../lib/live';

export const prerender = true;

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
