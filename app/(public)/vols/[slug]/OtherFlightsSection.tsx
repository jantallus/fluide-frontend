import Link from 'next/link';
import { Mountain, Clock, Weight, Wind } from 'lucide-react';
import { SkiIcon, SnowboardIcon, PedestrianIcon, ChildrenIcon, GoproIcon } from '@/components/icons/ActivityIcons';
import { Snowflake, Sun } from 'lucide-react';
import type { FlightType } from '@/lib/types';
import { getMarketingInfo } from '@/lib/booking-utils';
import { VOL_PAGES } from '../config';

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:3001';

function flightLink(flight: FlightType): string {
  const entry = Object.values(VOL_PAGES).find(cfg => {
    const regex = new RegExp('\\b' + cfg.volParam + '\\b', 'i');
    return regex.test(flight.name);
  });
  if (entry) return `/vols/${entry.slug}`;
  const keyword = flight.name.toLowerCase().split(/\s+/).pop() ?? 'vol';
  return `/booking?vol=${encodeURIComponent(keyword)}`;
}

function MarketingIcon({ info }: { info: string }) {
  if (info.includes('dénivelé')) return <Mountain size={18} strokeWidth={1.5} />;
  if (info.includes('min') || info.includes('h de vol')) return <Clock size={18} strokeWidth={1.5} />;
  return <Wind size={18} strokeWidth={1.5} />;
}

async function fetchFlights(): Promise<FlightType[]> {
  try {
    const res = await fetch(`${BACKEND_URL}/api/flight-types`, { next: { revalidate: 60 } });
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export default async function OtherFlightsSection({ currentVolParam }: { currentVolParam: string }) {
  const allFlights = await fetchFlights();
  const others = allFlights
    .filter(f => f.is_active !== false)
    .filter(f => !new RegExp('\\b' + currentVolParam + '\\b', 'i').test(f.name))
    .slice(0, 3);

  if (others.length === 0) return null;

  return (
    <section style={{ backgroundColor: '#312783' }}>
      <div className="max-w-7xl mx-auto px-4 py-16">

        {/* Titre */}
        <h2 style={{
          color: 'white', fontWeight: 700,
          fontSize: 'clamp(1.5rem, 3vw, 2rem)',
          marginBottom: '2.5rem',
        }}>
          Autres vols proposés par Fluide
        </h2>

        {/* Grille de cartes */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {others.map(flight => {
            const info = getMarketingInfo(flight.name);
            const s = String(flight.season || 'ALL').toUpperCase().trim();
            const isWinter = s === 'WINTER' || s === 'HIVER';
            const isSummer = s === 'SUMMER' || s === 'ETE' || s === 'ÉTÉ';
            const SeasonIcon = isWinter ? Snowflake : isSummer ? Sun : null;
            const href = flightLink(flight);

            return (
              <div key={flight.id} className="bg-white rounded-[10px] p-8 border border-slate-100 flex flex-col justify-between">

                {/* Photo */}
                {flight.image_url && (
                  <div
                    className="w-full h-40 bg-cover bg-center rounded-[10px] mb-6 border border-slate-100"
                    style={{ backgroundImage: `url(${flight.image_url})` }}
                  />
                )}

                <div className="flex flex-col gap-3 flex-1">
                  {/* Nom */}
                  <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#312783', margin: 0 }}>
                    {flight.name}
                  </h3>

                  {/* Infos marketing */}
                  <div className="flex flex-wrap gap-x-5 gap-y-1">
                    <span style={{ color: '#E6007E', fontSize: '1.125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <MarketingIcon info={info} />{info}
                    </span>
                    <span style={{ color: '#E6007E', fontSize: '1.125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                      <Weight size={18} strokeWidth={1.5} />
                      {flight.weight_min ?? 20}–{flight.weight_max ?? 110} kg
                    </span>
                  </div>

                  {/* Pictogrammes activité + saison */}
                  {(flight.activity_ski || flight.activity_snowboard || flight.activity_pedestrian || flight.activity_children || flight.activity_gopro || SeasonIcon) && (
                    <div className="flex flex-wrap items-center gap-3" style={{ color: '#E6007E' }}>
                      {SeasonIcon && <SeasonIcon size={22} strokeWidth={1.5} />}
                      {flight.activity_ski        && <SkiIcon        size={22} />}
                      {flight.activity_snowboard  && <SnowboardIcon  size={22} />}
                      {flight.activity_pedestrian && <PedestrianIcon size={22} />}
                      {flight.activity_children   && <ChildrenIcon   size={22} />}
                      {flight.activity_gopro      && <GoproIcon      size={22} />}
                    </div>
                  )}

                  {/* Description */}
                  {flight.description && (
                    <p style={{ color: '#1D1D1B', fontSize: '1.0625rem', lineHeight: 1.625, margin: 0 }}>
                      {flight.description}
                    </p>
                  )}
                </div>

                {/* Prix + bouton */}
                <div className="flex items-center justify-between gap-4 mt-6">
                  <span style={{ fontSize: '2rem', fontWeight: 700, color: '#E6007E' }}>
                    {flight.price_cents ? Math.round(flight.price_cents / 100) : '—'}€
                  </span>
                  <Link
                    href={href}
                    className="rounded-[5px] px-5 py-3 font-bold text-base transition-colors"
                    style={{ backgroundColor: 'rgba(230,0,126,0.1)', color: '#E6007E' }}
                  >
                    Réserver
                  </Link>
                </div>

              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
