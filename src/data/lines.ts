import type { PictoName } from '../assets/pictos';

export interface Transfer {
  id: string;
  /** Two-letter line code, as on a transfer sign. */
  code: string;
  name: string;
  picto: PictoName;
  href: string;
}

/** Other lines: Wonsik's accounts elsewhere. Order follows the transfer section of the home board. */
export const TRANSFERS = [
  {
    id: 'tw',
    code: 'TW',
    name: 'Twitch',
    picto: 'live',
    href: 'https://www.twitch.tv/mystclwzrd/',
  },
  {
    id: 'yt',
    code: 'YT',
    name: 'YouTube',
    picto: 'video',
    href: 'https://www.youtube.com/@mysticalwizard/',
  },
  {
    id: 'gh',
    code: 'GH',
    name: 'GitHub',
    picto: 'branch',
    href: 'https://github.com/mysticalwizard/',
  },
  {
    id: 'osu',
    code: 'OS',
    name: 'osu!',
    picto: 'circle',
    href: 'https://osu.ppy.sh/users/19430051/osu/',
  },
  {
    id: 'st',
    code: 'ST',
    name: 'Steam',
    picto: 'gamepad',
    href: 'https://steamcommunity.com/id/mysticalwiz/',
  },
] as const satisfies readonly Transfer[];
