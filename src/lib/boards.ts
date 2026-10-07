// The sub line under each station's name, shared by the station boards and their
// Open Graph images.
import { lineCounts } from '../data/projects';
import { INSPECTED } from '../data/specs';
import type { StationId } from '../data/stations';
import type { Strings } from '../i18n';

export function boardSub(id: StationId, t: Strings): string[] {
  switch (id) {
    case 'home':
      return [...t.home.sub, t.home.formerly];
    case 'about':
      return t.about.sub;
    case 'projects': {
      const counts = lineCounts();
      return t.projects.sub(counts.lines, counts.inService, counts.building);
    }
    case 'specs':
      return t.specs.sub(INSPECTED);
  }
}
