import { mkdtemp, readdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { googleTtf } from './og';

// What Google Fonts answers for a static instance: a stylesheet pointing at a TTF file.
const STYLESHEET = `@font-face {
  font-family: 'Archivo';
  font-style: normal;
  font-weight: 800;
  font-stretch: 125%;
  src: url(https://fonts.gstatic.com/s/archivo/v25/archivo-125-800.ttf) format('truetype');
}
`;
/** The start of a TrueType file. */
const FONT = new Uint8Array([0x00, 0x01, 0x00, 0x00, 0x00, 0x10]);

/** Google Fonts, with the font file itself answering `status`. */
function googleFonts(status: number) {
  return vi.fn(async (url: string) => {
    if (url.startsWith('https://fonts.googleapis.com/css2')) {
      return new Response(STYLESHEET, {
        headers: { 'Content-Type': 'text/css' },
      });
    }
    return status === 200
      ? new Response(FONT, { headers: { 'Content-Type': 'font/ttf' } })
      : new Response('<!DOCTYPE html><title>Error</title>', {
          status,
          headers: { 'Content-Type': 'text/html' },
        });
  });
}

describe('googleTtf', () => {
  let cache: string;

  beforeEach(async () => {
    cache = await mkdtemp(join(tmpdir(), 'mystwiz-og-'));
  });

  afterEach(async () => {
    vi.unstubAllGlobals();
    await rm(cache, { recursive: true, force: true });
  });

  it('keeps nothing from a failed download, so the next build downloads the font again', async () => {
    vi.stubGlobal('fetch', googleFonts(503));
    await expect(
      googleTtf('Archivo', 'wdth,wght@125,800', cache),
    ).rejects.toThrow('503');
    expect(await readdir(cache)).toEqual([]);

    vi.stubGlobal('fetch', googleFonts(200));
    const font = await googleTtf('Archivo', 'wdth,wght@125,800', cache);
    expect(new Uint8Array(font)).toEqual(FONT);
  });

  it('downloads a font once, then reads it from the cache', async () => {
    const fetch = googleFonts(200);
    vi.stubGlobal('fetch', fetch);
    await googleTtf('Archivo', 'wdth,wght@125,800', cache);
    const again = await googleTtf('Archivo', 'wdth,wght@125,800', cache);
    expect(new Uint8Array(again)).toEqual(FONT);
    // The stylesheet and the font, the first time only.
    expect(fetch).toHaveBeenCalledTimes(2);
  });
});
