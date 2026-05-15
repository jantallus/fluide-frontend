import Link from 'next/link';
import { Mountain, Clock } from 'lucide-react';
import { InfoIcon } from '@/components/icons/ActivityIcons';
import { VOL_PAGES } from '../config';

export default function OtherFlightsSection({ currentVolParam, season }: { currentVolParam: string; season: 'Standard' | 'Hiver' }) {
  const others = Object.values(VOL_PAGES).filter(cfg => cfg.volParam !== currentVolParam && cfg.season === season);

  if (others.length === 0) return null;

  return (
    <section style={{ backgroundColor: '#312783' }}>
      <div className="max-w-7xl mx-auto px-4 py-16">

        <h2 style={{
          color: 'white', fontWeight: 700,
          fontSize: 'clamp(1.75rem, 3.5vw, 2.5rem)',
          marginBottom: '2.5rem',
          textAlign: 'center',
        }}>
          Autres vols proposés par Fluide
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {others.map(cfg => (
            <div key={cfg.slug} className="bg-white rounded-[10px] p-8 border border-slate-100 flex flex-col justify-between">

              {/* Photo */}
              <div
                className="w-full h-40 bg-cover bg-center rounded-[10px] mb-6"
                style={{ backgroundImage: `url(${cfg.heroImage})` }}
              />

              <div className="flex flex-col gap-3 flex-1">
                <h3 style={{ fontSize: '1.5rem', fontWeight: 700, color: '#312783', margin: 0 }}>
                  {cfg.name}
                </h3>

                <div className="flex flex-wrap gap-x-5 gap-y-1">
                  <span style={{ color: '#E6007E', fontSize: '1.125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    {cfg.statIcon === 'Clock'
                      ? <Clock size={18} strokeWidth={1.5} />
                      : <Mountain size={18} strokeWidth={1.5} />
                    }{cfg.denivele}
                  </span>
                  <span style={{ color: '#E6007E', fontSize: '1.125rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 6 }}>
                    <InfoIcon size={18} />{cfg.priceFrom}
                  </span>
                </div>
              </div>

              <div className="flex items-center justify-end gap-4 mt-6">
                <Link
                  href={`/vols/${cfg.slug}`}
                  className="rounded-[5px] px-5 py-3 font-bold text-base transition-colors"
                  style={{ backgroundColor: '#E6007E', color: 'white' }}
                >
                  Réserver
                </Link>
              </div>

            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
