import { describe, expect, it } from 'vitest';
import { lineCounts, PROJECTS } from './projects';

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
});
