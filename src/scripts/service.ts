// Day and night service (the color theme). The inline script in Base.astro applies the stored
// choice before first paint, so it repeats the storage key and colors used here.
import { chime } from './sound';
import { store } from './store';

export type Service = 'night' | 'day';

const THEME_COLOR: Record<Service, string> = {
  night: '#0b0b0a',
  day: '#e7e6e0',
};

export function currentService(): Service {
  return document.documentElement.dataset.service === 'day' ? 'day' : 'night';
}

/** Pages are rendered in night service: copy the current service onto a page about to be swapped in. */
export function carryService(doc: Document): void {
  const service = currentService();
  doc.documentElement.dataset.service = service;
  doc
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[service]);
}

declare global {
  interface DocumentEventMap {
    'mz:service': CustomEvent<Service>;
  }
}

export function applyService(service: Service): void {
  document.documentElement.dataset.service = service;
  document.dispatchEvent(new CustomEvent('mz:service', { detail: service }));
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[service]);
  store.set('service', service);
}

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
let sweeping = false;

/** Switches service behind the sweep band (instantly under reduced motion). */
export async function switchService(): Promise<void> {
  // A click while the band is crossing is ignored: the service may only change behind it.
  if (sweeping) return;
  const next: Service = currentService() === 'day' ? 'night' : 'day';
  const sweep = document.querySelector<HTMLElement>('[data-sweep]');
  if (!sweep || reducedMotion.matches) {
    applyService(next);
    return;
  }
  sweeping = true;
  const text = sweep.querySelector('[data-sweep-text]');
  if (text) text.textContent = sweep.dataset[next] ?? '';
  sweep.classList.remove('go');
  void sweep.offsetWidth;
  sweep.classList.add('go');
  chime();
  // The band covers the screen halfway through; flip the service then.
  await wait(470);
  applyService(next);
  await wait(520);
  sweep.classList.remove('go');
  sweeping = false;
}
