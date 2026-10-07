import { describe, expect, it } from 'vitest';
import { emptyTaps, idleTaps, tapAt, type Taps } from './tap';

function tapEvery(ms: number, count: number, from: Taps = emptyTaps()): Taps {
  let taps = from;
  const start = (taps.times.at(-1) ?? 0) + ms;
  for (let i = 0; i < count; i++) taps = tapAt(taps, start + i * ms);
  return taps;
}

describe('keypad tap test', () => {
  it('counts stream BPM as taps per second × 15 (1/4 notes)', () => {
    // 10 taps a second is 150 BPM.
    expect(tapEvery(100, 6).bpm).toBe(150);
  });

  it('needs four taps before showing a BPM', () => {
    expect(tapEvery(100, 3).bpm).toBe(0);
    expect(tapEvery(100, 4).bpm).toBe(150);
  });

  it('records a best only after eight taps', () => {
    expect(tapEvery(100, 7).best).toBe(0);
    expect(tapEvery(100, 8).best).toBe(150);
  });

  it('keeps the best when a slower stream follows', () => {
    const fast = tapEvery(80, 10);
    const slow = tapEvery(120, 10, idleTaps(fast));
    expect(fast.best).toBe(188);
    expect(slow.bpm).toBe(125);
    expect(slow.best).toBe(188);
  });

  it('measures over the most recent 24 taps', () => {
    let taps = tapEvery(200, 24);
    taps = tapEvery(100, 24, taps);
    expect(taps.times).toHaveLength(24);
    expect(taps.bpm).toBe(150);
  });

  it('resets the run but keeps the best when idle', () => {
    const idle = idleTaps(tapEvery(100, 8));
    expect(idle).toMatchObject({ count: 0, bpm: 0, best: 150, times: [] });
  });

  it('ignores taps that land on the same millisecond', () => {
    let taps = emptyTaps();
    for (let i = 0; i < 4; i++) taps = tapAt(taps, 1000);
    expect(taps.bpm).toBe(0);
    expect(taps.count).toBe(4);
  });
});
