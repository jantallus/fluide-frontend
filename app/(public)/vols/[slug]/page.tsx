'use server';
import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Mountain, Clock, Weight, MapPin, Award, Wind } from 'lucide-react';
import { SkiIcon, SnowboardIcon, PedestrianIcon } from '@/components/icons/ActivityIcons';
import BookingClient from '../../booking/BookingClient';
import { VOL_PAGES, type VolHighlight } from '../config';

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) return {};
  return {
    title: `${config.name} · La Clusaz`,
    description: config.description[0] ?? '',
    openGraph: { images: [config.heroImage] },
  };
}

function HighlightIcon({ icon }: { icon: VolHighlight['icon'] }) {
  const props = { size: 20, strokeWidth: 1.5 } as const;
  switch (icon) {
    case 'Mountain':   return <Mountain   {...props} />;
    case 'Clock':      return <Clock      {...props} />;
    case 'Weight':     return <Weight     {...props} />;
    case 'MapPin':     return <MapPin     {...props} />;
    case 'Award':      return <Award      {...props} />;
    case 'Wind':       return <Wind       {...props} />;
    case 'Ski':        return <SkiIcon    size={20} />;
    case 'Snowboard':  return <SnowboardIcon size={20} />;
    case 'Pedestrian': return <PedestrianIcon size={20} />;
  }
}

export default async function VolPage({ params }: Props) {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) notFound();

  return (
    <div style={{ backgroundColor: '#F3F3F3', color: '#1D1D1B' }}>

      {/* ── Présentation : photo gauche / texte droite ── */}
      <section className="max-w-7xl mx-auto px-4 pt-10 pb-2">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">

          {/* Photo */}
          <div className="rounded-[10px] overflow-hidden w-full" style={{ aspectRatio: '4/3' }}>
            <img
              src={config.heroImage}
              alt={config.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Contenu */}
          <div className="flex flex-col gap-6">

            {/* Label + titre */}
            <div>
              <p style={{
                color: '#009FE3', fontWeight: 800, fontSize: '0.75rem',
                letterSpacing: '0.15em', textTransform: 'uppercase', marginBottom: 8,
              }}>
                Parapente · La Clusaz
              </p>
              <h1 style={{
                color: '#312783', fontWeight: 700,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                lineHeight: 1.1, margin: 0,
              }}>
                {config.name}
              </h1>
            </div>

            {/* Durée + prix */}
            <div className="flex flex-wrap gap-3">
              <span className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2" style={{
                backgroundColor: 'rgba(230,0,126,0.08)',
                color: '#E6007E', fontWeight: 700, fontSize: '1.125rem',
              }}>
                <Clock size={18} strokeWidth={1.5} />
                {config.duration}
              </span>
              <span className="inline-flex items-center gap-2 rounded-[5px] px-4 py-2" style={{
                backgroundColor: 'rgba(230,0,126,0.08)',
                color: '#E6007E', fontWeight: 700, fontSize: '1.125rem',
              }}>
                {config.priceFrom}
              </span>
            </div>

            {/* Description */}
            {config.description.map((para, i) => (
              <p key={i} style={{
                fontSize: '1.0625rem', lineHeight: 1.75,
                color: '#374151', margin: 0,
              }}>
                {para}
              </p>
            ))}

            {/* Highlights */}
            {config.highlights.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.highlights.map((h, i) => (
                  <li key={i} className="flex items-center gap-3" style={{ color: '#312783', fontWeight: 600, fontSize: '1rem' }}>
                    <span style={{ color: '#E6007E', flexShrink: 0 }}>
                      <HighlightIcon icon={h.icon} />
                    </span>
                    {h.text}
                  </li>
                ))}
              </ul>
            )}

            {/* CTA */}
            <a
              href="#reserver"
              className="inline-flex items-center justify-center rounded-[5px] transition-colors"
              style={{
                backgroundColor: '#E6007E', color: 'white',
                fontWeight: 700, fontSize: '1.125rem',
                padding: '14px 28px', textDecoration: 'none',
                alignSelf: 'flex-start',
              }}
              onMouseEnter={undefined}
            >
              Voir les disponibilités →
            </a>

          </div>
        </div>
      </section>

      {/* ── Grille de créneaux ── */}
      <div id="reserver">
        <Suspense fallback={null}>
          <BookingClient volOverride={config.volParam} />
        </Suspense>
      </div>

    </div>
  );
}
