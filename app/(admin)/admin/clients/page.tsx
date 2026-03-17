"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const fetchClients = async () => {
      try {
        const res = await apiFetch('/api/admin/clients');
        if (res.ok) setClients(await res.json());
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchClients();
  }, []);

  const filteredClients = clients.filter((c: any) => 
    c.first_name.toLowerCase().includes(search.toLowerCase()) || 
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300">CHARGEMENT...</div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6 p-4">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Annuaire Clients</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Base de données des passagers</p>
        </div>
        <input 
          type="text" 
          placeholder="RECHERCHER UN NOM..." 
          className="bg-white border border-slate-200 rounded-2xl px-4 py-2 text-xs font-bold outline-none focus:ring-2 focus:ring-sky-500 w-64"
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="bg-white rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-slate-50 border-bottom border-slate-100">
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Prénom / Nom</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400">Email</th>
              <th className="p-5 text-[10px] font-black uppercase text-slate-400 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredClients.map((client: any) => (
              <tr key={client.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                <td className="p-5 font-bold text-slate-700">{client.first_name}</td>
                <td className="p-5 text-sm text-slate-500">{client.email}</td>
                <td className="p-5 text-right">
                   <button className="text-[10px] font-black uppercase text-sky-600 hover:underline">Voir les vols</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}