// Live service on the project lines: what status.mystwiz.net reports for each line, and the
// manual override (the STATUS_OVERRIDE Worker variable) that wins over it. Shared by the server
// and the browser, so it stays free of DOM and server-only code.
import type { ProjectId, ProjectStatus } from '../data/projects';

/** A line's service right now, in rail terms. */
export const LINE_SERVICES = [
  'service',
  'delayed',
  'suspended',
  'maintenance',
  'paused',
] as const;

export type LineService = (typeof LINE_SERVICES)[number];

export type LineServices = Partial<Record<ProjectId, LineService>>;

/** The status page's answer, turned into lines. A line it can't vouch for is left out. */
export interface ServicesData {
  lines: LineServices;
  /** When the status page last ran its checks (ISO 8601). */
  updatedAt: string;
}

/** What GET https://status.mystwiz.net/api/status answers, as far as the lines need it. */
export interface StatusPageAnswer {
  updatedAt: string | null;
  components: { id: string; status: string }[];
}

/** Which of the status page's components make up each line (ids from its src/lib/config.ts). */
export const LINE_COMPONENTS: Partial<Record<ProjectId, string[]>> = {
  yr: ['yorimichi'],
  mz: ['site'],
  ew: ['electricalwizard', 'ew-dashboard'],
  cp: ['compost'],
};

/** The status page itself: it answered, so it runs as long as its checks keep up. */
const STATUS_PAGE_LINE: ProjectId = 'ms';

/** The status page checks every minute; older results than this mean its checks have stalled. */
export const STALE_CHECKS_MS = 5 * 60_000;

const FROM_STATUS: Record<string, LineService> = {
  up: 'service',
  degraded: 'delayed',
  down: 'suspended',
  maintenance: 'maintenance',
  paused: 'paused',
};

// Worst first wins for a line with several components, ranked the way the status page ranks
// its overall status: a paused part never hides one that is running.
const RANK: Record<LineService, number> = {
  suspended: 4,
  maintenance: 3,
  delayed: 2,
  service: 1,
  paused: 0,
};

export function servicesFromStatus(
  answer: StatusPageAnswer,
  now: Date,
): ServicesData {
  const updatedAt = answer.updatedAt ?? now.toISOString();
  const stalled =
    answer.updatedAt === null ||
    now.getTime() - Date.parse(answer.updatedAt) > STALE_CHECKS_MS;
  // Stalled checks say nothing about the other lines any more.
  if (stalled) return { lines: { [STATUS_PAGE_LINE]: 'delayed' }, updatedAt };

  const byId = new Map(answer.components.map((c) => [c.id, c.status]));
  const lines: LineServices = { [STATUS_PAGE_LINE]: 'service' };
  for (const [line, ids] of Object.entries(LINE_COMPONENTS)) {
    const known = ids
      .map((id) => FROM_STATUS[byId.get(id) ?? ''])
      .filter((s): s is LineService => s !== undefined);
    // Only when every part has been checked: half a line isn't the whole story.
    if (known.length && known.length === ids.length) {
      lines[line as ProjectId] = known.reduce((worst, s) =>
        RANK[s] > RANK[worst] ? s : worst,
      );
    }
  }
  return { lines, updatedAt };
}

/**
 * Reads STATUS_OVERRIDE, a JSON object from line id to service, e.g. {"yr":"suspended"}.
 * Anything it can't use is left out and reported through `onProblem`, so a typo shows up in the
 * Worker's logs instead of silently doing nothing.
 */
export function parseOverrides(
  raw: string | undefined,
  lineIds: readonly ProjectId[],
  onProblem: (message: string) => void = () => {},
): LineServices {
  if (!raw?.trim()) return {};
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    onProblem(`STATUS_OVERRIDE is not JSON: ${raw}`);
    return {};
  }
  if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
    onProblem(`STATUS_OVERRIDE must be a JSON object, got: ${raw}`);
    return {};
  }
  const overrides: LineServices = {};
  for (const [line, service] of Object.entries(parsed)) {
    if (!lineIds.includes(line as ProjectId)) {
      onProblem(
        `STATUS_OVERRIDE: no line "${line}" (lines: ${lineIds.join(', ')})`,
      );
    } else if (!LINE_SERVICES.includes(service as LineService)) {
      onProblem(
        `STATUS_OVERRIDE: "${String(service)}" for ${line} is not one of ${LINE_SERVICES.join(', ')}`,
      );
    } else {
      overrides[line as ProjectId] = service as LineService;
    }
  }
  return overrides;
}

/**
 * What a line's card shows: an override always; otherwise the status page's answer, but only for
 * a line that is in service (a line under construction or private isn't promised to run).
 * Undefined keeps the card's own status.
 */
export function lineService(
  line: ProjectId,
  status: ProjectStatus,
  services: ServicesData | null | undefined,
  overrides: LineServices | undefined,
): LineService | undefined {
  return (
    overrides?.[line] ??
    (status === 'service' ? services?.lines[line] : undefined)
  );
}
