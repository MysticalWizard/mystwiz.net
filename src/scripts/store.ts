// localStorage with an "mz:" prefix and JSON values. Storage can be missing or blocked
// (private windows, in-app browsers), so reads fall back and writes are best effort.
const PREFIX = 'mz:';

export const store = {
  get<T>(key: string, fallback: T): T {
    try {
      const value = localStorage.getItem(PREFIX + key);
      return value === null ? fallback : (JSON.parse(value) as T);
    } catch {
      return fallback;
    }
  },
  set(key: string, value: unknown): void {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Storage unavailable: the choice just won't persist.
    }
  },
};
