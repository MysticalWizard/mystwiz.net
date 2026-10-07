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
}

const MINUTE = 60_000;

/** How long each source's answer is reused (DESIGN.md section 7). */
export const TTL = {
  twitch: MINUTE,
  youtube: 30 * MINUTE,
  osu: 30 * MINUTE,
  github: 5 * MINUTE,
  steam: 2 * MINUTE,
} as const;

export async function boardSnapshot(options: {
  sources: BoardSources;
  cache: SourceCache;
  ctx: SourceContext;
  live: boolean;
}): Promise<BoardSnapshot> {
  const { sources, cache, ctx, live } = options;
  const generatedAt = ctx.now().toISOString();

  const load = <T>(key: keyof typeof TTL, source: Source<T> | undefined) =>
    source
      ? cache.get(key, TTL[key], () => source(ctx))
      : Promise.resolve(undefined);

  const [twitch, youtube, osu, github, steam] = await Promise.all([
    load('twitch', sources.twitch),
    load('youtube', sources.youtube),
    load('osu', sources.osu),
    load('github', sources.github),
    load('steam', sources.steam),
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
    },
  };
}
