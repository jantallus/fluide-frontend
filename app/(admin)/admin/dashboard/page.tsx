"use client";
import { useEffect, useState } from 'react';
// Import de l'utilitaire sécurisé
import { apiFetch } from '@/lib/api'; 

export default function DashboardPage() {
  // Initialisation stricte
  const [stats, setStats] = useState({ 
    summary: { totalRevenue: 0, totalBookings: 0 }, 
    upcoming: [], 
    history: [] 
  });
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      // Utilisation de apiFetch qui injecte automatiquement le token
      const res = await apiFetch('/api/admin/stats');
      
      if (res.ok) {
        const data = await res.json();
        // Sécurité : on s'assure que data contient bien ce qu'on attend
        setStats({
          summary: data.summary || { totalRevenue: 0, totalBookings: 0 },
          upcoming: data.upcoming || [],
          history: data.history || []
        });
      }
    } catch (err) {
      console.error("Erreur stats:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <div className="text-center font-black animate-pulse text-slate-400 uppercase italic tracking-widest">
        Accès sécurisé... Récupération des données
      </div>
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-12 p-6">
      {/* 1. HEADER */}
      <div>
        <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Tableau de bord</h1>
        <p className="text-slate-500 font-medium">Vue d'ensemble de l'activité de Fluide Parapente.</p>
      </div>

      {/* 2. CARTES DE STATISTIQUES */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Chiffre d'affaires</p>
          <p className="text-4xl font-black text-slate-900 italic">
            {((stats.summary.totalRevenue || 0) / 100).toLocaleString('fr-FR')}€
          </p>
        </div>

        <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
          <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-2">Réservations totales</p>
          <p className="text-4xl font-black text-slate-900 italic">{stats.summary.totalBookings || 0}</p>
        </div>

        <div className="bg-gradient-to-br from-sky-500 to-indigo-600 p-8 rounded-[40px] shadow-xl text-white">
          <p className="text-[10px] font-black text-sky-100 uppercase tracking-[0.2em] mb-2">Objectif mensuel</p>
          <p className="text-4xl font-black italic">85%</p>
          <div className="w-full bg-white/20 h-2 mt-4 rounded-full overflow-hidden">
            <div className="bg-white h-full w-[85%] shadow-[0_0_15px_rgba(255,255,255,0.5)]"></div>
          </div>
        </div>
      </div>

      {/* 3. RÉSERVATIONS À VENIR */}
      <section className="space-y-6">
        <div className="flex items-center gap-4">
          <div className="w-3 h-3 bg-emerald-500 rounded-full animate-ping"></div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-900">Prochains décollages</h2>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {(stats.upcoming?.length || 0) > 0 ? stats.upcoming.map((item: any) => (
            <div key={item.id} className="bg-white p-6 rounded-[32px] border-2 border-emerald-100 shadow-sm relative overflow-hidden group hover:border-emerald-400 transition-all">
              <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <span className="text-4xl font-black italic">#{item.id}</span>
              </div>
              <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 italic">
                {new Date(item.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' })}
              </p>
              <h3 className="text-xl font-black text-slate-900 uppercase italic leading-none mb-1">{item.client_name}</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-tighter mb-4">{item.flight_name}</p>
              
              <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                <div>
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Heure</p>
                  <p className="font-black text-slate-700 italic">
                    {new Date(item.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Pilote</p>
                  <p className="font-black text-sky-500 italic uppercase text-sm">{item.monitor_name}</p>
                </div>
              </div>
            </div>
          )) : (
            <div className="col-span-full bg-slate-100/50 p-10 rounded-[32px] border border-dashed border-slate-200 text-center">
               <p className="text-slate-400 font-bold italic text-sm">Aucun vol prévu pour le moment.</p>
            </div>
          )}
        </div>
      </section>

      {/* 4. HISTORIQUE DES VENTES */}
      <section className="space-y-6">
        <h2 className="text-2xl font-black uppercase italic tracking-tighter text-slate-400">Historique des ventes</h2>
        <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50">
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Date</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Client</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Vol</th>
                <th className="p-6 text-[10px] font-black uppercase tracking-widest text-slate-400 text-right">Montant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.history && stats.history.length > 0 ? stats.history.map((booking: any) => (
                <tr key={booking.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="p-6 text-xs font-bold text-slate-400">
                    {new Date(booking.start_time).toLocaleDateString()}
                  </td>
                  <td className="p-6 font-black text-slate-900 uppercase italic text-sm">{booking.client_name}</td>
                  <td className="p-6">
                    <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-3 py-1 rounded-lg uppercase">
                      {booking.flight_name}
                    </span>
                  </td>
                  <td className="p-6 text-right font-black text-slate-900 italic">
                    {(booking.total_price / 100).toLocaleString('fr-FR')}€
                  </td>
                </tr>
              )) : (
                <tr>
                  <td colSpan={4} className="p-10 text-center text-slate-400 italic text-sm">Aucune transaction passée.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}