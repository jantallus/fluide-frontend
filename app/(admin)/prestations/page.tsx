"use client";
import React, { useState } from 'react';
import { usePrestationsData } from '@/hooks/usePrestationsData';
import { FlightModal } from '@/components/prestations/FlightModal';
import type { FlightType } from '@/lib/types';

export default function PrestationsPage() {
  const { flights, slotDefs, loading, loadData, deleteFlight } = usePrestationsData();
  const [seasonFilter, setSeasonFilter] = useState<'ALL' | 'SUMMER' | 'WINTER'>('ALL');
  const [showModal, setShowModal] = useState(false);
  const [flightToEdit, setFlightToEdit] = useState<FlightType | null>(null);

  const startEdit = (f: FlightType) => { setFlightToEdit(f); setShowModal(true); };
  const startNew = () => { setFlightToEdit(null); setShowModal(true); };
  const handleClose = () => { setShowModal(false); setFlightToEdit(null); };

  const filteredFlights = flights.filter(f => {
    if (seasonFilter === 'ALL') return true;
    return f.season === seasonFilter || f.season === 'ALL';
  });

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
          <div>
            <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Catalogue</p>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-sky-500">Prestations</span>
            </h1>
          </div>
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200 flex w-full sm:w-auto">
              <button onClick={() => setSeasonFilter('ALL')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Tout</button>
              <button onClick={() => setSeasonFilter('SUMMER')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'SUMMER' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-slate-900'}`}>☀️ Été</button>
              <button onClick={() => setSeasonFilter('WINTER')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'WINTER' ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-900'}`}>❄️ Hiver</button>
            </div>
            <button onClick={startNew} className="w-full sm:w-auto bg-sky-500 text-white px-6 py-4 sm:py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-sky-600 transition-colors">
              + Nouveau Vol
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-[40px]" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredFlights.map(f => (
              <div key={f.id} className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: f.color_code }} />
                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl md:text-2xl font-black uppercase italic text-slate-800 leading-tight pr-4">{f.name}</h3>
                    <span className="bg-slate-900 text-white px-3 md:px-4 py-1 rounded-full font-black text-sm md:text-lg italic shrink-0">{f.price_cents / 100}€</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">⏱️ {f.duration_minutes} min</div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">⚖️ {f.weight_min ?? 20} - {f.weight_max ?? 110} kg</div>
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase">⏳ Bloqué {f.booking_delay_hours || 0}h avant</div>
                    {(f.allowed_time_slots?.length ?? 0) > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">✅ {f.allowed_time_slots!.length} Créneaux</div>
                    )}
                    <div className="flex items-center gap-2 font-bold text-[10px] uppercase flex-wrap">
                      {f.season === 'SUMMER' && <span className="text-amber-500 bg-amber-50 px-2 py-1 rounded-md">☀️ Exclusif Été</span>}
                      {f.season === 'WINTER' && <span className="text-sky-500 bg-sky-50 px-2 py-1 rounded-md">❄️ Exclusif Hiver</span>}
                      {(!f.season || f.season === 'ALL') && <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">🌍 Toute l'année</span>}
                      {f.allow_multi_slots && <span className="text-violet-500 bg-violet-50 px-2 py-1 rounded-md">🧩 Multi-créneaux</span>}
                    </div>
                  </div>
                </div>
                <div className="flex gap-2 relative z-20 mt-4 border-t border-slate-100 pt-6">
                  <button onClick={() => startEdit(f)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors cursor-pointer">Modifier</button>
                  <button onClick={() => deleteFlight(f.id)} className="px-4 bg-rose-50 text-rose-500 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all cursor-pointer">Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <FlightModal
          flightToEdit={flightToEdit}
          slotDefs={slotDefs}
          onClose={handleClose}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
