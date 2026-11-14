// What the departure board shows right now, assembled from every source in parallel.
//
// mode "live":     served on request by the board endpoint; the browser keeps polling it.
// mode "snapshot": taken at build time (no server). A stream that was on air during the build
//                  may be over by the time the page is read, so that row has no data.
//
// Nothing is made up: a source without an API key is left out of the data, and the board
// says so instead of showing values.
import type {
  BoardData,
  GitHubData,
  OsuData,
  SteamData,
  TwitchData,
  YouTubeData,
} from '../board';
import type { LineServices, ServicesData } from '../services';
import type { SourceCache } from './cache';
import type { Source, SourceContext } from './sources';

export type BoardMode = 'live' | 'snapshot';

export interface BoardSnapshot {
  mode: BoardMode;
  generatedAt: string;
  data: BoardData;
}

export interface BoardSources {
  twitch?: Source<TwitchData>;
  youtube?: Source<YouTubeData>;
  osu?: Source<OsuData>;
  github?: Source<GitHubData>;
  steam?: Source<SteamData>;
  services?: Source<ServicesData>;
}

const MINUTE = 60_000;

/** How long each source's answer is reused (DESIGN.md section 7). */
export const TTL = {
  twitch: MINUTE,
  youtube: 30 * MINUTE,
  osu: 30 * MINUTE,
  github: 5 * MINUTE,
  steam: 2 * MINUTE,
  // The status page checks every minute.
  services: MINUTE,
} as const;

export async function boardSnapshot(options: {
  sources: BoardSources;
  cache: SourceCache;
  ctx: SourceContext;
  live: boolean;
  /** Lines set by hand (STATUS_OVERRIDE); only on a live board. */
  overrides?: LineServices;
}): Promise<BoardSnapshot> {
  const { sources, cache, ctx, live, overrides } = options;
  const generatedAt = ctx.now().toISOString();

  const load = <T>(key: keyof typeof TTL, source: Source<T> | undefined) =>
    source
      ? cache.get(key, TTL[key], () => source(ctx))
      : Promise.resolve(undefined);

  const [twitch, youtube, osu, github, steam, services] = await Promise.all([
    load('twitch', sources.twitch),
    load('youtube', sources.youtube),
    load('osu', sources.osu),
    load('github', sources.github),
    load('steam', sources.steam),
    // Line status read long after the build could say a line is down that came back long
    // ago: a build-time snapshot leaves it out, and the cards keep their own status.
    live ? load('services', sources.services) : Promise.resolve(undefined),
  ]);

  return {
    mode: live ? 'live' : 'snapshot',
    generatedAt,
    data: {
      twitch: !live && twitch?.live ? null : twitch,
      youtube,
      osu,
      github,
      steam,
      services,
      ...(live && overrides && Object.keys(overrides).length
        ? { overrides }
        : {}),
    },
  };
}
