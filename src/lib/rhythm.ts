// Clicking to a beat, osu! style: three or more steady intervals in a row (each within 20% of
// their average) build a combo that grows with every further click on the beat.

export interface Rhythm {
  /** Time of the previous click (ms), or -Infinity before the first one. */
  last: number;
  /** The most recent intervals between clicks (up to four). */
  gaps: number[];
  combo: number;
}

const MIN_GAP = 110;
const MAX_GAP = 900;
const TOLERANCE = 0.2;

export const emptyRhythm = (): Rhythm => ({
  last: -Infinity,
  gaps: [],
  combo: 0,
});

export function comboAfter(rhythm: Rhythm, now: number): Rhythm {
  const gap = now - rhythm.last;
  if (gap <= MIN_GAP || gap >= MAX_GAP) {
    return { last: now, gaps: [], combo: 0 };
  }
  const gaps = [...rhythm.gaps, gap].slice(-4);
  if (gaps.length < 3) return { last: now, gaps, combo: 0 };

  const mean = gaps.reduce((sum, g) => sum + g, 0) / gaps.length;
  const wobble = Math.max(...gaps.map((g) => Math.abs(g - mean))) / mean;
  const combo =
    wobble < TOLERANCE
      ? rhythm.combo
        ? rhythm.combo + 1
        : gaps.length + 1
      : 0;
  return { last: now, gaps, combo };
}
