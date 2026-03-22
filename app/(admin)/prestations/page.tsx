"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function PrestationsPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]); // Pour charger les créneaux disponibles
  const [loading, setLoading] = useState(true);
  
  // États pour la gestion du formulaire
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    duration_minutes: 60,
    price_cents: 10000,
    restricted_start_time: '',
    restricted_end_time: '',
    color_code: '#3b82f6',
    allowed_time_slots: [] as string[] // Nouveau champ JSON
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [flightsRes, slotsRes] = await Promise.all([
        apiFetch('/api/flight-types'),
        apiFetch('/api/slot-definitions') // On charge les rotations
      ]);
      if (flightsRes.ok) setFlights(await flightsRes.json());
      if (slotsRes.ok) setSlotDefs(await slotsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/flight-types/${editingId}` : '/api/flight-types';

    const payload = {
      ...formData,
      duration_minutes: Number(formData.duration_minutes),
      price_cents: Number(formData.price_cents)
    };

    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });

    if (res.ok) {
      setShowModal(false);
      setEditingId(null);
      loadData();
    } else {
      const errorData = await res.json();
      alert("Erreur : " + (errorData.error || "Problème d'enregistrement"));
    }
  };

  const deleteFlight = async (id: number) => {
    if (!confirm("Supprimer définitivement ce vol ?")) return;
    const res = await apiFetch(`/api/flight-types/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
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
      allowed_time_slots: f.allowed_time_slots || [] // On charge les créneaux sauvegardés
    });
    setShowModal(true);
  };

  const startNew = () => {
    setEditingId(null);
    // Par défaut, un vol de 60 min prend tous les créneaux >= 60 min
    const defaultDuration = 60;
    const compatibleSlots = slotDefs
      .filter(s => s.duration_minutes >= defaultDuration && !s.label?.includes('PAUSE'))
      .map(s => s.start_time.slice(0,5));

    setFormData({ 
      name: '', 
      duration_minutes: defaultDuration, 
      price_cents: 10000, 
      restricted_start_time: '', 
      restricted_end_time: '', 
      color_code: '#3b82f6',
      allowed_time_slots: compatibleSlots
    });
    setShowModal(true);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-5xl mx-auto">
        <header className="flex justify-between items-center mb-12">
          <div>
            <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Catalogue</p>
            <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
              Tes <span className="text-sky-500">Prestations</span>
            </h1>
          </div>
          <button 
            onClick={startNew}
            className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-transform"
          >
            + Nouveau Vol
          </button>
        </header>

        {loading ? (
          <div className="grid gap-6 md:grid-cols-2">
            {[1, 2, 3, 4].map(i => <div key={i} className="h-48 bg-slate-200 animate-pulse rounded-[40px]" />)}
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2">
            {flights.map((f) => (
              <div key={f.id} className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 hover:shadow-xl transition-all group relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 -mr-8 -mt-8 rounded-full opacity-20" style={{ backgroundColor: f.color_code }} />
                <div className="relative z-10">
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-2xl font-black uppercase italic text-slate-800 leading-none">{f.name}</h3>
                    <span className="bg-slate-900 text-white px-4 py-1 rounded-full font-black text-lg italic">{f.price_cents / 100}€</span>
                  </div>
                  <div className="space-y-3 mb-8">
                    <div className="flex items-center gap-2 text-slate-500 font-bold text-[10px] uppercase">
                      ⏱️ {f.duration_minutes} min
                    </div>
                    {f.allowed_time_slots && f.allowed_time_slots.length > 0 && (
                      <div className="flex items-center gap-2 text-emerald-600 font-bold text-[10px] uppercase">
                        ✅ {f.allowed_time_slots.length} Créneaux autorisés
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(f)} className="flex-1 bg-slate-100 text-slate-400 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-slate-200 transition-colors">Modifier</button>
                    <button onClick={() => deleteFlight(f.id)} className="px-4 bg-rose-50 text-rose-400 py-3 rounded-2xl font-black text-[10px] uppercase hover:bg-rose-500 hover:text-white transition-all">Suppr.</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MODALE DE GESTION */}
        {showModal && (
          <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
            <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-black uppercase italic mb-6">{editingId ? 'Modifier le vol' : 'Nouveau Vol'}</h2>
              
              <div className="space-y-4">
                <input type="text" placeholder="Nom du vol (ex: Grand Vol)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} />
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Prix (€)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.price_cents / 100} onChange={e => setFormData({...formData, price_cents: Number(e.target.value) * 100})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Durée (min)</label>
                    <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.duration_minutes} 
                      onChange={e => {
                        const newDur = Number(e.target.value);
                        // Au changement de durée, on recalcule les créneaux compatibles
                        const compSlots = slotDefs
                          .filter(s => s.duration_minutes >= newDur && !s.label?.includes('PAUSE'))
                          .map(s => s.start_time.slice(0,5));
                        setFormData({...formData, duration_minutes: newDur, allowed_time_slots: compSlots});
                      }} 
                    />
                  </div>
                </div>

                <div>
                   <label className="text-[10px] font-black text-slate-400 uppercase ml-4">Couleur Planning</label>
                   <input type="color" className="w-full h-12 rounded-xl mt-1 overflow-hidden" value={formData.color_code} onChange={e => setFormData({...formData, color_code: e.target.value})} />
                </div>

                {/* SÉLECTEUR DE CRÉNEAUX HORAIRES */}
                <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl">
                  <label className="text-[10px] font-black text-slate-400 uppercase block mb-2">
                    Créneaux Compatibles
                  </label>
                  <p className="text-[10px] text-slate-400 mb-3 leading-tight">
                    Décochez les horaires où ce vol n'est pas autorisé. (Les créneaux trop courts sont grisés).
                  </p>
                  <div className="grid grid-cols-3 gap-2">
                    {slotDefs.filter(s => !s.label?.includes('PAUSE')).map(slot => {
                      const timeStr = slot.start_time.slice(0,5);
                      const isCompatible = slot.duration_minutes >= formData.duration_minutes;
                      const isChecked = formData.allowed_time_slots.includes(timeStr);

                      return (
                        <label key={slot.id} className={`flex items-center justify-center p-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                          !isCompatible ? 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed' : 
                          isChecked ? 'bg-sky-500 text-white cursor-pointer shadow-md' : 'bg-white border-2 border-slate-200 text-slate-500 cursor-pointer hover:border-sky-300'
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
                </div>

                <div className="pt-2">
                  <button onClick={handleSave} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl mb-3 hover:scale-[1.02] transition-transform">Enregistrer la prestation</button>
                  <button onClick={() => setShowModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}