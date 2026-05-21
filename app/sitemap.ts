import type { MetadataRoute } from 'next';

const BASE_URL = 'https://reservation.fluide-parapente.fr';

const VOL_SLUGS = [
  'cret-du-loup',
  'beauregard',
  'aiguille',
  'loupiot',
  'decouverte',
  'ascendance',
  'prestige',
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date();

  const volPages: MetadataRoute.Sitemap = VOL_SLUGS.map(slug => ({
    url: `${BASE_URL}/vols/${slug}`,
    lastModified: now,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: `${BASE_URL}/booking`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/bons-cadeaux`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    ...volPages,
    {
      url: `${BASE_URL}/cgv`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
    {
      url: `${BASE_URL}/mentions-legales`,
      lastModified: now,
      changeFrequency: 'yearly',
      priority: 0.2,
    },
  ];
}
