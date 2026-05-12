import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import BookingClient from '../../booking/BookingClient';
import { VOL_PAGES } from '../config';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) return {};
  return {
    title: `Réserver – ${config.volParam}`,
    openGraph: { images: [config.heroImage] },
  };
}

export default async function VolPage({ params }: Props) {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) notFound();

  return (
    <>
      {/* Bandeau hero propre à la page vol */}
      <section
        style={{
          position: 'relative',
          width: '100%',
          height: '60vh',
          minHeight: 320,
          overflow: 'hidden',
          display: 'flex',
          alignItems: 'flex-end',
          paddingBottom: '3rem',
          paddingLeft: '5vw',
        }}
      >
        {/* Photo de fond */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backgroundImage: `url(${config.heroImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center 30%',
            zIndex: 1,
          }}
        />
        {/* Dégradé bas */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, transparent 55%)',
            zIndex: 2,
          }}
        />
        <p
          style={{
            position: 'relative',
            zIndex: 3,
            color: '#009FE3',
            fontWeight: 800,
            fontSize: '0.8rem',
            letterSpacing: '0.15em',
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          Réserver en ligne · La Clusaz
        </p>
      </section>

      {/* Grille de créneaux — BookingClient en mode direct */}
      <Suspense fallback={null}>
        <BookingClient volOverride={config.volParam} />
      </Suspense>
    </>
  );
}
