import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fakeBrowser } from './fake-browser';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));
vi.mock('astro:transitions/client', () => ({ navigate }));

/** The ticket machine on a 1280 × 800 screen: a 760 × 600 panel with 18px of padding. */
async function machine({ open = true } = {}) {
  const ticket = {
    classList: { add: () => {}, remove: () => {} },
    replaceChildren: () => {},
  };
  const dialog = {
    open,
    dataset: {
      from: 'MZ01 Home',
      ticketHead: 'MZ Line · One way · No. {no}',
      ticketValid: 'Valid today only',
    },
    showModal() {
      this.open = true;
    },
    /** Closing fires "close", whether it's close() or Esc that closes it. */
    close() {
      this.open = false;
      page.document.fire('close', { target: this });
    },
    getBoundingClientRect: () => ({
      left: 260,
      top: 100,
      right: 1020,
      bottom: 700,
    }),
    matches: (selector: string) => selector === '[data-ticket-machine]',
    closest: () => null,
    querySelector: (selector: string) =>
      selector === '[data-ticket]' ? ticket : null,
  };
  /** The fare button for About, one stop from Home. */
  const fare = {
    dataset: { fare: 'about', href: '/about/', code: 'MZ02 About', yen: '140' },
    getAttribute: () => null,
    closest(selector: string) {
      return selector === '[data-fare]' ? this : null;
    },
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
  return { dialog, fare, click, key };
}

const openMachine = () => machine({ open: true });

describe('ticket machine', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    navigate.mockClear();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('prints a ticket, then rides to the station on it', async () => {
    const { dialog, fare, click } = await openMachine();
    click(fare, 400, 300);
    await vi.advanceTimersByTimeAsync(2000);
    expect(dialog.open).toBe(false);
    expect(navigate.mock.calls).toEqual([['/about/']]);
  });

  it('prints one ticket and rides once when a fare is clicked twice', async () => {
    const { fare, click } = await openMachine();
    click(fare, 400, 300);
    await vi.advanceTimersByTimeAsync(100);
    click(fare, 400, 300);
    await vi.advanceTimersByTimeAsync(2000);
    expect(navigate.mock.calls).toEqual([['/about/']]);
  });

  it('does not ride when the machine is closed while the ticket prints', async () => {
    const { dialog, fare, click } = await openMachine();
    click(fare, 400, 300);
    await vi.advanceTimersByTimeAsync(300);
    dialog.close();
    await vi.advanceTimersByTimeAsync(2000);
    expect(navigate).not.toHaveBeenCalled();
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
