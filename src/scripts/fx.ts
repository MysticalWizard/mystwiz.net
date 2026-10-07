// Canvas effects. Behind the page: speed lines that stream past while the train speeds up.
// Over the page: every press spawns an osu!-style approach circle that closes in on the point,
// then a hit burst; clicking on a steady beat shows a dot-matrix ×N combo that turns lit at ×8.
// All of it is off under reduced motion.
import { comboAfter, emptyRhythm } from '../lib/rhythm';
import { onFrame } from './frame';
import { speedLevel } from './speed';

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

const streakCanvas =
  document.querySelector<HTMLCanvasElement>('[data-streaks]');
const fxCanvas = document.querySelector<HTMLCanvasElement>('[data-fx]');
const streakCtx = streakCanvas?.getContext('2d');
const fxCtx = fxCanvas?.getContext('2d');

let width = 0;
let height = 0;
const colors = { fg: '', lit: '', line: '', led: '' };

function readColors() {
  const style = getComputedStyle(document.documentElement);
  colors.fg = style.getPropertyValue('--fg').trim();
  colors.lit = style.getPropertyValue('--lit').trim();
  colors.line = style.getPropertyValue('--line').trim();
  colors.led = style.getPropertyValue('--f-led').trim();
}

function size() {
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  width = window.innerWidth;
  height = window.innerHeight;
  for (const [canvas, ctx] of [
    [streakCanvas, streakCtx],
    [fxCanvas, fxCtx],
  ] as const) {
    if (!canvas || !ctx) continue;
    canvas.width = width * dpr;
    canvas.height = height * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
}

readColors();
size();
window.addEventListener('resize', size);
document.addEventListener('mz:service', readColors);

/* ---------- speed lines ---------- */

const streaks = Array.from({ length: 70 }, () => ({
  x: Math.random(),
  y: Math.random(),
  length: 0.3 + Math.random(),
  speed: 0.6 + Math.random(),
}));
let amount = 0;
let streaksDrawn = false;

onFrame((_, dt) => {
  if (!streakCtx) return;
  const target = reducedMotion.matches ? 0 : speedLevel();
  amount += (target - amount) * 0.12;
  if (amount < 0.01) {
    if (streaksDrawn) streakCtx.clearRect(0, 0, width, height);
    streaksDrawn = false;
    return;
  }
  streaksDrawn = true;
  streakCtx.clearRect(0, 0, width, height);
  streakCtx.strokeStyle = colors.line;
  streakCtx.lineCap = 'round';
  for (const s of streaks) {
    s.x -= s.speed * amount * dt * 0.0022;
    if (s.x < -0.3) {
      s.x = 1.1;
      s.y = Math.random();
    }
    const x = s.x * width;
    const y = s.y * height;
    streakCtx.globalAlpha = 0.55 * amount * s.speed;
    streakCtx.lineWidth = s.speed > 1.3 ? 2 : 1;
    streakCtx.beginPath();
    streakCtx.moveTo(x, y);
    streakCtx.lineTo(x + s.length * 220 * amount, y);
    streakCtx.stroke();
  }
  streakCtx.globalAlpha = 1;
});

/* ---------- approach circles and combo ---------- */

const HIT_MS = 150;
const RIPPLE_MS = 520;

interface Ripple {
  x: number;
  y: number;
  t: number;
  combo: number;
}

let ripples: Ripple[] = [];
let rhythm = emptyRhythm();
let stopDrawing: (() => void) | undefined;

function drawRipples(now: number) {
  if (!fxCtx) return;
  fxCtx.clearRect(0, 0, width, height);
  ripples = ripples.filter((r) => now - r.t < RIPPLE_MS);
  for (const r of ripples) {
    const age = now - r.t;
    const color = r.combo >= 8 ? colors.lit : colors.fg;
    fxCtx.lineWidth = 2;
    fxCtx.strokeStyle = color;
    fxCtx.fillStyle = color;
    if (age < HIT_MS) {
      // The approach circle closes in on the point.
      const k = age / HIT_MS;
      fxCtx.globalAlpha = 0.25 + 0.75 * k;
      fxCtx.beginPath();
      fxCtx.arc(r.x, r.y, 48 - 32 * k, 0, Math.PI * 2);
      fxCtx.stroke();
      fxCtx.globalAlpha = 0.18;
      fxCtx.beginPath();
      fxCtx.arc(r.x, r.y, 16, 0, Math.PI * 2);
      fxCtx.fill();
    } else {
      // Hit burst.
      const k = Math.min(1, (age - HIT_MS) / 300);
      fxCtx.globalAlpha = 1 - k;
      fxCtx.beginPath();
      fxCtx.arc(r.x, r.y, 16 + 26 * k, 0, Math.PI * 2);
      fxCtx.stroke();
      fxCtx.globalAlpha = (1 - k) * 0.35;
      fxCtx.beginPath();
      fxCtx.arc(r.x, r.y, 16 * (1 - k), 0, Math.PI * 2);
      fxCtx.fill();
    }
    if (r.combo >= 4) {
      fxCtx.globalAlpha = Math.max(0, 1 - age / RIPPLE_MS);
      fxCtx.fillStyle = r.combo >= 8 ? colors.lit : colors.line;
      fxCtx.font = `800 22px ${colors.led}`;
      fxCtx.fillText(`×${r.combo}`, r.x + 22, r.y - 18 - age * 0.03);
    }
  }
  fxCtx.globalAlpha = 1;
  if (!ripples.length) {
    stopDrawing?.();
    stopDrawing = undefined;
  }
}

document.addEventListener(
  'pointerdown',
  (event) => {
    const now = performance.now();
    rhythm = comboAfter(rhythm, now);
    // Listeners (the click tick) hear every hit; only the drawing is motion.
    document.dispatchEvent(
      new CustomEvent('mz:hit', { detail: { combo: rhythm.combo } }),
    );
    if (reducedMotion.matches || !fxCtx) return;
    ripples.push({
      x: event.clientX,
      y: event.clientY,
      t: now,
      combo: rhythm.combo,
    });
    stopDrawing ??= onFrame(drawRipples);
  },
  { capture: true, passive: true },
);

declare global {
  interface DocumentEventMap {
    'mz:hit': CustomEvent<{ combo: number }>;
  }
}
