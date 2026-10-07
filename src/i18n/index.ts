import en from './en';

export type Strings = typeof en;

// Korean and Japanese slot in here once Astro i18n routing (/ko, /ja) is added.
const locales: Record<string, Strings> = { en };

export function getStrings(locale?: string): Strings {
  return (locale && locales[locale]) || en;
}
