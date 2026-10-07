// "Try the Wooting": stream speed the way osu! players count it. Taps per second × 15 gives the
// BPM of a stream of 1/4 notes. Measured over the most recent taps; the best needs a real run.

export interface Taps {
  /** Times of the most recent taps (ms). */
  times: number[];
  count: number;
  bpm: number;
  best: number;
}

const WINDOW = 24;
const MIN_FOR_BPM = 4;
const MIN_FOR_BEST = 8;
const MAX_BPM = 999;

export const emptyTaps = (): Taps => ({ times: [], count: 0, bpm: 0, best: 0 });

export function tapAt(taps: Taps, now: number): Taps {
  const times = [...taps.times, now].slice(-WINDOW);
  const span = times[times.length - 1] - times[0];
  let { bpm, best } = taps;
  if (times.length >= MIN_FOR_BPM && span > 0) {
    bpm = Math.round(((times.length - 1) / span) * 1000 * 15);
    if (times.length >= MIN_FOR_BEST && bpm > best && bpm < MAX_BPM) best = bpm;
  }
  return { times, count: taps.count + 1, bpm, best };
}

/** After a pause the run starts over; the best stays. */
export const idleTaps = (taps: Taps): Taps => ({
  ...emptyTaps(),
  best: taps.best,
});

/** Readouts are three dot-matrix digits. */
export const readout = (n: number) =>
  String(Math.min(MAX_BPM, n)).padStart(3, '0');
