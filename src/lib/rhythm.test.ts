import { describe, expect, it } from 'vitest';
import { comboAfter, emptyRhythm, type Rhythm } from './rhythm';

/** Clicks at the given times (ms); returns the combo after each click. */
function play(times: number[]): number[] {
  let rhythm: Rhythm = emptyRhythm();
  return times.map((t) => {
    rhythm = comboAfter(rhythm, t);
    return rhythm.combo;
  });
}

describe('click combo', () => {
  it('starts a combo once three intervals in a row are steady', () => {
    // Four clicks, 300ms apart: three steady intervals, so the combo starts at x4.
    expect(play([0, 300, 600, 900, 1200, 1500])).toEqual([0, 0, 0, 4, 5, 6]);
  });

  it('tolerates intervals within 20% of their average', () => {
    expect(play([0, 300, 640, 920, 1240])).toEqual([0, 0, 0, 4, 5]);
  });

  it('drops the combo when the beat wobbles by more than 20%', () => {
    expect(play([0, 300, 600, 900, 1500])).toEqual([0, 0, 0, 4, 0]);
  });

  it('resets after a pause longer than 900ms', () => {
    expect(play([0, 300, 600, 900, 2000, 2300, 2600, 2900])).toEqual([
      0, 0, 0, 4, 0, 0, 0, 4,
    ]);
  });

  it('ignores double clicks faster than 110ms', () => {
    expect(play([0, 50, 100, 150, 200])).toEqual([0, 0, 0, 0, 0]);
  });
});
