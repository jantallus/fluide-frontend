"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ConfigPage() {
  const [definitions, setDefinitions] = useState<any[]>([]);
  const [settings, setSettings] = useState<any>({});
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<{id: string, name: string, start: string, end: string}[]>([]);
  
  // NOUVEAU : États pour la boutique (Avec pdf_background_url)
  const [templates, setTemplates] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [showTemplateModal, setShowTemplateModal] = useState(false);
  const [editingTemplateId, setEditingTemplateId] = useState<number | null>(null);
  const [newTemplate, setNewTemplate] = useState({ title: '', description: '', price_cents: '', flight_type_id: '', validity_months: 12, image_url: '', pdf_background_url: '', is_published: false });

  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  
  // 🎯 NOUVEAU : Mémoires pour les DEUX boutons de chargement d'image
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);
  
  const [activePlan, setActivePlan] = useState<string>('Standard');
  const [newRotation, setNewRotation] = useState({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: 'Standard' });

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, setRes, tplRes, flightsRes] = await Promise.all([ 
        apiFetch('/api/slot-definitions'), 
        apiFetch('/api/settings'),
        apiFetch('/api/gift-card-templates'),
        apiFetch('/api/flight-types')
      ]);
      
      if (defRes.ok) setDefinitions(await defRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (flightsRes.ok) setFlights(await flightsRes.json());
      
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

  const uniquePlans = Array.from(new Set((definitions || []).map(d => d.plan_name || 'Standard')));
  if (!uniquePlans.includes('Standard') && definitions.length === 0) uniquePlans.push('Standard');
  const activeDefs = definitions.filter(d => (d.plan_name || 'Standard') === activePlan); 

  const handleSaveRotation = async () => {
    if (!newRotation.start_time || newRotation.duration_minutes <= 0) return;
    setIsSaving(true); 
    try {
      const res = await apiFetch('/api/slot-definitions', { method: 'POST', body: JSON.stringify({ ...newRotation, plan_name: activePlan }) });
      if (res.ok) { setNewRotation({ start_time: '', duration_minutes: 0, label: 'VOL', plan_name: activePlan }); loadData(); } 
      else { alert("Erreur lors de l'enregistrement"); }
    } catch (err) { alert("Erreur de connexion"); } finally { setIsSaving(false); }
  };

  const deleteDef = async (id: number) => {
    if(!confirm("Supprimer cette rotation ?")) return;
    await apiFetch(`/api/slot-definitions/${id}`, { method: 'DELETE' }); loadData();
  };

  const renamePlan = async (oldName: string) => {
    if (oldName === 'Standard') return alert("Le plan Standard ne peut pas être renommé.");
    const newName = prompt(`Renommer le plan "${oldName}" en :`, oldName);
    if (!newName || newName === oldName) return;
    await apiFetch(`/api/plans/${oldName}`, { method: 'PUT', body: JSON.stringify({ newName }) });
    setActivePlan(newName); loadData();
  };

  const deletePlan = async (name: string) => {
    if (name === 'Standard') return alert("Le plan Standard ne peut pas être supprimé.");
    if (!confirm(`Voulez-vous vraiment supprimer le plan "${name}" ?`)) return;
    await apiFetch(`/api/plans/${name}`, { method: 'DELETE' });
    setActivePlan('Standard'); loadData();
  };

  const saveSeasonsToDB = async (updatedSeasons: any[]) => { await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ key: 'opening_periods', value: JSON.stringify(updatedSeasons) }) }); };
  const handleAddSeason = () => { const updated = [...seasons, { id: Date.now().toString(), name: '', start: '', end: '' }]; setSeasons(updated); saveSeasonsToDB(updated); };
  const handleSeasonChange = (id: string, field: string, value: string) => { setSeasons(seasons.map(s => s.id === id ? { ...s, [field]: value } : s)); };
  const handleDeleteSeason = (id: string) => { if(!confirm("Supprimer ?")) return; const updated = seasons.filter(s => s.id !== id); setSeasons(updated); saveSeasonsToDB(updated); };

  const saveEmailSetting = async (key: string, value: string) => {
    try {
      const res = await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
      if (res.ok) alert("Sauvegardé avec succès ! ✅");
      else alert("❌ Erreur lors de la sauvegarde côté serveur.");
    } catch (err) { alert("❌ Erreur de connexion avec le serveur."); }
  };

  const handleSaveTemplate = async () => {
    if (!newTemplate.title || !newTemplate.price_cents) return alert("Le titre et le prix sont obligatoires.");
    setIsSaving(true);
    try {
      const payload = { ...newTemplate, price_cents: Math.round(parseFloat(newTemplate.price_cents as string) * 100) };
      const url = editingTemplateId ? `/api/gift-card-templates/${editingTemplateId}` : '/api/gift-card-templates';
      const method = editingTemplateId ? 'PUT' : 'POST';
      
      const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
      if (res.ok) { setShowTemplateModal(false); loadData(); } else { alert("Erreur lors de l'enregistrement du modèle."); }
    } catch (err) { alert("Erreur de connexion."); } finally { setIsSaving(false); }
  };

  const deleteTemplate = async (id: number) => {
    if(!confirm("Supprimer définitivement ce modèle de la boutique ?")) return;
    await apiFetch(`/api/gift-card-templates/${id}`, { method: 'DELETE' }); loadData();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto space-y-8">
        <header>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-2">Logistique & Saison</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Configuration <span className="text-indigo-500">Fluide</span>
          </h1>
        </header>

        {/* --- SECTION : BOUTIQUE BONS CADEAUX --- */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">🛍️ Boutique Bons Cadeaux</h2>
            <button onClick={() => { 
                setEditingTemplateId(null); 
                setNewTemplate({ title: '', description: '', price_cents: '', flight_type_id: '', validity_months: 12, image_url: '', pdf_background_url: '', is_published: true }); 
                setShowTemplateModal(true); 
              }} 
              className="bg-amber-500 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform"
            >
              + Créer un Modèle
            </button>
          </div>

          <div className="space-y-4">
            {templates.length === 0 && <p className="text-center text-slate-400 font-bold italic py-6">Aucun modèle créé pour la boutique.</p>}
            {templates.map(tpl => (
              <div key={tpl.id} className="flex flex-col md:flex-row justify-between items-center bg-slate-50 p-4 rounded-3xl border border-slate-100 group">
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
                    <button onClick={() => {
                        setEditingTemplateId(tpl.id);
                        setNewTemplate({ ...tpl, price_cents: (tpl.price_cents / 100).toString(), flight_type_id: tpl.flight_type_id || '', pdf_background_url: tpl.pdf_background_url || '' });
                        setShowTemplateModal(true);
                      }} className="text-[10px] font-black uppercase text-indigo-500 hover:bg-indigo-50 px-3 py-1 rounded-lg transition-colors">✏️ Modifier</button>
                    <button onClick={() => deleteTemplate(tpl.id)} className="text-[10px] font-black uppercase text-rose-500 hover:bg-rose-50 px-3 py-1 rounded-lg transition-colors">🗑️ Supprimer</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 1 : SAISONS MULTIPLES */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">📅 Périodes d'ouverture</h2>
            <button onClick={handleAddSeason} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-black text-[10px] uppercase shadow-lg hover:scale-105 transition-transform">+ Ajouter une période</button>
          </div>
          <div className="space-y-4">
            {seasons.map((season) => (
              <div key={season.id} className="grid grid-cols-1 md:grid-cols-12 gap-4 items-end bg-slate-50 p-4 rounded-3xl border border-slate-100">
                <div className="md:col-span-4">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Nom</label>
                  <input type="text" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none" value={season.name} onChange={(e) => handleSeasonChange(season.id, 'name', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Début</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-sm" value={season.start} onChange={(e) => handleSeasonChange(season.id, 'start', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-3">
                  <label className="block text-[10px] font-black uppercase text-slate-400 mb-2 ml-4">Fin</label>
                  <input type="date" className="w-full bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none text-sm" value={season.end} onChange={(e) => handleSeasonChange(season.id, 'end', e.target.value)} onBlur={() => saveSeasonsToDB(seasons)} />
                </div>
                <div className="md:col-span-2 flex justify-end">
                  <button onClick={() => handleDeleteSeason(season.id)} className="w-full p-4 bg-rose-100 text-rose-500 rounded-2xl font-black hover:bg-rose-500 hover:text-white">🗑️</button>
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
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {uniquePlans.map(plan => (
              <button key={plan} onClick={() => setActivePlan(plan)} className={`px-6 py-3 rounded-2xl font-black uppercase text-xs transition-all whitespace-nowrap ${activePlan === plan ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-slate-100 text-slate-500 hover:bg-slate-200'}`}>Plan : {plan}</button>
            ))}
            <button onClick={() => { const newPlanName = prompt("Nom du nouveau plan:"); if (newPlanName) { setActivePlan(newPlanName); } }} className="px-6 py-3 rounded-2xl font-black uppercase text-xs bg-white border-2 border-dashed border-slate-300 text-slate-400 hover:border-indigo-400 hover:text-indigo-500">+ Créer un plan</button>
          </div>
          <div className="space-y-3 mb-6">
            {activePlan !== 'Standard' && (
              <div className="flex justify-end gap-3 mb-4">
                <button onClick={() => renamePlan(activePlan)} className="text-[10px] font-black uppercase tracking-wider text-indigo-500 bg-indigo-50 px-4 py-2 rounded-xl">✏️ Renommer</button>
                <button onClick={() => deletePlan(activePlan)} className="text-[10px] font-black uppercase tracking-wider text-rose-500 bg-rose-50 px-4 py-2 rounded-xl">🗑️ Supprimer</button>
              </div>
            )}
            {activeDefs.length === 0 && <p className="text-center text-slate-400 font-bold italic py-6">Aucune rotation.</p>}
            {activeDefs.map((def) => (
              <div key={def.id} onClick={() => { setEditingId(def.id); setNewRotation({ start_time: def.start_time.slice(0,5), duration_minutes: def.duration_minutes, label: def.label, plan_name: def.plan_name || 'Standard' }); setShowAddModal(true); }} className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 cursor-pointer hover:bg-indigo-50">
                <div className="flex items-center gap-6"><span className="bg-white px-4 py-2 rounded-xl font-black text-indigo-600 shadow-sm">{def.start_time.slice(0, 5)}</span><div><p className="font-black uppercase text-xs text-slate-800">{def.label}</p><p className="text-[10px] font-bold text-slate-400 uppercase">{def.duration_minutes} min</p></div></div>
                <button onClick={(e) => { e.stopPropagation(); deleteDef(def.id); }} className="p-2 text-rose-500 hover:bg-rose-50 rounded-lg">🗑️</button>
              </div>
            ))}
          </div>
          <button onClick={() => { setEditingId(null); setNewRotation({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: activePlan }); setShowAddModal(true); }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl hover:scale-[1.01] transition-transform">+ Ajouter une rotation</button>
        </section>

        {/* SECTION : AFFICHAGE DU PLANNING CLIENT */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-8">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">📱 Affichage du Planning</h2>
          </div>
          <div className="bg-slate-50 p-6 rounded-[30px] border border-slate-100">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 mb-2 block">Nombre de colonnes (jours)</label>
            <div className="flex flex-col md:flex-row items-center gap-4">
              <select
                className="w-full md:w-1/2 bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-indigo-500 text-slate-700"
                value={settings['display_days_count'] || '7'}
                onChange={(e) => setSettings({...settings, 'display_days_count': e.target.value})}
              >
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

        {/* SECTION : EMAILS PERSONNALISÉS */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-black uppercase italic flex items-center gap-2">💌 Messages Automatiques</h2>
          </div>
          
            <div className="bg-emerald-50 p-6 rounded-[30px] border border-emerald-100 relative overflow-hidden mb-8">
              <div className="absolute top-0 left-0 w-2 h-full bg-emerald-500"></div>
              <h3 className="font-black text-emerald-900 uppercase tracking-widest text-sm mb-2">🛎️ Adresses de notification (Nouvelles réservations)</h3>
              <input
                type="text"
                className="w-full bg-white border-2 border-emerald-200 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500 text-slate-700"
                placeholder="Ex: contact@fluide-parapente.fr, thomas@gmail.com"
                value={settings['admin_notification_emails'] || ''}
                onChange={(e) => setSettings({...settings, 'admin_notification_emails': e.target.value})}
              />
              <button onClick={() => saveEmailSetting('admin_notification_emails', settings['admin_notification_emails'])} className="mt-4 bg-emerald-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-700 transition-all shadow-md">
                Sauvegarder les adresses
              </button>
            </div>

          <div className="space-y-8">
            <div className="bg-fuchsia-50 p-6 rounded-[30px] border border-fuchsia-100 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-2 h-full bg-fuchsia-500"></div>
              <h3 className="font-black text-fuchsia-900 uppercase tracking-widest text-sm mb-4">🎁 Achat d'un Bon Cadeau</h3>
              <textarea
                className="w-full bg-white border-2 border-fuchsia-200 rounded-2xl p-4 font-bold outline-none focus:border-fuchsia-500 min-h-[100px] text-slate-700"
                placeholder="Ex: Merci pour votre achat ! Voici votre bon cadeau prêt à être offert..."
                value={settings['email_gift_card'] || ''}
                onChange={(e) => setSettings({...settings, 'email_gift_card': e.target.value})}
              />
              <button onClick={() => saveEmailSetting('email_gift_card', settings['email_gift_card'])} className="mt-4 bg-fuchsia-600 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-fuchsia-700 transition-all shadow-md">
                Sauvegarder
              </button>
            </div>

            <div>
              <div className="mb-6 border-b-2 border-slate-100 pb-4">
                <h3 className="font-black text-sky-900 uppercase tracking-widest text-sm mb-2">🪂 Personnalisation par type de vol</h3>
                <p className="text-xs text-slate-500 font-bold">
                  💡 Astuce : Vous pouvez utiliser les balises <span className="text-sky-500 px-1 bg-sky-50 rounded">[PRENOM]</span>, <span className="text-sky-500 px-1 bg-sky-50 rounded">[DATE]</span> et <span className="text-sky-500 px-1 bg-sky-50 rounded">[HEURE]</span>. Elles seront remplacées automatiquement lors de l'envoi !
                </p>
              </div>
              
              <div className="grid grid-cols-1 gap-8">
                {flights.map(flight => (
                  <div key={flight.id} className="bg-slate-50 p-8 rounded-[40px] border border-slate-200">
                    <h4 className="font-black text-slate-800 uppercase italic mb-6 text-xl">{flight.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <label className="text-[10px] font-black uppercase text-indigo-500 ml-4 mb-1 block">📧 Contenu du bloc "Conseils" (Email)</label>
                        <textarea
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 text-sm min-h-[120px] text-slate-600"
                          placeholder="Ex: Prévoyez de bonnes chaussures et un coupe-vent. Balises utiles : [PRENOM], [DATE], [HEURE]"
                          value={settings[`email_flight_${flight.id}`] || ''}
                          onChange={(e) => setSettings({...settings, [`email_flight_${flight.id}`]: e.target.value})}
                        />
                        <button onClick={() => saveEmailSetting(`email_flight_${flight.id}`, settings[`email_flight_${flight.id}`])} className="mt-3 bg-slate-800 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-indigo-500 transition-colors shadow-sm">
                          Enregistrer l'Email
                        </button>
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-emerald-500 ml-4 mb-1 block">📱 Message SMS (Court)</label>
                        <textarea
                          className="w-full bg-white border-2 border-slate-200 rounded-2xl p-4 font-bold outline-none focus:border-emerald-500 text-sm min-h-[120px] text-slate-600"
                          maxLength={160}
                          placeholder="Ex: Bonjour [PRENOM], votre vol le [DATE] à [HEURE] est confirmé ! À très vite - L'équipe Fluide."
                          value={settings[`sms_flight_${flight.id}`] || ''}
                          onChange={(e) => setSettings({...settings, [`sms_flight_${flight.id}`]: e.target.value})}
                        />
                        <div className="flex justify-between items-center mt-3">
                          <button onClick={() => saveEmailSetting(`sms_flight_${flight.id}`, settings[`sms_flight_${flight.id}`])} className="bg-slate-800 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-500 transition-colors shadow-sm">
                            Enregistrer le SMS
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* MODALE : MODÈLE BOUTIQUE (AVEC DOUBLE UPLOAD) */}
        {showTemplateModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center p-4 overflow-y-auto">
            <div className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl my-8">
              <h2 className="text-xl font-black uppercase italic mb-6 text-amber-500">
                {editingTemplateId ? 'Modifier le Modèle' : 'Nouveau Modèle Boutique'}
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Titre (affiché au client)</label>
                  <input type="text" placeholder="Ex: Chèque Cadeau Liberté" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={newTemplate.title} onChange={e => setNewTemplate({...newTemplate, title: e.target.value})} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Description</label>
                  <textarea placeholder="Ex: Valable sur toutes nos prestations..." className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 h-24" value={newTemplate.description} onChange={e => setNewTemplate({...newTemplate, description: e.target.value})} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prix de vente (€)</label>
                    <input type="number" placeholder="Ex: 100" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 text-amber-600" value={newTemplate.price_cents} onChange={e => setNewTemplate({...newTemplate, price_cents: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Validité (Mois)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={newTemplate.validity_months} onChange={e => setNewTemplate({...newTemplate, validity_months: parseInt(e.target.value)})} />
                  </div>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lier à une prestation (Optionnel)</label>
                  <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={newTemplate.flight_type_id} onChange={e => setNewTemplate({...newTemplate, flight_type_id: e.target.value})}>
                    <option value="">💶 Avoir Libre (Montant déduit du total)</option>
                    {flights.map(f => <option key={f.id} value={f.id}>🎯 Uniquement : {f.name}</option>)}
                  </select>
                </div>

                {/* 🎯 DOUBLE UPLOAD D'IMAGES */}
                <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-6">
                  
                  {/* 1. Image Vitrine Boutique */}
                  <div>
                    <label className="text-[10px] font-black uppercase text-sky-500 ml-2">1. Image d'illustration (Vitrine Boutique)</label>
                    <div className="flex gap-3 mt-2">
                      <input 
                        type="file" id="image-upload" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setIsUploading(true);
                          const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'fluide_preset'); 
                          try {
                            const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.secure_url) setNewTemplate({...newTemplate, image_url: data.secure_url});
                          } catch (err) { alert("Erreur d'envoi."); } finally { setIsUploading(false); }
                        }} 
                      />
                      <label htmlFor="image-upload" className={`flex-1 flex items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl p-3 font-black uppercase text-[10px] tracking-widest cursor-pointer ${isUploading ? 'bg-white text-slate-400' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
                        {isUploading ? '⏳ Envoi...' : '📸 Uploader la miniature'}
                      </label>
                    </div>
                    {newTemplate.image_url && (
                      <div className="mt-3 h-24 rounded-xl bg-cover bg-center border border-slate-200 relative group" style={{ backgroundImage: `url(${newTemplate.image_url})` }}>
                         <button onClick={() => setNewTemplate({...newTemplate, image_url: ''})} className="absolute top-2 right-2 bg-rose-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 text-xs">✕</button>
                      </div>
                    )}
                  </div>

                  {/* 2. Image Fond PDF */}
                  <div className="border-t border-slate-200 pt-4">
                    <label className="text-[10px] font-black uppercase text-rose-500 ml-2">2. Image de Fond du PDF (Format A4 Vertical)</label>
                    <div className="flex gap-3 mt-2">
                      <input 
                        type="file" id="pdf-upload" accept="image/*" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0]; if (!file) return;
                          setIsUploadingPdf(true);
                          const formData = new FormData(); formData.append('file', file); formData.append('upload_preset', 'fluide_preset'); 
                          try {
                            const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.secure_url) setNewTemplate({...newTemplate, pdf_background_url: data.secure_url});
                          } catch (err) { alert("Erreur d'envoi."); } finally { setIsUploadingPdf(false); }
                        }} 
                      />
                      <label htmlFor="pdf-upload" className={`flex-1 flex items-center justify-center border-2 border-dashed border-rose-300 rounded-2xl p-3 font-black uppercase text-[10px] tracking-widest cursor-pointer ${isUploadingPdf ? 'bg-white text-slate-400' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                        {isUploadingPdf ? '⏳ Envoi...' : '🖼️ Uploader un fond PDF'}
                      </label>
                    </div>
                    {newTemplate.pdf_background_url && (
                      <div className="mt-3 h-32 w-24 mx-auto rounded-md bg-cover bg-center border border-slate-200 relative group" style={{ backgroundImage: `url(${newTemplate.pdf_background_url})` }}>
                         <button onClick={() => setNewTemplate({...newTemplate, pdf_background_url: ''})} className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 text-[10px] flex items-center justify-center shadow-md">✕</button>
                      </div>
                    )}
                  </div>
                  
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-100">
                  <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={newTemplate.is_published} onChange={e => setNewTemplate({...newTemplate, is_published: e.target.checked})} />
                  <span className="font-bold text-slate-700 text-sm">Rendre visible sur la boutique en ligne</span>
                </label>

                <div className="pt-4">
                  <button onClick={handleSaveTemplate} disabled={isSaving} className="w-full bg-amber-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl mb-3">{isSaving ? '⏳ En cours...' : 'Enregistrer le modèle'}</button>
                  <button onClick={() => setShowTemplateModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* MODALE : ROTATION */}
        {showAddModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
             <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
              <h2 className="text-xl font-black uppercase italic mb-6">{editingId ? 'Modifier Rotation' : 'Nouvelle Rotation'}</h2>
              <div className="space-y-4">
                <input type="time" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={newRotation.start_time} onChange={e => setNewRotation({...newRotation, start_time: e.target.value})} />
                <input type="number" placeholder="Durée (min)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={newRotation.duration_minutes || ''} onChange={e => setNewRotation({...newRotation, duration_minutes: parseInt(e.target.value) || 0})} />
                <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={newRotation.label} onChange={e => setNewRotation({...newRotation, label: e.target.value})}><option value="VOL">VOL</option><option value="PAUSE">PAUSE</option></select>
                <button onClick={handleSaveRotation} disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">{isSaving ? '⏳' : 'Enregistrer'}</button>
                <button onClick={() => setShowAddModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
              </div>
             </div>
          </div>
        )}

      </div>
    </div>
  );
}