"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function MoniteursPage() {
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Charger la liste des moniteurs et admins
  const loadMonitors = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/monitors-admin'); // On va créer cette route dédiée
      if (res.ok) {
        setMonitors(await res.json());
      }
    } catch (err) {
      console.error("Erreur chargement moniteurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadMonitors(); }, []);

  // Basculer le statut "Actif au planning"
  const toggleActive = async (id: number, currentStatus: boolean) => {
    try {
      const res = await apiFetch(`/api/monitors/${id}/toggle-active`, {
        method: 'PATCH',
        body: JSON.stringify({ is_active_monitor: !currentStatus })
      });
      if (res.ok) loadMonitors();
    } catch (err) {
      alert("Erreur lors de la mise à jour");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="flex justify-between items-end mb-12">
          <div>
            <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Gestion équipe</p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-sky-500">Moniteurs</span>
            </h1>
          </div>
          <div className="bg-white px-6 py-3 rounded-2xl shadow-sm border border-slate-200">
            <span className="text-2xl font-black text-slate-900">{monitors.filter(m => m.is_active_monitor).length}</span>
            <span className="text-slate-400 font-bold text-xs uppercase ml-2">En activité</span>
          </div>
        </header>

        {loading ? (
          <div className="animate-pulse space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-20 bg-slate-200 rounded-3xl" />)}
          </div>
        ) : (
          <div className="grid gap-4">
            {monitors.map((m) => (
              <div key={m.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex items-center justify-between hover:shadow-md transition-shadow">
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${m.role === 'admin' ? 'bg-amber-100 text-amber-600' : 'bg-sky-100 text-sky-600'}`}>
                    {m.first_name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-slate-800 uppercase text-lg">{m.first_name}</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{m.role} • {m.email}</p>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-slate-300 uppercase mb-1">Planning</p>
                    <button 
                      onClick={() => toggleActive(m.id, m.is_active_monitor)}
                      className={`px-6 py-2 rounded-full font-black text-[10px] uppercase transition-all ${
                        m.is_active_monitor 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-200' 
                        : 'bg-slate-100 text-slate-400'
                      }`}
                    >
                      {m.is_active_monitor ? 'Actif' : 'Inactif'}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        <footer className="mt-12 p-8 border-2 border-dashed border-slate-200 rounded-[40px] text-center">
          <p className="text-slate-400 font-medium text-sm">
            Seuls les moniteurs marqués comme <span className="text-emerald-500 font-bold">"Actifs"</span> apparaissent <br /> dans l'outil de génération de créneaux.
          </p>
        </footer>
      </div>
    </div>
  );
}