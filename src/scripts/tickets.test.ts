import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** The open ticket machine on a 1280 × 800 screen: a 760 × 600 panel with 18px of padding. */
async function openMachine() {
  const dialog = {
    open: true,
    close() {
      this.open = false;
    },
    getBoundingClientRect: () => ({
      left: 260,
      top: 100,
      right: 1020,
      bottom: 700,
    }),
    closest: () => null,
  };
  const page = fakeBrowser({
    elements: { '[data-ticket-machine]': dialog },
  });
  await import('./tickets');
  const click = (target: object, clientX: number, clientY: number) =>
    page.document.fire('click', { target, clientX, clientY });
  return { dialog, click };
}

describe('ticket machine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('stays open when a click lands on its own padding', async () => {
    const { dialog, click } = await openMachine();
    // Clicks on the dialog's padding are dispatched to the dialog itself, like backdrop clicks.
    click(dialog, 268, 400);
    expect(dialog.open).toBe(true);
  });

  it('closes when the backdrop around it is clicked', async () => {
    const { dialog, click } = await openMachine();
    click(dialog, 120, 400);
    expect(dialog.open).toBe(false);
  });

  it('closes from its Esc button', async () => {
    const { dialog, click } = await openMachine();
    const esc = {
      closest: (selector: string) => (selector === '[data-close]' ? {} : null),
    };
    click(esc, 990, 130);
    expect(dialog.open).toBe(false);
  });
});
