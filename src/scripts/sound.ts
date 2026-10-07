// Melodies. Off by default; the visitor turns them on in the route bar. When on: every station
// plays its own short chiptune departure melody on arrival (like Tokyo stations do), a two-tone
// chime sounds before each ride, and clicks, taps and the name scramble tick softly.
// All synthesized with Web Audio; there are no sound files.
import { station, stationForPath, type Note } from '../data/stations';

const SESSION_KEY = 'mz:melody';
/** The melody starts once the doors have opened. */
const MELODY_DELAY_MS = 450;

let audio: AudioContext | undefined;
let enabled = false;

try {
  enabled = sessionStorage.getItem(SESSION_KEY) === 'on';
} catch {
  // Storage blocked: start with sound off.
}

function context(): AudioContext | undefined {
  if (!audio) {
    const Context =
      window.AudioContext ??
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!Context) return undefined;
    audio = new Context();
  }
  if (audio.state === 'suspended') void audio.resume();
  return audio;
}

const hz = (note: number) => 440 * 2 ** ((note - 69) / 12);

function tone(
  frequency: number,
  at: number,
  duration: number,
  type: OscillatorType = 'triangle',
  volume = 0.07,
) {
  const ctx = context();
  if (!ctx) return;
  const oscillator = ctx.createOscillator();
  const gain = ctx.createGain();
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  gain.gain.setValueAtTime(0, at);
  gain.gain.linearRampToValueAtTime(volume, at + 0.012);
  gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
  oscillator.connect(gain).connect(ctx.destination);
  oscillator.start(at);
  oscillator.stop(at + duration + 0.03);
}

export function melody(notes: readonly Note[], bpm = 200): void {
  const ctx = enabled ? context() : undefined;
  if (!ctx) return;
  const beat = 60 / bpm;
  let at = ctx.currentTime + 0.05;
  for (const [note, beats] of notes) {
    tone(hz(note), at, Math.max(0.12, beats * beat * 1.4), 'triangle', 0.075);
    tone(hz(note + 12), at, 0.08, 'square', 0.012);
    at += beats * beat;
  }
}

/** Two-tone door chime. */
export function chime(): void {
  const ctx = enabled ? context() : undefined;
  if (!ctx) return;
  const at = ctx.currentTime + 0.02;
  tone(hz(88), at, 0.35, 'sine', 0.08);
  tone(hz(84), at + 0.28, 0.55, 'sine', 0.08);
}

/** A soft tick; `strong` for hits on a combo and printed tickets. */
export function tick(strong = false): void {
  const ctx = enabled ? context() : undefined;
  if (!ctx) return;
  tone(strong ? 1600 : 2200, ctx.currentTime, 0.045, 'square', 0.018);
}

export function soundOn(): boolean {
  return enabled;
}

export function setSound(on: boolean): void {
  enabled = on;
  try {
    sessionStorage.setItem(SESSION_KEY, on ? 'on' : 'off');
  } catch {
    // The choice just won't survive a reload.
  }
  if (on) {
    const here = stationForPath(location.pathname);
    if (here) melody(station(here.id).melody);
  }
}

document.addEventListener('mz:depart', () => chime());
document.addEventListener('mz:arrive', (event) => {
  const to = event.detail.to;
  if (to) setTimeout(() => melody(station(to).melody), MELODY_DELAY_MS);
});
document.addEventListener('mz:hit', (event) => tick(event.detail.combo >= 4));
