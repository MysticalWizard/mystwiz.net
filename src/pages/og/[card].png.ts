// Open Graph image per page: its station board (src/lib/og.ts).
import type { APIRoute, GetStaticPaths } from 'astro';
import {
  nextStation,
  prevStation,
  station,
  STATIONS,
  type StationId,
} from '../../data/stations';
import { getStrings } from '../../i18n';
import { boardSub } from '../../lib/boards';
import { renderCard, type Card } from '../../lib/og';

export const prerender = true;

const t = getStrings();
const home = station('home');
const short = (id: StationId) => ({
  no: station(id).no,
  name: t.stations[id].short,
});

const cards: Record<string, Card> = {
  ...Object.fromEntries(
    STATIONS.map((s) => [
      s.id,
      {
        no: s.no,
        name: t.stations[s.id].name,
        sub: boardSub(s.id, t),
        prev: short(prevStation(s.id).id),
        next: short(nextStation(s.id).id),
        band: t.line.loop,
        site: 'mystwiz.net',
      },
    ]),
  ),
  'not-in-service': {
    no: '??',
    name: t.notFound.title,
    sub: t.notFound.sub,
    prev: short(home.id),
    next: short(home.id),
    band: t.line.outOfService,
    site: 'mystwiz.net',
  },
};

export const getStaticPaths = (() =>
  Object.keys(cards).map((card) => ({
    params: { card },
  }))) satisfies GetStaticPaths;

export const GET: APIRoute = async ({ params }) => {
  const card = cards[params.card ?? ''];
  if (!card) return new Response(null, { status: 404 });
  const png = await renderCard(card);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png' },
  });
};
