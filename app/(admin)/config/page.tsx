"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ConfigPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  // NOUVEAU : État pour gérer les multiples saisons
  const [seasons, setSeasons] = useState<{id: string, name: string, start: string, end: string}[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [newRotation, setNewRotation] = useState({ start_time: '', duration_minutes: 60, label: 'VOL' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, setRes] = await Promise.all([
        apiFetch('/api/slot-definitions'),
        apiFetch('/api/settings')
      ]);
      
      if (defRes.ok) {
        setDefinitions(await defRes.json());
      }
      
      if (setRes.ok) {
        const s = await setRes.json();
        const settingsObj = s.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
        setSettings(settingsObj);

        // NOUVEAU : On récupère les périodes si elles existent, sinon on met un tableau vide
        if (settingsObj.opening_periods) {
          try {
            setSeasons(JSON.parse(settingsObj.opening_periods));
          } catch (e) {
            setSeasons([]);
          }
        }
      }
    } catch (err) { 
      console.error(err); 
    } finally { 
      setLoading(false); 
    }
  };

  useEffect(() => { loadData(); }, []);

  // --- GESTION DES ROTATIONS ---
  const handleSaveRotation = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/slot-definitions/${editingId}` : '/api/slot-definitions';
    
    try {
      const res = await apiFetch(url, {
        method: method,
        body: JSON.stringify(newRotation)
      });
      if (res.ok) {
        setShowAddModal(false);
        setEditingId(null);
        setNewRotation({ start_time: '', duration_minutes: 60, label: 'VOL' });
        loadData();
      } else {
        const data = await res.json();
        alert(data.error || "Erreur lors de l'enregistrement");
      }
    } catch (err) { alert("Erreur réseau"); }
  };

  const deleteDef = async (id: number) => {
    if(!confirm("Supprimer cette rotation ?")) return;
    await apiFetch(`/api/slot-definitions/${id}`, { method: 'DELETE' });
    loadData();
  };

  // --- GESTION DES SAISONS MULTIPLES ---
  const saveSeasonsToDB = async (updatedSeasons: any[]) => {
    await apiFetch('/api/settings', {
      method: 'POST',
      body: JSON.stringify({ key: 'opening_periods', value: JSON.stringify(updatedSeasons) })
    });
  };

  const handleAddSeason = () => {
    const newSeason = { id: Date.now().toString(), name: '', start: '', end: '' };
    const updated = [...seasons, newSeason];
    setSeasons(updated);
    saveSeasonsToDB(updated);
  };

  const handleSeasonChange = (id: string, field: string, value: string) => {
    const updated = seasons.map(s => s.id === id ? { ...s, [field]: value } : s);
    setSeasons(updated);
  };

  const handleDeleteSeason = (id: string) => {
    if(!confirm("Supprimer cette période d'ouverture ?")) return;
    const updated = seasons.filter(s => s.id !== id);
    setSeasons(updated);
    saveSeasonsToDB(updated);
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

        {/* SECTION 1 : SAISONS MULTIPLES */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">📅 Périodes d'ouverture</h2>
            <button 
              onClick={handleAddSeason}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform"
            >
              + Ajouter une période
            </button>
          </div>
          
          <div className="space-y-4">
            {seasons.length === 0 && (
              <div className="text-center p-8 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">Aucune période définie. Créez-en une pour restreindre les réservations.</p>
              </div>
            )}
            
            {seasons.map((season) => (
              <div key={season.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-100 transition-all hover:border-indigo-100">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Nom de la période</label>
                  <input 
                    type="text" 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300 transition-colors" 
                    value={season.name} 
                    placeholder="Ex: Hiver 2026"
                    onChange={(e) => handleSeasonChange(season.id, 'name', e.target.value)} 
                    onBlur={() => saveSeasonsToDB(seasons)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Date de début</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300 transition-colors text-sm" 
                    value={season.start} 
                    onChange={(e) => handleSeasonChange(season.id, 'start', e.target.value)} 
                    onBlur={() => saveSeasonsToDB(seasons)}
                  />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Date de fin</label>
                  <input 
                    type="date" 
                    className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300 transition-colors text-sm" 
                    value={season.end} 
                    onChange={(e) => handleSeasonChange(season.id, 'end', e.target.value)} 
                    onBlur={() => saveSeasonsToDB(seasons)}
                  />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button 
                    onClick={() => handleDeleteSeason(season.id)}
                    className="w-full p-4 bg-rose-100 text-rose-500 rounded-2xl font-black uppercase text-[10px] hover:bg-rose-500 hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
                  >
                    🗑️ <span className="md:hidden">Supprimer</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2 : ROTATIONS */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">⏱️ Rotations types</h2>
            <button 
              onClick={() => {
                setEditingId(null);
                setNewRotation({ start_time: '', duration_minutes: 60, label: 'VOL' });
                setShowAddModal(true);
              }}
              className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform"
            >
              + Ajouter une rotation
            </button>
          </div>
          
          <div className="space-y-3">
            {definitions.map((def) => (
              <div 
                key={def.id} 
                onClick={() => {
                   setEditingId(def.id);
                   setNewRotation({ start_time: def.start_time.slice(0,5), duration_minutes: def.duration_minutes, label: def.label });
                   setShowAddModal(true);
                }}
                className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group cursor-pointer hover:bg-indigo-50 transition-colors"
              >
                <div className="flex items-center gap-6">
                  <span className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{def.start_time.slice(0, 5)}</span>
                  <div>
                    <p className="font-black uppercase text-xs text-slate-800">{def.label}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{def.duration_minutes} min</p>
                  </div>
                </div>
                <button 
                  onClick={(e) => { e.stopPropagation(); deleteDef(def.id); }} 
                  className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* MODALE D'AJOUT / MODIF ROTATION */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
              <h2 className="text-xl font-black uppercase italic mb-6">
                {editingId ? 'Modifier Rotation' : 'Nouvelle Rotation'}
              </h2>
              <div className="space-y-4">
                <input 
                  type="time" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                  value={newRotation.start_time}
                  onChange={e => setNewRotation({...newRotation, start_time: e.target.value})} 
                />
                <input 
                  type="number" 
                  placeholder="Durée (min)" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                  value={newRotation.duration_minutes}
                  onChange={e => setNewRotation({...newRotation, duration_minutes: parseInt(e.target.value)})} 
                />
                <select 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                  value={newRotation.label}
                  onChange={e => setNewRotation({...newRotation, label: e.target.value})}
                >
                  <option value="VOL">VOL</option>
                  <option value="PAUSE">PAUSE</option>
                </select>
                <button onClick={handleSaveRotation} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">
                   {editingId ? 'Mettre à jour' : 'Enregistrer'}
                </button>
                <button onClick={() => setShowAddModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}