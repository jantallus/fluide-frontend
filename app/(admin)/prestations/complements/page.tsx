"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../../lib/api';

export default function ComplementsPage() {
  const [complements, setComplements] = useState<any[]>([]);
  const [newComp, setNewComp] = useState({ name: '', description: '', price_cents: 2000 });
  const [loading, setLoading] = useState(true);

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
      setNewComp({ name: '', description: '', price_cents: 2000 });
      loadComplements();
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Supprimer ce complément ?")) return;
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
            <button onClick={handleAdd} className="bg-emerald-500 text-white rounded-2xl font-black uppercase italic shadow-lg hover:bg-emerald-600 transition-all">
              Ajouter
            </button>
          </div>
        </section>

        {/* LISTE DES COMPLÉMENTS */}
        <div className="space-y-4">
          {complements.map((c) => (
            <div key={c.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group">
              <div className="flex items-center gap-6">
                <span className="bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl font-black">{c.price_cents / 100}€</span>
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