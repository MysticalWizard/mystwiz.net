// A small cache per data source. Each source has its own time to live; when a refresh fails the
// cache keeps answering with the last good value (which carries its own updatedAt), and waits a
// little before trying that source again. Concurrent requests share one fetch.

/** How long to wait before retrying a source that just failed (unless its TTL is shorter). */
export const RETRY_MS = 30_000;

interface Entry {
  value: unknown;
  fetchedAt: number;
  failedAt?: number;
}

export interface SourceCache {
  get<T>(key: string, ttlMs: number, load: () => Promise<T>): Promise<T | null>;
}

export function createCache(now: () => number = Date.now): SourceCache {
  const entries = new Map<string, Entry>();
  const pending = new Map<string, Promise<unknown>>();

  return {
    get<T>(key: string, ttlMs: number, load: () => Promise<T>) {
      const entry = entries.get(key);
      const at = now();
      const fresh = entry !== undefined && at - entry.fetchedAt < ttlMs;
      const coolingDown =
        entry?.failedAt !== undefined &&
        at - entry.failedAt < Math.min(ttlMs, RETRY_MS);
      if (fresh || coolingDown)
        return Promise.resolve((entry?.value ?? null) as T | null);

      let request = pending.get(key) as Promise<T | null> | undefined;
      if (!request) {
        request = load()
          .then(
            (value) => {
              entries.set(key, { value, fetchedAt: now() });
              return value;
            },
            () => {
              const last = entries.get(key);
              entries.set(key, {
                value: last?.value ?? null,
                fetchedAt: last?.fetchedAt ?? -Infinity,
                failedAt: now(),
              });
              return (last?.value ?? null) as T | null;
            },
          )
          .finally(() => pending.delete(key));
        pending.set(key, request);
      }
      return request;
    },
  };
}
