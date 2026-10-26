// Projects are lines on the network map; each stop is something the project is built with.
// A stop marked "transfer" is shared with another line. Descriptions live in src/i18n.

export type ProjectStatus =
  'building' | 'service' | 'here' | 'private' | 'suspended';

export interface Stop {
  name: string;
  transfer?: boolean;
  /** Not announced yet: drawn dashed. */
  tba?: boolean;
}

export interface ProjectLink {
  /** A test ride is an early build of a line still under construction. */
  kind: 'visit' | 'testRide' | 'source';
  href: string;
}

export interface Project {
  id: 'yr' | 'ms' | 'mz' | 'ew';
  code: string;
  name: string;
  jp?: string;
  /** Line color on the map and its card: mystwiz.net uses the site's line color, the others a --line-* token. */
  tone: string;
  status: ProjectStatus;
  stops: Stop[];
  links: ProjectLink[];
}

/** In map order: the cards follow the badges top to bottom. */
export const PROJECTS: Project[] = [
  {
    id: 'yr',
    code: 'YR',
    name: 'Yorimichi',
    jp: '寄り道',
    tone: 'var(--line-yr)',
    status: 'building',
    stops: [
      { name: 'PyTorch' },
      { name: 'Svelte', transfer: true },
      { name: 'TypeScript', transfer: true },
      { name: 'Tailwind', transfer: true },
      { name: 'SQLite' },
      { name: '', tba: true },
    ],
    links: [{ kind: 'testRide', href: 'https://yorimichi.mystwiz.net/' }],
  },
  {
    id: 'mz',
    code: 'MZ',
    name: 'mystwiz.net',
    tone: 'var(--line)',
    status: 'here',
    stops: [
      { name: 'Astro', transfer: true },
      { name: 'TypeScript', transfer: true },
      { name: 'Tailwind', transfer: true },
    ],
    links: [
      { kind: 'source', href: 'https://github.com/mysticalwizard/mystwiz.net' },
    ],
  },
  {
    id: 'ms',
    code: 'MS',
    name: 'mystwiz status',
    tone: 'var(--line-ms)',
    status: 'service',
    stops: [
      { name: 'Astro', transfer: true },
      { name: 'Svelte', transfer: true },
      { name: 'TypeScript', transfer: true },
      { name: 'Cloudflare D1' },
    ],
    links: [{ kind: 'visit', href: 'https://status.mystwiz.net/' }],
  },
  {
    id: 'ew',
    code: 'EW',
    name: 'ElectricalWizard',
    tone: 'var(--line-ew)',
    status: 'service',
    stops: [
      { name: 'Discord.js' },
      { name: 'React' },
      { name: 'Next.js' },
      { name: 'TypeScript', transfer: true },
      { name: 'Tailwind', transfer: true },
      { name: 'MongoDB' },
    ],
    links: [
      { kind: 'visit', href: 'https://elecwiz.mystwiz.net/' },
      {
        kind: 'source',
        href: 'https://github.com/mysticalwizard/electricalwizard',
      },
    ],
  },
];

/** Counts for the Projects board: lines, lines in service, lines under construction. */
export function lineCounts(projects: Project[] = PROJECTS) {
  const count = (...statuses: ProjectStatus[]) =>
    projects.filter((p) => statuses.includes(p.status)).length;
  return {
    lines: projects.length,
    inService: count('service', 'here', 'private'),
    building: count('building'),
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
  viewBox: '0 50 1080 345',
  /** Lines in a capsule run side by side, 16 apart: MS 292, YR 308, MZ 324, EW 340. */
  lines: [
    {
      id: 'yr',
      d: 'M80 110 H340 L538 308 H800 L878 230 H970',
      extension: 'M970 230 H1050',
    },
    { id: 'ew', d: 'M80 340 H1050' },
    { id: 'mz', d: 'M80 210 H326 L440 324 H820 L854 290 H1050' },
    {
      id: 'ms',
      d: 'M80 280 H150 L350 80 H400 L612 292 H710 L852 150 H1050',
    },
  ] as { id: Project['id']; d: string; extension?: string }[],
  stations: [
    { name: 'PyTorch', x: 200, y: 110, lines: ['yr'], label: 'below' },
    {
      name: 'Svelte',
      x: 320,
      y: 110,
      lines: ['yr', 'ms'],
      label: 'below',
      shape: 'junction',
    },
    { name: 'SQLite', x: 930, y: 230, lines: ['yr'], label: 'below' },
    { name: '', x: 1015, y: 230, lines: ['yr'], label: 'below', tba: true },
    {
      name: 'Astro',
      x: 220,
      y: 210,
      lines: ['mz', 'ms'],
      label: 'below',
      shape: 'junction',
    },
    { name: 'Discord.js', x: 190, y: 340, lines: ['ew'], label: 'below' },
    { name: 'React', x: 300, y: 340, lines: ['ew'], label: 'below' },
    { name: 'Next.js', x: 410, y: 340, lines: ['ew'], label: 'below' },
    {
      name: 'TypeScript',
      x: 680,
      y: 316,
      lines: ['ms', 'yr', 'mz', 'ew'],
      label: 'below',
      shape: 'capsule',
    },
    {
      name: 'Tailwind',
      x: 780,
      y: 324,
      lines: ['yr', 'mz', 'ew'],
      label: 'below',
      shape: 'capsule',
    },
    { name: 'MongoDB', x: 870, y: 340, lines: ['ew'], label: 'below' },
    { name: 'Cloudflare D1', x: 950, y: 150, lines: ['ms'], label: 'above' },
  ] as MapStation[],
  /** Line badges sit at the start of each line. */
  badges: [
    { id: 'yr', x: 80, y: 110 },
    { id: 'mz', x: 80, y: 210 },
    { id: 'ms', x: 80, y: 280 },
    { id: 'ew', x: 80, y: 340 },
  ] as { id: Project['id']; x: number; y: number }[],
  /** Termini are labeled with the project's domain. */
  termini: [
    { id: 'ms', x: 1050, y: 180, text: 'status.mystwiz.net' },
    { id: 'mz', x: 1050, y: 314, text: 'mystwiz.net' },
    { id: 'ew', x: 1050, y: 374, text: 'elecwiz.mystwiz.net' },
  ] as { id: Project['id']; x: number; y: number; text: string }[],
};
