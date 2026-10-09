import { afterEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** The ticket machine on a 1280 × 800 screen: a 760 × 600 panel with 18px of padding. */
async function machine({ open = true } = {}) {
  const dialog = {
    open,
    showModal() {
      this.open = true;
    },
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
    querySelector: () => null,
  };
  const page = fakeBrowser({
    elements: { '[data-ticket-machine]': dialog },
  });
  await import('./tickets');
  const click = (target: object, clientX: number, clientY: number) =>
    page.document.fire('click', { target, clientX, clientY });
  /** A key pressed with nothing focused. */
  const key = (key: string, repeat = false) =>
    page.document.fire('keydown', {
      key,
      repeat,
      target: page.document.body,
      metaKey: false,
      ctrlKey: false,
      altKey: false,
      preventDefault() {},
    });
  return { dialog, click, key };
}

const openMachine = () => machine({ open: true });

describe('ticket machine', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('opens once when / is held down', async () => {
    const { dialog, key } = await machine({ open: false });
    key('/');
    for (let i = 0; i < 3; i++) key('/', true);
    expect(dialog.open).toBe(true);
  });

  it('closes again on the next press of /', async () => {
    const { dialog, key } = await machine({ open: false });
    key('/');
    key('/');
    expect(dialog.open).toBe(false);
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
