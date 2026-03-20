"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function PrestationsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadFlights = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/flight-types');
      if (res.ok) setFlights(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadFlights(); }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Catalogue</p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-sky-500">Prestations</span>
            </h1>
          </div>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-transform">
            + Nouveau Vol
          </button>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-[40px]" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {flights.map((f) => (
              <div key={f.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                {/* Badge Couleur */}
                <div 
                  className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 transition-transform group-hover:scale-150"
                  style={{ backgroundColor: f.color_code }}
                />

                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black uppercase italic text-slate-800 leading-none">{f.name}</h3>
                    <span className="bg-slate-900 text-white px-4 py-1 rounded-full font-black text-lg italic">
                      {f.price_cents / 100}€
                    </span>
                  </div>

                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">
                      <span className="w-5 h-5 bg-slate-100 rounded-md flex items-center justify-center">⏱️</span>
                      Durée totale : {f.duration_minutes} min
                    </div>
                    
                    {f.restricted_start_time && (
                      <div className="flex items-center gap-2 text-amber-600 font-bold text-[10px] uppercase">
                        <span className="w-5 h-5 bg-amber-50 rounded-md flex items-center justify-center">☀️</span>
                        Contrainte : {f.restricted_start_time.slice(0,5)} - {f.restricted_end_time.slice(0,5)}
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2">
                    <button className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">Modifier</button>
                    <button className="px-4 bg-rose-50 text-rose-400 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all">Suppr.</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}