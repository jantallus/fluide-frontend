"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import type { GiftCardShopTemplate, FlightType } from '@/lib/types';

const EMPTY_TEMPLATE = {
  title: '', description: '', price_cents: '', flight_type_id: '',
  validity_months: 12, image_url: '', pdf_background_url: '',
  is_published: true, popup_content: '', show_popup: false,
  custom_line_1: '', custom_line_2: '', custom_line_3: '',
};

interface Props {
  templateToEdit: GiftCardShopTemplate | null;
  flights: FlightType[];
  onClose: () => void;
  onSaved: () => void;
}

export function TemplateModal({ templateToEdit, flights, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [tpl, setTpl] = useState({ ...EMPTY_TEMPLATE });
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingPdf, setIsUploadingPdf] = useState(false);

  useEffect(() => {
    if (templateToEdit) {
      setTpl({
        title: templateToEdit.title,
        description: templateToEdit.description || '',
        price_cents: (templateToEdit.price_cents / 100).toString(),
        flight_type_id: templateToEdit.flight_type_id?.toString() ?? '',
        validity_months: templateToEdit.validity_months,
        image_url: templateToEdit.image_url || '',
        pdf_background_url: templateToEdit.pdf_background_url || '',
        is_published: templateToEdit.is_published,
        popup_content: templateToEdit.popup_content || '',
        show_popup: templateToEdit.show_popup || false,
        custom_line_1: templateToEdit.custom_line_1 || '',
        custom_line_2: templateToEdit.custom_line_2 || '',
        custom_line_3: templateToEdit.custom_line_3 || '',
      });
    } else {
      setTpl({ ...EMPTY_TEMPLATE });
    }
  }, [templateToEdit]);

  const handleSave = async () => {
    if (!tpl.title || !tpl.price_cents) return toast.warning('Le titre et le prix sont obligatoires.');
    setIsSaving(true);
    try {
      const payload = { ...tpl, price_cents: Math.round(parseFloat(tpl.price_cents as string) * 100) };
      const url = templateToEdit ? `/api/gift-card-templates/${templateToEdit.id}` : '/api/gift-card-templates';
      const res = await apiFetch(url, { method: templateToEdit ? 'PUT' : 'POST', body: JSON.stringify(payload) });
      if (res.ok) { onSaved(); onClose(); }
      else toast.error("Erreur lors de l'enregistrement du modèle.");
    } catch { toast.error('Erreur de connexion.'); } finally { setIsSaving(false); }
  };

  const uploadImage = async (file: File, field: 'image_url' | 'pdf_background_url', setUploading: (v: boolean) => void) => {
    setUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', 'fluide_preset');
    try {
      const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', { method: 'POST', body: formData });
      const data = await res.json();
      if (data.secure_url) setTpl(prev => ({ ...prev, [field]: data.secure_url }));
    } catch { toast.error("Erreur lors de l'envoi de l'image."); } finally { setUploading(false); }
  };

  const set = (patch: Partial<typeof EMPTY_TEMPLATE>) => setTpl(prev => ({ ...prev, ...patch }));

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-start justify-center p-4 overflow-y-auto">
      <div className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl my-8">
        <h2 className="text-xl font-black uppercase italic mb-6 text-amber-500">
          {templateToEdit ? 'Modifier le Modèle' : 'Nouveau Modèle Boutique'}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Titre (affiché au client)</label>
            <input type="text" placeholder="Ex: Chèque Cadeau Liberté" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={tpl.title} onChange={e => set({ title: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Description</label>
            <textarea placeholder="Ex: Valable sur toutes nos prestations..." className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 h-24" value={tpl.description} onChange={e => set({ description: e.target.value })} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prix de vente (€)</label>
              <input type="number" placeholder="Ex: 100" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 text-amber-600" value={tpl.price_cents} onChange={e => set({ price_cents: e.target.value })} />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Validité (Mois)</label>
              <input type="number" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={tpl.validity_months} onChange={e => set({ validity_months: parseInt(e.target.value) })} />
            </div>
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Lier à une prestation (Optionnel)</label>
            <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" value={tpl.flight_type_id} onChange={e => set({ flight_type_id: e.target.value })}>
              <option value="">💶 Avoir Libre (Montant déduit du total)</option>
              {flights.map(f => <option key={f.id} value={f.id}>🎯 Uniquement : {f.name}</option>)}
            </select>
          </div>

          {/* Double upload */}
          <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 space-y-6">
            <div>
              <label className="text-[10px] font-black uppercase text-sky-500 ml-2">1. Image d'illustration (Vitrine Boutique)</label>
              <div className="flex gap-3 mt-2">
                <input type="file" id="image-upload" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'image_url', setIsUploading); }} />
                <label htmlFor="image-upload" className={`flex-1 flex items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl p-3 font-black uppercase text-[10px] tracking-widest cursor-pointer ${isUploading ? 'bg-white text-slate-400' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}>
                  {isUploading ? '⏳ Envoi...' : '📸 Uploader la miniature'}
                </label>
              </div>
              {tpl.image_url && (
                <div className="mt-3 h-24 rounded-xl bg-cover bg-center border border-slate-200 relative group" style={{ backgroundImage: `url(${tpl.image_url})` }}>
                  <button onClick={() => set({ image_url: '' })} className="absolute top-2 right-2 bg-rose-500 text-white w-6 h-6 rounded-full opacity-0 group-hover:opacity-100 text-xs">✕</button>
                </div>
              )}
            </div>

            <div className="border-t border-slate-200 pt-4">
              <label className="text-[10px] font-black uppercase text-rose-500 ml-2">2. Image de Fond du PDF (Format A4 Vertical)</label>
              <div className="flex gap-3 mt-2">
                <input type="file" id="pdf-upload" accept="image/*" className="hidden"
                  onChange={e => { const f = e.target.files?.[0]; if (f) uploadImage(f, 'pdf_background_url', setIsUploadingPdf); }} />
                <label htmlFor="pdf-upload" className={`flex-1 flex items-center justify-center border-2 border-dashed border-rose-300 rounded-2xl p-3 font-black uppercase text-[10px] tracking-widest cursor-pointer ${isUploadingPdf ? 'bg-white text-slate-400' : 'bg-rose-50 text-rose-600 hover:bg-rose-100'}`}>
                  {isUploadingPdf ? '⏳ Envoi...' : '🖼️ Uploader un fond PDF'}
                </label>
              </div>
              {tpl.pdf_background_url && (
                <div className="mt-3 h-32 w-24 mx-auto rounded-md bg-cover bg-center border border-slate-200 relative group" style={{ backgroundImage: `url(${tpl.pdf_background_url})` }}>
                  <button onClick={() => set({ pdf_background_url: '' })} className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full opacity-0 group-hover:opacity-100 text-[10px] flex items-center justify-center shadow-md">✕</button>
                </div>
              )}
            </div>
          </div>

          {/* Lignes PDF personnalisées */}
          <div className="mt-4 p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <h4 className="text-sm font-black text-slate-700 mb-2">Texte "VALABLE POUR :" sur le PDF</h4>
            <p className="text-[10px] text-slate-500 font-bold mb-3 leading-tight">Si vous remplissez ces cases, ce texte remplacera le nom générique du vol sur le PDF.</p>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ligne 1</label>
            <input type="text" maxLength={80} placeholder="Ex: 1 vol Crêt du Loup Hiver ou Découverte Été" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white text-sm mb-3 outline-none focus:border-indigo-500" value={tpl.custom_line_1} onChange={e => set({ custom_line_1: e.target.value })} />
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ligne 2 (Suite optionnelle)</label>
            <input type="text" maxLength={80} placeholder="Ex: Option photos et vidéos incluse" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white text-sm outline-none focus:border-indigo-500 mb-3" value={tpl.custom_line_2} onChange={e => set({ custom_line_2: e.target.value })} />
            <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Ligne 3 (Suite optionnelle)</label>
            <input type="text" maxLength={80} placeholder="Ex: Réservation obligatoire par téléphone" className="w-full border-2 border-slate-200 rounded-xl p-3 font-bold bg-white text-sm outline-none focus:border-indigo-500" value={tpl.custom_line_3} onChange={e => set({ custom_line_3: e.target.value })} />
          </div>

          {/* Popup info */}
          <div className="mt-4 p-4 bg-sky-50 rounded-2xl border border-sky-100">
            <label className="flex items-center gap-3 cursor-pointer mb-2">
              <input type="checkbox" className="w-5 h-5 accent-sky-500 rounded" checked={tpl.show_popup} onChange={e => set({ show_popup: e.target.checked })} />
              <span className="font-bold text-sky-900 text-xs">Activer le bouton "i" (Informations détaillées)</span>
            </label>
            {tpl.show_popup && (
              <div className="mt-3">
                <label className="text-[10px] font-black uppercase text-sky-600/70 ml-2">Contenu de la Popup</label>
                <textarea className="w-full bg-white border-2 border-sky-100 rounded-2xl p-4 font-medium text-sm h-32 focus:border-sky-400 outline-none text-slate-700 mt-1" placeholder="Explications sur ce bon cadeau..." value={tpl.popup_content} onChange={e => set({ popup_content: e.target.value })} />
                <p className="text-[10px] text-slate-400 mt-2 font-medium leading-tight ml-2">💡 Entourez un mot avec deux étoiles pour le mettre en gras : <span className="font-bold text-slate-600">**haute saison**</span>.</p>
              </div>
            )}
          </div>

          <label className="flex items-center gap-3 cursor-pointer bg-slate-50 p-4 rounded-2xl border border-slate-100">
            <input type="checkbox" className="w-5 h-5 accent-emerald-500" checked={tpl.is_published} onChange={e => set({ is_published: e.target.checked })} />
            <span className="font-bold text-slate-700 text-sm">Rendre visible sur la boutique en ligne</span>
          </label>

          <div className="pt-4">
            <button onClick={handleSave} disabled={isSaving} className="w-full bg-amber-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl mb-3">
              {isSaving ? '⏳ En cours...' : 'Enregistrer le modèle'}
            </button>
            <button onClick={onClose} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
