"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ComplementsPage() {
  const [extras, setExtras] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadExtras = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/complements');
      if (res.ok) setExtras(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadExtras(); }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <p className="text-emerald-500 font-black uppercase text-xs tracking-widest mb-2">Options de vol</p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-emerald-500">Compléments</span>
            </h1>
          </div>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl">
            + Ajouter une option
          </button>
        </header>

        <div className="grid gap-4">
          {extras.map((extra) => (
            <div key={extra.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center justify-between group hover:border-emerald-200 transition-all">
              <div className="flex items-center gap-6">
                <div className="w-14 h-14 bg-emerald-50 rounded-2xl flex items-center justify-center text-2xl">
                  {extra.name.includes('GoPro') ? '📹' : '✨'}
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-lg leading-tight">{extra.name}</h3>
                  <p className="text-slate-400 text-xs font-medium">{extra.description}</p>
                </div>
              </div>

              <div className="flex items-center gap-8">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-300 uppercase">Tarif</p>
                  <p className="text-xl font-black text-slate-900 italic">{extra.price_cents / 100}€</p>
                </div>
                <button className="p-3 bg-slate-50 text-slate-300 rounded-xl group-hover:text-rose-500 transition-colors">
                  🗑️
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 bg-emerald-900 rounded-[40px] p-8 text-white flex items-center justify-between overflow-hidden relative">
            <div className="relative z-10">
                <h4 className="text-xl font-black uppercase italic mb-2">Astuce Fluide</h4>
                <p className="text-emerald-200 text-sm max-w-md font-medium">
                    Ces options seront proposées aux clients lors de leur réservation en ligne ou pourront être ajoutées manuellement sur le planning.
                </p>
            </div>
            <div className="text-6xl opacity-20 absolute -right-4 -bottom-4 rotate-12">🚀</div>
        </div>
      </div>
    </div>
  );
}