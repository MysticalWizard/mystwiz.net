import { describe, expect, it, vi } from 'vitest';
import { createCache, RETRY_MS, STALE_TTLS } from './cache';

function clock(start = 0) {
  let now = start;
  return {
    now: () => now,
    advance: (ms: number) => {
      now += ms;
    },
  };
}

describe('source cache', () => {
  it('serves a cached value until its time to live runs out', async () => {
    const time = clock();
    const cache = createCache(time.now);
    const load = vi.fn().mockResolvedValueOnce('a').mockResolvedValueOnce('b');

    expect(await cache.get('yt', 1000, load)).toBe('a');
    time.advance(999);
    expect(await cache.get('yt', 1000, load)).toBe('a');
    time.advance(1);
    expect(await cache.get('yt', 1000, load)).toBe('b');
    expect(load).toHaveBeenCalledTimes(2);
  });

  it('keeps answering with the last good value when a source fails', async () => {
    const time = clock();
    const cache = createCache(time.now);
    await cache.get('tw', 1000, async () => 'good');
    time.advance(3000);
    const failing = vi.fn().mockRejectedValue(new Error('timeout'));
    expect(await cache.get('tw', 1000, failing)).toBe('good');
  });

  it('stops standing in for a failing source once its last good value is too old', async () => {
    const time = clock();
    const cache = createCache(time.now);
    await cache.get('tw', 1000, async () => 'on air');
    const failing = () => Promise.reject(new Error('timeout'));

    time.advance(1000 * STALE_TTLS - 1);
    expect(await cache.get('tw', 1000, failing)).toBe('on air');
    // Too old now, both while waiting to retry and when the retry fails too.
    time.advance(1);
    expect(await cache.get('tw', 1000, failing)).toBeNull();
    time.advance(1000);
    expect(await cache.get('tw', 1000, failing)).toBeNull();
  });

  it('reports each failed refresh, but not the answers it gives while waiting to retry', async () => {
    const time = clock();
    const failures: [string, unknown][] = [];
    const cache = createCache(time.now, (key, error) =>
      failures.push([key, error]),
    );
    const down = new Error('down');
    const failing = () => Promise.reject(down);

    await cache.get('st', 60_000, failing);
    time.advance(RETRY_MS - 1);
    await cache.get('st', 60_000, failing);
    expect(failures).toEqual([['st', down]]);
    time.advance(1);
    await cache.get('st', 60_000, failing);
    expect(failures).toEqual([
      ['st', down],
      ['st', down],
    ]);
  });

  it('waits as long as a rate-limited source asks before trying it again', async () => {
    const time = clock();
    const cache = createCache(time.now);
    const limited = vi.fn().mockRejectedValue(
      Object.assign(new Error('403 from api.github.com'), {
        retryAt: 10 * 60_000,
      }),
    );

    await cache.get('gh', 5 * 60_000, limited);
    time.advance(10 * 60_000 - 1);
    await cache.get('gh', 5 * 60_000, limited);
    expect(limited).toHaveBeenCalledTimes(1);
    time.advance(1);
    await cache.get('gh', 5 * 60_000, limited);
    expect(limited).toHaveBeenCalledTimes(2);
  });

  it('answers null when a source has never worked', async () => {
    const cache = createCache(clock().now);
    expect(
      await cache.get('osu', 1000, () => Promise.reject(new Error('401'))),
    ).toBeNull();
  });

  it('waits before retrying a failed source', async () => {
    const time = clock();
    const cache = createCache(time.now);
    const failing = vi.fn().mockRejectedValue(new Error('down'));
    await cache.get('st', 60_000, failing);
    time.advance(RETRY_MS - 1);
    await cache.get('st', 60_000, failing);
    expect(failing).toHaveBeenCalledTimes(1);
    time.advance(1);
    await cache.get('st', 60_000, failing);
    expect(failing).toHaveBeenCalledTimes(2);
  });

  it('shares one fetch between requests that arrive together', async () => {
    const cache = createCache(clock().now);
    let resolve: (value: string) => void = () => {};
    const load = vi.fn(() => new Promise<string>((done) => (resolve = done)));
    const first = cache.get('gh', 1000, load);
    const second = cache.get('gh', 1000, load);
    resolve('push');
    expect(await Promise.all([first, second])).toEqual(['push', 'push']);
    expect(load).toHaveBeenCalledTimes(1);
  });
});
