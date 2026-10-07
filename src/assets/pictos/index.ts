// Pixel pictograms: drawn as simple geometry on a 16px grid, then snapped to whole pixels.
// Exported once from the prototype's canvas drawings; each file is one path with fill="currentColor".
import arrow from './arrow.svg';
import board from './board.svg';
import bolt from './bolt.svg';
import branch from './branch.svg';
import caseIcon from './case.svg';
import chip from './chip.svg';
import circle from './circle.svg';
import code from './code.svg';
import cone from './cone.svg';
import cube from './cube.svg';
import cycle from './cycle.svg';
import disk from './disk.svg';
import external from './external.svg';
import fan from './fan.svg';
import gamepad from './gamepad.svg';
import gpu from './gpu.svg';
import keyboard from './keyboard.svg';
import live from './live.svg';
import mic from './mic.svg';
import moon from './moon.svg';
import mute from './mute.svg';
import ram from './ram.svg';
import screen from './screen.svg';
import speaker from './speaker.svg';
import sun from './sun.svg';
import ticket from './ticket.svg';
import video from './video.svg';

export const pictos = {
  arrow,
  board,
  bolt,
  branch,
  case: caseIcon,
  chip,
  circle,
  code,
  cone,
  cube,
  cycle,
  disk,
  external,
  fan,
  gamepad,
  gpu,
  keyboard,
  live,
  mic,
  moon,
  mute,
  ram,
  screen,
  speaker,
  sun,
  ticket,
  video,
};

export type PictoName = keyof typeof pictos;
