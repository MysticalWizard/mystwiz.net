import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { BoardSnapshot } from '../lib/live/snapshot';
import { fakeBrowser } from './fake-browser';

const MINUTE = 60_000;

const live: BoardSnapshot = {
  mode: 'live',
  generatedAt: '2026-10-08T12:00:00.000Z',
  data: {
    github: {
      lastPushAt: '2026-10-08T11:00:00Z',
      repo: 'mystwiz.net',
      updatedAt: '2026-10-08T12:00:00.000Z',
    },
  },
};

type Answer = BoardSnapshot | number | 'offline';

/** The board endpoint, answering each request in turn; the last answer repeats. */
function endpoint(...answers: Answer[]) {
  let request = 0;
  return vi.fn(async () => {
    const answer = answers[Math.min(request++, answers.length - 1)];
    if (answer === 'offline') throw new TypeError('Failed to fetch');
    if (typeof answer === 'number')
      return new Response(null, { status: answer });
    return Response.json(answer);
  });
}

/** Opens a page with live.ts on it and lets its first request finish. */
async function openPage(fetch: ReturnType<typeof endpoint>) {
  const page = fakeBrowser();
  vi.stubGlobal('fetch', fetch);
  const boards: BoardSnapshot[] = [];
  page.document.addEventListener(
    'mz:board',
    (event: CustomEvent<BoardSnapshot>) => boards.push(event.detail),
  );
  await import('./live');
  await vi.advanceTimersByTimeAsync(0);
  const show = (state: DocumentVisibilityState) => {
    page.document.visibilityState = state;
    page.document.fire('visibilitychange');
  };
  return { boards, show };
}

describe('live board updates', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('asks the board endpoint every minute while it answers live', async () => {
    const fetch = endpoint(live);
    const { boards } = await openPage(fetch);
    await vi.advanceTimersByTimeAsync(3 * MINUTE);
    expect(fetch).toHaveBeenCalledTimes(4);
    expect(boards).toHaveLength(4);
  });

  it.each([
    ['the network is down', 'offline'],
    ['the server errors', 503],
  ] as const)(
    'asks again a minute later when %s on the first request',
    async (_, failure) => {
      const fetch = endpoint(failure, live);
      const { boards } = await openPage(fetch);
      expect(boards).toEqual([]);
      await vi.advanceTimersByTimeAsync(MINUTE);
      expect(fetch).toHaveBeenCalledTimes(2);
      expect(boards).toEqual([live]);
    },
  );

  it('asks again as soon as the tab comes back after a failed request', async () => {
    const fetch = endpoint('offline', live);
    const { show } = await openPage(fetch);
    show('hidden');
    await vi.advanceTimersByTimeAsync(5 * MINUTE);
    expect(fetch).toHaveBeenCalledTimes(1);
    show('visible');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(2);
  });

  it.each([
    ['there is no board endpoint', 404],
    ['the board was taken at build time', { ...live, mode: 'snapshot' }],
  ] as const)('stops asking when %s', async (_, answer) => {
    const fetch = endpoint(answer);
    const { show } = await openPage(fetch);
    await vi.advanceTimersByTimeAsync(10 * MINUTE);
    show('hidden');
    show('visible');
    await vi.advanceTimersByTimeAsync(0);
    expect(fetch).toHaveBeenCalledTimes(1);
  });
});
