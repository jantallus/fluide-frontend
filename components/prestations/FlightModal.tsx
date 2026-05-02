"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

const EMPTY_FORM = {
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
  show_popup: false,
};

interface Props {
  flightToEdit: any | null;
  slotDefs: any[];
  onClose: () => void;
  onSaved: () => void;
}

export function FlightModal({ flightToEdit, slotDefs, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({ ...EMPTY_FORM });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => {
    if (flightToEdit) {
      setFormData({
        name: flightToEdit.name,
        duration_minutes: flightToEdit.duration_minutes,
        price_cents: flightToEdit.price_cents,
        restricted_start_time: flightToEdit.restricted_start_time || '',
        restricted_end_time: flightToEdit.restricted_end_time || '',
        color_code: flightToEdit.color_code || '#3b82f6',
        allowed_time_slots: flightToEdit.allowed_time_slots || [],
        season: flightToEdit.season || 'ALL',
        weight_min: flightToEdit.weight_min ?? 20,
        weight_max: flightToEdit.weight_max ?? 110,
        allow_multi_slots: flightToEdit.allow_multi_slots || false,
        booking_delay_hours: flightToEdit.booking_delay_hours ?? 1,
        image_url: flightToEdit.image_url || '',
        popup_content: flightToEdit.popup_content || '',
        show_popup: flightToEdit.show_popup || false,
      });
    } else {
      setFormData({ ...EMPTY_FORM });
    }
  }, [flightToEdit]);

  const set = (patch: Partial<typeof EMPTY_FORM>) => setFormData(prev => ({ ...prev, ...patch }));

  const handleSave = async () => {
    if (isSaving) return;
    setIsSaving(true);
    const editingId = flightToEdit?.id ?? null;
    const url = editingId ? `/api/flight-types/${editingId}` : '/api/flight-types';
    const method = editingId ? 'PUT' : 'POST';
    const payload = {
      ...formData,
      duration_minutes: Number(formData.duration_minutes),
      price_cents: Number(formData.price_cents),
      weight_min: Number(formData.weight_min),
      weight_max: Number(formData.weight_max),
      booking_delay_hours: Number(formData.booking_delay_hours),
    };
    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) { onSaved(); onClose(); }
    else {
      const errorData = await res.json();
      toast.error("Erreur : " + (errorData.error || "Problème d'enregistrement"));
    }
    setIsSaving(false);
  };

  const uploadImage = async (file: File) => {
    setIsUploading(true);
    const dataForm = new FormData();
    dataForm.append('file', file);
    dataForm.append('upload_preset', 'fluide_preset');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', { method: 'POST', body: dataForm });
      const data = await res.json();
      if (data.secure_url) set({ image_url: data.secure_url });
    } catch { toast.error("Erreur lors de l'envoi de l'image."); }
    finally { setIsUploading(false); }
  };

  const displaySlots = slotDefs.filter(s => {
    if (s.label?.includes('PAUSE')) return false;
    if (formData.season === 'SUMMER') return s.plan_name === 'Standard';
    if (formData.season === 'WINTER') return s.plan_name === 'hiver';
    return true;
  });
  const uniqueTimes = Array.from(new Set(displaySlots.map((s: any) => s.start_time.slice(0, 5)))).sort() as string[];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto">
        <h2 className="text-xl md:text-2xl font-black uppercase italic mb-6 text-slate-900">
          {flightToEdit ? 'Modifier le vol' : 'Nouveau Vol'}
        </h2>

        <div className="space-y-4">
          <input type="text" placeholder="Nom du vol (ex: Grand Vol)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.name} onChange={e => set({ name: e.target.value })} />

          <div>
            <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Image du vol (Catalogue Client)</label>
            <div className="flex flex-col sm:flex-row gap-3 mt-1">
              <input type="file" id="image-upload-flight" accept="image/*" className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f); }} />
              <label htmlFor="image-upload-flight" className={`w-full sm:w-auto flex items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl p-4 font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer ${isUploading ? 'bg-slate-100 text-slate-400 border-slate-200' : 'bg-sky-50 text-sky-600 hover:bg-sky-100 hover:border-sky-400'}`}>
                {isUploading ? '⏳ Envoi en cours...' : '📸 Uploader'}
              </label>
              <input type="text" placeholder="Ou lien..." className="w-full sm:flex-1 border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 text-xs text-slate-500 outline-none focus:border-sky-300" value={formData.image_url} onChange={e => set({ image_url: e.target.value })} />
            </div>
            {formData.image_url && (
              <div className="mt-3 h-28 rounded-2xl bg-cover bg-center border-2 border-slate-200 shadow-inner relative group" style={{ backgroundImage: `url(${formData.image_url})` }}>
                <button onClick={() => set({ image_url: '' })} className="absolute top-2 right-2 bg-rose-500 text-white w-8 h-8 flex items-center justify-center rounded-full opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity shadow-md text-sm font-bold">✕</button>
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Prix (€)</label>
              <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.price_cents / 100} onChange={e => set({ price_cents: Number(e.target.value) * 100 })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Durée (min)</label>
              <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.duration_minutes} onChange={e => set({ duration_minutes: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Poids Min (kg)</label>
              <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.weight_min} onChange={e => set({ weight_min: Number(e.target.value) })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Poids Max (kg)</label>
              <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-300 text-slate-800" value={formData.weight_max} onChange={e => set({ weight_max: Number(e.target.value) })} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Couleur</label>
              <input type="color" className="w-full h-14 rounded-2xl mt-1 overflow-hidden cursor-pointer border-2 border-transparent" value={formData.color_code} onChange={e => set({ color_code: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase ml-2">Saison</label>
              <select className="w-full h-14 bg-slate-50 border-2 border-slate-100 rounded-2xl px-3 mt-1 font-bold text-xs outline-none focus:border-sky-300 text-slate-700" value={formData.season} onChange={e => set({ season: e.target.value, allowed_time_slots: [] })}>
                <option value="ALL">🌍 Toute l'année</option>
                <option value="SUMMER">☀️ Été</option>
                <option value="WINTER">❄️ Hiver</option>
              </select>
            </div>
          </div>

          <div className="mt-2 bg-rose-50/50 p-4 rounded-2xl border border-rose-100">
            <label className="text-[10px] font-black text-slate-500 uppercase ml-2">Délai limite avant le vol (en heures)</label>
            <input type="number" className="w-full border-2 border-white rounded-2xl p-4 font-bold mt-1 outline-none focus:border-rose-300 text-slate-800 shadow-sm" value={formData.booking_delay_hours} onChange={e => set({ booking_delay_hours: Number(e.target.value) })} />
            <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight">Exemple : 1 = Réservation impossible à partir d'une heure avant l'horaire du créneau.</p>
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-violet-50 p-4 rounded-2xl border border-violet-100 hover:border-violet-300 transition-colors mt-2">
            <input type="checkbox" className="w-5 h-5 accent-violet-500 rounded" checked={formData.allow_multi_slots} onChange={e => set({ allow_multi_slots: e.target.checked })} />
            <span className="font-bold text-violet-900 text-xs leading-tight">Autoriser l'étalement sur plusieurs créneaux</span>
          </label>

          <div className="mt-4 p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" className="w-5 h-5 accent-sky-500 rounded" checked={formData.show_popup} onChange={e => set({ show_popup: e.target.checked })} />
              <span className="font-bold text-sky-900 text-xs">Activer le bouton "i" (Informations détaillées)</span>
            </label>
            {formData.show_popup && (
              <div className="mt-3">
                <label className="text-[10px] font-black uppercase text-sky-600/70 ml-2">Contenu de la Popup (Point de RDV, vêtements...)</label>
                <textarea className="w-full bg-white border-2 border-sky-100 rounded-2xl p-4 font-medium text-sm h-32 focus:border-sky-400 outline-none text-slate-700 mt-1" placeholder="Rendez-vous au télésiège..." value={formData.popup_content} onChange={e => set({ popup_content: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight ml-2">💡 Astuce : Entourez un mot avec deux étoiles pour le mettre en gras. Exemple : <span className="font-bold text-slate-600">**lunettes de soleil**</span>.</p>
              </div>
            )}
          </div>

          <div className="bg-slate-50 border-2 border-slate-100 p-4 rounded-2xl mt-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
              <label className="text-[10px] font-black text-slate-400 uppercase block">Créneaux Compatibles</label>
              <div className="flex gap-2">
                <button onClick={() => {
                  const validTimes = uniqueTimes.filter(t => {
                    const maxDuration = Math.max(...displaySlots.filter((s: any) => s.start_time.slice(0, 5) === t).map((s: any) => s.duration_minutes));
                    return formData.allow_multi_slots ? true : maxDuration >= formData.duration_minutes;
                  });
                  set({ allowed_time_slots: validTimes });
                }} className="bg-sky-100 px-2 py-1 rounded text-[9px] font-black text-sky-600 uppercase hover:bg-sky-200 transition-colors">Tout cocher</button>
                <button onClick={() => set({ allowed_time_slots: [] })} className="bg-rose-100 px-2 py-1 rounded text-[9px] font-black text-rose-600 uppercase hover:bg-rose-200 transition-colors">Tout décocher</button>
              </div>
            </div>

            {uniqueTimes.length === 0 ? (
              <p className="text-xs font-bold text-rose-500 p-4 text-center bg-rose-50 rounded-xl border border-rose-100">Aucun créneau trouvé pour cette saison.</p>
            ) : (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {uniqueTimes.map(timeStr => {
                  const maxDuration = Math.max(...displaySlots.filter((s: any) => s.start_time.slice(0, 5) === timeStr).map((s: any) => s.duration_minutes));
                  const isCompatible = formData.allow_multi_slots ? true : maxDuration >= formData.duration_minutes;
                  const isChecked = formData.allowed_time_slots.includes(timeStr);
                  return (
                    <label key={timeStr} className={`flex items-center justify-center p-3 rounded-xl text-[10px] sm:text-xs font-black uppercase transition-all ${!isCompatible ? 'bg-slate-200 text-slate-400 opacity-50 cursor-not-allowed' : isChecked ? 'bg-sky-500 text-white cursor-pointer shadow-md' : 'bg-white border-2 border-slate-200 text-slate-500 cursor-pointer hover:border-sky-300 hover:text-sky-600'}`}>
                      <input type="checkbox" className="hidden" disabled={!isCompatible} checked={isCompatible && isChecked}
                        onChange={e => {
                          if (e.target.checked) set({ allowed_time_slots: [...formData.allowed_time_slots, timeStr] });
                          else set({ allowed_time_slots: formData.allowed_time_slots.filter(t => t !== timeStr) });
                        }} />
                      {timeStr}
                    </label>
                  );
                })}
              </div>
            )}
          </div>

          <div className="pt-4 space-y-3">
            <button onClick={handleSave} disabled={isSaving} className={`w-full py-4 md:py-5 rounded-3xl font-black uppercase italic shadow-xl transition-transform ${isSaving ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-[1.02]'}`}>
              {isSaving ? 'Enregistrement...' : 'Enregistrer la prestation'}
            </button>
            <button onClick={onClose} className="w-full text-slate-400 font-bold uppercase text-[10px] md:text-xs pb-2 hover:text-slate-600 transition-colors tracking-widest">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
