// One fetcher per live row of the departure board. Each turns an API's answer into the board's
// data shape (src/lib/board.ts) and remembers what it can reuse, like app tokens and user ids.
// Endpoints follow each API's documentation as of 2026; a failure throws, and the cache keeps
// the last good value.
import type {
  GitHubData,
  OsuData,
  SteamData,
  TwitchData,
  YouTubeData,
} from '../board';

export interface SourceContext {
  fetch: (input: string, init?: RequestInit) => Promise<Response>;
  now: () => Date;
  timeoutMs: number;
}

export type Source<T> = (ctx: SourceContext) => Promise<T>;

class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
    /** When a rate-limited API said to try again (ms since the epoch); the cache waits till then. */
    readonly retryAt?: number,
  ) {
    super(
      `${status} from ${new URL(url).host}` +
        (retryAt === undefined
          ? ''
          : `, rate limited until ${new Date(retryAt).toISOString()}`),
    );
  }
}

/**
 * When a rate-limited API says to try again: after Retry-After seconds, or, once GitHub has no
 * requests left, at its X-RateLimit-Reset.
 */
function retryTime(res: Response, now: Date): number | undefined {
  const after = Number(res.headers.get('Retry-After'));
  if (after > 0) return now.getTime() + after * 1000;
  const reset = Number(res.headers.get('X-RateLimit-Reset'));
  if (res.headers.get('X-RateLimit-Remaining') === '0' && reset > 0) {
    return reset * 1000;
  }
  return undefined;
}

async function getJson<T>(
  ctx: SourceContext,
  url: string,
  init: RequestInit = {},
): Promise<T> {
  const res = await ctx.fetch(url, {
    ...init,
    signal: AbortSignal.timeout(ctx.timeoutMs),
  });
  if (!res.ok) throw new HttpError(res.status, url, retryTime(res, ctx.now()));
  return (await res.json()) as T;
}

/** Client credentials (app) token that refreshes itself shortly before it expires. */
function appToken(
  request: (
    ctx: SourceContext,
  ) => Promise<{ access_token: string; expires_in: number }>,
) {
  let token: { value: string; expiresAt: number } | undefined;
  return {
    async get(ctx: SourceContext) {
      const now = ctx.now().getTime();
      if (!token || token.expiresAt - 60_000 < now) {
        const answer = await request(ctx);
        token = {
          value: answer.access_token,
          expiresAt: now + answer.expires_in * 1000,
        };
      }
      return token.value;
    },
    clear() {
      token = undefined;
    },
  };
}

/* ---------- Twitch: on air with the title, or when the last stream ended ---------- */

/** Twitch video durations look like "3h8m33s". */
export function parseTwitchDuration(duration: string): number {
  const part = (unit: string) =>
    Number(duration.match(new RegExp(`(\\d+)${unit}`))?.[1] ?? 0);
  return ((part('h') * 60 + part('m')) * 60 + part('s')) * 1000;
}

export function twitch(
  credentials: { clientId: string; clientSecret: string },
  login: string,
): Source<TwitchData> {
  const token = appToken((ctx) =>
    getJson(ctx, 'https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'client_credentials',
      }),
    }),
  );
  let userId: string | undefined;

  async function helix<T>(ctx: SourceContext, path: string): Promise<T> {
    const call = async () =>
      getJson<T>(ctx, `https://api.twitch.tv/helix/${path}`, {
        headers: {
          'Client-Id': credentials.clientId,
          Authorization: `Bearer ${await token.get(ctx)}`,
        },
      });
    try {
      return await call();
    } catch (error) {
      // An expired or revoked app token: get a new one and try once more.
      if (!(error instanceof HttpError) || error.status !== 401) throw error;
      token.clear();
      return call();
    }
  }

  return async (ctx) => {
    const updatedAt = ctx.now().toISOString();
    const streams = await helix<{ data: { title?: string }[] }>(
      ctx,
      `streams?user_login=${encodeURIComponent(login)}`,
    );
    const stream = streams.data[0];
    if (stream) return { live: true, title: stream.title, updatedAt };

    userId ??= (
      await helix<{ data: { id: string }[] }>(
        ctx,
        `users?login=${encodeURIComponent(login)}`,
      )
    ).data[0]?.id;
    if (!userId) return { live: false, updatedAt };

    const videos = await helix<{
      data: { created_at: string; duration: string }[];
    }>(ctx, `videos?user_id=${userId}&type=archive&first=1`);
    const last = videos.data[0];
    const lastStreamAt =
      last &&
      new Date(
        Date.parse(last.created_at) + parseTwitchDuration(last.duration),
      ).toISOString();
    return { live: false, lastStreamAt, updatedAt };
  };
}

/* ---------- YouTube: subscribers and the latest upload ---------- */

export function youtube(apiKey: string, handle: string): Source<YouTubeData> {
  const api = 'https://www.googleapis.com/youtube/v3';
  return async (ctx) => {
    const channels = await getJson<{
      items?: {
        statistics?: {
          subscriberCount?: string;
          hiddenSubscriberCount?: boolean;
        };
        contentDetails?: { relatedPlaylists?: { uploads?: string } };
      }[];
    }>(
      ctx,
      `${api}/channels?part=statistics,contentDetails&forHandle=${encodeURIComponent(handle)}&key=${apiKey}`,
    );
    const channel = channels.items?.[0];
    if (!channel) throw new Error(`No YouTube channel for ${handle}`);

    const stats = channel.statistics;
    const subscribers =
      stats?.subscriberCount && !stats.hiddenSubscriberCount
        ? Number(stats.subscriberCount)
        : undefined;

    let latestUploadAt: string | undefined;
    const uploads = channel.contentDetails?.relatedPlaylists?.uploads;
    if (uploads) {
      const playlist = await getJson<{
        items?: { contentDetails?: { videoPublishedAt?: string } }[];
      }>(
        ctx,
        `${api}/playlistItems?part=contentDetails&playlistId=${uploads}&maxResults=1&key=${apiKey}`,
      );
      latestUploadAt = playlist.items?.[0]?.contentDetails?.videoPublishedAt;
    }
    return { subscribers, latestUploadAt, updatedAt: ctx.now().toISOString() };
  };
}

/* ---------- osu!: global rank and pp ---------- */

export function osu(
  credentials: { clientId: string; clientSecret: string },
  userId: number,
): Source<OsuData> {
  const token = appToken((ctx) =>
    getJson(ctx, 'https://osu.ppy.sh/oauth/token', {
      method: 'POST',
      headers: { Accept: 'application/json' },
      body: new URLSearchParams({
        client_id: credentials.clientId,
        client_secret: credentials.clientSecret,
        grant_type: 'client_credentials',
        scope: 'public',
      }),
    }),
  );

  return async (ctx) => {
    const user = await getJson<{
      statistics?: { global_rank?: number | null; pp?: number };
    }>(ctx, `https://osu.ppy.sh/api/v2/users/${userId}/osu`, {
      headers: {
        Accept: 'application/json',
        Authorization: `Bearer ${await token.get(ctx)}`,
      },
    });
    return {
      // global_rank is null while unranked (inactive for a while).
      globalRank: user.statistics?.global_rank ?? undefined,
      pp: user.statistics?.pp,
      updatedAt: ctx.now().toISOString(),
    };
  };
}

/* ---------- GitHub: the latest push, and commits this year (needs a token) ---------- */

export function github(user: string, token?: string): Source<GitHubData> {
  const headers: Record<string, string> = {
    Accept: 'application/vnd.github+json',
    'User-Agent': 'mystwiz.net',
    'X-GitHub-Api-Version': '2022-11-28',
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  return async (ctx) => {
    const events = await getJson<
      { type: string; created_at: string; repo?: { name?: string } }[]
    >(ctx, `https://api.github.com/users/${user}/events/public?per_page=100`, {
      headers,
    });
    const push = events.find((event) => event.type === 'PushEvent');
    let commitsThisYear: number | undefined;

    if (token) {
      const from = new Date(
        Date.UTC(ctx.now().getUTCFullYear(), 0, 1),
      ).toISOString();
      const answer = await getJson<{
        data?: {
          user?: {
            contributionsCollection?: { totalCommitContributions?: number };
          };
        };
      }>(ctx, 'https://api.github.com/graphql', {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query:
            'query($login: String!, $from: DateTime!) { user(login: $login) { contributionsCollection(from: $from) { totalCommitContributions } } }',
          variables: { login: user, from },
        }),
      });
      commitsThisYear =
        answer.data?.user?.contributionsCollection?.totalCommitContributions;
    }
    return {
      lastPushAt: push?.created_at,
      repo: push?.repo?.name?.split('/')[1],
      commitsThisYear,
      updatedAt: ctx.now().toISOString(),
    };
  };
}

/* ---------- Steam: online, and what is being played ---------- */

export function steam(apiKey: string, vanity: string): Source<SteamData> {
  const api = 'https://api.steampowered.com/ISteamUser';
  let steamId: string | undefined;

  return async (ctx) => {
    steamId ??= (
      await getJson<{ response?: { steamid?: string } }>(
        ctx,
        `${api}/ResolveVanityURL/v1/?key=${apiKey}&vanityurl=${encodeURIComponent(vanity)}`,
      )
    ).response?.steamid;
    if (!steamId) throw new Error(`No Steam profile for ${vanity}`);

    const summaries = await getJson<{
      response?: {
        players?: {
          personastate?: number;
          gameextrainfo?: string;
          lastlogoff?: number;
        }[];
      };
    }>(ctx, `${api}/GetPlayerSummaries/v2/?key=${apiKey}&steamids=${steamId}`);
    const player = summaries.response?.players?.[0];
    if (!player) throw new Error('Steam profile not visible');

    // personastate 0 is offline; every other state (online, busy, away...) counts as online.
    const online = Boolean(player.personastate);
    return {
      online,
      game: online ? player.gameextrainfo : undefined,
      lastOnlineAt:
        !online && player.lastlogoff
          ? new Date(player.lastlogoff * 1000).toISOString()
          : undefined,
      updatedAt: ctx.now().toISOString(),
    };
  };
}
