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

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const config = VOL_PAGES[slug];
  if (!config) return {};
  const description = config.description[0]?.type === 'paragraph' ? config.description[0].text : '';
  return {
    title: config.name,
    description,
    alternates: { canonical: `/vols/${slug}`, languages: { fr: `/vols/${slug}`, 'x-default': `/vols/${slug}` } },
    openGraph: {
      title: `${config.name} · La Clusaz`,
      description,
      images: [{ url: config.heroImage, alt: config.name }],
    },
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

  const price = config.priceFrom.match(/\d+/)?.[0];
  const description = config.description[0]?.type === 'paragraph' ? config.description[0].text : config.name;
  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: config.name,
    description,
    image: `https://reservation.fluide-parapente.fr${config.heroImage}`,
    brand: { '@type': 'Brand', name: 'Fluide Parapente' },
    offers: {
      '@type': 'Offer',
      price,
      priceCurrency: 'EUR',
      availability: 'https://schema.org/InStock',
      url: `https://reservation.fluide-parapente.fr/vols/${slug}`,
    },
  };

  return (
    <div style={{ backgroundColor: '#FFFFFF', color: '#1D1D1B' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      {config.backUrl && <BackNavigationGuard to={config.backUrl} />}

      {/* ── Contenu blanc avec SVG décoratif ── */}
      <div style={{ position: 'relative' }}>

      {/* ── Présentation : photo gauche / texte droite ── */}
      <section className="py-[70px]">
        <div className="flex flex-wrap" style={{ width: '92%', maxWidth: '1240px', margin: '0 auto' }}>

          {/* Photo — col40 */}
          <div className="w-full md:w-1/2 lg:w-[40%]" style={{ padding: '15px 20px' }}>
            <div style={{ borderRadius: '10px', overflow: 'hidden', aspectRatio: '1/1' }}>
              <img
                src={config.heroImage}
                alt={config.name}
                fetchPriority="high"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>

          {/* Spacer — col3, desktop only */}
          <div className="hidden lg:block lg:w-[3%]" />

          {/* Contenu — col57 */}
          <div className="w-full lg:w-[57%]" style={{ padding: '15px 20px' }}>

            {/* Titre */}
            <h1 style={{
              color: '#312783', fontWeight: 700,
              fontSize: 'clamp(1.75rem, 4vw, 48px)',
              lineHeight: 1.1, margin: 0,
            }}>
              {config.name}
            </h1>

            {/* Dénivelé + prix */}
            <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', margin: '10px 0', color: '#E6007E', fontSize: '18px' }}>
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                {config.statIcon === 'Clock'
                  ? <Clock size={20} strokeWidth={1.5} />
                  : <Mountain size={20} strokeWidth={1.5} />
                }
              </span>
              {config.denivele}
            </p>
            <p style={{ fontWeight: 700, display: 'flex', alignItems: 'center', margin: '10px 0', color: '#E6007E', fontSize: '18px' }}>
              <span style={{ marginRight: '10px', display: 'flex', alignItems: 'center' }}>
                <InfoIcon size={20} />
              </span>
              {config.priceFrom}
            </p>

            {/* Bouton */}
            <p style={{ marginTop: '15px' }}>
              <ScrollToBookingButton />
            </p>

            {/* Description */}
            {config.description.map((block, i) => (
              block.type === 'paragraph' ? (
                <p key={i} style={{ fontSize: '18px', lineHeight: '26px', margin: '15px 0', color: '#1D1D1B' }}>
                  {block.text}
                </p>
              ) : block.type === 'note' ? (
                <p key={i} style={{ fontSize: '18px', lineHeight: '26px', margin: '15px 0', color: '#1D1D1B' }}>
                  <strong>{block.label}</strong> {block.text}
                </p>
              ) : block.type === 'section' ? (
                <div key={i}>
                  <h2 style={{ color: '#312783', fontWeight: 700, fontSize: '24px', marginTop: '20px', lineHeight: '1.1em', marginBottom: 0 }}>
                    {block.title}
                  </h2>
                  {block.paragraphs.map((p: string, j: number) => (
                    <p key={j} style={{ fontSize: '18px', lineHeight: '26px', margin: '15px 0', color: '#1D1D1B' }}>
                      {p}
                    </p>
                  ))}
                </div>
              ) : null
            ))}

            {/* Highlights */}
            {config.highlights.length > 0 && (
              <ul style={{ listStyle: 'none', padding: 0, margin: '15px 0', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {config.highlights.map((h, i) => (
                  <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px', color: '#312783', fontWeight: 600, fontSize: '18px' }}>
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
        <Suspense fallback={<div style={{ minHeight: '120px' }} />}>
          <BookingClient volOverride={config.volParam} seasonOverride={config.season} />
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
