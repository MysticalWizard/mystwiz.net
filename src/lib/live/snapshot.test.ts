import { describe, expect, it, vi } from 'vitest';
import { createCache } from './cache';
import { boardSnapshot, type BoardSources } from './snapshot';
import type { SourceContext } from './sources';

const NOW = new Date('2026-10-07T12:00:00Z');
const at = NOW.toISOString();
const ctx: SourceContext = { fetch: vi.fn(), now: () => NOW, timeoutMs: 1000 };

const sources = (overrides: Partial<BoardSources> = {}): BoardSources => ({
  twitch: async () => ({ live: true, title: 'On stream', updatedAt: at }),
  youtube: async () => ({ subscribers: 1300, updatedAt: at }),
  osu: async () => ({ globalRank: 40000, pp: 7000, updatedAt: at }),
  github: async () => ({ lastPushAt: at, updatedAt: at }),
  steam: async () => ({ online: false, updatedAt: at }),
  ...overrides,
});

describe('board snapshot', () => {
  it('leaves out sources without API keys instead of making data up', async () => {
    const snapshot = await boardSnapshot({
      sources: { github: sources().github },
      cache: createCache(),
      ctx,
      live: true,
    });
    expect(snapshot).toEqual({
      mode: 'live',
      generatedAt: at,
      data: { github: { lastPushAt: at, updatedAt: at } },
    });
  });

  it('answers live with every source when served on request', async () => {
    const snapshot = await boardSnapshot({
      sources: sources(),
      cache: createCache(),
      ctx,
      live: true,
    });
    expect(snapshot.mode).toBe('live');
    expect(snapshot.data.twitch).toEqual({
      live: true,
      title: 'On stream',
      updatedAt: at,
    });
    expect(snapshot.data.osu).toEqual({
      globalRank: 40000,
      pp: 7000,
      updatedAt: at,
    });
  });

  it('has no Twitch data in a build-time snapshot that caught the stream on air', async () => {
    const snapshot = await boardSnapshot({
      sources: sources(),
      cache: createCache(),
      ctx,
      live: false,
    });
    expect(snapshot.mode).toBe('snapshot');
    expect(snapshot.data.twitch).toBeNull();
  });

  it('keeps an off-air Twitch row in a build-time snapshot', async () => {
    const twitch = { live: false, lastStreamAt: at, updatedAt: at };
    const snapshot = await boardSnapshot({
      sources: sources({ twitch: async () => twitch }),
      cache: createCache(),
      ctx,
      live: false,
    });
    expect(snapshot.data.twitch).toEqual(twitch);
  });

  it('tells a source without a key apart from one that has never answered', async () => {
    const snapshot = await boardSnapshot({
      sources: sources({
        steam: undefined,
        osu: () => Promise.reject(new Error('401')),
      }),
      cache: createCache(),
      ctx,
      live: true,
    });
    expect(snapshot.data.steam).toBeUndefined();
    expect(snapshot.data.osu).toBeNull();
    expect(snapshot.data.youtube).not.toBeNull();
  });

  it('fetches each source once per time to live', async () => {
    const youtube = vi.fn(async () => ({ subscribers: 1, updatedAt: at }));
    const cache = createCache();
    await boardSnapshot({
      sources: sources({ youtube }),
      cache,
      ctx,
      live: true,
    });
    await boardSnapshot({
      sources: sources({ youtube }),
      cache,
      ctx,
      live: true,
    });
    expect(youtube).toHaveBeenCalledTimes(1);
  });
});
