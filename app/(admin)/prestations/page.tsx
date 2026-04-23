"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function PrestationsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  
  const [seasonFilter, setSeasonFilter] = useState<'ALL' | 'SUMMER' | 'WINTER'>('ALL');
  
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 60,
    price_cents: 10000,
    restricted_start_time: '',
    restricted_end_time: '',
    color_code: '#3b82f6',
    allowed_time_slots: [] as string[],
    season: 'ALL',
    weight_min: 20,
    weight_max: 110,
    allow_multi_slots: false,
    booking_delay_hours: 1,
    image_url: '',
    popup_content: '',
    show_popup: false
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [flightsRes, slotsRes] = await Promise.all([
        apiFetch('/api/flight-types'),
        apiFetch('/api/slot-definitions')
      ]);
      if (flightsRes.ok) setFlights(await flightsRes.json());
      if (slotsRes.ok) setSlotDefs(await slotsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/flight-types/${editingId}` : '/api/flight-types';

    const payload = {
      ...formData,
      duration_minutes: Number(formData.duration_minutes),
      price_cents: Number(formData.price_cents),
      weight_min: Number(formData.weight_min),
      weight_max: Number(formData.weight_max),
      booking_delay_hours: Number(formData.booking_delay_hours),
      image_url: formData.image_url 
    };

    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });

    if (res.ok) {
      setShowModal(false);
      setEditingId(null);
      await loadData();
    } else {
      const errorData = await res.json();
      alert("Erreur : " + (errorData.error || "Problème d'enregistrement"));
    }
    setIsSaving(false);
  };

  const deleteFlight = async (id: number) => {
    if (!confirm("Supprimer définitivement ce vol ? (Impossible s'il est déjà lié à des réservations ou des bons cadeaux)")) return;
    const res = await apiFetch(`/api/flight-types/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadData();
    } else {
      alert("Ce vol est lié à des réservations passées ou des bons cadeaux. Astuce: Modifiez-le pour décocher tous ses créneaux afin de le masquer du site client !");
    }
  };

  const startEdit = (f: any) => {
    setEditingId(f.id);
    setFormData({
      name: f.name,
      duration_minutes: f.duration_minutes,
      price_cents: f.price_cents,
      restricted_start_time: f.restricted_start_time || '',
      restricted_end_time: f.restricted_end_time || '',
      color_code: f.color_code || '#3b82f6',
      allowed_time_slots: f.allowed_time_slots || [],
      season: f.season || 'ALL',
      weight_min: f.weight_min !== undefined && f.weight_min !== null ? f.weight_min : 20,
      weight_max: f.weight_max !== undefined && f.weight_max !== null ? f.weight_max : 110,
      allow_multi_slots: f.allow_multi_slots || false,
      booking_delay_hours: f.booking_delay_hours !== undefined && f.booking_delay_hours !== null ? f.booking_delay_hours : 1,
      image_url: f.image_url || '',
      popup_content: f.popup_content || '', 
      show_popup: f.show_popup || false  
    });
    setShowModal(true);
  };

  const startNew = () => {
    setEditingId(null);
    setFormData({ 
      name: '', 
      duration_minutes: 60, 
      price_cents: 10000, 
      restricted_start_time: '', 
      restricted_end_time: '', 
      color_code: '#3b82f6',
      allowed_time_slots: [],
      season: 'ALL',
      weight_min: 20,
      weight_max: 110,
      allow_multi_slots: false,
      booking_delay_hours: 1, 
      image_url: '',
      popup_content: '',
      show_popup: false
    });
    setShowModal(true);
  };

  const filteredFlights = flights.filter(f => {
    if (seasonFilter === 'ALL') return true;
    return f.season === seasonFilter || f.season === 'ALL';
  });

  const getFilteredSlots = () => {
    return slotDefs.filter(s => {
      if (s.label?.includes('PAUSE')) return false;
      if (formData.season === 'SUMMER') return s.plan_name === 'Standard';
      if (formData.season === 'WINTER') return s.plan_name === 'hiver';
      return true;
    });
  };

  const displaySlots = getFilteredSlots();
  const uniqueTimes = Array.from(new Set(displaySlots.map(s => s.start_time.slice(0, 5)))).sort();

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8 md:mb-12">
          <div>
            <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Catalogue</p>
            <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-sky-500">Prestations</span>
            </h1>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full md:w-auto">
            <div className="bg-white rounded-2xl p-1 shadow-sm border border-slate-200 flex w-full sm:w-auto">
              <button onClick={() => setSeasonFilter('ALL')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'ALL' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:text-slate-900'}`}>Tout</button>
              <button onClick={() => setSeasonFilter('SUMMER')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'SUMMER' ? 'bg-amber-100 text-amber-600' : 'text-slate-400 hover:text-slate-900'}`}>☀️ Été</button>
              <button onClick={() => setSeasonFilter('WINTER')} className={`flex-1 px-4 py-3 sm:py-2 rounded-xl text-[10px] font-black uppercase transition-all ${seasonFilter === 'WINTER' ? 'bg-sky-100 text-sky-600' : 'text-slate-400 hover:text-slate-900'}`}>❄️ Hiver</button>
            </div>
            <button onClick={startNew} className="w-full sm:w-auto bg-sky-500 text-white px-6 py-4 sm:py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:bg-sky-600 transition-colors">
              + Nouveau Vol
            </button>
          </div>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-[40px]" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {filteredFlights.map((f) => (
              <div key={f.id} className="bg-white rounded-[30px] md:rounded-[40px] p-6 md:p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden flex flex-col justify-between">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20 pointer-events-none" style={{ backgroundColor: f.color_code }} />
                
                <div className="relative z-10 flex-1">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-xl md:text-2xl font-black uppercase italic text-slate-800 leading-tight pr-4">{f.name}</h3>
                    <span className="bg-slate-900 text-white px-3 md:px-4 py-1 rounded-full font-black text-sm md:text-lg italic shrink-0">{f.price_cents / 100}€</span>
                  </div>
                  
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">⏱️ {f.duration_minutes} min</div>
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">⚖️ {f.weight_min !== undefined ? f.weight_min : 20} - {f.weight_max !== undefined ? f.weight_max : 110} kg</div>
                    
                    <div className="flex items-center gap-2 text-rose-500 font-bold text-[10px] uppercase">
                      ⏳ Bloqué {f.booking_delay_hours || 0}h avant
                    </div>

                    {f.allowed_time_slots && f.allowed_time_slots.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">✅ {f.allowed_time_slots.length} Créneaux</div>
                    )}
                    <div className="flex items-center gap-2 font-bold text-[10px] uppercase flex-wrap">
                      {f.season === 'SUMMER' && <span className="text-amber-500 bg-amber-50 px-2 py-1 rounded-md">☀️ Exclusif Été</span>}
                      {f.season === 'WINTER' && <span className="text-sky-500 bg-sky-50 px-2 py-1 rounded-md">❄️ Exclusif Hiver</span>}
                      {(!f.season || f.season === 'ALL') && <span className="text-slate-400 bg-slate-100 px-2 py-1 rounded-md">🌍 Toute l'année</span>}
                      {f.allow_multi_slots && <span className="text-violet-500 bg-violet-50 px-2 py-1 rounded-md">🧩 Multi-créneaux</span>}
                    </div>
                  </div>
                </div>

                <div className="flex gap-2 relative z-20 mt-4 border-t border-slate-100 pt-6">
                  <button onClick={() => startEdit(f)} className="flex-1 bg-slate-100 text-slate-600 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors cursor-pointer">Modifier</button>
                  <button onClick={() => deleteFlight(f.id)} className="px-4 bg-rose-50 text-rose-500 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all cursor-pointer">Suppr.</button>
                </div>
              </div>
            ))}
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl md:text-2xl font-black uppercase italic mb-6 text-slate-900">{editingId ? 'Modifier le vol' : 'Nouveau Vol'}</h2>
              
              <div className="space-y-4">
                <input type="text" placeholder="Nom du vol (ex: Grand Vol)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Image du vol (Catalogue Client)</label>
                  
                  <div className="flex flex-col sm:flex-row gap-3 mt-1">
                    <input 
                      type="file" 
                      id="image-upload-flight" 
                      accept="image/*" 
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (!file) return;

                        setIsUploading(true);
                        const dataForm = new FormData();
                        dataForm.append('file', file);
                        
                        dataForm.append('upload_preset', 'fluide_preset'); 

                        try {
                          const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', {
                            method: 'POST',
                            body: dataForm
                          });
                          
                          const data = await res.json();
                          if (data.secure_url) {
                            setFormData({...formData, image_url: data.secure_url});
                          }
                        } catch (err) {
                          alert("Erreur lors de l'envoi de l'image.");
                        } finally {
                          setIsUploading(false);
                        }
                      }} 
                    />
                    
                    <label 
                      htmlFor="image-upload-flight" 
                      className={`w-full sm:w-auto flex items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl p-4 font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer ${isUploading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-400'}`}
                    >
                      {isUploading ? '⏳ Envoi en cours...' : '📸 Uploader'}
                    </label>

                    <input 
                      type="text" 
                      placeholder="Ou lien..." 
                      className="w-full sm:flex-1 border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 text-xs text-slate-500 outline-none focus:border-sky-300" 
                      value={formData.image_url || ''} 
                      onChange={e => setFormData({...formData, image_url: e.target.value})} 
                    />
                  </div>
                  
                  {formData.image_url && (
                    <div className="mt-3 h-28 rounded-2xl bg-cover bg-center border-2 border-slate-200 shadow-inner relative group" style={{ backgroundImage: `url(${formData.image_url})` }}>
                       <button onClick={() => setFormData({...formData, image_url: ''})} className="absolute top-2 right-2 bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-sm font-bold">✕</button>
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Prix (€)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.price_cents / 100} onChange={e => setFormData({...formData, price_cents: Number(e.target.value) * 100})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Durée (min)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.duration_minutes} onChange={e => setFormData({...formData, duration_minutes: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Poids Min (kg)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.weight_min} onChange={e => setFormData({...formData, weight_min: Number(e.target.value)})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Poids Max (kg)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.weight_max} onChange={e => setFormData({...formData, weight_max: Number(e.target.value)})} />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Couleur</label>
                    <input type="color" className="w-full h-14 rounded-2xl mt-1 overflow-hidden cursor-pointer border-2 border-transparent" value={formData.color_code} onChange={e => setFormData({...formData, color_code: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Saison</label>
                    <select 
                      className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 mt-1 font-bold text-xs outline-none focus:border-sky-300 text-slate-700"
                      value={formData.season}
                      onChange={e => setFormData({...formData, season: e.target.value, allowed_time_slots: []})}
                    >
                      <option value="ALL">🌍 Toute l'année</option>
                      <option value="SUMMER">☀️ Été</option>
                      <option value="WINTER">❄️ Hiver</option>
                    </select>
                  </div>
                </div>

                <div className="mt-2 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
                  <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Délai limite avant le vol (en heures)</label>
                  <input 
                    type="number" 
                    className="w-full border-2 border-white rounded-2xl p-4 font-bold mt-1 outline-none focus:border-rose-300 text-slate-800 shadow-sm" 
                    value={formData.booking_delay_hours} 
                    onChange={e => setFormData({...formData, booking_delay_hours: Number(e.target.value)})} 
                  />
                  <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight">Exemple : 1 = Réservation impossible à partir d'une heure avant l'horaire du créneau.</p>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-violet-50 p-4 rounded-2xl border border-violet-100 hover:border-violet-300 transition-colors mt-2">
                  <input type="checkbox" className="w-5 h-5 accent-violet-500 rounded" checked={formData.allow_multi_slots} onChange={e => setFormData({...formData, allow_multi_slots: e.target.checked})} />
                  <span className="font-bold text-violet-900 text-xs leading-tight">Autoriser l'étalement sur plusieurs créneaux</span>
                </label>

                {/* 🎯 NOUVEAU : GESTION DE LA POPUP D'INFORMATION */}
                <div className="mt-4 p-4 bg-sky-50 rounded-2xl border border-sky-100">
                  <label className="flex items-center gap-3 cursor-pointer mb-2">
                    <input 
                      type="checkbox" 
                      className="w-5 h-5 accent-sky-500 rounded"
                      checked={formData.show_popup}
                      onChange={e => setFormData({...formData, show_popup: e.target.checked})}
                    />
                    <span className="font-bold text-sky-900 text-xs">Activer le bouton "i" (Informations détaillées)</span>
                  </label>

                  {formData.show_popup && (
                    <div className="mt-3">
                      <label className="text-[10px] font-black uppercase text-sky-600/70 ml-2">Contenu de la Popup (Point de RDV, vêtements...)</label>
                      <textarea 
                        className="w-full bg-white border-2 border-sky-100 rounded-2xl p-4 font-medium text-sm h-32 focus:border-sky-400 outline-none text-slate-700 mt-1"
                        placeholder="Rendez-vous au télésiège...\nPrévoyez des chaussures de marche..."
                        value={formData.popup_content}
                        onChange={e => setFormData({...formData, popup_content: e.target.value})}
                      />
                    </div>
                  )}
                </div>

                <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mt-4">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
                    <label className="text-[10px] font-black text-slate-400 uppercase block">Créneaux Compatibles</label>
                    <div className="flex gap-2">
                       <button onClick={() => {
                            const validTimes = uniqueTimes.filter(t => {
                              const maxDuration = Math.max(...displaySlots.filter(s => s.start_time.slice(0,5) === t).map(s => s.duration_minutes));
                              return formData.allow_multi_slots ? true : maxDuration >= formData.duration_minutes;
                            });
                            setFormData({...formData, allowed_time_slots: validTimes});
                          }} className="bg-sky-100 px-2 py-1 rounded text-[9px] font-black text-sky-600 uppercase hover:bg-sky-200 transition-colors">Tout cocher</button>
                        <button onClick={() => setFormData({...formData, allowed_time_slots: []})} className="bg-rose-100 px-2 py-1 rounded text-[9px] font-black text-rose-600 uppercase hover:bg-rose-200 transition-colors">Tout décocher</button>
                    </div>
                  </div>
                  
                  {uniqueTimes.length === 0 ? (
                    <p className="text-xs font-bold text-rose-500 p-4 text-center bg-rose-50 rounded-xl border border-rose-100">Aucun créneau trouvé pour cette saison.</p>
                  ) : (
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {uniqueTimes.map(timeStr => {
                        const maxDuration = Math.max(...displaySlots.filter(s => s.start_time.slice(0,5) === timeStr).map(s => s.duration_minutes));
                        const isCompatible = formData.allow_multi_slots ? true : maxDuration >= formData.duration_minutes;
                        const isChecked = formData.allowed_time_slots.includes(timeStr);

                        return (
                          <label key={timeStr} className={`flex items-center justify-center p-3 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all ${
                            !isCompatible ? 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed' : 
                            isChecked ? 'bg-sky-500 text-white cursor-pointer shadow-md' : 'bg-white border-2 border-slate-200 text-slate-500 cursor-pointer hover:border-sky-300 hover:text-sky-600'
                          }`}>
                            <input 
                              type="checkbox" 
                              className="hidden"
                              disabled={!isCompatible}
                              checked={isCompatible && isChecked}
                              onChange={(e) => {
                                if (e.target.checked) {
                                  setFormData({...formData, allowed_time_slots: [...formData.allowed_time_slots, timeStr]});
                                } else {
                                  setFormData({...formData, allowed_time_slots: formData.allowed_time_slots.filter(t => t !== timeStr)});
                                }
                              }}
                            />
                            {timeStr}
                          </label>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="pt-4 space-y-3">
                  <button 
                    onClick={handleSave} 
                    disabled={isSaving}
                    className={`w-full py-4 md:py-5 rounded-3xl font-black uppercase italic shadow-xl transition-transform ${isSaving ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-[1.02]'}`}
                  >
                    {isSaving ? 'Enregistrement...' : 'Enregistrer la prestation'}
                  </button>
                  <button onClick={() => setShowModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] md:text-xs pb-2 hover:text-slate-600 transition-colors tracking-widest">Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}