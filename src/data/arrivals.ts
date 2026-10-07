// Styles for visitors who arrive from a bio link. Base.astro sets data-via on <html> before
// first paint; these rules, generated from ARRIVALS, put their platform and board row first.
import { ARRIVALS } from './lines';

const each = (
  selector: (
    via: string,
    a: (typeof ARRIVALS)[keyof typeof ARRIVALS],
  ) => string,
) =>
  Object.entries(ARRIVALS)
    .map(([via, arrival]) => selector(via, arrival))
    .join(',\n');

export const arrivalCss = `
${each((via, a) => `:root[data-via='${via}'] [data-platform='${a.platform}']`)},
${each((via, a) => `:root[data-via='${via}'] [data-row-item='${a.row}']`)} {
  order: -1;
}
${each((via, a) => `:root[data-via='${via}'] [data-platform='${a.platform}'] [data-from]`)},
${each((via, a) => `:root[data-via='${via}'] [data-row-item='${a.row}'] [data-from]`)} {
  display: inline-block;
}
${each((via, a) => `:root[data-via='${via}'] [data-platform='${a.platform}'] [data-from-frame]`)} {
  border-color: var(--line);
  box-shadow: 0 0 0 1px var(--line);
}
${each((via) => `:root[data-welcome][data-via='${via}'] [data-welcome-for='${via}']`)} {
  display: block;
}
`;
