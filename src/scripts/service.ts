// Day and night service (the color theme). The inline script in Base.astro applies the stored
// choice before first paint, so it repeats the storage key and colors used here.
import { store } from './store';

export type Service = 'night' | 'day';

const THEME_COLOR: Record<Service, string> = {
  night: '#0b0b0a',
  day: '#e7e6e0',
};

export function currentService(): Service {
  return document.documentElement.dataset.service === 'day' ? 'day' : 'night';
}

export function applyService(service: Service): void {
  document.documentElement.dataset.service = service;
  document
    .querySelector('meta[name="theme-color"]')
    ?.setAttribute('content', THEME_COLOR[service]);
  store.set('service', service);
}
