"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function GiftCardsPage() {
  const [cards, setCards] = useState<any[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [complements, setComplements] = useState<any[]>([]); // État pour les compléments
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const toggleCardStatus = async (id: number, currentStatus: string) => {
  const newStatus = currentStatus === 'valid' ? 'used' : 'valid';
  const confirmMsg = newStatus === 'valid' 
    ? "Réactiver ce bon ? Il pourra de nouveau être utilisé sur le planning." 
    : "Marquer ce bon comme utilisé manuellement ?";
    
  if (!confirm(confirmMsg)) return;

  const res = await apiFetch(`/api/gift-cards/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: newStatus })
  });

  if (res.ok) loadData();
};
  
  // État du nouveau bon avec support des compléments
  const [newCard, setNewCard] = useState({ 
    flight_type_id: '', 
    buyer_name: '', 
    beneficiary_name: '',
    selectedComplements: [] as number[] 
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes, compRes] = await Promise.all([
        apiFetch('/api/gift-cards'),
        apiFetch('/api/flight-types'),
        apiFetch('/api/complements') // On récupère tes nouveaux compléments
      ]);
      if (cRes.ok) setCards(await cRes.json());
      if (fRes.ok) setFlights(await fRes.json());
      if (compRes.ok) setComplements(await compRes.json());
    } catch (err) {
      console.error("Erreur chargement données:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleCreate = async () => {
  if (!newCard.flight_type_id || !newCard.buyer_name || !newCard.beneficiary_name) {
    alert("Veuillez remplir tous les champs obligatoires");
    return;
  }

  const flight = flights.find(f => f.id === parseInt(newCard.flight_type_id));
  const selectedCompsData = complements.filter(c => newCard.selectedComplements.includes(c.id));
  const totalCompsPrice = selectedCompsData.reduce((acc, curr) => acc + curr.price_cents, 0);
  const totalPrice = (flight?.price_cents || 0) + totalCompsPrice;

  // On prépare les notes qui seront stockées dans la colonne 'notes' de la table gift_cards
  const notesString = selectedCompsData.length > 0 
    ? `Options incluses : ${selectedCompsData.map(c => c.name).join(', ')}`
    : '';

  const res = await apiFetch('/api/gift-cards', {
    method: 'POST',
    body: JSON.stringify({ 
      flight_type_id: newCard.flight_type_id,
      buyer_name: newCard.buyer_name,
      beneficiary_name: newCard.beneficiary_name,
      price_paid_cents: totalPrice,
      notes: notesString // On envoie la string formatée
    })
  });

  if (res.ok) {
    setShowModal(false);
    setNewCard({ flight_type_id: '', buyer_name: '', beneficiary_name: '', selectedComplements: [] });
    loadData();
  } else {
    const errorMsg = await res.json();
    alert("Erreur : " + (errorMsg.error || "Problème lors de la création"));
  }
};

  const toggleComplement = (id: number) => {
    setNewCard(prev => ({
      ...prev,
      selectedComplements: prev.selectedComplements.includes(id)
        ? prev.selectedComplements.filter(cid => cid !== id)
        : [...prev.selectedComplements, id]
    }));
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen font-sans">
      <header className="flex justify-between items-center mb-12">
        <div>
          <p className="text-indigo-500 font-black uppercase text-xs tracking-widest mb-2">Ventes & Boutique</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Bons <span className="text-indigo-500">Cadeaux</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-indigo-600 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform"
        >
          + Émettre un bon
        </button>
      </header>

      {/* LISTE DES BONS */}
      <div className="grid gap-4">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse">Chargement des bons...</div>
        ) : cards.map(c => (
          <div key={c.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-indigo-200 transition-all">
            <div className="flex gap-6 items-center">
              <div className="bg-indigo-50 p-4 rounded-2xl text-center min-w-[100px]">
                <p className="text-[10px] font-black text-indigo-400 uppercase">Code</p>
                <p className="font-black text-indigo-600">{c.code}</p>
              </div>
              <div>
                <h3 className="text-xl font-black uppercase italic text-slate-800">{c.beneficiary_name}</h3>
                <p className="text-sm text-slate-400 font-bold uppercase tracking-tight">
                  {c.flight_name} • <span className="text-slate-500">Payé {c.price_paid_cents / 100}€</span>
                </p>
                <p className="text-[10px] text-slate-300 font-bold uppercase mt-1">Acheteur : {c.buyer_name}</p>
              </div>
            </div>
            <button 
              onClick={() => toggleCardStatus(c.id, c.status)}
              className={`px-6 py-2 rounded-full font-black uppercase text-xs transition-all hover:scale-105 shadow-sm ${
                c.status === 'valid' 
                ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200' 
                : 'bg-rose-100 text-rose-400 hover:bg-rose-200'
              }`}
            >
              {c.status === 'valid' ? '● Valide' : '✕ Utilisé'}
            </button>
          </div>
        ))}
      </div>

      {/* MODALE D'ÉMISSION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl overflow-y-auto max-h-[90vh]">
            <h2 className="text-2xl font-black uppercase italic mb-6">Émettre un bon</h2>
            
            <div className="space-y-6">
              {/* Infos de base */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Type de Vol</label>
                <select 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50"
                  value={newCard.flight_type_id}
                  onChange={e => setNewCard({...newCard, flight_type_id: e.target.value})}
                >
                  <option value="">Sélectionner une prestation...</option>
                  {flights.map(f => <option key={f.id} value={f.id}>{f.name} ({f.price_cents/100}€)</option>)}
                </select>
              </div>

              {/* Compléments (Les nouvelles options) */}
              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Options supplémentaires (Compléments)</label>
                <div className="grid grid-cols-1 gap-2">
                  {complements.map(comp => (
                    <div 
                      key={comp.id}
                      onClick={() => toggleComplement(comp.id)}
                      className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex justify-between items-center ${
                        newCard.selectedComplements.includes(comp.id) 
                        ? 'border-indigo-500 bg-indigo-50' 
                        : 'border-slate-100 bg-slate-50'
                      }`}
                    >
                      <span className="font-bold text-sm uppercase">{comp.name}</span>
                      <span className="font-black text-indigo-600">+{comp.price_cents / 100}€</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Acheteur</label>
                  <input 
                    type="text" placeholder="Nom" 
                    className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                    onChange={e => setNewCard({...newCard, buyer_name: e.target.value})} 
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Bénéficiaire</label>
                  <input 
                    type="text" placeholder="Nom" 
                    className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                    onChange={e => setNewCard({...newCard, beneficiary_name: e.target.value})} 
                  />
                </div>
              </div>

              <button 
                onClick={handleCreate} 
                className="w-full bg-indigo-600 text-white py-5 rounded-3xl font-black uppercase italic shadow-xl hover:bg-indigo-700 transition-all"
              >
                Générer et Enregistrer le bon
              </button>
              
              <button 
                onClick={() => setShowModal(false)} 
                className="w-full text-slate-300 font-bold uppercase text-[10px] tracking-widest"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}