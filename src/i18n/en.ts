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
    outOfService: 'MZ Line · Out of service',
  },

  notFound: {
    title: 'Not in service',
    description: 'This station is not on the MZ Line.',
    sub: ['404', 'No such station on the MZ Line'],
    destination: 'Not in service',
    text: "This train is not in service, and the station you asked for isn't on the line. Ride back to Home, or buy a ticket to a station that exists.",
    home: 'Ride back to Home',
    tickets: 'Open the ticket machine',
  },

  stations: {
    home: { name: 'mystwiz', short: 'Home' },
    about: { name: 'About', short: 'About' },
    projects: { name: 'Projects', short: 'Projects' },
    specs: { name: 'Specs', short: 'Specs' },
  },

  routeBar: {
    homeSuffix: ', home',
    nav: 'MZ Line stations',
    tickets: 'Tickets',
    live: 'Live',
    liveLabel: 'on Twitch now',
    melody: { label: 'Melody', on: 'on', off: 'off' },
    melodyHint: 'Every station has its own departure melody',
    service: {
      night: 'Night',
      day: 'Day',
      toDay: 'service, switch to day service',
      toNight: 'service, switch to night service',
      sweep: { day: 'Day service', night: 'Night service' },
    },
  },

  tickets: {
    title: 'Where to?',
    from: (station: string) => `From ${station}`,
    close: 'Esc',
    closeLabel: 'close the ticket machine',
    stations: 'Stations',
    here: 'You are here',
    transfers: 'Transfers to other lines',
    line: (code: string) => `${code} Line`,
    ticket: {
      head: (no: string) => `MZ Line · One way · No. ${no}`,
      valid: 'Valid today only',
    },
  },

  doors: {
    next: 'Next',
    arriving: 'Now arriving',
    stickers: ['Please mind the gap', 'MZ Line · Loop'],
  },

  arrivals: {
    messages: {
      github:
        'Transfer from the GitHub Line · You are probably here for the code · Platform 1 for projects',
      youtube:
        'Transfer from the YouTube Line · Welcome aboard · Platform 3 has the videos',
      twitch: 'Transfer from the Twitch Line · Check the board for live status',
      osu: 'Transfer from the osu! Line · Yes, I still click circles · Try clicking to a beat',
    },
    transferred: 'You transferred here',
    cameFrom: 'You came from here',
    close: 'Dismiss the welcome',
  },

  board: {
    prev: 'Previous station:',
    next: 'Next station:',
    transfers: 'Transfer here for',
  },

  // The LED departure board. Templates fill {n}, {age}, {time} and {game}; they stay plain
  // strings so the board can re-render them in the browser when fresh data arrives.
  departures: {
    label: 'Live board',
    heading: 'Departures and transfers',
    title: 'Departures',
    columns: { line: 'Line', destination: 'Destination', now: 'Now' },
    footer: {
      live: 'Updates every minute',
      snapshot: 'Updated {age}',
      // A board taken at build time, until the browser can say how long ago that was.
      taken: 'Updated {time}',
      tap: 'Tap a row to transfer',
    },
    numberLocale: 'en-US',
    rows: {
      yr: ['Now building', 'Anime recommender'],
      twitch: {
        off: 'Off air',
        lastStream: 'Last stream {age}',
        live: 'On air now',
        watch: 'Tap to watch',
      },
      youtube: {
        subscribers: '{n} subscribers',
        latest: 'Latest upload {age}',
      },
      github: {
        push: 'Last push {age}',
        commits: '{n} commits this year',
        repo: 'To {repo}',
      },
      osu: { rank: '#{n} global', pp: '{n} pp' },
      steam: {
        online: 'Online',
        playing: 'Playing {game}',
        offline: 'Offline',
        lastOnline: 'Last online {age}',
      },
      // Rows with nothing real to show. A row without an API key alternates the two.
      noData: 'No data',
      notConnected: 'Not connected',
    },
    ago: {
      now: 'just now',
      m: '{n}m ago',
      h: '{n}h ago',
      d: '{n}d ago',
      mo: '{n}mo ago',
      y: '{n}y ago',
    },
  },

  nextTrain: {
    label: 'Next train',
    loops: 'this line loops',
    hint: {
      fine: 'Hold the button, or hold Space, to depart.',
      coarse: 'Press and hold to depart, or swipe sideways.',
    },
    goNow: 'Go now instead',
    hold: 'Hold',
    holdLabel: (station: string) => `Hold to depart for ${station}`,
    keepHolding: 'Keep holding to depart',
    departing: (no: string, station: string) =>
      `Departing for MZ${no} ${station}`,
    kmh: 'km/h',
  },

  home: {
    sub: ['Wonsik Shin', 'Student', 'Developer'],
    aka: 'AKA MysticalWizard',
    altName: 'MysticalWizard',
    altNameTitle: 'Show the alt name',
    tags: {
      line: 'MZ Line',
      service: 'Loop service',
      provider: 'Service provided by mystwiz network',
      hold: ['Hold', 'Space', 'to depart'],
    },
    intro,
    platforms: {
      label: 'Platforms',
      heading: 'What runs from here',
      onAir: 'On air',
      rows: {
        code: { name: 'Code', text: 'Web apps, Discord bots and tools' },
        stream: { name: 'Stream', text: 'Live on Twitch as mystclwzrd' },
        video: { name: 'Video', text: 'YouTube @mysticalwizard' },
        play: { name: 'Play', text: 'osu! and whatever is on Steam' },
      },
    },
    yorimichi: {
      label: 'Now building',
      name: 'Yorimichi',
      jp: '寄り道',
      // "Yorimichi" in the middle of the sentence is set in bold.
      text: [
        'An anime recommender. ',
        ' is Japanese for taking a detour on the way somewhere, which is how most good anime gets found.',
      ],
      cta: 'See the line',
      diagram: { from: 'On the way', to: 'Somewhere' },
    },
  },

  about: {
    sub: ['Wonsik Shin', 'mystwiz', 'Passenger information'],
    pass: {
      label: 'MZ Pass for Wonsik Shin. Press to flip the card.',
      title: 'MZ PASS',
      kind: 'Commuter',
      name: 'Wonsik Shin',
      handle: 'mystwiz',
      fields: [
        ['Route', 'Code ⇄ Stream'],
        ['Valid', 'All MZ lines'],
        ['No.', 'MZ-0001'],
      ],
      band: ['MZ LINE', 'NON-TRANSFERABLE'],
      backBand: ['MZ LINE', 'FLIP TO RETURN'],
      back: {
        valid:
          'This pass is valid on every MZ line, including ones still under construction.',
        found: ['If found, return it at ', 'github.com/mysticalwizard', '.'],
        aka: ['Also issued as ', 'MysticalWizard', '.'],
      },
      hint: {
        fine: 'The photo powers on when you hover it. Press the card to flip it.',
        coarse: 'Press the card to flip it.',
      },
    },
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
      description:
        'Network map of projects. ElectricalWizard shares Discord.js with Waveworn, and TypeScript and Tailwind with mystwiz.net. Yorimichi is under construction, and Waveworn is out of service.',
      badge: (code: string, name: string) => `${code}, ${name} line`,
      legend: {
        station: 'Station',
        transfer: 'Transfer: shared tech',
        building: 'Under construction',
        hover: 'Hover or tap a line to light it',
        drag: 'Drag the map sideways',
      },
    },
    status: {
      building: 'Under construction',
      service: 'In service',
      here: 'You are here',
      private: 'Private line',
      suspended: 'Out of service',
    },
    noLinks: {
      building: 'Opening later',
      private: 'Not public',
      suspended: 'Not running',
    },
    links: {
      visit: (host: string) => `Visit ${host}`,
      testRide: (host: string) => `Test ride ${host}`,
      source: 'Source on GitHub',
    },
    stationsTba: 'Stations TBA',
    lines: {
      yr: 'An anime recommender. The name means taking a detour on the way somewhere.',
      ww: 'A Wuthering Waves tool that works on Discord and the web.',
      mz: 'This site. First built with Next.js, now rebuilt in Astro as a loop line.',
      ew: 'A Discord bot for a server with friends, with a web dashboard. The line that started it all.',
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
    formation: 'Train formation. Each car is a PC part.',
    plate: {
      title: "Builder's plate",
      inspected: 'Inspected',
      depot: 'MZ Depot',
    },
    cab: {
      label: 'Cab equipment',
      heading: "The driver's desk",
    },
    tap: {
      label: 'Keypad test',
      heading: 'Try the Wooting',
      key: (key: string) => `Tap key ${key}`,
      bpm: 'BPM, 1/4 streams',
      taps: 'Taps',
      best: 'Best',
      text: 'Tap Z and X on your keyboard, or the keys here. It measures your stream speed the way osu! players count it.',
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
