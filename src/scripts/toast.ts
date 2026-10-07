// Short messages at the bottom of the screen (see Toast.astro). The toast is a status region,
// so screen readers announce the message too.
const SHOW_MS = 2200;
let timer = 0;

export function toast(message: string): void {
  const el = document.querySelector<HTMLElement>('[data-toast]');
  if (!el) return;
  el.textContent = message;
  el.classList.add('show');
  clearTimeout(timer);
  timer = window.setTimeout(() => el.classList.remove('show'), SHOW_MS);
}
