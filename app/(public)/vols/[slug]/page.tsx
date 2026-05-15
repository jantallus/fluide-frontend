import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import type { Metadata } from 'next';
import { Mountain, Clock, Weight, MapPin, Award, Wind } from 'lucide-react';
import { SkiIcon, SnowboardIcon, PedestrianIcon, InfoIcon } from '@/components/icons/ActivityIcons';
import BookingClient from '../../booking/BookingClient';
import OtherFlightsSection from './OtherFlightsSection';
import BackNavigationGuard from './BackNavigationGuard';
import ScrollToBookingButton from './ScrollToBookingButton';
import { VOL_PAGES, type VolHighlight } from '../config';
import type { FlightType } from '@/lib/types';

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:3001';

async function fetchFlights(): Promise<FlightType[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/flight-types`, { next: { revalidate: 30 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) return {};
  return {
    title: `${config.name} · La Clusaz`,
    description: config.description[0]?.type === 'paragraph' ? config.description[0].text : '',
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

  const initialFlights = await fetchFlights();

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#1D1D1B' }}>
      {config.backUrl && <BackNavigationGuard to={config.backUrl} />}

      {/* ── Contenu blanc avec SVG décoratif ── */}
      <div style={{ position: 'relative', overflow: 'clip' }}>

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

            {/* Titre */}
            <div>
              <h1 style={{
                color: '#312783', fontWeight: 700,
                fontSize: 'clamp(1.75rem, 4vw, 2.5rem)',
                lineHeight: 1.1, margin: 0,
              }}>
                {config.name}
              </h1>
            </div>

            {/* Dénivelé + prix + bouton */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span className="inline-flex items-center gap-2" style={{
                  color: '#E6007E', fontWeight: 700, fontSize: '1.125rem',
                }}>
                  {config.statIcon === 'Clock'
                    ? <Clock size={18} strokeWidth={1.5} />
                    : <Mountain size={18} strokeWidth={1.5} />
                  }
                  {config.denivele}
                </span>
                <span className="inline-flex items-center gap-2" style={{
                  color: '#E6007E', fontWeight: 700, fontSize: '1.125rem',
                }}>
                  <InfoIcon size={18} />
                  {config.priceFrom}
                </span>
              </div>
              <ScrollToBookingButton />
            </div>

            {/* Description */}
            {config.description.map((block, i) => (
              block.type === 'paragraph' ? (
                <p key={i} style={{ fontSize: '1.0625rem', lineHeight: 1.75, color: '#374151', margin: 0 }}>
                  {block.text}
                </p>
              ) : block.type === 'note' ? (
                <p key={i} style={{ fontSize: '1.0625rem', lineHeight: 1.75, color: '#374151', margin: 0 }}>
                  <strong>{block.label}</strong> {block.text}
                </p>
              ) : block.type === 'section' ? (
                <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  <h2 style={{ color: '#312783', fontWeight: 700, fontSize: '1.25rem', margin: 0 }}>
                    {block.title}
                  </h2>
                  {block.paragraphs.map((p: string, j: number) => (
                    <p key={j} style={{ fontSize: '1.0625rem', lineHeight: 1.75, color: '#374151', margin: 0 }}>
                      {p}
                    </p>
                  ))}
                </div>
              ) : null
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


          </div>
        </div>
      </section>

      {/* ── Grille de créneaux ── */}
      <div id="etape-2">
        <Suspense fallback={null}>
          <BookingClient volOverride={config.volParam} seasonOverride={config.season} initialFlights={initialFlights} />
        </Suspense>
      </div>

      {/* ── SVG décoratif bas-droite ── */}
      <img
        src="/bg-single-rose2.svg"
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute', right: 0, bottom: 0,
          width: 'clamp(300px, 40vw, 560px)',
          pointerEvents: 'none', userSelect: 'none', display: 'block',
        }}
      />

      </div>{/* fin contenu blanc */}

      {/* ── Autres vols ── */}
      <OtherFlightsSection currentVolParam={config.volParam} season={config.season} />

    </div>
  );
}
