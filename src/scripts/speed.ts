// How fast the train is going, from 0 to 1: the hold progress while someone holds to depart,
// and full speed while a ride is underway. Speed lines and the hero train read it every frame.

export const speed = { hold: 0, ride: 0 };

document.addEventListener('mz:ride', () => {
  speed.ride = 1;
});

document.addEventListener('mz:arrive', () => {
  speed.ride = 0;
});

export function speedLevel(): number {
  return Math.max(speed.hold, speed.ride);
}
