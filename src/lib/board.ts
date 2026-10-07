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

/** Last good value per source; null until a source has answered at least once. */
export interface BoardData {
  twitch: TwitchData | null;
  youtube: YouTubeData | null;
  github: GitHubData | null;
  osu: OsuData | null;
  steam: SteamData | null;
}

export type BoardLineId = 'yr' | 'tw' | 'yt' | 'gh' | 'osu' | 'st';

export interface BoardRow {
  states: [string, string];
  /** Something is live right now: the row lights up. */
  live: boolean;
}

const MINUTE = 60_000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;

function fill(template: string, values: Record<string, string | number>) {
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
  const noSignal: BoardRow = {
    live: false,
    states: [r.noSignal[0], r.noSignal[1]],
  };
  // Two states; if one is unknown the row shows the other in both slots.
  const row = (a?: string, b?: string, live = false): BoardRow => {
    const first = a ?? b;
    const second = b ?? a;
    return first && second ? { live, states: [first, second] } : noSignal;
  };

  const { twitch, youtube, github, osu, steam } = data;
  return {
    yr: row(r.yr[0], r.yr[1]),
    tw: !twitch
      ? noSignal
      : twitch.live
        ? row(r.twitch.live, twitch.title || r.twitch.watch, true)
        : row(
            r.twitch.off,
            twitch.lastStreamAt &&
              fill(r.twitch.lastStream, { age: age(twitch.lastStreamAt) }),
          ),
    yt: !youtube
      ? noSignal
      : row(
          youtube.subscribers === undefined
            ? undefined
            : fill(r.youtube.subscribers, { n: num(youtube.subscribers) }),
          youtube.latestUploadAt &&
            fill(r.youtube.latest, { age: age(youtube.latestUploadAt) }),
        ),
    gh: !github
      ? noSignal
      : row(
          github.lastPushAt &&
            fill(r.github.push, { age: age(github.lastPushAt) }),
          github.commitsThisYear === undefined
            ? undefined
            : fill(r.github.commits, { n: num(github.commitsThisYear) }),
        ),
    osu: !osu
      ? noSignal
      : row(
          osu.globalRank === undefined
            ? undefined
            : fill(r.osu.rank, { n: num(osu.globalRank) }),
          osu.pp === undefined ? undefined : fill(r.osu.pp, { n: num(osu.pp) }),
        ),
    st: !steam
      ? noSignal
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

/** The prototype's sample values, until the live endpoint is connected. */
export function sampleBoard(now: Date): BoardData {
  const at = now.toISOString();
  const ago = (ms: number) => new Date(now.getTime() - ms).toISOString();
  return {
    twitch: { live: false, lastStreamAt: ago(2 * DAY), updatedAt: at },
    youtube: { subscribers: 1284, latestUploadAt: ago(3 * DAY), updatedAt: at },
    github: { lastPushAt: ago(2 * HOUR), commitsThisYear: 312, updatedAt: at },
    osu: { globalRank: 48213, pp: 6912, updatedAt: at },
    steam: { online: false, lastOnlineAt: ago(5 * HOUR), updatedAt: at },
  };
}
