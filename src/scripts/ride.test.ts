import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** A station page with ride.ts on it and nothing focused. */
async function station(path: string) {
  const page = fakeBrowser({ path });
  await import('./ride');
  const arrow = (key: 'ArrowLeft' | 'ArrowRight', repeat = false) =>
    page.document.fire('keydown', {
      key,
      repeat,
      target: page.document.body,
      defaultPrevented: false,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
    });
  return { arrow };
}

describe('riding with the arrow keys', () => {
  beforeEach(() => {
    navigate.mockClear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('rides to the next and previous stations, round the loop', async () => {
    const { arrow } = await station('/');
    arrow('ArrowRight');
    arrow('ArrowLeft');
    expect(navigate.mock.calls).toEqual([['/about/'], ['/specs/']]);
  });

  it('rides once when an arrow key is held down', async () => {
    const { arrow } = await station('/');
    arrow('ArrowRight');
    for (let i = 0; i < 5; i++) arrow('ArrowRight', true);
    expect(navigate).toHaveBeenCalledOnce();
  });
});
