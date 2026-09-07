"use client";
import React, { useState } from 'react';
import { useConfigData } from '@/hooks/useConfigData';
import { RotationModal } from '@/components/config/RotationModal';
import { Pencil, Trash2 } from 'lucide-react';
import type { SlotDefinition } from '@/lib/types';

export default function AravisConfigPage() {
  const {
    definitions, settings, setSettings, loading,
    seasons, loadData,
    deleteDef, renamePlan, deletePlan,
    handleAddSeason, handleSeasonChange, handleDeleteSeason, saveSeasonsToDB,
    saveEmailSetting,
  } = useConfigData();

  const [activePlan, setActivePlan] = useState('Standard');
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [rotationToEdit, setRotationToEdit] = useState<SlotDefinition | null>(null);
  const [showNewPlanInput, setShowNewPlanInput] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState('');

  const confirmNewPlan = () => {
    const name = newPlanName.trim();
    if (name) setActivePlan(name);
    setShowNewPlanInput(false);
    setNewPlanName('');
  };

  const confirmRename = async () => {
    const name = renameValue.trim();
    if (name && name !== activePlan) await renamePlan(activePlan, name, setActivePlan);
    setIsRenaming(false);
  };

  const uniquePlans = Array.from(new Set((definitions || []).map(d => d.plan_name || 'Standard')));
  if (!uniquePlans.includes('Standard') && definitions.length === 0) uniquePlans.push('Standard');
  const activeDefs = definitions.filter(d => (d.plan_name || 'Standard') === activePlan);

  return (
    <div className="p-8 bg-[#F0F4F8] min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <p className="text-[#4A8FBE] font-black uppercase text-xs tracking-widest mb-2">Logistique & Saison</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-[#1B2A4A]">
            Configuration <span className="text-[#4A8FBE]">Aravis Parapente</span>
          </h1>
        </header>

        {/* PÉRIODES D'OUVERTURE */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#D4E2ED]">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">📅 Périodes d'ouverture</h2>
            <button onClick={handleAddSeason} className="bg-[#1B2A4A] text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">+ Ajouter une période</button>
          </div>
          <div className="space-y-4">
            {seasons.map(season => (
              <div key={season.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-[#F0F4F8] p-4 rounded-3xl border border-[#D4E2ED]">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase text-[#8AABBD] mb-2 ml-4">Nom</label>
                  <input type="text" className="w-full bg-white border-2 border-[#D4E2ED] rounded-2xl p-4 font-bold outline-none focus:border-[#4A8FBE]" value={season.name} onChange={e => handleSeasonChange(season.id, 'name', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-[#8AABBD] mb-2 ml-4">Début</label>
                  <input type="date" className="w-full bg-white border-2 border-[#D4E2ED] rounded-2xl p-4 font-bold outline-none text-sm focus:border-[#4A8FBE]" value={season.start} onChange={e => handleSeasonChange(season.id, 'start', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-[#8AABBD] mb-2 ml-4">Fin</label>
                  <input type="date" className="w-full bg-white border-2 border-[#D4E2ED] rounded-2xl p-4 font-bold outline-none text-sm focus:border-[#4A8FBE]" value={season.end} onChange={e => handleSeasonChange(season.id, 'end', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={() => handleDeleteSeason(season.id)} className="w-full p-4 bg-rose-100 text-rose-500 rounded-2xl font-black hover:bg-rose-500 hover:text-white flex items-center justify-center"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROTATIONS PAR PLAN */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#D4E2ED]">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6">⏱️ Modèles de Rotations</h2>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {uniquePlans.map(plan => (
              <button key={plan} onClick={() => setActivePlan(plan)} className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all whitespace-nowrap ${activePlan === plan ? 'bg-[#1B2A4A] text-white' : 'bg-[#F0F4F8] text-slate-500 hover:bg-[#D4E2ED]'}`}>Plan : {plan}</button>
            ))}
            {showNewPlanInput ? (
              <form onSubmit={e => { e.preventDefault(); confirmNewPlan(); }} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && (setShowNewPlanInput(false), setNewPlanName(''))}
                  placeholder="Nom du plan..."
                  className="px-4 py-3 rounded-2xl font-bold text-xs border-2 border-[#4A8FBE] outline-none bg-white text-[#1B2A4A] min-w-[140px]"
                />
                <button type="submit" className="px-4 py-3 rounded-2xl font-black text-xs bg-[#1B2A4A] text-white">✓</button>
                <button type="button" onClick={() => { setShowNewPlanInput(false); setNewPlanName(''); }} className="px-4 py-3 rounded-2xl font-black text-xs bg-[#F0F4F8] text-slate-500">✕</button>
              </form>
            ) : (
              <button onClick={() => setShowNewPlanInput(true)} className="px-6 py-3 rounded-2xl font-black uppercase text-xs bg-white border-2 border-dashed border-[#D4E2ED] text-[#8AABBD] hover:border-[#4A8FBE] hover:text-[#4A8FBE]">+ Créer un plan</button>
            )}
          </div>
          <div className="space-y-3 mb-6">
            {activePlan !== 'Standard' && (
              <div className="flex justify-end gap-3 mb-4">
                {isRenaming ? (
                  <form onSubmit={e => { e.preventDefault(); confirmRename(); }} className="flex items-center gap-2">
                    <input
                      autoFocus
                      value={renameValue}
                      onChange={e => setRenameValue(e.target.value)}
                      onKeyDown={e => e.key === 'Escape' && setIsRenaming(false)}
                      className="px-4 py-2 rounded-xl font-bold text-xs border-2 border-[#4A8FBE] outline-none bg-white text-[#1B2A4A] min-w-[140px]"
                    />
                    <button type="submit" className="text-[10px] font-black uppercase tracking-wider text-white bg-[#1B2A4A] px-4 py-2 rounded-xl">✓</button>
                    <button type="button" onClick={() => setIsRenaming(false)} className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-[#F0F4F8] px-4 py-2 rounded-xl">✕</button>
                  </form>
                ) : (
                  <button onClick={() => { setRenameValue(activePlan); setIsRenaming(true); }} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-[#4A8FBE] bg-[#E3F1F7] px-4 py-2 rounded-xl"><Pencil size={11} /> Renommer</button>
                )}
                <button onClick={() => deletePlan(activePlan, setActivePlan)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-4 py-2 rounded-xl"><Trash2 size={11} /> Supprimer</button>
              </div>
            )}
            {activeDefs.length === 0 && <p className="text-center text-[#8AABBD] font-bold italic py-6">Aucune rotation.</p>}
            {activeDefs.map(def => (
              <div key={def.id} onClick={() => { setRotationToEdit(def); setShowRotationModal(true); }} className="flex items-center justify-between p-4 bg-[#F0F4F8] rounded-2xl border border-[#D4E2ED] cursor-pointer hover:bg-[#E3F1F7]">
                <div className="flex items-center gap-6">
                  <span className="bg-white px-4 py-2 rounded-xl font-black text-[#4A8FBE] shadow-sm">{def.start_time.slice(0, 5)}</span>
                  <div><p className="font-black uppercase text-xs text-[#1B2A4A]">{def.label}</p><p className="text-[10px] font-bold text-[#8AABBD] uppercase">{def.duration_minutes} min</p></div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteDef(def.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => { setRotationToEdit(null); setShowRotationModal(true); }} className="w-full bg-[#1B2A4A] text-white py-4 rounded-2xl font-black uppercase italic shadow-xl hover:scale-[1.01] transition-transform">+ Ajouter une rotation</button>
        </section>

        {/* AFFICHAGE PLANNING */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#D4E2ED]">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6">📱 Affichage du Planning</h2>
          <div className="bg-[#F0F4F8] p-6 rounded-[30px] border border-[#D4E2ED]">
            <label className="text-[10px] font-black uppercase text-[#8AABBD] ml-4 mb-2 block">Nombre de colonnes (jours)</label>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <select className="w-full md:w-1/2 bg-white border-2 border-[#D4E2ED] rounded-2xl p-4 font-bold outline-none focus:border-[#4A8FBE] text-[#1B2A4A]" value={settings['display_days_count'] || '7'} onChange={e => setSettings({ ...settings, display_days_count: e.target.value })}>
                <option value="3">3 jours (Idéal sur mobile)</option>
                <option value="4">4 jours</option>
                <option value="5">5 jours</option>
                <option value="6">6 jours</option>
                <option value="7">7 jours (Semaine complète)</option>
              </select>
              <button onClick={() => saveEmailSetting('display_days_count', settings['display_days_count'] || '7')} className="w-full md:w-auto bg-[#1B2A4A] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#243860] transition-all shadow-md">
                Enregistrer le format
              </button>
            </div>
          </div>

          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6 mt-8">🎟️ Limites de Réservation</h2>
          <div className="bg-[#F0F4F8] p-6 rounded-[30px] border border-[#D4E2ED]">
            <label className="text-[10px] font-black uppercase text-[#8AABBD] ml-4 mb-2 block">Nombre maximum de passagers par réservation</label>
            <p className="text-xs text-[#8AABBD] ml-4 mb-4">Par défaut : 8. Au-delà, la réservation en ligne est refusée (groupes → contact direct).</p>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <input
                type="number"
                min={1}
                max={50}
                className="w-full md:w-48 bg-white border-2 border-[#D4E2ED] rounded-2xl p-4 font-bold outline-none focus:border-[#4A8FBE] text-[#1B2A4A] text-center text-xl"
                value={settings['max_passengers_per_booking'] || '8'}
                onChange={e => setSettings({ ...settings, max_passengers_per_booking: e.target.value })}
              />
              <button
                onClick={() => saveEmailSetting('max_passengers_per_booking', settings['max_passengers_per_booking'] || '8')}
                className="w-full md:w-auto bg-[#1B2A4A] text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-[#243860] transition-all shadow-md"
              >
                Enregistrer
              </button>
            </div>
          </div>
        </section>

        {/* SYNCHRONISATION GOOGLE AGENDA */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-[#D4E2ED]">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-2">📆 Synchronisation Google Agenda</h2>
          <p className="text-xs text-[#8AABBD] mb-6">Activée : chaque modification de créneau met à jour Google Agenda. Désactivée : navigation ultra-rapide, sans synchro.</p>
          <div className="bg-[#F0F4F8] p-6 rounded-[30px] border border-[#D4E2ED]">
            <label className="flex items-center gap-4 cursor-pointer">
              <div
                onClick={() => {
                  const newVal = settings['google_calendar_sync'] === 'true' ? 'false' : 'true';
                  setSettings({ ...settings, google_calendar_sync: newVal });
                  saveEmailSetting('google_calendar_sync', newVal);
                }}
                className={`relative w-14 h-7 rounded-full transition-colors cursor-pointer ${settings['google_calendar_sync'] === 'true' ? 'bg-[#4A8FBE]' : 'bg-slate-300'}`}
              >
                <span className={`absolute top-1 left-1 w-5 h-5 bg-white rounded-full shadow transition-transform ${settings['google_calendar_sync'] === 'true' ? 'translate-x-7' : 'translate-x-0'}`} />
              </div>
              <span className="font-black text-sm text-[#1B2A4A]">
                {settings['google_calendar_sync'] === 'true' ? '✅ Google Sync activée' : '⏸️ Google Sync désactivée'}
              </span>
            </label>
          </div>
        </section>
      </div>

      {showRotationModal && (
        <RotationModal
          rotationToEdit={rotationToEdit}
          activePlan={activePlan}
          onClose={() => setShowRotationModal(false)}
          onSaved={loadData}
        />
      )}
    </div>
  );
}
