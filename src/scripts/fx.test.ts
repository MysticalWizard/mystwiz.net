import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

/** The page's two effect canvases, sharing a 2D context that records what is stroked. */
function canvases() {
  const context = {
    setTransform: () => {},
    clearRect: () => {},
    beginPath: () => {},
    moveTo: () => {},
    lineTo: () => {},
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

    page.document.fire('mz:ride');
    await vi.advanceTimersByTimeAsync(300);
    expect(context.stroke).toHaveBeenCalled();

    page.document.fire('mz:arrive');
    await vi.advanceTimersByTimeAsync(2000);
    expect(vi.getTimerCount()).toBe(0);
  });
});
