# mystwiz.net

Wonsik Shin's site, built as the **MZ Line**: a loop line styled after Tokyo station wayfinding.
Every page is a station with a station name board, moving between pages is a ride (doors close,
tunnel lights rush past, doors open), anything live sits on an LED departure board, and the site
is a toy: hold to depart, click to the beat, print a ticket, stretch the name.

Built with Astro 7 and Tailwind 4, hosted on Cloudflare Workers. Pages are prerendered; the live
board endpoint runs on request.

## Commands

| Command        | What it does                                                    |
| -------------- | --------------------------------------------------------------- |
| `pnpm dev`     | Dev server at `localhost:4321` (runs in Cloudflare's `workerd`) |
| `pnpm build`   | Build to `dist/` (`dist/client` assets, `dist/server` Worker)   |
| `pnpm preview` | Run the built Worker locally                                    |
| `pnpm check`   | Type-check `.astro` and `.ts` files                             |
| `pnpm test`    | Unit tests (Vitest)                                             |
| `pnpm lint`    | ESLint                                                          |
| `pnpm format`  | Prettier                                                        |

## Where things live

- **Copy:** every visible string is in `src/i18n/en.ts`. Korean or Japanese can be added as new
  files next to it once Astro i18n routing is set up.
- **Stations:** `src/data/stations.ts` (order, numbers, paths, departure melodies, fares).
- **Lines and transfers:** `src/data/lines.ts` (accounts, transfer links, departure board rows,
  platforms, bio-link arrivals).
- **Projects and the network map:** `src/data/projects.ts`. Adding a project is a data change: add
  it to `PROJECTS`, give it a line and stations in `NETWORK`, and add its description to
  `projects.lines` in `src/i18n/en.ts`. A test checks the map matches each project's stops.
- **PC specs:** `src/data/specs.ts` (the 8 cars and the cab equipment).
- **Pictograms:** `src/assets/pictos/*.svg`, 16 × 16 pixel art, one path each.
- **Design tokens:** `src/styles/global.css` (colors for night and day service, fonts, motion).
  Components keep their own styles in their `<style>` blocks.

Layouts: `src/layouts/Base.astro` is the document shell (route bar, doors, footer, effects);
`src/layouts/Station.astro` adds a station's board and its "Next train" block.

Interactive parts are custom elements or small modules in `src/scripts/`, written for Astro's
client router: rides (`ride.ts`), hold to depart (`hold.ts`), effects (`fx.ts`, `parallax.ts`),
sound (`sound.ts`), the ticket machine (`tickets.ts`) and live data (`live.ts`).

## Bio links

Each platform's bio links to its own short path, so visitors get a welcome and their platform first:
`/gh`, `/yt`, `/tw` and `/osu` redirect to `/?via=github` (and so on). To add one (X, Instagram,
TikTok, Discord...), add an entry to `ARRIVALS` in `src/data/lines.ts` and its welcome message to
`arrivals.messages` in `src/i18n/en.ts`.

## Live departure board

`/api/board.json` fetches Twitch, YouTube, osu!, GitHub and Steam in parallel, caches each source
separately, and rides out a failing source on its last good values. The board polls it every
minute. It never makes values up: a row without a key reads "Not connected", and a source that
hasn't answered, or whose last answer is five times its cache time old, reads "No data". Both
are dimmed. Each failure is logged, so a wrong key shows up in the Worker's logs.

Keys are listed in `.env.example`. All are optional; GitHub works without one.

- **Local:** copy `.env.example` to `.env` and fill in what you have.
- **Production:** add each key as a Worker secret, for example
  `pnpm wrangler secret put TWITCH_CLIENT_ID`, or in the Cloudflare dashboard under the Worker's
  Settings > Variables and Secrets.
- **Build:** Home is prerendered with the board's values at build time, so also set the keys as
  build variables (Workers Builds: Settings > Build > Variables and secrets). Otherwise those
  rows read "Not connected" until the first poll.

## Deploying

The Cloudflare adapter generates the Worker config at build time, so there is no `wrangler.jsonc`
to keep in sync. The Worker is named after `package.json` (`mystwiz-net`); to deploy over an
existing Worker with another name, add a `wrangler.jsonc` containing just `{ "name": "..." }`.

```sh
pnpm build
pnpm wrangler deploy
```

With Workers Builds (Git integration), use `pnpm build` as the build command and
`npx wrangler deploy` as the deploy command. Open Graph images are rendered during the build with
fonts fetched from Google Fonts (cached in `node_modules/.cache`), so the build needs network access.
