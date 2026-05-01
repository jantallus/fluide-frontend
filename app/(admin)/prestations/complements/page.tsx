"use client";
import React, { useState, useEffect } from 'react';
import type { Complement } from '@/lib/types';
import { apiFetch } from '../../../../lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export default function ComplementsPage() {
  const [complements, setComplements] = useState<any[]>([]);
  const [newComp, setNewComp] = useState({ name: '', description: '', price_cents: 2000, image_url: '' });
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { toast, confirm } = useToast();

  const loadComplements = async () => {
    try {
      const res = await apiFetch('/api/complements');
      if (res.ok) setComplements(await res.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadComplements(); }, []);

  const handleAdd = async () => {
    if (!newComp.name) return;
      const res = await apiFetch('/api/complements', {
    method: 'POST',
    body: JSON.stringify(newComp)
  });
    if (res.ok) {
      setNewComp({ name: '', description: '', price_cents: 2000, image_url: '' });
      loadComplements();
    }
  };

  const handleDelete = async (id: number) => {
    if (!await confirm("Supprimer ce complément ?")) return;
    const res = await apiFetch(`/api/complements/${id}`, { method: 'DELETE' });
    if (res.ok) loadComplements();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-4xl mx-auto">
        <header className="mb-12">
          <p className="text-emerald-500 font-black uppercase text-xs tracking-widest mb-2">Options</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Compléments <span className="text-emerald-500">de vol</span>
          </h1>
        </header>

        {/* FORMULAIRE D'AJOUT RAPIDE */}
        <section className="bg-white rounded-[40px] p-8 shadow-sm border border-slate-100 mb-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <input 
              type="text" placeholder="Nom (ex: Option Vidéo)" 
              className="border-2 border-slate-100 rounded-2xl p-4 font-bold"
              value={newComp.name} onChange={e => setNewComp({...newComp, name: e.target.value})}
            />
            <input 
              type="number" placeholder="Prix (€)" 
              className="border-2 border-slate-100 rounded-2xl p-4 font-bold"
              value={newComp.price_cents / 100} onChange={e => setNewComp({...newComp, price_cents: Number(e.target.value) * 100})}
            />
          </div>
          
          <div className="flex flex-col md:flex-row gap-4 items-center">
            {/* BOUTON CLOUDINARY */}
            <input 
              type="file" id="comp-image-upload" accept="image/*" className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                setIsUploading(true);
                const formData = new FormData();
                formData.append('file', file);
                formData.append('upload_preset', 'fluide_preset'); // ⚠️ VOTRE PRESET
                try {
                  const res = await fetch('https://api.cloudinary.com/v1_1/dscvvpjyb/image/upload', { // ⚠️ VOTRE CLOUD NAME
                    method: 'POST', body: formData
                  });
                  const data = await res.json();
                  if (data.secure_url) setNewComp({...newComp, image_url: data.secure_url});
                } catch (err) { toast.error("Erreur d'envoi"); }
                finally { setIsUploading(false); }
              }} 
            />
            <label 
              htmlFor="comp-image-upload" 
              className={`flex-1 w-full flex items-center justify-center border-2 border-dashed border-sky-300 rounded-2xl p-4 font-black uppercase text-[10px] tracking-widest transition-colors cursor-pointer ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-sky-50 text-sky-600 hover:bg-sky-100'}`}
            >
              {isUploading ? '⏳ Envoi...' : '📸 Picto (Optionnel)'}
            </label>
            
            {newComp.image_url && (
              <div className="h-14 w-14 shrink-0 rounded-xl bg-contain bg-no-repeat bg-center border-2 border-slate-200" style={{ backgroundImage: `url(${newComp.image_url})` }}></div>
            )}

            <button onClick={handleAdd} disabled={!newComp.name} className="flex-1 w-full bg-emerald-500 text-white rounded-2xl py-4 font-black uppercase italic shadow-lg hover:bg-emerald-600 transition-all disabled:bg-slate-300">
              Ajouter l'option
            </button>
          </div>
        </section>

        {/* LISTE DES COMPLÉMENTS */}
        <div className="space-y-4">
          {complements.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group">
              <div className="flex items-center gap-6">
                <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black">{c.price_cents / 100}€</span>
                {/* 🎯 NOUVEAU : On affiche le picto s'il existe ! */}
                {c.image_url && <img src={c.image_url} alt="Picto" className="w-8 h-8 object-contain" />}
                <p className="font-black uppercase text-slate-800 tracking-tight">{c.name}</p>
              </div>
              <button 
                onClick={() => handleDelete(c.id)}
                className="opacity-0 group-hover:opacity-100 p-2 text-rose-400 hover:bg-rose-50 rounded-xl transition-all"
              >
                🗑️ Supprimer
              </button>
            </div>
          ))}
          {complements.length === 0 && !loading && <p className="text-center text-slate-400 font-bold uppercase text-xs italic">Aucun complément pour le moment</p>}
        </div>
      </div>
    </div>
  );
}