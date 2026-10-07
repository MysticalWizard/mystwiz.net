import type { PictoName } from '../assets/pictos';

// The PC is an 8-car train named after its CPU. Peripherals are the driver's cab.

/** Date the parts list was last checked. */
export const INSPECTED = '2026.08.14';
export const SERIES = 'R958';

export interface Car {
  type: string;
  picto: PictoName;
  model: string;
  detail: string;
}

export const CARS: Car[] = [
  {
    type: 'CPU',
    picto: 'chip',
    model: 'Ryzen R9 9950x3D',
    detail: '16-core 32-threads',
  },
  {
    type: 'Cooler',
    picto: 'fan',
    model: 'NZXT Kraken Elite 360 RGB',
    detail: '360 mm AIO',
  },
  {
    type: 'Board',
    picto: 'board',
    model: 'MSI ROG STRIX X870E-E GAMING WIFI',
    detail: 'Motherboard',
  },
  {
    type: 'RAM',
    picto: 'ram',
    model: 'G.SKILL Trident Z5 Neo RGB',
    detail: '64GB (2x32GB) 6000MT/s CL30',
  },
  {
    type: 'GPU',
    picto: 'gpu',
    model: 'msi Gaming RTX 5080 16G SUPRIM SOC',
    detail: '16GB GDDR7',
  },
  {
    type: 'Storage',
    picto: 'disk',
    model: 'Samsung 9100 PRO 2TB NVMe M.2 SSD',
    detail:
      'Also: Samsung 990 Pro 1TB · Crucial MX500 1TB · Kingston A400 240GB',
  },
  {
    type: 'Case',
    picto: 'case',
    model: 'HYTE Y70',
    detail: 'Black | Dual Chamber Mid-Tower ATX Case',
  },
  { type: 'PSU', picto: 'bolt', model: 'CORSAIR RM1000x', detail: '1000 W' },
];

export interface CabItem {
  label: string;
  model: string;
  detail?: string;
}

export interface CabGroup {
  name: string;
  picto: PictoName;
  items: CabItem[];
}

export const CAB: CabGroup[] = [
  {
    name: 'Controls',
    picto: 'keyboard',
    items: [
      { label: 'Keyboard', model: 'ATK RS7 Air Cyber' },
      { label: 'Keypad', model: 'Wooting UwU RGB' },
      { label: 'Mouse 1', model: 'ATK A9 Pro Max 2.0' },
      { label: 'Mouse 2', model: 'Logitech G Pro X Superlight' },
      {
        label: 'Mousepad',
        model: 'ATK Blaze XSoft',
      },
      { label: 'Tablet', model: 'Wacom CTL-4100 Intuos Small' },
    ],
  },
  {
    name: 'Displays',
    picto: 'screen',
    items: [
      {
        label: 'Monitor 1',
        model: 'ASUS ROG Strix OLED XG27AQDMES',
        detail: '27" · 1440p QD-OLED · 240 Hz',
      },
      {
        label: 'Monitor 2',
        model: 'TBD',
        detail: 'TBD',
      },
      { label: 'Stream Deck', model: 'Elgato Stream Deck +' },
    ],
  },
  {
    name: 'Audio and camera',
    picto: 'mic',
    items: [
      { label: 'IEM', model: 'MOONDROP ARIA2' },
      { label: 'Microphone', model: 'Elgato Wave DX', detail: 'Dynamic XLR' },
      { label: 'Mic arm', model: 'Elgato Wave Mic Arm LP' },
      { label: 'XLR', model: 'Elgato Wave XLR MK.2' },
      { label: 'Camera', model: 'Logitech StreamCam' },
    ],
  },
];
