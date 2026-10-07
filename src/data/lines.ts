import type { PictoName } from '../assets/pictos';
import type { BoardLineId } from '../lib/board';
import { station, type StationId } from './stations';

export interface Line {
  id: BoardLineId;
  /** Two-letter line code, as on a transfer sign. */
  code: string;
  name: string;
  picto: PictoName;
  href: string;
  /** Rides to a station on the MZ Line instead of leaving the site. */
  internal?: boolean;
}

/** Wonsik's accounts, for links and the live board. */
export const ACCOUNTS = {
  twitch: 'mystclwzrd',
  youtube: '@mysticalwizard',
  github: 'mysticalwizard',
  osu: 19430051,
  steam: 'mysticalwiz',
} as const;

/** Other lines: Wonsik's accounts elsewhere. Order follows the transfer section of the home board. */
export const TRANSFERS = [
  {
    id: 'tw',
    code: 'TW',
    name: 'Twitch',
    picto: 'live',
    href: `https://www.twitch.tv/${ACCOUNTS.twitch}/`,
  },
  {
    id: 'yt',
    code: 'YT',
    name: 'YouTube',
    picto: 'video',
    href: `https://www.youtube.com/${ACCOUNTS.youtube}/`,
  },
  {
    id: 'gh',
    code: 'GH',
    name: 'GitHub',
    picto: 'branch',
    href: `https://github.com/${ACCOUNTS.github}/`,
  },
  {
    id: 'osu',
    code: 'OS',
    name: 'osu!',
    picto: 'circle',
    href: `https://osu.ppy.sh/users/${ACCOUNTS.osu}/osu/`,
  },
  {
    id: 'st',
    code: 'ST',
    name: 'Steam',
    picto: 'gamepad',
    href: `https://steamcommunity.com/id/${ACCOUNTS.steam}/`,
  },
] as const satisfies readonly Line[];

const transfer = (id: (typeof TRANSFERS)[number]['id']) =>
  TRANSFERS.find((line) => line.id === id)!;

/** Rows of the departure board: what is being built, then every transfer. */
export const BOARD_LINES: readonly Line[] = [
  {
    id: 'yr',
    code: 'YR',
    name: 'Yorimichi',
    picto: 'cone',
    href: station('projects').href,
    internal: true,
  },
  ...TRANSFERS,
];

export type Platform = {
  no: number;
  id: 'code' | 'stream' | 'video' | 'play';
  /** Platform 4 is visibly smaller: gaming is present but quieter. */
  minor?: boolean;
} & ({ station: StationId } | { line: (typeof TRANSFERS)[number]['id'] });

/** Platforms in priority order: code first, then streaming, video and play. */
export const PLATFORMS: readonly Platform[] = [
  { no: 1, id: 'code', station: 'projects' },
  { no: 2, id: 'stream', line: 'tw' },
  { no: 3, id: 'video', line: 'yt' },
  { no: 4, id: 'play', line: 'osu', minor: true },
];

/** Where a platform goes: a station on the MZ Line, or another line. */
export function platformTarget(p: Platform): {
  href: string;
  internal: boolean;
  name?: string;
} {
  if ('station' in p) return { href: station(p.station).href, internal: true };
  const line = transfer(p.line);
  return { href: line.href, internal: false, name: line.name };
}
