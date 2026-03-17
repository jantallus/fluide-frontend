"use client";
import React, { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function StatsPage() {
  const [stats, setStats] = useState({ 
    summary: { totalRevenue: 0, totalBookings: 0 }, 
    upcoming: [],
    history: [] 
  });
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      // Appel à la route stats sécurisée de votre index.js
      const res = await apiFetch('/api/admin/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des statistiques:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-xl font-black uppercase italic animate-pulse text-sky-500">Chargement des données...</div>
    </div>
  );

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-8 font-sans bg-slate-50 min-h-screen text-slate-900">
      
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black uppercase italic leading-none">Statistiques</h1>
          <p className="text-slate-500 font-bold mt-2 uppercase text-[10px] tracking-widest">Suivi des performances et réservations</p>
        </div>
        <button 
          onClick={loadData} 
          className="bg-white border-2 border-slate-200 p-3 rounded-2xl shadow-sm hover:bg-slate-100 transition-all active:scale-95"
          title="Actualiser"
        >
          🔄
        </button>
      </div>

      {/* CARTES DE SYNTHÈSE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-sky-500 text-white p-8 rounded-[45px] shadow-2xl shadow-sky-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase opacity-70">Chiffre d'Affaires Total</p>
            <p className="text-4xl font-black mt-1">
              {(stats.summary.totalRevenue / 100).toLocaleString('fr-FR', { minimumFractionDigits: 2 })} €
            </p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/10 text-9xl font-black italic">€</div>
        </div>

        <div className="bg-slate-900 text-white p-8 rounded-[45px] shadow-2xl shadow-slate-200 relative overflow-hidden">
          <div className="relative z-10">
            <p className="text-xs font-black uppercase opacity-70">Nombre de Vols</p>
            <p className="text-4xl font-black mt-1">{stats.summary.totalBookings}</p>
          </div>
          <div className="absolute -right-4 -bottom-4 text-white/10 text-9xl font-black italic">#</div>
        </div>

        <div className="bg-white border-2 border-slate-200 p-8 rounded-[45px] flex flex-col justify-center">
          <p className="text-xs font-black uppercase text-slate-400">Panier Moyen</p>
          <p className="text-4xl font-black text-slate-900 mt-1">
            {stats.summary.totalBookings > 0 
              ? (stats.summary.totalRevenue / 100 / stats.summary.totalBookings).toFixed(2) 
              : "0.00"} €
          </p>
        </div>
      </div>

      {/* TABLEAU DES RÉSERVATIONS À VENIR */}
      <div className="bg-white rounded-[45px] border-2 border-slate-100 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-50 flex justify-between items-center">
          <h2 className="text-xl font-black uppercase italic text-slate-800">Prochaines sessions</h2>
          <span className="bg-sky-100 text-sky-600 px-4 py-1 rounded-full text-[10px] font-black uppercase">
            {stats.upcoming.length} vols prévus
          </span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black uppercase text-slate-400">
                <th className="p-6">Date & Heure</th>
                <th className="p-6">Passager (Customer)</th>
                <th className="p-6">Type de Vol</th>
                <th className="p-6">Moniteur</th>
                <th className="p-6 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.upcoming.length > 0 ? stats.upcoming.map((item: any) => (
                <tr key={item.id} className="hover:bg-sky-50/30 transition-colors group">
                  <td className="p-6 font-bold text-sm text-slate-700">
                    {new Date(item.start_time).toLocaleDateString('fr-FR', { 
                      day: '2-digit', 
                      month: 'short', 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </td>
                  <td className="p-6">
                    <span className="font-black text-sky-600 uppercase text-xs">
                      {item.client_name || "Nom non renseigné"}
                    </span>
                  </td>
                  <td className="p-6">
                    <span className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                      {item.flight_name}
                    </span>
                  </td>
                  <td className="p-6 font-bold text-slate-500 text-xs italic">
                    {item.monitor_name}
                  </td>
                  <td className="p-6 text-right font-black text-slate-900">
                    {(item.total_price / 100).toFixed(2)} €
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={5} className="p-10 text-center text-slate-400 font-bold italic">
                    Aucune réservation à venir dans la base de données.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}