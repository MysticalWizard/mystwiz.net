import { afterEach, expect, it, vi } from 'vitest';

// No API keys: GitHub, which works without one, and the status page are the only sources. One
// override is set by hand, with a typo in another.
vi.mock('astro:env/server', () => ({
  GITHUB_TOKEN: undefined,
  OSU_CLIENT_ID: undefined,
  OSU_CLIENT_SECRET: undefined,
  STATUS_OVERRIDE: '{"cp":"maintenance","zz":"suspended"}',
  STEAM_API_KEY: undefined,
  TWITCH_CLIENT_ID: undefined,
  TWITCH_CLIENT_SECRET: undefined,
  YOUTUBE_API_KEY: undefined,
}));

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it('logs a source that fails, so a bad key or an outage shows up in the Worker logs', async () => {
  vi.stubGlobal('fetch', async (input: string) =>
    input.startsWith('https://status.mystwiz.net/')
      ? Response.json({ updatedAt: new Date().toISOString(), components: [] })
      : new Response('{"message":"API rate limit exceeded"}', { status: 403 }),
  );
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { getBoardSnapshot } = await import('./index');

  const snapshot = await getBoardSnapshot(true);

  expect(snapshot.data.github).toBeNull();
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('github'),
    expect.objectContaining({ message: '403 from api.github.com' }),
  );
  // The override's typo is logged too, once, and the rest of it still applies.
  expect(log).toHaveBeenCalledWith(expect.stringContaining('"zz"'));
  expect(log).toHaveBeenCalledTimes(2);
  expect(snapshot.data.overrides).toEqual({ cp: 'maintenance' });
  expect(snapshot.data.services?.lines).toEqual({ ms: 'service' });

  log.mockClear();
  await getBoardSnapshot(true);
  expect(log).not.toHaveBeenCalledWith(expect.stringContaining('"zz"'));
});
