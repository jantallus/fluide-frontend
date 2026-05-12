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
    title: `${config.priceFrom} · Vol parapente La Clusaz`,
    description: config.description[0] ?? '',
    openGraph: { images: [config.heroImage] },
  };
}

export default async function VolPage({ params }: Props) {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) notFound();

  const hasContent = config.description.length > 0 || config.highlights.length > 0;

  return (
    <div style={{ backgroundColor: '#F3F3F3', color: '#1D1D1B' }}>

      {/* ── Hero ── */}
      <section style={{
        position: 'relative', width: '100%', height: '62vh', minHeight: 300,
        overflow: 'hidden', display: 'flex', alignItems: 'flex-end',
        paddingBottom: '2.5rem', paddingLeft: '5vw',
      }}>
        <div style={{
          position: 'absolute', inset: 0, zIndex: 1,
          backgroundImage: `url(${config.heroImage})`,
          backgroundSize: 'cover', backgroundPosition: 'center 30%',
        }} />
        <div style={{
          position: 'absolute', inset: 0, zIndex: 2,
          background: 'linear-gradient(to top, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.1) 50%, transparent 100%)',
        }} />
        <div style={{ position: 'relative', zIndex: 3 }}>
          <p style={{
            margin: '0 0 6px', color: '#009FE3', fontWeight: 800,
            fontSize: '0.75rem', letterSpacing: '0.15em', textTransform: 'uppercase',
          }}>
            Parapente · La Clusaz
          </p>
          {/* Durée + prix en bas du hero */}
          <div style={{ display: 'flex', gap: '1.5rem', flexWrap: 'wrap' }}>
            <span style={{
              color: 'white', fontWeight: 700, fontSize: '1rem',
              background: 'rgba(0,0,0,0.3)', borderRadius: 6, padding: '4px 12px',
            }}>
              ⏱ {config.duration}
            </span>
            <span style={{
              color: 'white', fontWeight: 700, fontSize: '1rem',
              background: 'rgba(230,0,126,0.85)', borderRadius: 6, padding: '4px 12px',
            }}>
              {config.priceFrom}
            </span>
          </div>
        </div>
      </section>

      {/* ── Description + highlights ── */}
      {hasContent && (
        <section style={{ maxWidth: 860, margin: '0 auto', padding: '3rem 1.5rem 0' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '2.5rem' }}>

            {/* Texte */}
            {config.description.length > 0 && (
              <div>
                {config.description.map((para, i) => (
                  <p key={i} style={{
                    fontSize: '1.0625rem', lineHeight: 1.75, color: '#374151',
                    margin: i > 0 ? '1rem 0 0' : 0,
                  }}>
                    {para}
                  </p>
                ))}
              </div>
            )}

            {/* Infos clés */}
            {config.highlights.length > 0 && (
              <ul style={{
                listStyle: 'none', padding: 0, margin: 0,
                display: 'flex', flexWrap: 'wrap', gap: '0.75rem',
              }}>
                {config.highlights.map((item, i) => (
                  <li key={i} style={{
                    background: 'white', borderRadius: 8,
                    border: '1px solid rgba(49,39,131,0.12)',
                    padding: '0.5rem 1rem',
                    fontSize: '0.9375rem', fontWeight: 600, color: '#312783',
                    boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
                  }}>
                    {item}
                  </li>
                ))}
              </ul>
            )}

          </div>
        </section>
      )}

      {/* ── Grille de créneaux ── */}
      <Suspense fallback={null}>
        <BookingClient volOverride={config.volParam} />
      </Suspense>

    </div>
  );
}
