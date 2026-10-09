import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

/** A station board (it shakes while someone holds) and its ghost numeral, on a touch screen. */
async function stationHead() {
  const board = { dataset: { plane: 'shake' }, style: { transform: '' } };
  const ghost = { dataset: { plane: 'ghost' }, style: { transform: '' } };
  const page = fakeBrowser({ all: { '[data-plane]': [board, ghost] } });
  await import('./parallax');
  const { speed } = await import('./speed');
  return { page, board, speed };
}

describe('parallax', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'performance'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.resetModules();
  });

  it('lets the frame loop sleep once the planes have settled', async () => {
    await stationHead();
    await vi.advanceTimersByTimeAsync(1000);
    expect(vi.getTimerCount()).toBe(0);
  });

  it('shakes the board while someone holds to depart, then settles and sleeps again', async () => {
    vi.spyOn(Math, 'random').mockReturnValue(1);
    const { page, board, speed } = await stationHead();
    await vi.advanceTimersByTimeAsync(1000);

    speed.hold = 1;
    page.document.fire('mz:hold');
    await vi.advanceTimersByTimeAsync(100);
    expect(board.style.transform).toBe('translate3d(1.20px, 0.60px, 0)');

    speed.hold = 0;
    await vi.advanceTimersByTimeAsync(100);
    expect(board.style.transform).toBe('translate3d(0.00px, 0.00px, 0)');
    expect(vi.getTimerCount()).toBe(0);
  });
});
