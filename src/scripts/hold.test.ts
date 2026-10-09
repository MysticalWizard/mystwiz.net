import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** A Space key event on the page itself, with nothing focused that uses Space. */
const space = () => ({
  code: 'Space',
  target: { matches: () => false, closest: () => null },
  repeat: false,
  defaultPrevented: false,
  metaKey: false,
  ctrlKey: false,
  altKey: false,
  shiftKey: false,
  preventDefault() {
    this.defaultPrevented = true;
  },
});

/** Home, with its next-train hold button. */
async function home() {
  const holdButton = {
    dataset: {},
    classList: { add: () => {}, remove: () => {} },
    style: { setProperty: () => {} },
    closest: () => null,
  };
  const page = fakeBrowser({
    path: '/',
    elements: { 'main [data-hold]': holdButton },
  });
  await import('./hold');
  return page;
}

describe('holding Space to depart', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
    navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('scrolls the page on a quick tap, like Space always does', async () => {
    const page = await home();
    page.document.fire('keydown', space());
    await vi.advanceTimersByTimeAsync(100);
    page.document.fire('keyup', space());
    expect(page.window.scrollBy).toHaveBeenCalledOnce();
    expect(navigate).not.toHaveBeenCalled();
  });

  it('departs for the next station, and letting go afterwards does not scroll', async () => {
    const page = await home();
    page.document.fire('keydown', space());
    // 170ms to count as a hold, then 950ms of holding.
    await vi.advanceTimersByTimeAsync(1500);
    expect(navigate).toHaveBeenCalledWith('/about/');
    page.document.fire('keyup', space());
    expect(page.window.scrollBy).not.toHaveBeenCalled();
  });

  it('settles back without departing or scrolling when let go early', async () => {
    const page = await home();
    page.document.fire('keydown', space());
    await vi.advanceTimersByTimeAsync(500);
    page.document.fire('keyup', space());
    await vi.advanceTimersByTimeAsync(2000);
    expect(navigate).not.toHaveBeenCalled();
    expect(page.window.scrollBy).not.toHaveBeenCalled();
  });
});
