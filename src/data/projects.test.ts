import { describe, expect, it } from 'vitest';
import { lineCounts, NETWORK, PROJECTS } from './projects';

describe('project lines', () => {
  it('counts lines for the Projects board: 4 lines, 3 in service, 1 under construction', () => {
    expect(lineCounts()).toEqual({ lines: 4, inService: 3, building: 1 });
  });

  it('marks every shared stop as a transfer on each line that has it', () => {
    const lineCountByStop = new Map<string, number>();
    for (const p of PROJECTS) {
      for (const s of p.stops) {
        if (s.name)
          lineCountByStop.set(s.name, (lineCountByStop.get(s.name) ?? 0) + 1);
      }
    }
    for (const p of PROJECTS) {
      for (const s of p.stops) {
        const shared = (lineCountByStop.get(s.name) ?? 0) > 1;
        expect({ line: p.id, stop: s.name, transfer: !!s.transfer }).toEqual({
          line: p.id,
          stop: s.name,
          transfer: shared,
        });
      }
    }
  });

  it('draws every project as a line on the network map, with every stop', () => {
    for (const p of PROJECTS) {
      expect(NETWORK.lines.map((l) => l.id)).toContain(p.id);
      expect(NETWORK.badges.map((b) => b.id)).toContain(p.id);
      const onMap = NETWORK.stations
        .filter((s) => s.lines.includes(p.id))
        .map((s) => (s.tba ? '(tba)' : s.name))
        .sort();
      const stops = p.stops.map((s) => (s.tba ? '(tba)' : s.name)).sort();
      expect({ line: p.id, stops: onMap }).toEqual({ line: p.id, stops });
    }
  });

  it('makes every shared stop a transfer station on the map', () => {
    for (const s of NETWORK.stations) {
      expect({ stop: s.name, transfer: s.lines.length > 1 }).toEqual({
        stop: s.name,
        transfer: s.shape !== undefined,
      });
    }
  });
});
