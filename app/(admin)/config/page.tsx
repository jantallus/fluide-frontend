"use client";
import React, { useState } from 'react';
import { useConfigData } from '@/hooks/useConfigData';
import { TemplateModal } from '@/components/config/TemplateModal';
import { RotationModal } from '@/components/config/RotationModal';
import { Pencil, Trash2 } from 'lucide-react';

export default function ConfigPage() {
  const {
    definitions, settings, setSettings, loading,
    seasons, templates, flights, loadData,
    deleteDef, renamePlan, deletePlan,
    handleAddSeason, handleSeasonChange, handleDeleteSeason, saveSeasonsToDB,
    saveEmailSetting, deleteTemplate,
  } = useConfigData();

  const [activePlan, setActivePlan] = useState('Standard');
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [templateToEdit, setTemplateToEdit] = useState<any | null>(null);
  const [showRotationModal, setShowRotationModal] = useState(false);
  const [rotationToEdit, setRotationToEdit] = useState<any | null>(null);
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

  const uniquePlans = Array.from(new Set((definitions || []).map((d: any) => d.plan_name || 'Standard')));
  if (!uniquePlans.includes('Standard') && definitions.length === 0) uniquePlans.push('Standard');
  const activeDefs = definitions.filter((d: any) => (d.plan_name || 'Standard') === activePlan);

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-2">Logistique & Saison</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Configuration <span className="text-indigo-500">Fluide</span>
          </h1>
        </header>

        {/* BOUTIQUE BONS CADEAUX */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">🛍️ Boutique Bons Cadeaux</h2>
            <button onClick={() => { setTemplateToEdit(null); setShowTemplateModal(true); }} className="bg-amber-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">
              + Créer un Modèle
            </button>
          </div>
          <div className="space-y-4">
            {templates.length === 0 && <p className="text-center text-slate-400 font-bold italic py-6">Aucun modèle créé pour la boutique.</p>}
            {templates.map((tpl: any) => (
              <div key={tpl.id} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div>
                  <h3 className="font-black text-slate-900">{tpl.title}</h3>
                  <p className="text-xs text-slate-500 font-bold mt-1">
                    {tpl.flight_name ? `🎯 Valable pour : ${tpl.flight_name}` : '💶 Avoir Libre'} • Validité : {tpl.validity_months} mois
                  </p>
                </div>
                <div className="flex items-center gap-6 mt-4 md:mt-0">
                  <div className="text-right">
                    <p className="text-xl font-black text-amber-500">{tpl.price_cents / 100}€</p>
                    <span className={`text-[10px] font-black uppercase px-2 py-1 rounded-md ${tpl.is_published ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-200 text-slate-500'}`}>
                      {tpl.is_published ? 'En Ligne' : 'Brouillon'}
                    </span>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button onClick={() => { setTemplateToEdit(tpl); setShowTemplateModal(true); }} className="text-[10px] font-black uppercase text-indigo-500 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors"><Pencil size={11} className="inline mr-1" />Modifier</button>
                    <button onClick={() => deleteTemplate(tpl.id)} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors"><Trash2 size={11} className="inline mr-1" />Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* PÉRIODES D'OUVERTURE */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">📅 Périodes d'ouverture</h2>
            <button onClick={handleAddSeason} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">+ Ajouter une période</button>
          </div>
          <div className="space-y-4">
            {seasons.map(season => (
              <div key={season.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Nom</label>
                  <input type="text" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none" value={season.name} onChange={e => handleSeasonChange(season.id, 'name', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Début</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-sm" value={season.start} onChange={e => handleSeasonChange(season.id, 'start', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Fin</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-sm" value={season.end} onChange={e => handleSeasonChange(season.id, 'end', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={() => handleDeleteSeason(season.id)} className="w-full p-4 bg-rose-100 text-rose-500 rounded-2xl font-black hover:bg-rose-500 hover:text-white flex items-center justify-center"><Trash2 size={18} /></button>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ROTATIONS PAR PLAN */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6">⏱️ Modèles de Rotations</h2>
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {uniquePlans.map(plan => (
              <button key={plan} onClick={() => setActivePlan(plan)} className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all whitespace-nowrap ${activePlan === plan ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Plan : {plan}</button>
            ))}
            {showNewPlanInput ? (
              <form onSubmit={e => { e.preventDefault(); confirmNewPlan(); }} className="flex items-center gap-2">
                <input
                  autoFocus
                  value={newPlanName}
                  onChange={e => setNewPlanName(e.target.value)}
                  onKeyDown={e => e.key === 'Escape' && (setShowNewPlanInput(false), setNewPlanName(''))}
                  placeholder="Nom du plan..."
                  className="px-4 py-3 rounded-2xl font-bold text-xs border-2 border-indigo-400 outline-none bg-white text-slate-800 min-w-[140px]"
                />
                <button type="submit" className="px-4 py-3 rounded-2xl font-black text-xs bg-indigo-600 text-white">✓</button>
                <button type="button" onClick={() => { setShowNewPlanInput(false); setNewPlanName(''); }} className="px-4 py-3 rounded-2xl font-black text-xs bg-slate-200 text-slate-500">✕</button>
              </form>
            ) : (
              <button onClick={() => setShowNewPlanInput(true)} className="px-6 py-3 rounded-2xl font-black uppercase text-xs bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500">+ Créer un plan</button>
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
                      className="px-4 py-2 rounded-xl font-bold text-xs border-2 border-indigo-400 outline-none bg-white text-slate-800 min-w-[140px]"
                    />
                    <button type="submit" className="text-[10px] font-black uppercase tracking-wider text-white bg-indigo-600 px-4 py-2 rounded-xl">✓</button>
                    <button type="button" onClick={() => setIsRenaming(false)} className="text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100 px-4 py-2 rounded-xl">✕</button>
                  </form>
                ) : (
                  <button onClick={() => { setRenameValue(activePlan); setIsRenaming(true); }} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl"><Pencil size={11} /> Renommer</button>
                )}
                <button onClick={() => deletePlan(activePlan, setActivePlan)} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-4 py-2 rounded-xl"><Trash2 size={11} /> Supprimer</button>
              </div>
            )}
            {activeDefs.length === 0 && <p className="text-center text-slate-400 font-bold italic py-6">Aucune rotation.</p>}
            {activeDefs.map((def: any) => (
              <div key={def.id} onClick={() => { setRotationToEdit(def); setShowRotationModal(true); }} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-indigo-50">
                <div className="flex items-center gap-6">
                  <span className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{def.start_time.slice(0, 5)}</span>
                  <div><p className="font-black uppercase text-xs text-slate-800">{def.label}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{def.duration_minutes} min</p></div>
                </div>
                <button onClick={e => { e.stopPropagation(); deleteDef(def.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg"><Trash2 size={16} /></button>
              </div>
            ))}
          </div>
          <button onClick={() => { setRotationToEdit(null); setShowRotationModal(true); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl hover:scale-[1.01] transition-transform">+ Ajouter une rotation</button>
        </section>

        {/* AFFICHAGE PLANNING */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6">📱 Affichage du Planning</h2>
          <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Nombre de colonnes (jours)</label>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <select className="w-full md:w-1/2 bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 text-slate-700" value={settings['display_days_count'] || '7'} onChange={e => setSettings({ ...settings, display_days_count: e.target.value })}>
                <option value="3">3 jours (Idéal sur mobile)</option>
                <option value="4">4 jours</option>
                <option value="5">5 jours</option>
                <option value="6">6 jours</option>
                <option value="7">7 jours (Semaine complète)</option>
              </select>
              <button onClick={() => saveEmailSetting('display_days_count', settings['display_days_count'] || '7')} className="w-full md:w-auto bg-indigo-600 text-white px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-700 transition-all shadow-md">
                Enregistrer le format
              </button>
            </div>
          </div>
        </section>

        {/* MESSAGES AUTOMATIQUES */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <h2 className="text-xl font-black uppercase italic flex items-center gap-2 mb-6">💌 Messages Automatiques</h2>

          <div className="bg-orange-50 p-6 rounded-[30px] border border-orange-100 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-2 h-full bg-orange-500" />
            <h3 className="font-black text-orange-900 uppercase tracking-widest text-sm mb-4">📮 Option : Envoi Postal (Carte cartonnée)</h3>
            <div className="flex flex-col md:flex-row gap-6 items-center">
              <label className="flex items-center gap-3 cursor-pointer w-full md:w-1/2">
                <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={settings['physical_gift_card_enabled'] === 'true'} onChange={e => { const val = e.target.checked ? 'true' : 'false'; setSettings({ ...settings, physical_gift_card_enabled: val }); saveEmailSetting('physical_gift_card_enabled', val); }} />
                <span className="font-bold text-orange-900 text-sm">Proposer l'envoi postal au client (+€)</span>
              </label>
              {settings['physical_gift_card_enabled'] === 'true' && (
                <div className="w-full md:w-1/2 flex flex-col sm:flex-row gap-3">
                  <input type="number" placeholder="Prix de l'envoi (€)" className="w-full bg-white border-2 border-orange-200 rounded-xl p-3 font-bold outline-none focus:border-orange-500 text-slate-700" value={settings['physical_gift_card_price'] || ''} onChange={e => setSettings({ ...settings, physical_gift_card_price: e.target.value })} />
                  <button onClick={() => saveEmailSetting('physical_gift_card_price', settings['physical_gift_card_price'])} className="bg-orange-600 text-white px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-orange-700 transition-all shadow-md">Enregistrer le prix</button>
                </div>
              )}
            </div>
          </div>

          <div className="bg-emerald-50 p-6 rounded-[30px] border border-emerald-100 relative overflow-hidden mb-8">
            <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500" />
            <h3 className="font-black text-emerald-900 uppercase tracking-widest text-sm mb-2">🛎️ Adresses de notification (Nouvelles réservations)</h3>
            <input type="text" className="w-full bg-white border-2 border-emerald-200 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500 text-slate-700" placeholder="Ex: contact@fluide-parapente.fr, thomas@gmail.com" value={settings['admin_notification_emails'] || ''} onChange={e => setSettings({ ...settings, admin_notification_emails: e.target.value })} />
            <button onClick={() => saveEmailSetting('admin_notification_emails', settings['admin_notification_emails'])} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-md">Sauvegarder les adresses</button>
          </div>

          <div className="space-y-8">
            <div className="bg-fuchsia-50 p-6 rounded-[30px] border border-fuchsia-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500" />
              <h3 className="font-black text-fuchsia-900 uppercase tracking-widest text-sm mb-4">🎁 Achat d'un Bon Cadeau</h3>
              <textarea className="w-full bg-white border-2 border-fuchsia-200 rounded-2xl p-4 font-bold outline-none focus:border-fuchsia-500 min-h-[100px] text-slate-700" placeholder="Ex: Merci pour votre achat ! Voici votre bon cadeau prêt à être offert..." value={settings['email_gift_card'] || ''} onChange={e => setSettings({ ...settings, email_gift_card: e.target.value })} />
              <button onClick={() => saveEmailSetting('email_gift_card', settings['email_gift_card'])} className="mt-4 bg-fuchsia-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-fuchsia-700 transition-all shadow-md">Sauvegarder</button>
            </div>

            <div>
              <div className="mb-6 border-b-2 border-slate-100 pb-4">
                <h3 className="font-black text-sky-900 uppercase tracking-widest text-sm mb-2">🪂 Personnalisation par type de vol</h3>
                <p className="text-xs text-slate-500 font-bold">
                  💡 Astuce : Vous pouvez utiliser les balises <span className="text-sky-500 px-1 bg-sky-50 rounded">[PRENOM]</span>, <span className="text-sky-500 px-1 bg-sky-50 rounded">[DATE]</span> et <span className="text-sky-500 px-1 bg-sky-50 rounded">[HEURE]</span>.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-8">
                {flights.map((flight: any) => (
                  <div key={flight.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-200">
                    <h4 className="font-black text-slate-800 uppercase italic mb-6 text-xl">{flight.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black uppercase text-indigo-500 ml-4 mb-1 block">📧 Contenu du bloc "Conseils" (Email)</label>
                        <textarea className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 text-sm min-h-[120px] text-slate-600" placeholder="Ex: Prévoyez de bonnes chaussures et un coupe-vent." value={settings[`email_flight_${flight.id}`] || ''} onChange={e => setSettings({ ...settings, [`email_flight_${flight.id}`]: e.target.value })} />
                        <button onClick={() => saveEmailSetting(`email_flight_${flight.id}`, settings[`email_flight_${flight.id}`])} className="mt-3 bg-slate-800 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-colors shadow-sm">Enregistrer l'Email</button>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-emerald-500 ml-4 mb-1 block">📱 Message SMS (Court)</label>
                        <textarea className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500 text-sm min-h-[120px] text-slate-600" maxLength={160} placeholder="Ex: Bonjour [PRENOM], votre vol le [DATE] à [HEURE] est confirmé !" value={settings[`sms_flight_${flight.id}`] || ''} onChange={e => setSettings({ ...settings, [`sms_flight_${flight.id}`]: e.target.value })} />
                        <button onClick={() => saveEmailSetting(`sms_flight_${flight.id}`, settings[`sms_flight_${flight.id}`])} className="mt-3 bg-slate-800 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-colors shadow-sm">Enregistrer le SMS</button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>

      {showTemplateModal && (
        <TemplateModal
          templateToEdit={templateToEdit}
          flights={flights}
          onClose={() => setShowTemplateModal(false)}
          onSaved={loadData}
        />
      )}

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
