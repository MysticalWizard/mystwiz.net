import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** A station page with ride.ts on it and nothing focused. */
async function station(path: string) {
  const page = fakeBrowser({ path });
  await import('./ride');
  const arrow = (key: 'ArrowLeft' | 'ArrowRight', repeat = false) =>
    page.document.fire('keydown', {
      key,
      repeat,
      target: page.document.body,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
    });
  return { arrow };
}

describe('riding with the arrow keys', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('rides to the next and previous stations, round the loop', async () => {
    const { arrow } = await station('/');
    arrow('ArrowRight');
    arrow('ArrowLeft');
    expect(navigate.mock.calls).toEqual([['/about/'], ['/specs/']]);
  });

  it('rides once when an arrow key is held down', async () => {
    const { arrow } = await station('/');
    arrow('ArrowRight');
    for (let i = 0; i < 5; i++) arrow('ArrowRight', true);
    expect(navigate).toHaveBeenCalledOnce();
  });
});

/** Specs swapped in at the end of a ride, with the doors still shut. Returns <html>. */
async function rideIntoSpecs() {
  /** The doors' classes, as the ride leaves them. */
  const doorClasses = new Set(['on', 'closed', 'moving']);
  const doors = {
    classList: {
      contains: (name: string) => doorClasses.has(name),
      remove: (...names: string[]) =>
        names.forEach((n) => doorClasses.delete(n)),
    },
  };
  const page = fakeBrowser({
    path: '/specs/',
    elements: { '[data-doors]': doors },
  });
  await import('./ride');
  page.document.fire('astro:after-swap');
  return page.document.documentElement;
}

/** Specs as a first visit loads it, behind the doors (see Base.astro). Returns <html>. */
async function boardAtSpecs() {
  const page = fakeBrowser({ path: '/specs/', attributes: ['data-boarding'] });
  await import('./ride');
  return page.document.documentElement;
}

// Specs' train pulls in as its formation rises (see Formation.astro): 0.3s + 1.2s after a ride,
// 0.75s + 1.2s on a first visit.
describe('arriving at Specs', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('lasts until the train has pulled in after a ride', async () => {
    const html = await rideIntoSpecs();
    await vi.advanceTimersByTimeAsync(1500);
    expect(html.hasAttribute('data-arriving')).toBe(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(html.hasAttribute('data-arriving')).toBe(false);
  });

  it('lasts until the train has pulled in on a first visit', async () => {
    const html = await boardAtSpecs();
    await vi.advanceTimersByTimeAsync(1950);
    expect(html.hasAttribute('data-boarding')).toBe(true);
    await vi.advanceTimersByTimeAsync(500);
    expect(html.hasAttribute('data-boarding')).toBe(false);
  });
});

describe('riding back', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('tells the effects, and runs the doors and the arrival the other way', async () => {
    const doorClasses = new Set<string>();
    const doors = {
      dataset: {},
      querySelector: () => null,
      classList: {
        add: (...names: string[]) => names.forEach((n) => doorClasses.add(n)),
        remove: (...names: string[]) =>
          names.forEach((n) => doorClasses.delete(n)),
        toggle: (name: string, force: boolean) =>
          force ? doorClasses.add(name) : doorClasses.delete(name),
        contains: (name: string) => doorClasses.has(name),
      },
    };
    const page = fakeBrowser({
      path: '/about/',
      elements: { '[data-doors]': doors },
    });
    await import('./ride');
    const rides = vi.fn();
    page.document.addEventListener('mz:ride', (event: CustomEvent) =>
      rides(event.detail),
    );

    // Astro's router asks to go from About back to Home, then runs the (wrapped) page load.
    const navigation = {
      from: new URL('http://localhost/about/'),
      to: new URL('http://localhost/'),
      loader: async () => {},
    };
    page.document.fire('astro:before-preparation', navigation);
    const ride = navigation.loader();
    await vi.advanceTimersByTimeAsync(1500);
    await ride;
    expect(rides).toHaveBeenCalledWith(expect.objectContaining({ back: true }));
    expect(doorClasses.has('back')).toBe(true);

    page.document.fire('astro:after-swap');
    expect(page.document.documentElement.getAttribute('data-arriving')).toBe(
      'back',
    );
  });
});
