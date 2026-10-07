import { describe, expect, it } from 'vitest';
import en from '../i18n/en';
import { formatAge, formatBoard, rowLabel, type BoardData } from './board';

const now = new Date('2026-10-07T12:00:00Z');
const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
const MIN = 60_000;
const HOUR = 60 * MIN;
const DAY = 24 * HOUR;

describe('formatAge', () => {
  it.each([
    [20_000, 'just now'],
    [5 * MIN, '5m ago'],
    [2 * HOUR + 10 * MIN, '2h ago'],
    [3 * DAY, '3d ago'],
    [45 * DAY, '1mo ago'],
    [400 * DAY, '1y ago'],
  ])('%i ms ago reads "%s"', (ms, text) => {
    expect(formatAge(ago(ms), now, en.departures.ago)).toBe(text);
  });

  it('treats timestamps from the future as just now', () => {
    expect(formatAge(ago(-5 * MIN), now, en.departures.ago)).toBe('just now');
  });
});

describe('formatBoard', () => {
  const data: BoardData = {
    twitch: { live: false, lastStreamAt: ago(2 * DAY), updatedAt: ago(MIN) },
    youtube: {
      subscribers: 1284,
      latestUploadAt: ago(3 * DAY),
      updatedAt: ago(MIN),
    },
    github: {
      lastPushAt: ago(2 * HOUR),
      commitsThisYear: 312,
      updatedAt: ago(MIN),
    },
    osu: { globalRank: 48213, pp: 6912, updatedAt: ago(MIN) },
    steam: { online: false, lastOnlineAt: ago(5 * HOUR), updatedAt: ago(MIN) },
  };

  it('gives every row two states that alternate on the board', () => {
    const rows = formatBoard(data, now, en.departures);
    expect(rows.yr.states).toEqual(['Now building', 'Anime recommender']);
    expect(rows.tw.states).toEqual(['Off air', 'Last stream 2d ago']);
    expect(rows.yt.states).toEqual([
      '1,284 subscribers',
      'Latest upload 3d ago',
    ]);
    expect(rows.gh.states).toEqual([
      'Last push 2h ago',
      '312 commits this year',
    ]);
    expect(rows.osu.states).toEqual(['#48,213 global', '6,912 pp']);
    expect(rows.st.states).toEqual(['Offline', 'Last online 5h ago']);
  });

  it('lights the Twitch row while on air, with the stream title', () => {
    const rows = formatBoard(
      {
        ...data,
        twitch: {
          live: true,
          title: 'Building the MZ Line',
          updatedAt: ago(0),
        },
      },
      now,
      en.departures,
    );
    expect(rows.tw).toEqual({
      live: true,
      empty: false,
      states: ['On air now', 'Building the MZ Line'],
    });
    expect(rows.yt.live).toBe(false);
  });

  it('shows what is playing when Steam is online', () => {
    const rows = formatBoard(
      { ...data, steam: { online: true, game: 'osu!', updatedAt: ago(0) } },
      now,
      en.departures,
    );
    expect(rows.st.states).toEqual(['Online', 'Playing osu!']);
  });

  it('reads no data when a source has not answered, or has nothing to show', () => {
    const rows = formatBoard(
      { ...data, youtube: null, osu: { updatedAt: ago(0) } },
      now,
      en.departures,
    );
    const noData = { live: false, empty: true, states: ['No data', 'No data'] };
    expect(rows.yt).toEqual(noData);
    expect(rows.osu).toEqual(noData);
    expect(rows.gh.empty).toBe(false);
  });

  it('reads not connected when a source has no API key', () => {
    const rows = formatBoard({ ...data, steam: undefined }, now, en.departures);
    expect(rows.st).toEqual({
      live: false,
      empty: true,
      states: ['No data', 'Not connected'],
    });
  });

  it('falls back to the other half of a row when one value is missing', () => {
    const rows = formatBoard(
      { ...data, github: { lastPushAt: ago(2 * HOUR), updatedAt: ago(0) } },
      now,
      en.departures,
    );
    expect(rows.gh.states).toEqual(['Last push 2h ago', 'Last push 2h ago']);
  });
});

describe('formatBoard without commit counts', () => {
  it('names the repo of the latest push instead', () => {
    const rows = formatBoard(
      {
        twitch: null,
        youtube: null,
        osu: null,
        steam: null,
        github: {
          lastPushAt: ago(2 * HOUR),
          repo: 'mystwiz.net',
          updatedAt: ago(0),
        },
      },
      now,
      en.departures,
    );
    expect(rows.gh.states).toEqual(['Last push 2h ago', 'To mystwiz.net']);
  });
});

describe('rowLabel', () => {
  it('reads both states, or one when they match', () => {
    expect(
      rowLabel({
        live: false,
        empty: false,
        states: ['Off air', 'Last stream 2d ago'],
      }),
    ).toBe('Off air, Last stream 2d ago');
    expect(
      rowLabel({ live: false, empty: true, states: ['No data', 'No data'] }),
    ).toBe('No data');
  });
});
