// The MZ Line: every page is a station on one loop. Order is ride order; numbers are station codes.
// Names and other copy live in src/i18n.

/** A note of a departure melody: MIDI note number and length in beats. */
export type Note = readonly [note: number, beats: number];

// Like Tokyo stations, every station has its own short departure melody.
export const STATIONS = [
  {
    id: 'home',
    no: '01',
    href: '/',
    melody: [
      [74, 0.5],
      [78, 0.5],
      [81, 0.5],
      [86, 1],
      [83, 0.5],
      [81, 1.5],
    ],
  },
  {
    id: 'about',
    no: '02',
    href: '/about/',
    melody: [
      [76, 0.5],
      [79, 0.5],
      [83, 0.5],
      [81, 0.5],
      [79, 0.5],
      [76, 1.5],
    ],
  },
  {
    id: 'projects',
    no: '03',
    href: '/projects/',
    melody: [
      [81, 0.5],
      [83, 0.5],
      [86, 0.5],
      [88, 0.75],
      [86, 0.25],
      [83, 1.5],
    ],
  },
  {
    id: 'specs',
    no: '04',
    href: '/specs/',
    melody: [
      [69, 0.5],
      [74, 0.5],
      [76, 0.5],
      [78, 0.5],
      [81, 1],
      [78, 1],
    ],
  },
] as const satisfies readonly {
  id: string;
  no: string;
  href: string;
  melody: readonly Note[];
}[];

export type Station = (typeof STATIONS)[number];
export type StationId = Station['id'];

export function stationIndex(id: StationId): number {
  return STATIONS.findIndex((s) => s.id === id);
}

/** Station at a position on the loop; positions wrap around in both directions. */
export function stationAt(index: number): Station {
  const n = STATIONS.length;
  return STATIONS[((index % n) + n) % n];
}

export function station(id: StationId): Station {
  return stationAt(stationIndex(id));
}

/** The station served at a URL path, if any. */
export function stationForPath(pathname: string): Station | undefined {
  const path = pathname.endsWith('/') ? pathname : `${pathname}/`;
  return STATIONS.find((s) => s.href === path);
}

export function nextStation(id: StationId): Station {
  return stationAt(stationIndex(id) + 1);
}

export function prevStation(id: StationId): Station {
  return stationAt(stationIndex(id) - 1);
}

/** Fares go by distance on the loop: ¥140 for one stop, ¥170 for two, ¥30 per stop after. */
export function fare(from: StationId, to: StationId): number {
  const gap = Math.abs(stationIndex(from) - stationIndex(to));
  const stops = Math.min(gap, STATIONS.length - gap);
  return stops === 0 ? 0 : 110 + 30 * stops;
}
