"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';
import type { DashboardStats, UpcomingFlight } from '@/lib/types';

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({ todaySlots: 0, bookedSlots: 0, revenue: 0 });
  const [nextFlights, setNextFlights] = useState<UpcomingFlight[]>([]);

  const loadDashboard = async () => {
    try {
      const res = await apiFetch('/api/dashboard-stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data.summary);
        setNextFlights(data.upcoming);
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadDashboard(); }, []);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Aujourd'hui</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Tableau de <span className="text-sky-500">Bord</span>
          </h1>
        </header>

        {/* CARTES DE STATISTIQUES */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-100">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Taux d'occupation</p>
            <div className="flex items-end gap-2">
              <span className="text-4xl font-black italic text-slate-900">
                {stats.todaySlots > 0 ? Math.round((stats.bookedSlots / stats.todaySlots) * 100) : 0}%
              </span>
              <span className="text-slate-300 font-bold mb-1">({stats.bookedSlots}/{stats.todaySlots} vols)</span>
            </div>
          </div>

          <div className="bg-sky-500 p-8 rounded-[40px] shadow-xl shadow-sky-100 text-white">
            <p className="text-[10px] font-black uppercase text-sky-100 mb-2">Chiffre d'Affaires Jour</p>
            <span className="text-4xl font-black italic">{stats.revenue / 100}€</span>
          </div>

          <div className="bg-slate-900 p-8 rounded-[40px] shadow-xl text-white">
            <p className="text-[10px] font-black uppercase text-slate-400 mb-2">Status Structure</p>
            <span className="text-xl font-black uppercase italic text-emerald-400">Ouvert 🟢</span>
          </div>
        </div>

        {/* LISTE DES PROCHAINS VOLS */}
        <div className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black uppercase italic mb-8 flex items-center gap-3">
            <span className="w-2 h-8 bg-sky-500 rounded-full"></span> Prochains décollages
          </h2>
          
          <div className="space-y-4">
            {nextFlights.length > 0 ? nextFlights.map((f: UpcomingFlight) => (
              <div key={f.id} className="flex items-center justify-between p-6 bg-slate-50 rounded-[30px] border border-slate-100">
                <div className="flex items-center gap-6">
                  <span className="bg-white px-4 py-2 rounded-xl font-black text-sky-600 shadow-sm border border-slate-100">
                    {new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <div>
                    <p className="font-black uppercase text-slate-800">{f.title || 'Client Inconnu'}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                      Pilote : {f.monitor_name} • {f.flight_name}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2">
                   {f.notes && <span className="bg-amber-100 text-amber-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">Note</span>}
                </div>
              </div>
            )) : (
              <p className="text-center text-slate-300 font-bold py-12">Aucun vol prévu pour le moment.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}