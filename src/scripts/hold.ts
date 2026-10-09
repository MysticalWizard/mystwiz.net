// Hold to depart. Holding the next-train button (or Space, anywhere) for 950ms departs for the
// next station; holding Shift+Space departs for the previous one. While holding: the button's
// approach ring closes in, the HUD counts up the speed, speed lines stream past (see fx.ts), the
// hero train speeds up and the route-bar train creeps toward the stop it's heading for. Letting
// go early decays back to zero.
import { nextStation, prevStation, stationIndex } from '../data/stations';
import { currentStation, rideNext, ridePrev } from './ride';
import { speed } from './speed';
import { toast } from './toast';

const HOLD_MS = 950;
/** A Space press shorter than this still scrolls the page. */
const SPACE_HOLD_DELAY_MS = 170;
const DECAY_MS = 380;
/** How far the route-bar train creeps toward the next station, in stops. */
const CREEP = 0.3;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

declare global {
  interface DocumentEventMap {
    /** Someone started holding to depart: effects that follow the speed wake up. */
    'mz:hold': CustomEvent<null>;
  }
}

export const hold = {
  on: false,
  /** Progress from 0 to 1. */
  p: 0,
  /** Heading for the previous station instead of the next. */
  back: false,
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
    const to = stationIndex((hold.back ? prevStation : nextStation)(here).id);
    mark.classList.toggle('creep', p > 0);
    // Where the loop wraps around (Specs on to Home, Home back to Specs) the stop is at the other
    // end of the bar: creep that way, the same short distance as from any other station.
    const creep = Math.sign(to - from) * p * CREEP;
    mark.style.setProperty('--i', String(from + creep));
  }
}

function nudge(button: HTMLElement) {
  button.classList.remove('nudge');
  void button.offsetWidth;
  button.classList.add('nudge');
  if (button.dataset.nudge) toast(button.dataset.nudge);
}

/** Starts holding to depart: for the next station, or the previous one when `back`. */
export function press(button: HTMLElement | null, back = false): void {
  if (!button || hold.on || riding) return;
  hold.on = true;
  hold.button = button;
  // Picking up again during a decay continues from where the progress fell to, unless the train
  // turns around: then it starts from a standstill.
  if (back !== hold.back) hold.p = 0;
  hold.back = back;
  hold.start = performance.now() - hold.p * HOLD_MS;
  button.classList.add('holding');
  const to = document.querySelector('[data-hud-to]');
  if (to) to.textContent = button.dataset[back ? 'hudPrev' : 'hudNext'] ?? '';
  document.dispatchEvent(new CustomEvent('mz:hold'));

  const step = () => {
    const p = Math.min(1, (performance.now() - hold.start) / HOLD_MS);
    render(p);
    if (p >= 1) {
      release(true);
      if (back) ridePrev();
      else rideNext();
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

/* ---------- keyboard: hold Space anywhere, Shift+Space to go back ---------- */

/** Up, down (a tap so far), or held long enough to count as holding to depart. */
let space: 'up' | 'down' | 'held' = 'up';
/** Shift was down when Space went down: a tap scrolls up, a hold departs for the previous stop. */
let spaceBack = false;
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
  if (event.repeat || space !== 'up') return;
  space = 'down';
  spaceBack = event.shiftKey;
  spaceTimer = window.setTimeout(() => {
    space = 'held';
    press(button, spaceBack);
  }, SPACE_HOLD_DELAY_MS);
});

document.addEventListener('keyup', (event) => {
  if (event.code !== 'Space' || space === 'up') return;
  const tap = space === 'down';
  space = 'up';
  clearTimeout(spaceTimer);
  event.preventDefault();
  if (hold.on) {
    release(false);
  } else if (tap) {
    // A quick tap: scroll like Space normally does. A hold never scrolls, even when the train
    // has already departed by the time it ends.
    window.scrollBy({
      top: (spaceBack ? -1 : 1) * window.innerHeight * 0.8,
      behavior: reducedMotion.matches ? 'auto' : 'smooth',
    });
  }
});

window.addEventListener('blur', () => {
  space = 'up';
  clearTimeout(spaceTimer);
  release(false);
});
