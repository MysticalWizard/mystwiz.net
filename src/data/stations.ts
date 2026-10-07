// The MZ Line: every page is a station on one loop. Order is ride order; numbers are station codes.
// Names and other copy live in src/i18n.

export const STATIONS = [
  { id: 'home', no: '01', href: '/' },
  { id: 'about', no: '02', href: '/about/' },
  { id: 'projects', no: '03', href: '/projects/' },
  { id: 'specs', no: '04', href: '/specs/' },
] as const;

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
