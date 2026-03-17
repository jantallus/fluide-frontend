"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function CouponsPage() {
  const [vouchers, setVouchers] = useState([]);
  const [flightTypes, setFlightTypes] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newCard, setNewCard] = useState({ flight_type_id: '', buyer_name: '', recipient_name: '' });

  const fetchData = async () => {
    const [resCards, resVols] = await Promise.all([apiFetch('/api/gift-cards'), apiFetch('/api/vols')]);
    if (resCards.ok) setVouchers(await resCards.json());
    if (resVols.ok) setFlightTypes(await resVols.json());
  };

  useEffect(() => { fetchData(); }, []);

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const res = await apiFetch('/api/gift-cards', { method: 'POST', body: JSON.stringify(newCard) });
    if (res.ok) {
      setIsModalOpen(false);
      fetchData();
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 p-6">
      <div className="flex justify-between items-center">
        <h1 className="text-4xl font-black text-slate-900 italic uppercase">Bons Cadeaux</h1>
        <button onClick={() => setIsModalOpen(true)} className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black uppercase text-xs">
          + Émettre un bon
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {vouchers.map((v: any) => (
          <div key={v.id} className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
            <div className={`p-6 text-white ${v.status === 'used' ? 'bg-slate-300' : 'bg-slate-900'}`}>
              <p className="text-2xl font-black italic">{v.code}</p>
            </div>
            <div className="p-8">
              <p className="text-xs font-black uppercase text-sky-500 mb-4">{v.flight_name}</p>
              <p className="font-bold text-slate-700">Pour : {v.recipient_name}</p>
            </div>
          </div>
        ))}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50">
          <form onSubmit={handleSubmit} className="bg-white rounded-[40px] p-10 max-w-md w-full space-y-4">
            <h2 className="text-2xl font-black uppercase italic">Nouveau Bon</h2>
            <select required className="w-full p-4 bg-slate-50 rounded-2xl font-bold" value={newCard.flight_type_id} onChange={e => setNewCard({...newCard, flight_type_id: e.target.value})}>
              <option value="">Type de vol...</option>
              {flightTypes.map((f:any) => <option key={f.id} value={f.id}>{f.name}</option>)}
            </select>
            <input placeholder="Acheteur" className="w-full p-4 bg-slate-50 rounded-2xl" onChange={e => setNewCard({...newCard, buyer_name: e.target.value})} />
            <input placeholder="Bénéficiaire" className="w-full p-4 bg-slate-50 rounded-2xl" onChange={e => setNewCard({...newCard, recipient_name: e.target.value})} />
            <div className="flex gap-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black uppercase text-xs">Annuler</button>
              <button type="submit" className="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs">Générer</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}