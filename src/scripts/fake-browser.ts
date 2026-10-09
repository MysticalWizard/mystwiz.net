// Test helper, not part of the site: just enough of a browser for the scripts in this folder to
// run under Vitest in Node. Listeners added to document and window are kept so a test can fire
// events at them, document.querySelector answers from the elements the test passes in, <html>
// keeps the attributes set on it, and timers and animation frames run on whatever clock the test
// installed (vi.useFakeTimers).
import { vi } from 'vitest';

type Listener = (event: never) => void;

function eventTarget() {
  const listeners = new Map<string, Listener[]>();
  return {
    addEventListener(type: string, listener: Listener) {
      listeners.set(type, [...(listeners.get(type) ?? []), listener]);
    },
    removeEventListener(type: string, listener: Listener) {
      listeners.set(
        type,
        (listeners.get(type) ?? []).filter((l) => l !== listener),
      );
    },
    dispatchEvent(event: Event) {
      for (const listener of listeners.get(event.type) ?? []) {
        listener(event as never);
      }
      return true;
    },
    /** Hands a plain object to the listeners for `type`, as the browser hands them an event. */
    fire(type: string, event: object = {}) {
      for (const listener of listeners.get(type) ?? []) {
        listener(event as never);
      }
    },
  };
}

export function fakeBrowser({
  path = '/',
  elements = {},
  all = {},
  attributes = [],
}: {
  /** The page's URL path. */
  path?: string;
  /** What document.querySelector finds, by selector. */
  elements?: Record<string, object>;
  /** What document.querySelectorAll finds, by selector. */
  all?: Record<string, object[]>;
  /** Attributes already on <html> when the scripts run. */
  attributes?: string[];
} = {}) {
  const html = new Set(attributes);
  const doc = Object.assign(eventTarget(), {
    body: { matches: () => false, closest: () => null },
    visibilityState: 'visible' as DocumentVisibilityState,
    documentElement: {
      dataset: {} as DOMStringMap,
      hasAttribute: (name: string) => html.has(name),
      setAttribute: (name: string) => {
        html.add(name);
      },
      removeAttribute: (name: string) => {
        html.delete(name);
      },
      toggleAttribute: (name: string, force = !html.has(name)) => {
        if (force) html.add(name);
        else html.delete(name);
        return force;
      },
    },
    querySelector: (selector: string) => elements[selector] ?? null,
    querySelectorAll: (selector: string) => all[selector] ?? [],
    createElement: () => ({}),
  });
  const win = Object.assign(eventTarget(), {
    innerWidth: 1280,
    innerHeight: 800,
    devicePixelRatio: 1,
    scrollY: 0,
    matchMedia: () => ({ matches: false }),
    scrollBy: vi.fn(),
    setTimeout: (callback: () => void, ms?: number) => setTimeout(callback, ms),
    clearTimeout: (id?: number) => clearTimeout(id),
  });
  vi.stubGlobal('document', doc);
  vi.stubGlobal('window', win);
  vi.stubGlobal('location', { pathname: path });
  vi.stubGlobal('HTMLElement', class {});
  vi.stubGlobal('getComputedStyle', () => ({ getPropertyValue: () => '' }));
  vi.stubGlobal('requestAnimationFrame', (callback: FrameRequestCallback) =>
    setTimeout(() => callback(performance.now()), 16),
  );
  vi.stubGlobal('cancelAnimationFrame', (id?: number) => clearTimeout(id));
  return { document: doc, window: win };
}
