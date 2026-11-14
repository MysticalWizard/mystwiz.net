// Server side of the live departure board: the configured sources and one shared cache.
// Imported only from server code (the board endpoint and the board's server render).
import {
  GITHUB_TOKEN,
  OSU_CLIENT_ID,
  OSU_CLIENT_SECRET,
  STATUS_OVERRIDE,
  STEAM_API_KEY,
  TWITCH_CLIENT_ID,
  TWITCH_CLIENT_SECRET,
  YOUTUBE_API_KEY,
} from 'astro:env/server';
import { ACCOUNTS } from '../../data/lines';
import { PROJECTS } from '../../data/projects';
import { parseOverrides, type LineServices } from '../services';
import { createCache } from './cache';
import {
  boardSnapshot,
  type BoardSnapshot,
  type BoardSources,
} from './snapshot';
import { github, osu, statusPage, steam, twitch, youtube } from './sources';

export type { BoardMode, BoardSnapshot } from './snapshot';

/** Short timeouts: a slow source must not hold up the board. */
const TIMEOUT_MS = 4000;

let sources: BoardSources | undefined;

// Secrets are read on first use: on Cloudflare they are bound to each request, so they are
// not there yet when this module is first imported.
function configuredSources(): BoardSources {
  sources ??= {
    twitch:
      TWITCH_CLIENT_ID && TWITCH_CLIENT_SECRET
        ? twitch(
            { clientId: TWITCH_CLIENT_ID, clientSecret: TWITCH_CLIENT_SECRET },
            ACCOUNTS.twitch,
          )
        : undefined,
    youtube: YOUTUBE_API_KEY
      ? youtube(YOUTUBE_API_KEY, ACCOUNTS.youtube)
      : undefined,
    osu:
      OSU_CLIENT_ID && OSU_CLIENT_SECRET
        ? osu(
            { clientId: OSU_CLIENT_ID, clientSecret: OSU_CLIENT_SECRET },
            ACCOUNTS.osu,
          )
        : undefined,
    github: github(ACCOUNTS.github, GITHUB_TOKEN),
    steam: STEAM_API_KEY ? steam(STEAM_API_KEY, ACCOUNTS.steam) : undefined,
    services: statusPage(),
  };
  return sources;
}

let overrides: { raw: string | undefined; lines: LineServices } | undefined;

// The manual override is parsed once per value (changing the variable deploys a new version),
// and a value it can't fully use is logged once, not on every request.
function lineOverrides(): LineServices {
  if (!overrides || overrides.raw !== STATUS_OVERRIDE) {
    overrides = {
      raw: STATUS_OVERRIDE,
      lines: parseOverrides(
        STATUS_OVERRIDE,
        PROJECTS.map((p) => p.id),
        (problem) => console.error(problem),
      ),
    };
  }
  return overrides.lines;
}

// A failing source answers with its last good value for a while (see cache.ts), so log each
// failure: otherwise a wrong key or a long outage goes unnoticed.
const cache = createCache(Date.now, (source, error) =>
  console.error(`Live board: ${source} failed.`, error),
);

/** `live` when answering a request; false while prerendering at build time. */
export function getBoardSnapshot(live: boolean): Promise<BoardSnapshot> {
  return boardSnapshot({
    sources: configuredSources(),
    cache,
    live,
    overrides: live ? lineOverrides() : undefined,
    ctx: {
      fetch: (input, init) => fetch(input, init),
      now: () => new Date(),
      timeoutMs: TIMEOUT_MS,
    },
  });
}
