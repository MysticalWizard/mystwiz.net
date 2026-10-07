// Projects are lines on the network map; each stop is something the project is built with.
// A stop marked "transfer" is shared with another line. Descriptions live in src/i18n.

export type ProjectStatus = 'building' | 'service' | 'here' | 'private';

export interface Stop {
  name: string;
  transfer?: boolean;
  /** Not announced yet: drawn dashed. */
  tba?: boolean;
}

export interface ProjectLink {
  kind: 'visit' | 'source';
  href: string;
}

export interface Project {
  id: 'yr' | 'ww' | 'mz' | 'ew';
  code: string;
  name: string;
  jp?: string;
  /** Line color on the map: the featured line uses the line color, the others step down from --fg to --dim. */
  tone: string;
  status: ProjectStatus;
  stops: Stop[];
  links: ProjectLink[];
}

export const PROJECTS: Project[] = [
  {
    id: 'yr',
    code: 'YR',
    name: 'Yorimichi',
    jp: '寄り道',
    tone: 'var(--line-ink)',
    status: 'building',
    stops: [
      { name: 'Anime' },
      { name: 'Recommendations' },
      { name: '', tba: true },
    ],
    links: [],
  },
  {
    id: 'ww',
    code: 'WW',
    name: 'Waveworn',
    tone: 'var(--fg)',
    status: 'service',
    stops: [
      { name: 'Discord.js', transfer: true },
      { name: 'React' },
      { name: 'Next.js' },
      { name: 'TypeScript', transfer: true },
      { name: 'Tailwind', transfer: true },
    ],
    links: [{ kind: 'visit', href: 'https://wuwa.mystwiz.net/' }],
  },
  {
    id: 'mz',
    code: 'MZ',
    name: 'mystwiz.net',
    tone: 'var(--muted)',
    status: 'here',
    stops: [
      { name: 'Astro' },
      { name: 'TypeScript', transfer: true },
      { name: 'Tailwind', transfer: true },
    ],
    links: [
      { kind: 'source', href: 'https://github.com/mysticalwizard/mystwiz.net' },
    ],
  },
  {
    id: 'ew',
    code: 'EW',
    name: 'ElectricalWizard',
    tone: 'var(--dim)',
    status: 'private',
    stops: [
      { name: 'JavaScript' },
      { name: 'Node.js' },
      { name: 'Discord.js', transfer: true },
    ],
    links: [],
  },
];

/** Counts for the Projects board: lines, lines in service, lines under construction. */
export function lineCounts(projects: Project[] = PROJECTS) {
  const building = projects.filter((p) => p.status === 'building').length;
  return {
    lines: projects.length,
    inService: projects.length - building,
    building,
  };
}
