// The ticket machine (TicketMachine.astro). A native modal <dialog>, so focus stays inside
// and Esc closes it; arrow keys move between the buttons like on a real machine.
import { navigate } from 'astro:transitions/client';
import { tick } from './sound';
import { store } from './store';

/** Time for the ticket to come out of the slot and rest a moment before it is punched. */
const PRINT_MS = 600;
/** Time for the punch to land and the punched-out bit to fall before the ride starts. */
const PUNCH_MS = 300;

const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const wait = (ms: number) => new Promise((done) => setTimeout(done, ms));
let lastFocus: HTMLElement | null = null;
/** The fare whose ticket is printing. Closing the machine cancels its ride. */
let printing: HTMLElement | undefined;

const machine = () =>
  document.querySelector<HTMLDialogElement>('[data-ticket-machine]');

export function openTickets(): void {
  const dialog = machine();
  if (!dialog || dialog.open) return;
  lastFocus = document.activeElement as HTMLElement | null;
  dialog.querySelector('[data-ticket]')?.classList.remove('out', 'punched');
  dialog.showModal();
  dialog
    .querySelector<HTMLElement>('.fare:not([aria-disabled="true"])')
    ?.focus();
}

export function closeTickets(): void {
  const dialog = machine();
  if (dialog?.open) dialog.close();
}

// Focus goes back to where it was (the dialog's own restore isn't in every browser yet).
document.addEventListener(
  'close',
  (event) => {
    if (!(event.target as Element).matches?.('[data-ticket-machine]')) return;
    printing = undefined;
    if (lastFocus?.isConnected) lastFocus.focus({ preventScroll: true });
    lastFocus = null;
  },
  true,
);

const typing = (el: Element) =>
  (el instanceof HTMLElement && el.isContentEditable) ||
  el.matches('input, textarea, select');

/** Whether a click landed outside the element's box. */
const outside = (el: Element, { clientX: x, clientY: y }: MouseEvent) => {
  const box = el.getBoundingClientRect();
  return x < box.left || x > box.right || y < box.top || y > box.bottom;
};

document.addEventListener('keydown', (event) => {
  const dialog = machine();
  const open = Boolean(dialog?.open);
  const shortcut =
    (event.key === '/' &&
      !event.metaKey &&
      !event.ctrlKey &&
      !event.altKey &&
      !typing(event.target as Element)) ||
    ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k');
  if (shortcut) {
    event.preventDefault();
    // Holding the key down opens or closes the machine once.
    if (event.repeat) return;
    if (open) closeTickets();
    else openTickets();
    return;
  }
  if (open && dialog) moveFocus(dialog, event);
});

/** Arrow keys: left and right step through the buttons; up and down go to the row above or below. */
function moveFocus(dialog: HTMLDialogElement, event: KeyboardEvent) {
  const keys = ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'];
  if (!keys.includes(event.key)) return;
  const items = [...dialog.querySelectorAll<HTMLElement>('.fare')];
  const current = items.indexOf(document.activeElement as HTMLElement);
  event.preventDefault();
  if (current < 0) {
    items[0]?.focus();
    return;
  }
  if (event.key === 'ArrowLeft' || event.key === 'ArrowRight') {
    const step = event.key === 'ArrowRight' ? 1 : -1;
    items[(current + step + items.length) % items.length].focus();
    return;
  }
  const from = items[current].getBoundingClientRect();
  const down = event.key === 'ArrowDown';
  const rows = items
    .map((el) => ({ el, rect: el.getBoundingClientRect() }))
    .filter(({ rect }) =>
      down ? rect.top > from.top + 4 : rect.top < from.top - 4,
    );
  if (!rows.length) return;
  const rowTop = down
    ? Math.min(...rows.map(({ rect }) => rect.top))
    : Math.max(...rows.map(({ rect }) => rect.top));
  const centre = from.left + from.width / 2;
  const target = rows
    .filter(({ rect }) => Math.abs(rect.top - rowTop) < 4)
    .sort(
      (a, b) =>
        Math.abs(a.rect.left + a.rect.width / 2 - centre) -
        Math.abs(b.rect.left + b.rect.width / 2 - centre),
    )[0];
  target?.el.focus();
}

document.addEventListener('click', async (event) => {
  const target = event.target as Element;
  if (target.closest('[data-open-tickets]')) {
    openTickets();
    return;
  }
  const dialog = machine();
  if (!dialog?.open) return;
  // A click on the dimmed backdrop lands on the dialog element itself, but so does one on the
  // dialog's padding or between its rows: only a click outside its box is on the backdrop.
  if (
    target.closest('[data-close]') ||
    (target === dialog && outside(dialog, event))
  ) {
    closeTickets();
    return;
  }
  const button = target.closest<HTMLElement>('[data-fare]');
  if (!button || button.getAttribute('aria-disabled') === 'true') return;
  // One ticket at a time.
  if (printing) return;
  printing = button;
  await printTicket(dialog, button);
  // The machine was closed while the ticket printed (Esc, the backdrop): no punch, no ride.
  if (printing !== button) return;
  await punchTicket(dialog);
  if (printing !== button) return;
  printing = undefined;
  closeTickets();
  if (button.dataset.href) navigate(button.dataset.href);
});

/** Prints a numbered one-way ticket for the ride; the number counts up in this browser. */
async function printTicket(dialog: HTMLDialogElement, button: HTMLElement) {
  const ticket = dialog.querySelector<HTMLElement>('[data-ticket]');
  if (!ticket) return;
  const number = store.get('tickets', 0) + 1;
  store.set('tickets', number);
  const now = new Date();
  const time = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const route = document.createElement('b');
  route.textContent = `${dialog.dataset.from} → ${button.dataset.code}`;
  ticket.replaceChildren(
    (dialog.dataset.ticketHead ?? '').replace(
      '{no}',
      String(number).padStart(4, '0'),
    ),
    route,
    `¥${button.dataset.yen} · ${time} · ${dialog.dataset.ticketValid ?? ''}`,
  );
  tick(true);
  if (reducedMotion.matches) return;
  ticket.classList.add('out');
  await wait(PRINT_MS);
}

/** Punches a hole in the ticket, the way a gate clips a paper ticket, before the ride. */
async function punchTicket(dialog: HTMLDialogElement) {
  const ticket = dialog.querySelector<HTMLElement>('[data-ticket]');
  if (!ticket || reducedMotion.matches) return;
  ticket.classList.add('punched');
  await wait(PUNCH_MS);
}
