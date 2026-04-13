"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await apiFetch('/api/clients');
        if (res.ok) {
          const data = await res.json();
          setClients(data);
        }
      } catch (err) {
        console.error("Erreur clients:", err);
      }
    };
    fetchData();
  }, []);

  const filtered = clients.filter(c => 
    c.first_name.toLowerCase().includes(search.toLowerCase()) || 
    c.last_name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Annuaire</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Tes <span className="text-sky-500">Clients</span>
          </h1>
          <input 
            className="mt-6 w-full max-w-md bg-white border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 transition-all shadow-sm"
            placeholder="Rechercher un passager..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </header>

        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest">
                <th className="p-6">Nom / Prénom</th>
                <th className="p-6">Téléphone</th>
                <th className="p-6 text-center">Poids</th>
                <th className="p-6 text-center">Origine / Paiement</th>
                <th className="p-6 text-right">Dernier Vol</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {filtered.map(c => (
                <tr key={c.id} className="hover:bg-sky-50/30 transition-colors">
                  <td className="p-6">
                    <p className="font-black text-slate-800 uppercase">{c.last_name} {c.first_name}</p>
                    <p className="text-[10px] text-slate-400 font-bold">{c.email}</p>
                  </td>
                  <td className="p-6 font-bold text-slate-600 text-sm">{c.phone || '--'}</td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-500 text-xs">
                      {c.weight ? `${c.weight}kg` : '--'}
                    </span>
                  </td>
                  <td className="p-6 text-center">
                    {(() => {
                      const status = c.payment_status;
                      if (!status) return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 shadow-sm block w-fit mx-auto">🏢 Backoffice (À régler)</span>;
                      if (status.includes('Bon Cadeau')) return <span className="bg-violet-100 text-violet-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-violet-200 shadow-sm block w-fit mx-auto">🎁 {status}</span>;
                      if (status.includes('Promo')) return <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-200 shadow-sm block w-fit mx-auto">🏷️ {status}</span>;
                      if (status.includes('CB')) return <span className="bg-sky-100 text-sky-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-sky-200 shadow-sm block w-fit mx-auto">💳 {status}</span>;
                      return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 shadow-sm block w-fit mx-auto">{status}</span>;
                    })()}
                  </td>
                  <td className="p-6 text-right font-bold text-slate-400 text-xs uppercase">
                    {c.last_flight_date ? new Date(c.last_flight_date).toLocaleDateString() : 'Jamais'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}