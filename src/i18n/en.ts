// All site copy. Draft copy in Wonsik's voice; see DESIGN.md section 13 for the open questions.

/** A run of the intro statement: plain text, an inline sign chip, or muted text. */
export type IntroPart =
  string | { chip: string; text: string; after?: string } | { soft: string };

export interface HistoryStop {
  when: string;
  name: string;
  text: string;
  kind?: 'renamed' | 'here';
}

const intro: IntroPart[] = [
  'Developer first. I build ',
  { chip: 'WEB', text: 'apps', after: ',' },
  ' ',
  { chip: 'BOT', text: 'Discord bots' },
  ' and ',
  { chip: 'TOOL', text: 'tools', after: '.' },
  ' ',
  { soft: 'Sometimes I stream the process.' },
];

// Years are placeholders until Wonsik fills them in.
const history: HistoryStop[] = [
  {
    when: 'Opened',
    name: 'MysticalWizard Line',
    text: 'Teen gaming days, and the username that came with them.',
  },
  {
    when: 'Year TBD',
    name: 'ElectricalWizard',
    text: 'First Discord bot, built for a server with friends.',
  },
  {
    when: 'Year TBD',
    name: 'mystwiz.net, first build',
    text: 'Next.js and Tailwind.',
  },
  {
    when: 'Year TBD',
    name: 'Waveworn',
    text: 'A Wuthering Waves tool for Discord and the web.',
  },
  {
    when: 'Notice',
    name: 'This line has been renamed',
    text: 'MysticalWizard is now mystwiz. Old tickets are still valid.',
    kind: 'renamed',
  },
  {
    when: 'Now',
    name: 'Yorimichi',
    text: 'An anime recommender, under construction.',
  },
  {
    when: 'You are here',
    name: 'mystwiz.net, rebuilt in Astro',
    text: 'The site you are riding right now.',
    kind: 'here',
  },
];

const en = {
  meta: {
    homeTitle: 'mystwiz · Wonsik Shin',
    title: (station: string) => `${station} · mystwiz`,
    description:
      'Wonsik Shin, online as mystwiz: a developer who builds web apps, Discord bots and tools, and sometimes streams the process.',
  },

  skip: 'Skip to content',

  line: {
    name: 'MZ Line',
    loop: 'MZ Line · Loop',
  },

  stations: {
    home: { name: 'mystwiz', short: 'Home' },
    about: { name: 'About', short: 'About' },
    projects: { name: 'Projects', short: 'Projects' },
    specs: { name: 'Specs', short: 'Specs' },
  },

  routeBar: {
    home: 'mystwiz, home',
    nav: 'MZ Line stations',
    service: {
      night: 'Night',
      day: 'Day',
      toDay: 'service, switch to day service',
      toNight: 'service, switch to night service',
    },
  },

  doors: {
    next: 'Next',
    arriving: 'Now arriving',
    stickers: ['Please mind the gap', 'MZ Line · Loop'],
  },

  board: {
    prev: 'Previous station:',
    next: 'Next station:',
    transfers: 'Transfer here for',
  },

  nextTrain: {
    label: 'Next train',
    loops: 'this line loops',
    depart: (station: string) => `Depart for ${station}`,
  },

  home: {
    sub: ['Wonsik Shin', 'Developer'],
    formerly: 'Formerly MysticalWizard',
    tags: {
      line: 'MZ Line',
      service: 'Loop service',
    },
    intro,
  },

  about: {
    sub: ['Wonsik Shin', 'mystwiz', 'Passenger information'],
    lede: "Hey, I'm Wonsik. Online I go by mystwiz.",
    bio: "I'm into AI, machine learning, networking and web development, and I like building things people actually use: a bot for my friends' Discord server, a tool for a game I play, and now an anime recommender.",
    offDuty:
      "When I'm not coding, I stream on Twitch, make YouTube videos and still click circles in osu!.",
    notice: {
      title: 'Under construction',
      body: "The ambitions line: what I'm aiming for next. Plans are still being drawn.",
    },
    served: {
      label: 'Destinations served',
      stops: ['AI', 'Machine learning', 'Networking', 'Web dev'],
    },
    history: {
      label: 'Line history',
      heading: 'How this line got here',
      stops: history,
    },
  },

  projects: {
    sub: (lines: number, inService: number, building: number) => [
      `${lines} lines`,
      `${inService} in service`,
      `${building} under construction`,
    ],
    map: {
      label: 'Network map',
      heading: "Every project is a line. Every stop is what it's built with.",
    },
    status: {
      building: 'Under construction',
      service: 'In service',
      here: 'You are here',
      private: 'Private line',
    },
    noLinks: {
      building: 'Opening later',
      private: 'Not public',
    },
    links: {
      visit: (host: string) => `Visit ${host}`,
      source: 'Source on GitHub',
    },
    stationsTba: 'Stations TBA',
    lines: {
      yr: 'An anime recommender. The name means taking a detour on the way somewhere.',
      ww: 'A Wuthering Waves tool that works on Discord and the web.',
      mz: 'This site. First built with Next.js, now rebuilt in Astro as a loop line.',
      ew: 'A Discord bot for a server with friends. The line that started it all.',
    },
  },

  specs: {
    sub: (inspected: string) => [
      'Rolling stock',
      'Cab equipment',
      `Last inspection ${inspected}`,
    ],
    rolling: {
      label: 'Rolling stock',
      heading: (series: string, cars: number) =>
        `Series ${series}, ${cars} cars`,
    },
    car: (n: number) => `Car ${n}`,
    cab: {
      label: 'Cab equipment',
      heading: "The driver's desk",
    },
  },

  footer: {
    blog: {
      name: 'Blog Line',
      host: 'blog.mystwiz.net',
      note: 'Under construction · Its own line, its own look',
    },
    transfers: 'Transfers',
    fine: (year: number) =>
      `© ${year} Wonsik Shin · mystwiz.net · Built with Astro`,
  },
};

export default en;
