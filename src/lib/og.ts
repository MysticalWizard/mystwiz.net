// Open Graph images: each page's station board as a 1200 × 630 PNG, rendered at build time.
// Satori lays the board out and turns its text into SVG paths; sharp rasterizes the SVG.
// Satori needs static TTF fonts, so the needed Archivo widths and JetBrains Mono weights are
// fetched once from Google Fonts and cached in node_modules/.cache.
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import satori from 'satori';
import sharp from 'sharp';

export const OG_WIDTH = 1200;
export const OG_HEIGHT = 630;

const CACHE_DIR = join(process.cwd(), 'node_modules/.cache/mystwiz-og');
/** An old Safari user agent makes Google Fonts answer with TTF files. */
const TTF_AGENT =
  'Mozilla/5.0 (Macintosh; U; Intel Mac OS X 10_6_8; de-at) AppleWebKit/533.21.1 (KHTML, like Gecko) Version/5.0.5 Safari/533.21.1';

/** A static instance of a Google font, e.g. ("Archivo", "wdth,wght@125,800"). */
async function googleTtf(family: string, axes: string): Promise<Buffer> {
  const file = join(
    CACHE_DIR,
    `${family}-${axes}.ttf`.replace(/[^\w.-]+/g, '-'),
  );
  try {
    return await readFile(file);
  } catch {
    // Not cached yet.
  }
  const query = `${family.replace(/ /g, '+')}:${axes}`;
  const css = await fetch(`https://fonts.googleapis.com/css2?family=${query}`, {
    headers: { 'User-Agent': TTF_AGENT },
  }).then((res) => res.text());
  const url = css.match(/url\((https:[^)]+\.ttf)\)/)?.[1];
  if (!url) throw new Error(`Google Fonts has no TTF for ${family} ${axes}`);
  const font = await fetch(url);
  const data = Buffer.from(await font.arrayBuffer());
  await mkdir(CACHE_DIR, { recursive: true });
  await writeFile(file, data);
  return data;
}

let fonts: Promise<Parameters<typeof satori>[1]['fonts']> | undefined;

function loadFonts() {
  fonts ??= Promise.all([
    googleTtf('Archivo', 'wdth,wght@125,800'),
    googleTtf('Archivo', 'wdth,wght@100,700'),
    googleTtf('Archivo', 'wdth,wght@75,800'),
    googleTtf('JetBrains Mono', 'wght@500'),
    googleTtf('JetBrains Mono', 'wght@700'),
  ]).then(([expanded, sign, condensed, mono, monoBold]) => [
    { name: 'Archivo Expanded', data: expanded, weight: 800, style: 'normal' },
    { name: 'Archivo', data: sign, weight: 700, style: 'normal' },
    {
      name: 'Archivo Condensed',
      data: condensed,
      weight: 800,
      style: 'normal',
    },
    { name: 'JetBrains Mono', data: mono, weight: 500, style: 'normal' },
    { name: 'JetBrains Mono', data: monoBold, weight: 700, style: 'normal' },
  ]);
  return fonts;
}

/** Night service colors (DESIGN.md section 3.1). */
const C = {
  bg: '#0b0b0a',
  panel: '#151514',
  rule: '#2b2b28',
  fg: '#ecebe4',
  muted: '#9d9c92',
  line: '#d8c46c',
  onLine: '#0b0b0a',
  grid: 'rgba(236, 235, 228, 0.06)',
};

type Node = { type: string; props: Record<string, unknown> };

/** Satori element; anything with more than one child is a flex box unless styled otherwise. */
function h(
  type: string,
  style: Record<string, unknown>,
  ...children: (Node | string)[]
): Node {
  const layout = children.length > 1 ? { display: 'flex', ...style } : style;
  // Satori rejects an empty children array, so leave the prop out for empty boxes.
  const content =
    children.length === 0
      ? {}
      : { children: children.length === 1 ? children[0] : children };
  return { type, props: { style: layout, ...content } };
}

/** A small sign triangle pointing left or right. */
const tri = (left: boolean): Node => ({
  type: 'svg',
  props: {
    width: 15,
    height: 20,
    viewBox: '0 0 3 4',
    children: {
      type: 'path',
      props: { d: left ? 'M3 0L0 2L3 4Z' : 'M0 0L3 2L0 4Z', fill: C.onLine },
    },
  },
});

/** Separator dot between sub line items. */
const dot = () =>
  h('div', { width: 6, height: 6, borderRadius: 3, background: '#5f5e58' });

export interface Card {
  no: string;
  name: string;
  sub: string[];
  prev: { no: string; name: string };
  next: { no: string; name: string };
  band: string;
  site: string;
}

/** Font size that fits the name on the board (expanded type is about 0.8em per letter). */
const nameSize = (name: string) =>
  Math.round(Math.max(72, Math.min(168, 780 / (0.8 * name.length))));

export async function renderCard(card: Card): Promise<Buffer> {
  const mono = (size: number, color: string, weight = 500) => ({
    fontFamily: 'JetBrains Mono',
    fontSize: size,
    fontWeight: weight,
    letterSpacing: '0.12em',
    textTransform: 'uppercase',
    color,
  });

  const board = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      border: `2px solid ${C.rule}`,
      borderRadius: 16,
      background: C.panel,
      overflow: 'hidden',
    },
    h(
      'div',
      { display: 'flex', alignItems: 'center', padding: '44px 48px', gap: 40 },
      h(
        'div',
        {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          width: 150,
          height: 150,
          flexShrink: 0,
          border: `17px solid ${C.line}`,
          borderRadius: 33,
          color: C.fg,
          lineHeight: 0.95,
        },
        h(
          'div',
          { fontFamily: 'Archivo', fontSize: 30, fontWeight: 700 },
          'MZ',
        ),
        h(
          'div',
          { fontFamily: 'Archivo Condensed', fontSize: 62, fontWeight: 800 },
          card.no,
        ),
      ),
      h(
        'div',
        { display: 'flex', flexDirection: 'column', gap: 22, minWidth: 0 },
        h(
          'div',
          {
            fontFamily: 'Archivo Expanded',
            fontSize: nameSize(card.name),
            fontWeight: 800,
            lineHeight: 0.9,
            letterSpacing: '-0.015em',
            color: C.fg,
          },
          card.name,
        ),
        h(
          'div',
          {
            display: 'flex',
            flexWrap: 'wrap',
            alignItems: 'center',
            columnGap: 18,
            rowGap: 8,
            ...mono(20, C.muted),
          },
          ...card.sub.flatMap((item, i) =>
            i ? [dot(), h('div', {}, item)] : [h('div', {}, item)],
          ),
        ),
      ),
    ),
    h(
      'div',
      {
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '22px 48px',
        background: C.line,
        color: C.onLine,
        fontFamily: 'Archivo',
        fontSize: 30,
        fontWeight: 700,
      },
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 14 },
        tri(true),
        card.prev.name,
        h(
          'div',
          { ...mono(18, C.onLine, 700), opacity: 0.7 },
          `MZ${card.prev.no}`,
        ),
      ),
      h('div', mono(18, C.onLine, 700), card.band),
      h(
        'div',
        { display: 'flex', alignItems: 'center', gap: 14 },
        h(
          'div',
          { ...mono(18, C.onLine, 700), opacity: 0.7 },
          `MZ${card.next.no}`,
        ),
        card.next.name,
        tri(false),
      ),
    ),
  );

  const tree = h(
    'div',
    {
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'space-between',
      width: OG_WIDTH,
      height: OG_HEIGHT,
      padding: 56,
      background: C.bg,
      backgroundImage: `linear-gradient(${C.grid} 1px, transparent 1px), linear-gradient(90deg, ${C.grid} 1px, transparent 1px)`,
      backgroundSize: '32px 32px',
    },
    h('div', mono(18, C.muted), card.band),
    board,
    h(
      'div',
      { display: 'flex', justifyContent: 'flex-end', ...mono(20, C.fg, 700) },
      card.site,
    ),
  );
  const svg = await satori(tree as Parameters<typeof satori>[0], {
    width: OG_WIDTH,
    height: OG_HEIGHT,
    fonts: await loadFonts(),
  });
  return sharp(Buffer.from(svg)).png().toBuffer();
}
