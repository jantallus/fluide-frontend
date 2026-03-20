"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // États pour la modale d'ajout
  const [showAddModal, setShowAddModal] = useState(false);
  const [newRotation, setNewRotation] = useState({ start_time: '', duration_minutes: 60, label: 'VOL' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, setRes] = await Promise.all([
        apiFetch('/api/slot-definitions'),
        apiFetch('/api/settings')
      ]);
      if (defRes.ok) setDefinitions(await defRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        const settingsObj = s.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
        setSettings(settingsObj);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleAddRotation = async () => {
    try {
      const res = await apiFetch('/api/slot-definitions', {
        method: 'POST',
        body: JSON.stringify(newRotation)
      });
      if (res.ok) {
        setShowAddModal(false);
        loadData();
      }
    } catch (err) { alert("Erreur lors de l'ajout"); }
  };

  const deleteDef = async (id: number) => {
    if(!confirm("Supprimer cette rotation ?")) return;
    await apiFetch(`/api/slot-definitions/${id}`, { method: 'DELETE' });
    loadData();
  };

  const saveSetting = async (key: string, value: string) => {
    await apiFetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ key, value })
    });
    loadData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-2">Logistique & Saison</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Configuration <span className="text-indigo-500">Fluide</span>
          </h1>
        </header>

        {/* SECTION 1 : SAISON */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-8">
          <h2 className="text-xl font-black uppercase italic mb-6 flex items-center gap-2">📅 Période d'ouverture</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Début de saison</label>
              <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={settings.season_start || ''} onChange={(e) => saveSetting('season_start', e.target.value)} />
            </div>
            <div>
              <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Fin de saison</label>
              <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={settings.season_end || ''} onChange={(e) => saveSetting('season_end', e.target.value)} />
            </div>
          </div>
        </section>

        {/* SECTION 2 : ROTATIONS */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">⏱️ Rotations types</h2>
            <button 
              onClick={() => setShowAddModal(true)}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform"
            >
              + Ajouter une rotation
            </button>
          </div>
          
          <div className="space-y-3">
            {definitions.map((def) => (
              <div key={def.id} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group">
                <div className="flex items-center gap-6">
                  <span className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{def.start_time.slice(0, 5)}</span>
                  <div>
                    <p className="font-black uppercase text-xs text-slate-800">{def.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{def.duration_minutes} min</p>
                  </div>
                </div>
                <button onClick={() => deleteDef(def.id)} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">🗑️</button>
              </div>
            ))}
          </div>
        </section>

        {/* MODALE D'AJOUT */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
              <h2 className="text-xl font-black uppercase italic mb-6">Nouvelle Rotation</h2>
              <div className="space-y-4">
                <input type="time" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewRotation({...newRotation, start_time: e.target.value})} />
                <input type="number" placeholder="Durée (min)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewRotation({...newRotation, duration_minutes: parseInt(e.target.value)})} />
                <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewRotation({...newRotation, label: e.target.value})}>
                  <option value="VOL">VOL</option>
                  <option value="PAUSE">PAUSE</option>
                </select>
                <button onClick={handleAddRotation} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">Enregistrer</button>
                <button onClick={() => setShowAddModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}