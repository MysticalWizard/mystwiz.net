// A small cache per data source. Each source has its own time to live; when a refresh fails the
// cache keeps answering with the last good value (which carries its own updatedAt) for a while,
// and waits a little before trying that source again. Concurrent requests share one fetch.

/** How long to wait before retrying a source that just failed (unless its TTL is shorter). */
export const RETRY_MS = 30_000;

/**
 * A failing source's last good value stands in for it until it is this many times its time to
 * live old. After that the source reads as never having answered, so a long outage can't keep a
 * stream on air.
 */
export const STALE_TTLS = 5;

interface Entry {
  value: unknown;
  fetchedAt: number;
  failedAt?: number;
}

export interface SourceCache {
  get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T | null>;
}

/** `onError` hears about every failed refresh; the cache itself carries on as described above. */
export function createCache(
  now: () => number = Date.now,
  onError: (key: string, error: unknown) => void = () => {},
): SourceCache {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<unknown>>();

  return {
    get<T>(key: string, ttlMs: number, load: () => Promise<T>) {
      const lastGood = (entry: Entry | undefined, at: number) =>
        (entry !== undefined && at - entry.fetchedAt < ttlMs * STALE_TTLS
          ? (entry.value ?? null)
          : null) as T | null;

      const entry = entries.get(key);
      const at = now();
      const fresh = entry !== undefined && at - entry.fetchedAt < ttlMs;
      const coolingDown =
        entry?.failedAt !== undefined &&
        at - entry.failedAt < Math.min(ttlMs, RETRY_MS);
      if (fresh || coolingDown) return Promise.resolve(lastGood(entry, at));

      let request = pending.get(key) as Promise<T | null> | undefined;
      if (!request) {
        request = load()
          .then(
            (value) => {
              entries.set(key, { value, fetchedAt: now() });
              return value;
            },
            (error: unknown) => {
              const last = entries.get(key);
              const failedAt = now();
              entries.set(key, {
                value: last?.value ?? null,
                fetchedAt: last?.fetchedAt ?? -Infinity,
                failedAt,
              });
              onError(key, error);
              return lastGood(last, failedAt);
            },
          )
          .finally(() => pending.delete(key));
        pending.set(key, request);
      }
      return request;
    },
  };
}
