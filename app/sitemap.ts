import { MetadataRoute } from 'next';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: 'https://mystwiz.net/',
      lastModified: new Date(),
      priority: 1,
    },
    {
      url: 'https://mystwiz.net/about',
      lastModified: new Date(),
      priority: 0.8,
    },
    {
      url: 'https://mystwiz.net/blog',
      lastModified: new Date(),
      priority: 0.6,
    },
    {
      url: 'https://mystwiz.net/projects',
      lastModified: new Date(),
      priority: 0.6,
    },
    {
      url: 'https://mystwiz.net/specs',
      lastModified: new Date(),
    },
  ];
}
