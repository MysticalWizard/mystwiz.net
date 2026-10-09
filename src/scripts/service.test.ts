import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

/** A page in night service, with the sweep band ready. */
async function page() {
  const sweep = {
    dataset: { day: 'Day service', night: 'Night service' },
    classList: { add: () => {}, remove: () => {} },
    offsetWidth: 0,
    querySelector: () => ({ textContent: '' }),
  };
  fakeBrowser({ elements: { '[data-sweep]': sweep } });
  return import('./service');
}

describe('day and night service', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('switches once the band covers the screen', async () => {
    const { switchService, currentService } = await page();
    void switchService();
    await vi.advanceTimersByTimeAsync(400);
    expect(currentService()).toBe('night');
    await vi.advanceTimersByTimeAsync(100);
    expect(currentService()).toBe('day');
  });

  it('ignores a second click while the band is crossing', async () => {
    const { switchService, currentService } = await page();
    void switchService();
    await vi.advanceTimersByTimeAsync(200);
    void switchService();
    expect(currentService()).toBe('night');
    await vi.advanceTimersByTimeAsync(2000);
    expect(currentService()).toBe('day');
  });

  it('switches back on a click after the band has passed', async () => {
    const { switchService, currentService } = await page();
    void switchService();
    await vi.advanceTimersByTimeAsync(1500);
    void switchService();
    await vi.advanceTimersByTimeAsync(1500);
    expect(currentService()).toBe('night');
  });
});
