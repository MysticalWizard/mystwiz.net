// Hold to depart. Holding the next-train button (or Space, anywhere) for 950ms departs for the
// next station. While holding: the button's approach ring closes in, the HUD counts up the
// speed, speed lines stream past (see fx.ts), the hero train speeds up and the route-bar train
// creeps toward the next stop. Letting go early decays back to zero.
import { nextStation, stationIndex } from '../data/stations';
import { currentStation, rideNext } from './ride';
import { speed } from './speed';
import { toast } from './toast';

const HOLD_MS = 950;
/** A Space press shorter than this still scrolls the page. */
const SPACE_HOLD_DELAY_MS = 170;
const DECAY_MS = 380;
/** The route-bar train creeps this share of the way to the next stop. */
const CREEP = 0.3;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

export const hold = {
  on: false,
  /** Progress from 0 to 1. */
  p: 0,
  start: 0,
  raf: 0,
  button: null as HTMLElement | null,
};

let riding = false;
document.addEventListener('mz:depart', () => {
  riding = true;
  release(false);
});
document.addEventListener('mz:arrive', () => {
  riding = false;
});

const holdButton = () =>
  document.querySelector<HTMLElement>('main [data-hold]');

function render(p: number) {
  hold.p = p;
  speed.hold = p;
  const kmh = String(Math.round(p * p * 95)).padStart(3, '0');

  const hud = document.querySelector<HTMLElement>('[data-hud]');
  if (hud) {
    hud.classList.toggle('on', p > 0.02);
    hud.style.setProperty('--p', p.toFixed(3));
    const readout = hud.querySelector('[data-hud-speed]');
    if (readout) readout.textContent = kmh;
  }

  const button = hold.button ?? holdButton();
  button?.style.setProperty('--p', p.toFixed(3));
  const speedo = button
    ?.closest('[data-next-train]')
    ?.querySelector('[data-speed]');
  if (speedo) speedo.textContent = kmh;

  const mark = document.querySelector<HTMLElement>('[data-train-mark]');
  const here = currentStation();
  if (mark && here) {
    const from = stationIndex(here);
    const to = stationIndex(nextStation(here).id);
    mark.classList.toggle('creep', p > 0);
    mark.style.setProperty('--i', String(from + (to - from) * p * CREEP));
  }
}

function nudge(button: HTMLElement) {
  button.classList.remove('nudge');
  void button.offsetWidth;
  button.classList.add('nudge');
  if (button.dataset.nudge) toast(button.dataset.nudge);
}

export function press(button: HTMLElement | null): void {
  if (!button || hold.on || riding) return;
  hold.on = true;
  hold.button = button;
  // Picking up again during a decay continues from where the progress fell to.
  hold.start = performance.now() - hold.p * HOLD_MS;
  button.classList.add('holding');
  const to = document.querySelector('[data-hud-to]');
  if (to) to.textContent = button.dataset.hudText ?? '';

  const step = () => {
    const p = Math.min(1, (performance.now() - hold.start) / HOLD_MS);
    render(p);
    if (p >= 1) {
      release(true);
      rideNext();
      return;
    }
    hold.raf = requestAnimationFrame(step);
  };
  step();
}

/** Ends a hold: `departed` when it ran to the end, otherwise the progress decays to zero. */
export function release(departed: boolean): void {
  if (!hold.on) return;
  cancelAnimationFrame(hold.raf);
  hold.on = false;
  const button = hold.button;
  button?.classList.remove('holding');

  if (departed) {
    // The ride takes over from here; the route-bar train slides on from where it crept to.
    hold.p = 0;
    speed.hold = 0;
    hold.button = null;
    document.querySelector('[data-hud]')?.classList.remove('on');
    document.querySelector('[data-train-mark]')?.classList.remove('creep');
    return;
  }

  const from = hold.p;
  const start = performance.now();
  const decay = () => {
    if (hold.on) return;
    const k = Math.min(1, (performance.now() - start) / DECAY_MS);
    render(from * (1 - k) * (1 - k));
    if (k < 1) requestAnimationFrame(decay);
    else hold.button = null;
  };
  decay();
  if (from < 0.15 && button) nudge(button);
}

/* ---------- pointer and touch ---------- */

document.addEventListener('pointerdown', (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-hold]');
  if (!button || event.button !== 0) return;
  event.preventDefault();
  try {
    button.setPointerCapture(event.pointerId);
  } catch {
    // Capture is best effort; pointerup on the document still ends the hold.
  }
  press(button);
});

for (const type of ['pointerup', 'pointercancel', 'lostpointercapture']) {
  document.addEventListener(type, () => release(false));
}

// Long presses on touch screens would otherwise open a context menu.
document.addEventListener('contextmenu', (event) => {
  if ((event.target as Element).closest('[data-hold]')) event.preventDefault();
});

// Clicking or pressing Enter is a tap, not a hold.
document.addEventListener('click', (event) => {
  const button = (event.target as Element).closest<HTMLElement>('[data-hold]');
  if (button && !hold.on && event.detail === 0) nudge(button);
});

/* ---------- keyboard: hold Space anywhere ---------- */

let spaceDown = false;
let spaceTimer = 0;

const usesSpace = (el: Element) =>
  (el instanceof HTMLElement && el.isContentEditable) ||
  el.matches('input, textarea, select') ||
  (el.closest('a, button, summary, [role="button"]') !== null &&
    !el.closest('[data-hold]'));

document.addEventListener('keydown', (event) => {
  if (event.code !== 'Space' || event.defaultPrevented) return;
  if (event.metaKey || event.ctrlKey || event.altKey) return;
  if (usesSpace(event.target as Element)) return;
  const button = holdButton();
  if (!button || document.querySelector('[data-overlay][open]')) return;
  event.preventDefault();
  if (event.repeat || spaceDown) return;
  spaceDown = true;
  spaceTimer = window.setTimeout(() => press(button), SPACE_HOLD_DELAY_MS);
});

document.addEventListener('keyup', (event) => {
  if (event.code !== 'Space' || !spaceDown) return;
  spaceDown = false;
  clearTimeout(spaceTimer);
  event.preventDefault();
  if (hold.on) {
    release(false);
  } else {
    // A quick tap: scroll like Space normally does.
    window.scrollBy({
      top: (event.shiftKey ? -1 : 1) * window.innerHeight * 0.8,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }
});

window.addEventListener('blur', () => {
  spaceDown = false;
  clearTimeout(spaceTimer);
  release(false);
});
