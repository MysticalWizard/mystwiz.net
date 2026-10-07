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

// The network map (Projects): a schematic, octilinear map where every project is a line and
// every stop is what it is built with. Coordinates are in the map's SVG units.

export interface MapStation {
  /** Stop name; empty for the "stations TBA" stop of a line under construction. */
  name: string;
  x: number;
  y: number;
  lines: Project['id'][];
  label: 'above' | 'below';
  tba?: boolean;
  /** Where lines meet at one point (a junction) or run side by side (a capsule). */
  shape?: 'junction' | 'capsule';
}

export const NETWORK = {
  viewBox: '0 30 1080 420',
  lines: [
    { id: 'yr', d: 'M90 80 H440', extension: 'M440 80 H600' },
    { id: 'ew', d: 'M70 400 H300 L420 280' },
    { id: 'ww', d: 'M330 280 H1050' },
    { id: 'mz', d: 'M540 150 H600 L714 264 H900 L950 214 H1050' },
  ] as { id: Project['id']; d: string; extension?: string }[],
  stations: [
    { name: 'Anime', x: 210, y: 80, lines: ['yr'], label: 'above' },
    { name: 'Recommendations', x: 360, y: 80, lines: ['yr'], label: 'above' },
    { name: '', x: 560, y: 80, lines: ['yr'], label: 'above', tba: true },
    { name: 'JavaScript', x: 150, y: 400, lines: ['ew'], label: 'below' },
    { name: 'Node.js', x: 250, y: 400, lines: ['ew'], label: 'below' },
    {
      name: 'Discord.js',
      x: 420,
      y: 280,
      lines: ['ew', 'ww'],
      label: 'below',
      shape: 'junction',
    },
    { name: 'React', x: 530, y: 280, lines: ['ww'], label: 'below' },
    { name: 'Next.js', x: 640, y: 280, lines: ['ww'], label: 'below' },
    {
      name: 'TypeScript',
      x: 770,
      y: 272,
      lines: ['ww', 'mz'],
      label: 'below',
      shape: 'capsule',
    },
    {
      name: 'Tailwind',
      x: 860,
      y: 272,
      lines: ['ww', 'mz'],
      label: 'below',
      shape: 'capsule',
    },
    { name: 'Astro', x: 600, y: 150, lines: ['mz'], label: 'above' },
  ] as MapStation[],
  /** Line badges sit at the start of each line. */
  badges: [
    { id: 'yr', x: 90, y: 80 },
    { id: 'ew', x: 70, y: 400 },
    { id: 'ww', x: 330, y: 280 },
    { id: 'mz', x: 540, y: 150 },
  ] as { id: Project['id']; x: number; y: number }[],
  /** Termini are labeled with the project's domain. */
  termini: [
    { id: 'ww', x: 1050, y: 314, text: 'wuwa.mystwiz.net' },
    { id: 'mz', x: 1050, y: 194, text: 'mystwiz.net' },
  ] as { id: Project['id']; x: number; y: number; text: string }[],
};
