// Riding between stations. Astro's ClientRouter swaps pages; this module turns each swap into a
// ride: the doors close before the next station loads, tunnel lights rush past while it loads,
// and the doors open on the new station as its board arrives.
//
// Other parts of the site follow along through document events:
//   mz:depart  a ride was requested (doors about to close)
//   mz:ride    the doors are closed and the train is moving
//   mz:arrive  the new station has been swapped in
import { navigate } from 'astro:transitions/client';
import {
  nextStation,
  prevStation,
  station,
  stationForPath,
  type StationId,
} from '../data/stations';

export interface RideDetail {
  from?: StationId;
  to?: StationId;
}

declare global {
  interface DocumentEventMap {
    'mz:depart': CustomEvent<RideDetail>;
    'mz:ride': CustomEvent<RideDetail>;
    'mz:arrive': CustomEvent<RideDetail>;
  }
}

const CLOSE_MS = 320;
const RIDE_MS = 640;
const OPEN_MS = 360;
/** Pause between the swap and the doors opening, as the train settles. */
const SETTLE_MS = 90;
/** Long enough for the board's arrival and the staggered content to finish. */
const ARRIVAL_MS = 1500;
/** First visit: the doors open on load (see Doors.astro), then normal service resumes. */
const BOARDING_MS = 1800;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const root = document.documentElement;

const wait = (ms: number) => new Promise<void>((done) => setTimeout(done, ms));
const nextFrame = () =>
  new Promise<void>((done) =>
    requestAnimationFrame(() => requestAnimationFrame(() => done())),
  );

function emit(type: keyof DocumentEventMap, detail: RideDetail) {
  document.dispatchEvent(new CustomEvent(type, { detail }));
}

/** The station the current page belongs to. */
export function currentStation(): StationId | undefined {
  return stationForPath(location.pathname)?.id;
}

export function rideNext(): void {
  const here = currentStation();
  if (here) navigate(nextStation(here).href);
}

export function ridePrev(): void {
  const here = currentStation();
  if (here) navigate(prevStation(here).href);
}

/* ---------- doors ---------- */

const doors = () => document.querySelector<HTMLElement>('[data-doors]');
let closing: Promise<void> | undefined;

function showDestination(el: HTMLElement, to: StationId | undefined) {
  const led = el.querySelector('[data-led]');
  if (!led) return;
  const names = JSON.parse(el.dataset.names ?? '{}') as Record<string, string>;
  const dest = to ? `MZ${station(to).no} ${names[to] ?? ''}` : 'MZ ??';
  const tri = document.createElement('span');
  tri.className = 'tri';
  led.replaceChildren(el.dataset.next ?? 'Next', tri, dest);
}

function closeDoors(el: HTMLElement): Promise<void> {
  closing ??= (async () => {
    el.classList.add('on');
    await nextFrame();
    el.classList.add('closed');
    await wait(CLOSE_MS + 10);
  })();
  return closing;
}

async function openDoors(el: HTMLElement) {
  closing = undefined;
  el.classList.remove('moving', 'closed');
  await wait(OPEN_MS);
  if (!el.classList.contains('closed')) el.classList.remove('on');
}

/* ---------- arrival ---------- */

let arrivalTimer = 0;

function markArrival() {
  root.setAttribute('data-arriving', '');
  clearTimeout(arrivalTimer);
  arrivalTimer = window.setTimeout(
    () => root.removeAttribute('data-arriving'),
    ARRIVAL_MS,
  );
}

/** After a ride, focus moves to the station title (it has tabindex="-1"). */
function focusTitle() {
  document
    .querySelector<HTMLElement>('main h1')
    ?.focus({ preventScroll: true });
}

/* ---------- router hooks ---------- */

document.addEventListener('astro:before-preparation', (event) => {
  root.removeAttribute('data-boarding');
  const detail = {
    from: stationForPath(event.from.pathname)?.id,
    to: stationForPath(event.to.pathname)?.id,
  };
  emit('mz:depart', detail);

  const el = doors();
  if (!el || reducedMotion.matches) return;
  showDestination(el, detail.to);
  const load = event.loader;
  event.loader = async () => {
    await closeDoors(el);
    el.classList.add('moving');
    emit('mz:ride', detail);
    const ride = wait(RIDE_MS);
    await load();
    await ride;
  };
});

document.addEventListener('astro:after-swap', () => {
  emit('mz:arrive', { to: currentStation() });
  focusTitle();

  const el = doors();
  if (!el?.classList.contains('closed')) return;
  el.classList.remove('moving');
  markArrival();
  setTimeout(() => openDoors(el), SETTLE_MS);
});

if (root.hasAttribute('data-boarding')) {
  setTimeout(() => root.removeAttribute('data-boarding'), BOARDING_MS);
}

/* ---------- other ways to ride ---------- */

const leavesPage = (event: MouseEvent) =>
  event.button !== 0 ||
  event.metaKey ||
  event.ctrlKey ||
  event.shiftKey ||
  event.altKey;

// A link to the station you're already at scrolls back up instead of riding nowhere.
document.addEventListener(
  'click',
  (event) => {
    const link = (event.target as Element).closest('a');
    if (!link || event.defaultPrevented || leavesPage(event) || link.target) {
      return;
    }
    const url = new URL(link.href, location.href);
    if (
      url.origin === location.origin &&
      url.pathname === location.pathname &&
      url.search === location.search &&
      !url.hash
    ) {
      event.preventDefault();
      window.scrollTo({
        top: 0,
        behavior: reducedMotion.matches ? 'auto' : 'smooth',
      });
    }
  },
  { capture: true },
);

// Left and right arrows ride, unless focus is somewhere that uses the arrows itself.
document.addEventListener('keydown', (event) => {
  if (
    event.defaultPrevented ||
    event.metaKey ||
    event.ctrlKey ||
    event.altKey
  ) {
    return;
  }
  const target = event.target as Element;
  if (target !== document.body && !target.matches('main h1')) return;
  if (event.key === 'ArrowRight') rideNext();
  else if (event.key === 'ArrowLeft') ridePrev();
});

// Swiping sideways on a phone rides to the next or previous station.
let swipe: { x: number; y: number; t: number } | undefined;

document.addEventListener(
  'touchstart',
  (event) => {
    const target = event.target as Element;
    swipe =
      event.touches.length === 1 &&
      target.closest('main') &&
      !target.closest('[data-noswipe], [data-hold], .wordmark')
        ? {
            x: event.touches[0].clientX,
            y: event.touches[0].clientY,
            t: Date.now(),
          }
        : undefined;
  },
  { passive: true },
);

document.addEventListener(
  'touchend',
  (event) => {
    if (!swipe) return;
    const touch = event.changedTouches[0];
    const dx = touch.clientX - swipe.x;
    const dy = touch.clientY - swipe.y;
    if (Math.abs(dx) > 90 && Math.abs(dy) < 50 && Date.now() - swipe.t < 700) {
      if (dx < 0) rideNext();
      else ridePrev();
    }
    swipe = undefined;
  },
  { passive: true },
);
