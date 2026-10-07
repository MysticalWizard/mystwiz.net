// @ts-check
import { defineConfig, envField, fontProviders } from 'astro/config';

import tailwindcss from '@tailwindcss/vite';
import { ARRIVALS } from './src/data/lines.ts';

const secret = () =>
  envField.string({ context: 'server', access: 'secret', optional: true });

// https://astro.build/config
export default defineConfig({
  site: 'https://mystwiz.net',
  // Bio links: each platform's bio points at its own short path, e.g. /yt -> /?via=youtube.
  redirects: Object.fromEntries(
    Object.entries(ARRIVALS).map(([via, { path }]) => [path, `/?via=${via}`]),
  ),
  // API keys for the live departure board (see .env.example). All optional: rows without a
  // key stay empty, and with no keys at all the board shows sample data.
  env: {
    schema: {
      TWITCH_CLIENT_ID: secret(),
      TWITCH_CLIENT_SECRET: secret(),
      YOUTUBE_API_KEY: secret(),
      OSU_CLIENT_ID: secret(),
      OSU_CLIENT_SECRET: secret(),
      GITHUB_TOKEN: secret(),
      STEAM_API_KEY: secret(),
    },
  },
  fonts: [
    {
      provider: fontProviders.google(),
      name: 'Archivo',
      cssVariable: '--font-archivo',
      weights: ['100 900'],
      styles: ['normal'],
      // Width is part of the design (expanded names, condensed numerals), so keep the whole axis.
      options: { experimental: { variableAxis: { wdth: [['62', '125']] } } },
    },
    {
      provider: fontProviders.google(),
      name: 'Doto',
      cssVariable: '--font-doto',
      // LED type only uses round dots at 800, so both axes are pinned.
      weights: [800],
      styles: ['normal'],
      fallbacks: ['monospace'],
      options: { experimental: { variableAxis: { ROND: ['100'] } } },
    },
    {
      provider: fontProviders.google(),
      name: 'JetBrains Mono',
      cssVariable: '--font-jetbrains-mono',
      weights: [400, 500, 700],
      styles: ['normal'],
      fallbacks: ['monospace'],
    },
    {
      provider: fontProviders.google(),
      name: 'Zen Kaku Gothic New',
      cssVariable: '--font-zen-kaku-gothic-new',
      weights: [700],
      styles: ['normal'],
      fallbacks: ['Hiragino Sans', 'Yu Gothic', 'Noto Sans JP', 'sans-serif'],
      optimizedFallbacks: false,
      // Only Yorimichi's name is set in Japanese for now.
      options: { experimental: { glyphs: ['寄り道'] } },
    },
  ],
  vite: {
    plugins: [tailwindcss()],
  },
});
