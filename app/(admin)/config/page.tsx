"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ConfigPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  
  const [seasons, setSeasons] = useState<{id: string, name: string, start: string, end: string}[]>([]);
  
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // NOUVEAU : On gère le nom du plan dynamiquement (Hiver, Été, etc.)
  const [activePlan, setActivePlan] = useState<string>('Standard');
  const [newRotation, setNewRotation] = useState({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: 'Standard' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, setRes] = await Promise.all([ apiFetch('/api/slot-definitions'), apiFetch('/api/settings') ]);
      if (defRes.ok) setDefinitions(await defRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        const settingsObj = s.reduce((acc: any, curr: any) => ({ ...acc, [curr.key]: curr.value }), {});
        setSettings(settingsObj);
        if (settingsObj.opening_periods) {
          try { setSeasons(JSON.parse(settingsObj.opening_periods)); } catch (e) { setSeasons([]); }
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // Liste des plans uniques existants
  const uniquePlans = Array.from(new Set((definitions || []).map(d => d.plan_name || 'Standard')));
  if (!uniquePlans.includes('Standard') && definitions.length === 0) uniquePlans.push('Standard');

  // On ne montre que les rotations du plan actuellement sélectionné
  // On affiche tout ce qui vient de la base, sans filtre, pour tester
  const activeDefs = definitions.filter(d => (d.plan_name || 'Standard') === activePlan); 
  console.log("Données reçues du serveur :", definitions);

  const handleSaveRotation = async () => {
    // Tes vérifications de base
    if (!newRotation.start_time || newRotation.duration_minutes <= 0) return;
    
    // 🔒 ON VERROUILLE LE BOUTON
    setIsSaving(true); 

    try {
      const res = await apiFetch('/api/slot-definitions', {
        method: 'POST',
        body: JSON.stringify({ ...newRotation, plan_name: activePlan })
      });
      
      if (res.ok) {
        // On vide le formulaire après succès
        setNewRotation({ start_time: '', duration_minutes: 0, label: 'VOL', plan_name: activePlan });
        loadData();
      } else {
        alert("Erreur lors de l'enregistrement");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion");
    } finally {
      // 🔓 ON DÉVERROUILLE LE BOUTON (même si ça a planté)
      setIsSaving(false); 
    }
  };

  const deleteDef = async (id: number) => {
    if(!confirm("Supprimer cette rotation ?")) return;
    await apiFetch(`/api/slot-definitions/${id}`, { method: 'DELETE' });
    loadData();
  };

  const renamePlan = async (oldName: string) => {
    if (oldName === 'Standard') {
      alert("Le plan Standard est le plan par défaut, il ne peut pas être renommé.");
      return;
    }
    const newName = prompt(`Renommer le plan "${oldName}" en :`, oldName);
    if (!newName || newName === oldName) return;

    await apiFetch(`/api/plans/${oldName}`, {
      method: 'PUT',
      body: JSON.stringify({ newName })
    });
    setActivePlan(newName);
    loadData();
  };

  const deletePlan = async (name: string) => {
    if (name === 'Standard') {
      alert("Le plan Standard ne peut pas être supprimé.");
      return;
    }
    if (!confirm(`⚠️ ATTENTION : Voulez-vous vraiment supprimer le plan "${name}" et TOUTES les rotations qu'il contient ?`)) return;

    await apiFetch(`/api/plans/${name}`, { method: 'DELETE' });
    setActivePlan('Standard');
    loadData();
  };

  const saveSeasonsToDB = async (updatedSeasons: any[]) => {
    await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ key: 'opening_periods', value: JSON.stringify(updatedSeasons) }) });
  };
  const handleAddSeason = () => {
    const updated = [...seasons, { id: Date.now().toString(), name: '', start: '', end: '' }];
    setSeasons(updated); saveSeasonsToDB(updated);
  };
  const handleSeasonChange = (id: string, field: string, value: string) => { setSeasons(seasons.map(s => s.id === id ? { ...s, [field]: value } : s)); };
  const handleDeleteSeason = (id: string) => {
    if(!confirm("Supprimer ?")) return;
    const updated = seasons.filter(s => s.id !== id);
    setSeasons(updated); saveSeasonsToDB(updated);
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
            <button onClick={handleAddSeason} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">+ Ajouter une période</button>
          </div>
          <div className="space-y-4">
            {seasons.map((season) => (
              <div key={season.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Nom de la période</label>
                  <input type="text" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300" value={season.name} placeholder="Ex: Hiver 2026" onChange={(e) => handleSeasonChange(season.id, 'name', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Date de début</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300 text-sm" value={season.start} onChange={(e) => handleSeasonChange(season.id, 'start', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Date de fin</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-indigo-300 text-sm" value={season.end} onChange={(e) => handleSeasonChange(season.id, 'end', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={() => handleDeleteSeason(season.id)} className="w-full p-4 bg-rose-100 text-rose-500 rounded-2xl font-black uppercase text-[10px] hover:bg-rose-500 hover:text-white transition-all">🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 2 : ROTATIONS PAR PLAN */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">⏱️ Modèles de Rotations</h2>
          </div>

          {/* ONGLETS DES PLANS */}
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {uniquePlans.map(plan => (
              <button 
                key={plan} 
                onClick={() => setActivePlan(plan)}
                className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all whitespace-nowrap ${activePlan === plan ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}
              >
                Plan : {plan}
              </button>
            ))}
            <button 
              onClick={() => {
                const newPlanName = prompt("Nom du nouveau plan (ex: Week-end) :");
                if (newPlanName) { setActivePlan(newPlanName); }
              }}
              className="px-6 py-3 rounded-2xl font-black uppercase text-xs bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500 transition-all"
            >
              + Créer un plan
            </button>
          </div>
          
          <div className="space-y-3 mb-6">
            {/* ACTIONS DU PLAN ACTUEL */}
          {activePlan !== 'Standard' && (
            <div className="flex justify-end gap-3 mb-4">
              <button 
                onClick={() => renamePlan(activePlan)} 
                className="text-[10px] font-black uppercase tracking-wider text-indigo-500 hover:text-white bg-indigo-50 hover:bg-indigo-500 px-4 py-2 rounded-xl transition-all"
              >
                ✏️ Renommer le plan
              </button>
              <button 
                onClick={() => deletePlan(activePlan)} 
                className="text-[10px] font-black uppercase tracking-wider text-rose-500 hover:text-white bg-rose-50 hover:bg-rose-500 px-4 py-2 rounded-xl transition-all"
              >
                🗑️ Supprimer le plan
              </button>
            </div>
          )}
            {activeDefs.length === 0 && <p className="text-center text-slate-400 font-bold italic py-6">Aucune rotation dans ce plan.</p>}
            {activeDefs.map((def) => (
              <div 
                key={def.id} 
                onClick={() => {
                   setEditingId(def.id);
                   setNewRotation({ start_time: def.start_time.slice(0,5), duration_minutes: def.duration_minutes, label: def.label, plan_name: def.plan_name || 'Standard' });
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
                <button onClick={(e) => { e.stopPropagation(); deleteDef(def.id); }} className="opacity-0 group-hover:opacity-100 p-2 text-rose-500 hover:bg-rose-50 rounded-lg transition-all">🗑️</button>
              </div>
            ))}
          </div>

          <button 
            onClick={() => {
              setEditingId(null);
              setNewRotation({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: activePlan });
              setShowAddModal(true);
            }}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl hover:scale-[1.01] transition-transform"
          >
            + Ajouter une rotation au plan {activePlan}
          </button>
        </section>

        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
              <h2 className="text-xl font-black uppercase italic mb-6">
                {editingId ? 'Modifier Rotation' : 'Nouvelle Rotation'}
              </h2>
              <div className="space-y-4">
                <div className="bg-indigo-50 p-3 rounded-xl border border-indigo-100 text-center mb-4">
                  <span className="text-[10px] font-black uppercase text-indigo-400 block mb-1">Plan sélectionné</span>
                  <span className="font-bold text-indigo-700">{newRotation.plan_name}</span>
                </div>

                <input type="time" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={newRotation.start_time} onChange={e => setNewRotation({...newRotation, start_time: e.target.value})} />
                <input 
                  type="number" 
                  placeholder="Durée (min)" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" 
                  value={newRotation.duration_minutes === 0 ? '' : newRotation.duration_minutes} 
                  onChange={e => setNewRotation({
                    ...newRotation, 
                    duration_minutes: e.target.value === '' ? 0 : parseInt(e.target.value)
                  })} 
                />
                <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={newRotation.label} onChange={e => setNewRotation({...newRotation, label: e.target.value})}>
                  <option value="VOL">VOL</option>
                  <option value="PAUSE">PAUSE</option>
                </select>
                <button 
                  onClick={handleSaveRotation} 
                  disabled={isSaving}
                  className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${
                    isSaving 
                      ? 'bg-indigo-300 text-indigo-100 cursor-not-allowed' 
                      : 'bg-indigo-600 text-white hover:scale-105'
                  }`}
                >
                  {isSaving ? '⏳ Enregistrement...' : (editingId ? 'Mettre à jour' : 'Enregistrer')}
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