// The departure board's data and how it reads on the LED rows. Each row alternates between two
// states, the way real boards alternate languages. This module is shared by the server render
// and the browser, so it stays free of DOM and server-only code.
import type { Strings } from '../i18n';

type Departures = Strings['departures'];

/** When the source was last fetched successfully (ISO 8601). */
interface Stamped {
  updatedAt: string;
}

export interface TwitchData extends Stamped {
  live: boolean;
  title?: string;
  lastStreamAt?: string;
}

export interface YouTubeData extends Stamped {
  subscribers?: number;
  latestUploadAt?: string;
}

export interface GitHubData extends Stamped {
  lastPushAt?: string;
  repo?: string;
  commitsThisYear?: number;
}

export interface OsuData extends Stamped {
  globalRank?: number;
  pp?: number;
}

export interface SteamData extends Stamped {
  online: boolean;
  game?: string;
  lastOnlineAt?: string;
}

/**
 * Last good value per source. A source with no API key is left out (its row reads "Not
 * connected"); one with a key is null until it has answered at least once ("No data").
 */
export interface BoardData {
  twitch?: TwitchData | null;
  youtube?: YouTubeData | null;
  github?: GitHubData | null;
  osu?: OsuData | null;
  steam?: SteamData | null;
}

export type BoardLineId = 'yr' | 'tw' | 'yt' | 'gh' | 'osu' | 'st';

export interface BoardRow {
  states: [string, string];
  /** Something is live right now: the row lights up. */
  live: boolean;
  /** Nothing real to show: the row is dimmed. */
  empty: boolean;
}

const MINUTE = 60_000;

export function fill(
  template: string,
  values: Record<string, string | number>,
) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) =>
    String(values[key] ?? ''),
  );
}

export function formatAge(at: string, now: Date, s: Departures['ago']): string {
  const minutes = Math.floor((now.getTime() - Date.parse(at)) / MINUTE);
  if (minutes < 1) return s.now;
  if (minutes < 60) return fill(s.m, { n: minutes });
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return fill(s.h, { n: hours });
  const days = Math.floor(hours / 24);
  if (days < 30) return fill(s.d, { n: days });
  if (days < 365) return fill(s.mo, { n: Math.floor(days / 30) });
  return fill(s.y, { n: Math.floor(days / 365) });
}

export function formatBoard(
  data: BoardData,
  now: Date,
  s: Departures,
): Record<BoardLineId, BoardRow> {
  const r = s.rows;
  const num = (n: number) => Math.round(n).toLocaleString(s.numberLocale);
  const age = (at: string) => formatAge(at, now, s.ago);
  const noData: BoardRow = {
    live: false,
    empty: true,
    states: [r.noData, r.noData],
  };
  // A source with nothing to show: null if it has an API key, left out if it hasn't.
  const missing = (value: null | undefined): BoardRow =>
    value === null
      ? noData
      : { live: false, empty: true, states: [r.noData, r.notConnected] };
  // Two states; if one is unknown the row shows the other in both slots.
  const row = (a?: string, b?: string, live = false): BoardRow => {
    const first = a ?? b;
    const second = b ?? a;
    return first && second
      ? { live, empty: false, states: [first, second] }
      : noData;
  };

  const { twitch, youtube, github, osu, steam } = data;
  return {
    yr: row(r.yr[0], r.yr[1]),
    tw: !twitch
      ? missing(twitch)
      : twitch.live
        ? row(r.twitch.live, twitch.title || r.twitch.watch, true)
        : row(
            r.twitch.off,
            twitch.lastStreamAt &&
              fill(r.twitch.lastStream, { age: age(twitch.lastStreamAt) }),
          ),
    yt: !youtube
      ? missing(youtube)
      : row(
          youtube.subscribers === undefined
            ? undefined
            : fill(r.youtube.subscribers, { n: num(youtube.subscribers) }),
          youtube.latestUploadAt &&
            fill(r.youtube.latest, { age: age(youtube.latestUploadAt) }),
        ),
    gh: !github
      ? missing(github)
      : row(
          github.lastPushAt &&
            fill(r.github.push, { age: age(github.lastPushAt) }),
          github.commitsThisYear !== undefined
            ? fill(r.github.commits, { n: num(github.commitsThisYear) })
            : github.repo && fill(r.github.repo, { repo: github.repo }),
        ),
    osu: !osu
      ? missing(osu)
      : row(
          osu.globalRank === undefined
            ? undefined
            : fill(r.osu.rank, { n: num(osu.globalRank) }),
          osu.pp === undefined ? undefined : fill(r.osu.pp, { n: num(osu.pp) }),
        ),
    st: !steam
      ? missing(steam)
      : steam.online
        ? row(
            r.steam.online,
            steam.game && fill(r.steam.playing, { game: steam.game }),
          )
        : row(
            r.steam.offline,
            steam.lastOnlineAt &&
              fill(r.steam.lastOnline, { age: age(steam.lastOnlineAt) }),
          ),
  };
}

/** A row's accessible name: both states (the flips are hidden), or one when they match. */
export function rowLabel(row: BoardRow): string {
  const [first, second] = row.states;
  return first === second ? first : `${first}, ${second}`;
}
