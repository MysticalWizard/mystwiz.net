import { describe, expect, it, vi } from 'vitest';
import { sampleBoard } from '../board';
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
  it('shows sample data until API keys are configured', async () => {
    const snapshot = await boardSnapshot({
      sources: { github: sources().github },
      cache: createCache(),
      ctx,
      live: true,
    });
    expect(snapshot).toEqual({
      mode: 'sample',
      generatedAt: at,
      data: sampleBoard(NOW),
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

  it('never claims to be on air in a snapshot taken at build time', async () => {
    const snapshot = await boardSnapshot({
      sources: sources(),
      cache: createCache(),
      ctx,
      live: false,
    });
    expect(snapshot.mode).toBe('snapshot');
    expect(snapshot.data.twitch?.live).toBe(false);
    expect(snapshot.data.twitch?.title).toBeUndefined();
  });

  it('leaves a row empty when its source is not configured or has never answered', async () => {
    const snapshot = await boardSnapshot({
      sources: sources({
        steam: undefined,
        osu: () => Promise.reject(new Error('401')),
      }),
      cache: createCache(),
      ctx,
      live: true,
    });
    expect(snapshot.data.steam).toBeNull();
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
