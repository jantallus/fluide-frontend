"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function CouponsPage() {
  const [coupons, setCoupons] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/gift-cards');
        if (res.ok) {
          const data = await res.json();
          setCoupons(data);
        }
      } catch (err) {
        console.error("Erreur coupons:", err);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <p className="text-fuchsia-500 font-black uppercase text-xs tracking-widest mb-2">Boutique</p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Bons <span className="text-fuchsia-500">Cadeaux</span>
            </h1>
          </div>
          <button className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl">+ Créer un bon</button>
        </header>

        <div className="grid gap-6">
          {coupons.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-[35px] shadow-sm border border-slate-100 flex items-center justify-between group">
              <div className="flex items-center gap-6">
                <div className="bg-fuchsia-50 text-fuchsia-600 w-16 h-16 rounded-2xl flex flex-col items-center justify-center border border-fuchsia-100">
                  <span className="text-[10px] font-black uppercase">CODE</span>
                  <span className="font-black text-xs italic">{c.code.split('-').pop()}</span>
                </div>
                <div>
                  <h3 className="font-black text-slate-800 uppercase text-lg">{c.beneficiary_name}</h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase italic">
                    {c.flight_name} • Expire le {new Date(c.expires_at).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <span className={`px-4 py-2 rounded-full font-black text-[10px] uppercase ${
                c.status === 'used' ? 'bg-slate-100 text-slate-400' : 'bg-emerald-100 text-emerald-600'
              }`}>
                {c.status === 'used' ? 'Utilisé' : 'Valide'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}