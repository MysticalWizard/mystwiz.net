// Bio-link arrivals (see Base.astro and src/data/arrivals.ts). The visitor's line stays on
// <html> for the whole visit, and the welcome strip can be dismissed.
document.addEventListener('astro:before-swap', (event) => {
  const via = document.documentElement.dataset.via;
  if (via) event.newDocument.documentElement.dataset.via = via;
});

document.addEventListener('click', (event) => {
  if ((event.target as Element).closest('[data-close-welcome]')) {
    document.documentElement.removeAttribute('data-welcome');
  }
});
