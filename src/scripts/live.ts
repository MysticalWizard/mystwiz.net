// Live data for the whole site. Asks the board endpoint on load and then every minute (paused
// while the tab is hidden), trying again after a failed request. It stops only when there is no
// live board to ask: no endpoint, or a board taken at build time. The departure board listens
// for mz:board, and the LIVE pill and "On air" tags follow data-on-air on <html>.
import type { BoardSnapshot } from '../lib/live/snapshot';

const ENDPOINT = '/api/board.json';
const POLL_MS = 60_000;

declare global {
  interface DocumentEventMap {
    'mz:board': CustomEvent<BoardSnapshot>;
  }
}

let latest: BoardSnapshot | undefined;
let polling = true;
let timer = 0;

/** The most recent board data from the endpoint, if any. */
export function latestBoard(): BoardSnapshot | undefined {
  return latest;
}

function showOnAir() {
  const onAir = latest?.mode === 'live' && Boolean(latest.data.twitch?.live);
  document.documentElement.toggleAttribute('data-on-air', onAir);
}

async function refresh() {
  clearTimeout(timer);
  try {
    const res = await fetch(ENDPOINT, {
      headers: { Accept: 'application/json' },
    });
    if (res.ok) {
      latest = (await res.json()) as BoardSnapshot;
      polling = latest.mode === 'live';
      showOnAir();
      document.dispatchEvent(new CustomEvent('mz:board', { detail: latest }));
    } else if (res.status === 404) {
      polling = false;
    }
  } catch {
    // Offline: the board keeps what it has until the next try.
  }
  if (polling && document.visibilityState === 'visible') {
    timer = window.setTimeout(refresh, POLL_MS);
  }
}

document.addEventListener('visibilitychange', () => {
  if (!polling) return;
  if (document.visibilityState === 'visible') void refresh();
  else clearTimeout(timer);
});

// <html> attributes come from the next page on every ride; keep the on-air state.
document.addEventListener('astro:before-swap', (event) => {
  if (document.documentElement.hasAttribute('data-on-air')) {
    event.newDocument.documentElement.setAttribute('data-on-air', '');
  }
});

void refresh();
