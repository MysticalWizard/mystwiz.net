import { describe, expect, it, vi } from 'vitest';
import {
  github,
  osu,
  parseTwitchDuration,
  steam,
  twitch,
  youtube,
  type SourceContext,
} from './sources';

const NOW = new Date('2026-10-07T12:00:00Z');

type Route = unknown | ((url: string, init?: RequestInit) => unknown);

/**
 * A fetch that answers JSON by URL prefix; a number answers with that HTTP status, and a
 * Response is answered as it is.
 */
function fakeFetch(routes: Record<string, Route>) {
  return vi.fn(async (input: string | URL | Request, init?: RequestInit) => {
    const url = String(input);
    const key = Object.keys(routes)
      .filter((prefix) => url.startsWith(prefix))
      .sort((a, b) => b.length - a.length)[0];
    if (key === undefined) throw new Error(`unexpected fetch ${url}`);
    const route = routes[key];
    const body = typeof route === 'function' ? route(url, init) : route;
    if (body instanceof Response) return body;
    if (typeof body === 'number') return new Response('{}', { status: body });
    return new Response(JSON.stringify(body), {
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

const context = (fetch: SourceContext['fetch']): SourceContext => ({
  fetch,
  now: () => NOW,
  timeoutMs: 1000,
});

describe('twitch', () => {
  const token = {
    access_token: 'app-token',
    expires_in: 3600,
    token_type: 'bearer',
  };

  it('reads a stream duration like "3h8m33s"', () => {
    expect(parseTwitchDuration('3h8m33s')).toBe(
      (3 * 3600 + 8 * 60 + 33) * 1000,
    );
    expect(parseTwitchDuration('45m2s')).toBe((45 * 60 + 2) * 1000);
    expect(parseTwitchDuration('59s')).toBe(59_000);
  });

  it('reports on air with the stream title', async () => {
    const fetch = fakeFetch({
      'https://id.twitch.tv/oauth2/token': token,
      'https://api.twitch.tv/helix/streams': {
        data: [{ type: 'live', title: 'Building the MZ Line' }],
      },
    });
    const source = twitch(
      { clientId: 'id', clientSecret: 'secret' },
      'mystclwzrd',
    );
    expect(await source(context(fetch))).toEqual({
      live: true,
      title: 'Building the MZ Line',
      updatedAt: NOW.toISOString(),
    });
    const [, init] = fetch.mock.calls[1];
    expect(new Headers(init?.headers).get('Authorization')).toBe(
      'Bearer app-token',
    );
    expect(new Headers(init?.headers).get('Client-Id')).toBe('id');
  });

  it('dates the last stream from the end of the latest broadcast', async () => {
    const fetch = fakeFetch({
      'https://id.twitch.tv/oauth2/token': token,
      'https://api.twitch.tv/helix/streams': { data: [] },
      'https://api.twitch.tv/helix/users': { data: [{ id: '42' }] },
      'https://api.twitch.tv/helix/videos': (url: string) => {
        expect(url).toContain('user_id=42');
        expect(url).toContain('type=archive');
        return {
          data: [{ created_at: '2026-10-05T18:00:00Z', duration: '2h30m0s' }],
        };
      },
    });
    const source = twitch(
      { clientId: 'id', clientSecret: 'secret' },
      'mystclwzrd',
    );
    expect(await source(context(fetch))).toEqual({
      live: false,
      lastStreamAt: '2026-10-05T20:30:00.000Z',
      updatedAt: NOW.toISOString(),
    });
  });

  it('reuses the app token and the user id between refreshes', async () => {
    const fetch = fakeFetch({
      'https://id.twitch.tv/oauth2/token': token,
      'https://api.twitch.tv/helix/streams': { data: [] },
      'https://api.twitch.tv/helix/users': { data: [{ id: '42' }] },
      'https://api.twitch.tv/helix/videos': { data: [] },
    });
    const source = twitch(
      { clientId: 'id', clientSecret: 'secret' },
      'mystclwzrd',
    );
    await source(context(fetch));
    await source(context(fetch));
    const urls = fetch.mock.calls.map(([url]) => String(url));
    expect(urls.filter((u) => u.includes('oauth2/token'))).toHaveLength(1);
    expect(urls.filter((u) => u.includes('helix/users'))).toHaveLength(1);
  });

  it('gets a new token when the old one is refused', async () => {
    let tokens = 0;
    let streams = 0;
    const fetch = fakeFetch({
      'https://id.twitch.tv/oauth2/token': () => ({
        ...token,
        access_token: `t${++tokens}`,
      }),
      'https://api.twitch.tv/helix/streams': () =>
        ++streams === 1 ? 401 : { data: [{ title: 'Back' }] },
    });
    const source = twitch(
      { clientId: 'id', clientSecret: 'secret' },
      'mystclwzrd',
    );
    expect((await source(context(fetch))).title).toBe('Back');
    expect(tokens).toBe(2);
  });
});

describe('youtube', () => {
  it('reads subscribers and the latest upload', async () => {
    const fetch = fakeFetch({
      'https://www.googleapis.com/youtube/v3/channels': (url: string) => {
        expect(url).toContain('forHandle=%40mysticalwizard');
        return {
          items: [
            {
              statistics: {
                subscriberCount: '1284',
                hiddenSubscriberCount: false,
              },
              contentDetails: { relatedPlaylists: { uploads: 'UU123' } },
            },
          ],
        };
      },
      'https://www.googleapis.com/youtube/v3/playlistItems': {
        items: [
          { contentDetails: { videoPublishedAt: '2026-10-04T10:00:00Z' } },
        ],
      },
    });
    expect(await youtube('key', '@mysticalwizard')(context(fetch))).toEqual({
      subscribers: 1284,
      latestUploadAt: '2026-10-04T10:00:00Z',
      updatedAt: NOW.toISOString(),
    });
  });

  it('leaves out a hidden subscriber count', async () => {
    const fetch = fakeFetch({
      'https://www.googleapis.com/youtube/v3/channels': {
        items: [
          { statistics: { hiddenSubscriberCount: true }, contentDetails: {} },
        ],
      },
    });
    const data = await youtube('key', '@mysticalwizard')(context(fetch));
    expect(data.subscribers).toBeUndefined();
  });

  it('fails when the channel is missing', async () => {
    const fetch = fakeFetch({
      'https://www.googleapis.com/youtube/v3/channels': { items: [] },
    });
    await expect(youtube('key', '@nobody')(context(fetch))).rejects.toThrow();
  });
});

describe('osu!', () => {
  it('reads global rank and pp with a client credentials token', async () => {
    const fetch = fakeFetch({
      'https://osu.ppy.sh/oauth/token': (_: string, init?: RequestInit) => {
        const body = new URLSearchParams(String(init?.body));
        expect(body.get('grant_type')).toBe('client_credentials');
        expect(body.get('scope')).toBe('public');
        return {
          access_token: 'osu-token',
          expires_in: 86400,
          token_type: 'Bearer',
        };
      },
      'https://osu.ppy.sh/api/v2/users/19430051/osu': {
        statistics: { global_rank: 48213, pp: 6912.4, country_rank: 1200 },
      },
    });
    const source = osu({ clientId: '1', clientSecret: 'secret' }, 19430051);
    expect(await source(context(fetch))).toEqual({
      globalRank: 48213,
      pp: 6912.4,
      updatedAt: NOW.toISOString(),
    });
  });
});

describe('github', () => {
  const events = [
    {
      type: 'WatchEvent',
      created_at: '2026-10-07T11:00:00Z',
      repo: { name: 'someone/else' },
    },
    {
      type: 'PushEvent',
      created_at: '2026-10-07T10:00:00Z',
      repo: { name: 'mysticalwizard/mystwiz.net' },
    },
  ];

  it('finds the latest push without a token', async () => {
    const fetch = fakeFetch({
      'https://api.github.com/users/mysticalwizard/events/public': events,
    });
    expect(await github('mysticalwizard')(context(fetch))).toEqual({
      lastPushAt: '2026-10-07T10:00:00Z',
      repo: 'mystwiz.net',
      updatedAt: NOW.toISOString(),
    });
  });

  it('counts commits this year when it has a token', async () => {
    const fetch = fakeFetch({
      'https://api.github.com/users/mysticalwizard/events/public': events,
      'https://api.github.com/graphql': (_: string, init?: RequestInit) => {
        const { variables } = JSON.parse(String(init?.body));
        expect(variables).toEqual({
          login: 'mysticalwizard',
          from: '2026-01-01T00:00:00.000Z',
        });
        return {
          data: {
            user: {
              contributionsCollection: { totalCommitContributions: 312 },
            },
          },
        };
      },
    });
    const data = await github('mysticalwizard', 'gh-token')(context(fetch));
    expect(data.commitsThisYear).toBe(312);
  });

  it('says when the limit for requests without a token resets', async () => {
    const resetAt = Date.parse('2026-10-07T12:42:00Z');
    const fetch = fakeFetch({
      'https://api.github.com/users/mysticalwizard/events/public': () =>
        new Response(
          JSON.stringify({
            message:
              "API rate limit exceeded for 203.0.113.7. (But here's the good news: Authenticated requests get a higher rate limit. Check out the documentation for more details.)",
            documentation_url:
              'https://docs.github.com/rest/overview/resources-in-the-rest-api#rate-limiting',
          }),
          {
            status: 403,
            headers: {
              'Content-Type': 'application/json',
              'X-RateLimit-Limit': '60',
              'X-RateLimit-Remaining': '0',
              'X-RateLimit-Reset': String(resetAt / 1000),
              'X-RateLimit-Used': '60',
              'X-RateLimit-Resource': 'core',
            },
          },
        ),
    });
    await expect(
      github('mysticalwizard')(context(fetch)),
    ).rejects.toMatchObject({
      retryAt: resetAt,
      message: expect.stringContaining('2026-10-07T12:42:00.000Z'),
    });
  });

  it('waits as long as a secondary rate limit asks', async () => {
    const fetch = fakeFetch({
      'https://api.github.com/users/mysticalwizard/events/public': () =>
        new Response(
          JSON.stringify({
            message:
              'You have exceeded a secondary rate limit. Please wait a few minutes before you try again.',
          }),
          {
            status: 429,
            headers: {
              'Content-Type': 'application/json',
              'Retry-After': '60',
            },
          },
        ),
    });
    await expect(
      github('mysticalwizard')(context(fetch)),
    ).rejects.toMatchObject({ retryAt: Date.parse('2026-10-07T12:01:00Z') });
  });
});

describe('steam', () => {
  it('resolves the vanity URL once, then reads presence', async () => {
    let resolves = 0;
    const fetch = fakeFetch({
      'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/': () => {
        resolves++;
        return { response: { steamid: '76561198000000000', success: 1 } };
      },
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/': (
        url: string,
      ) => {
        expect(url).toContain('steamids=76561198000000000');
        return {
          response: { players: [{ personastate: 1, gameextrainfo: 'osu!' }] },
        };
      },
    });
    const source = steam('key', 'mysticalwiz');
    expect(await source(context(fetch))).toEqual({
      online: true,
      game: 'osu!',
      updatedAt: NOW.toISOString(),
    });
    await source(context(fetch));
    expect(resolves).toBe(1);
  });

  it('reads when an offline player was last online', async () => {
    const fetch = fakeFetch({
      'https://api.steampowered.com/ISteamUser/ResolveVanityURL/v1/': {
        response: { steamid: '1', success: 1 },
      },
      'https://api.steampowered.com/ISteamUser/GetPlayerSummaries/v2/': {
        response: { players: [{ personastate: 0, lastlogoff: 1_791_000_000 }] },
      },
    });
    expect(await steam('key', 'mysticalwiz')(context(fetch))).toEqual({
      online: false,
      lastOnlineAt: new Date(1_791_000_000 * 1000).toISOString(),
      updatedAt: NOW.toISOString(),
    });
  });
});
