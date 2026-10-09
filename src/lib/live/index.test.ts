import { afterEach, expect, it, vi } from 'vitest';

// No API keys: GitHub, which works without one, is the only source on the board.
vi.mock('astro:env/server', () => ({
  GITHUB_TOKEN: undefined,
  OSU_CLIENT_ID: undefined,
  OSU_CLIENT_SECRET: undefined,
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
  vi.stubGlobal(
    'fetch',
    async () =>
      new Response('{"message":"API rate limit exceeded"}', { status: 403 }),
  );
  const log = vi.spyOn(console, 'error').mockImplementation(() => {});
  const { getBoardSnapshot } = await import('./index');

  const snapshot = await getBoardSnapshot(true);

  expect(snapshot.data.github).toBeNull();
  expect(log).toHaveBeenCalledOnce();
  expect(log).toHaveBeenCalledWith(
    expect.stringContaining('github'),
    expect.objectContaining({ message: '403 from api.github.com' }),
  );
});
