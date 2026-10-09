import { describe, expect, it } from 'vitest';
import {
  fare,
  nextStation,
  prevStation,
  ridesBack,
  station,
  stationForPath,
  STATIONS,
} from './stations';

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

  it('finds the station for a path, with or without the trailing slash', () => {
    expect(stationForPath('/')?.id).toBe('home');
    expect(stationForPath('/about')?.id).toBe('about');
    expect(stationForPath('/specs/')?.id).toBe('specs');
    expect(stationForPath('/not-in-service/')).toBeUndefined();
  });

  it('charges fares by distance on the loop: ¥140 for one stop, ¥170 for two', () => {
    expect(fare('home', 'about')).toBe(140);
    expect(fare('home', 'projects')).toBe(170);
    expect(fare('about', 'specs')).toBe(170);
    // Specs to Home is one stop round the loop.
    expect(fare('specs', 'home')).toBe(140);
    expect(fare('home', 'specs')).toBe(140);
    expect(fare('projects', 'projects')).toBe(0);
  });

  it('rides back the shorter way round the loop', () => {
    expect(ridesBack('about', 'home')).toBe(true);
    expect(ridesBack('home', 'about')).toBe(false);
    // Specs on to Home is one stop forward round the loop, and Home back to Specs one stop back.
    expect(ridesBack('specs', 'home')).toBe(false);
    expect(ridesBack('home', 'specs')).toBe(true);
  });

  it('rides back halfway round the loop when the stop is to the left on the route bar', () => {
    expect(ridesBack('projects', 'home')).toBe(true);
    expect(ridesBack('home', 'projects')).toBe(false);
    expect(ridesBack('specs', 'about')).toBe(true);
  });
});
