import { describe, expect, it } from 'vitest';
import { nextStation, prevStation, station, STATIONS } from './stations';

describe('MZ Line stations', () => {
  it('numbers the stations in ride order', () => {
    expect(STATIONS.map((s) => `${s.no} ${s.id}`)).toEqual([
      '01 home',
      '02 about',
      '03 projects',
      '04 specs',
    ]);
  });

  it('rides one stop at a time', () => {
    expect(nextStation('home').id).toBe('about');
    expect(nextStation('about').id).toBe('projects');
    expect(prevStation('projects').id).toBe('about');
  });

  it('loops: the station after Specs is Home, and before Home is Specs', () => {
    expect(nextStation('specs').id).toBe('home');
    expect(prevStation('home').id).toBe('specs');
  });

  it('looks stations up by id', () => {
    expect(station('projects')).toMatchObject({ no: '03', href: '/projects/' });
  });
});
