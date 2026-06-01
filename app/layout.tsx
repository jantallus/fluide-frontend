import "./globals.css";
import type { Metadata } from 'next';

export const metadata: Metadata = {
  metadataBase: new URL('https://reservation.fluide-parapente.fr'),
  title: {
    default: 'Fluide Parapente · Réservation La Clusaz',
    template: '%s · Fluide Parapente La Clusaz',
  },
  description: 'Réservez votre baptême de parapente biplace à La Clusaz avec Fluide Parapente. Vols disponibles hiver et été.',
  openGraph: {
    siteName: 'Fluide Parapente',
    locale: 'fr_FR',
    type: 'website',
    images: [{ url: '/hero-parapente.jpg', width: 1200, height: 630, alt: 'Parapente biplace à La Clusaz' }],
  },
  twitter: { card: 'summary_large_image' },
  robots: { index: false, follow: false },
};

const localBusinessSchema = {
  '@context': 'https://schema.org',
  '@type': ['LocalBusiness', 'SportsActivityLocation'],
  name: 'Fluide Parapente',
  description: 'École de parapente et vols biplaces à La Clusaz, Haute-Savoie.',
  url: 'https://reservation.fluide-parapente.fr',
  image: 'https://reservation.fluide-parapente.fr/hero-parapente.jpg',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'La Clusaz',
    postalCode: '74220',
    addressCountry: 'FR',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 45.9044,
    longitude: 6.4233,
  },
  priceRange: '€€',
  currenciesAccepted: 'EUR',
  sameAs: ['https://www.fluide-parapente.fr'],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning>
      <head>
<script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
