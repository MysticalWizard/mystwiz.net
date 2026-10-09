import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

/** The page's two effect canvases, sharing a 2D context that records what is stroked. */
function canvases() {
  const context = {
    setTransform: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: vi.fn(),
    lineTo: vi.fn(),
    stroke: vi.fn(),
    arc: () => {},
    fill: () => {},
    fillText: () => {},
    globalAlpha: 1,
    lineWidth: 1,
    lineCap: 'butt',
    strokeStyle: '',
    fillStyle: '',
    font: '',
  };
  const canvas = () => ({ width: 0, height: 0, getContext: () => context });
  return {
    context,
    elements: { '[data-streaks]': canvas(), '[data-fx]': canvas() },
  };
}

describe('speed lines', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('let the frame loop sleep while the train is still', async () => {
    fakeBrowser({ elements: canvases().elements });
    await import('./fx');
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('stream past during a ride, then fade out and let the loop sleep', async () => {
    const { context, elements } = canvases();
    const page = fakeBrowser({ elements });
    await import('./fx');

    page.document.fire('mz:ride', { detail: {} });
    await vi.advanceTimersByTimeAsync(300);
    expect(context.stroke).toHaveBeenCalled();

    page.document.fire('mz:arrive', { detail: {} });
    await vi.advanceTimersByTimeAsync(2000);
    expect(vi.getTimerCount()).toBe(0);
  });

  // Every line starts mid-screen, at x = 640, and streams past against the way the train goes
  // with its tail trailing behind it.
  it.each([
    ['on to the next station', false, -1],
    ['back to the previous one', true, 1],
  ])('stream past the way the train is going: %s', async (_, back, way) => {
    vi.spyOn(Math, 'random').mockReturnValue(0.5);
    const { context, elements } = canvases();
    const page = fakeBrowser({ elements });
    await import('./fx');

    page.document.fire('mz:ride', { detail: { back } });
    await vi.advanceTimersByTimeAsync(300);
    const [x] = context.moveTo.mock.lastCall!;
    const [tail] = context.lineTo.mock.lastCall!;
    expect(Math.sign(x - 640)).toBe(way);
    expect(Math.sign(tail - x)).toBe(-way);
  });
});
