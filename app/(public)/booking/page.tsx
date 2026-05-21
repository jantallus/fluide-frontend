import { Suspense } from 'react';
import type { Metadata } from 'next';
import BookingClient from './BookingClient';

export const metadata: Metadata = {
  title: 'Réserver un vol parapente biplace',
  description: 'Réservez votre baptême de parapente biplace à La Clusaz. Choisissez votre vol, votre date et votre créneau en ligne. Disponibilités en temps réel.',
  alternates: { canonical: '/booking', languages: { fr: '/booking', 'x-default': '/booking' } },
  openGraph: {
    title: 'Réserver un vol parapente biplace à La Clusaz',
    description: 'Réservez votre baptême de parapente biplace à La Clusaz. Choisissez votre vol, votre date et votre créneau en ligne. Disponibilités en temps réel.',
    images: [{ url: '/hiver-hero.jpg', width: 1920, height: 2880, alt: 'Vol parapente biplace à La Clusaz' }],
  },
};

const serviceSchema = {
  '@context': 'https://schema.org',
  '@type': 'Service',
  name: 'Réservation vol parapente biplace à La Clusaz',
  description: 'Réservez en ligne votre baptême de parapente biplace à La Clusaz. Créneaux disponibles hiver et été.',
  provider: { '@type': 'LocalBusiness', name: 'Fluide Parapente', url: 'https://reservation.fluide-parapente.fr' },
  areaServed: { '@type': 'Place', name: 'La Clusaz, Haute-Savoie' },
  serviceType: 'Parapente biplace',
  offers: {
    '@type': 'AggregateOffer',
    lowPrice: '70',
    highPrice: '180',
    priceCurrency: 'EUR',
  },
};

export default function Page() {
  return (
    <>
      <link rel="preload" href="/hiver-hero.jpg" as="image" />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }}
      />
      <Suspense fallback={null}>
        <BookingClient />
      </Suspense>
    </>
  );
}
