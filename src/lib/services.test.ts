import { describe, expect, it, vi } from 'vitest';
import {
  lineService,
  parseOverrides,
  servicesFromStatus,
  type StatusPageAnswer,
} from './services';

const NOW = new Date('2026-11-14T12:00:00Z');
const fresh = new Date(NOW.getTime() - 40_000).toISOString();

const answer = (
  statuses: Record<string, string>,
  updatedAt: string | null = fresh,
): StatusPageAnswer => ({
  updatedAt,
  components: Object.entries(statuses).map(([id, status]) => ({ id, status })),
});

const ALL_UP = {
  'mc-game': 'paused',
  yorimichi: 'up',
  electricalwizard: 'up',
  'ew-dashboard': 'up',
  site: 'up',
  compost: 'up',
  lang: 'up',
};

describe('servicesFromStatus', () => {
  it('puts every line the status page checks in service, and the status page itself', () => {
    expect(servicesFromStatus(answer(ALL_UP), NOW)).toEqual({
      lines: {
        ms: 'service',
        yr: 'service',
        mz: 'service',
        ew: 'service',
        cp: 'service',
      },
      updatedAt: fresh,
    });
  });

  it('maps each status page status to rail terms', () => {
    const lines = servicesFromStatus(
      answer({
        ...ALL_UP,
        yorimichi: 'degraded',
        site: 'maintenance',
        compost: 'down',
        electricalwizard: 'paused',
        'ew-dashboard': 'paused',
      }),
      NOW,
    ).lines;
    expect(lines).toMatchObject({
      yr: 'delayed',
      mz: 'maintenance',
      cp: 'suspended',
      ew: 'paused',
    });
  });

  it('shows the worst part of a line, but a paused part never hides a running one', () => {
    const down = answer({ ...ALL_UP, 'ew-dashboard': 'down' });
    expect(servicesFromStatus(down, NOW).lines.ew).toBe('suspended');
    const paused = answer({ ...ALL_UP, electricalwizard: 'paused' });
    expect(servicesFromStatus(paused, NOW).lines.ew).toBe('service');
  });

  it("leaves out a line it can't vouch for: unchecked or missing parts", () => {
    const lines = servicesFromStatus(
      answer({ yorimichi: 'unknown', electricalwizard: 'up', compost: 'up' }),
      NOW,
    ).lines;
    expect(lines).toEqual({ ms: 'service', cp: 'service' });
  });

  it('says only that the status page is delayed once its checks have stalled', () => {
    const old = new Date(NOW.getTime() - 6 * 60_000).toISOString();
    expect(servicesFromStatus(answer(ALL_UP, old), NOW)).toEqual({
      lines: { ms: 'delayed' },
      updatedAt: old,
    });
    expect(servicesFromStatus(answer(ALL_UP, null), NOW).lines).toEqual({
      ms: 'delayed',
    });
  });
});

describe('parseOverrides', () => {
  const ids = ['yr', 'ms', 'mz', 'ew', 'cp'] as const;

  it('reads a line-to-service object', () => {
    expect(
      parseOverrides('{"yr":"suspended","ew":"maintenance"}', ids),
    ).toEqual({ yr: 'suspended', ew: 'maintenance' });
  });

  it('is empty when unset or blank', () => {
    expect(parseOverrides(undefined, ids)).toEqual({});
    expect(parseOverrides('  ', ids)).toEqual({});
  });

  it('keeps what it can use and reports the rest', () => {
    const problems = vi.fn();
    expect(
      parseOverrides(
        '{"cp":"delayed","xx":"suspended","yr":"broken"}',
        ids,
        problems,
      ),
    ).toEqual({ cp: 'delayed' });
    expect(problems).toHaveBeenCalledTimes(2);
    expect(problems).toHaveBeenCalledWith(expect.stringContaining('"xx"'));
    expect(problems).toHaveBeenCalledWith(expect.stringContaining('"broken"'));
  });

  it('reports a value that is not a JSON object', () => {
    const problems = vi.fn();
    expect(parseOverrides('yr=suspended', ids, problems)).toEqual({});
    expect(parseOverrides('["yr"]', ids, problems)).toEqual({});
    expect(problems).toHaveBeenCalledTimes(2);
  });
});

describe('lineService', () => {
  const services = {
    lines: { cp: 'suspended', yr: 'service' } as const,
    updatedAt: fresh,
  };

  it('follows the status page for a line in service', () => {
    expect(lineService('cp', 'service', services, {})).toBe('suspended');
  });

  it("keeps a line's own status when it isn't in service, or nothing is known", () => {
    expect(lineService('yr', 'building', services, {})).toBeUndefined();
    expect(lineService('ew', 'service', services, {})).toBeUndefined();
    expect(lineService('cp', 'service', null, undefined)).toBeUndefined();
  });

  it('lets an override win, on any line, even without the status page', () => {
    expect(lineService('cp', 'service', services, { cp: 'maintenance' })).toBe(
      'maintenance',
    );
    expect(lineService('yr', 'building', null, { yr: 'paused' })).toBe(
      'paused',
    );
  });
});
