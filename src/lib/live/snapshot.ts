// What the departure board shows right now, assembled from every source in parallel.
//
// mode "live":     served on request by the board endpoint; the browser keeps polling it.
// mode "snapshot": taken at build time (no server); it can't know about a stream that starts
//                  later, so it never says the Twitch line is on air.
// mode "sample":   no API keys are configured yet; the board shows the prototype's sample data.
import {
  sampleBoard,
  type BoardData,
  type GitHubData,
  type OsuData,
  type SteamData,
  type TwitchData,
  type YouTubeData,
} from '../board';
import type { SourceCache } from './cache';
import type { Source, SourceContext } from './sources';

export type BoardMode = 'live' | 'snapshot' | 'sample';

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
  const now = ctx.now();
  const generatedAt = now.toISOString();

  // GitHub works without a key; the board goes live once any keyed source is set up.
  if (!sources.twitch && !sources.youtube && !sources.osu && !sources.steam) {
    return { mode: 'sample', generatedAt, data: sampleBoard(now) };
  }

  const load = <T>(key: keyof typeof TTL, source: Source<T> | undefined) =>
    source
      ? cache.get(key, TTL[key], () => source(ctx))
      : Promise.resolve(null);

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
      twitch:
        twitch && !live ? { ...twitch, live: false, title: undefined } : twitch,
      youtube,
      osu,
      github,
      steam,
    },
  };
}
