import type { MetadataRoute } from 'next';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin/', '/api/', '/login', '/succes'],
      },
    ],
    sitemap: 'https://reservation.fluide-parapente.fr/sitemap.xml',
  };
}
