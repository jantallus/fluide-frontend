"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function MoniteursPage() {
  const [moniteurs, setMoniteurs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newMonitor, setNewMonitor] = useState({ first_name: '', email: '', password: '', role: 'monitor' });

  const fetchMoniteurs = async () => {
    try {
      const res = await apiFetch('/api/monitors');
      if (res.ok) {
        const data = await res.json();
        setMoniteurs(data);
      }
    } catch (err) {
      console.error("Erreur chargement moniteurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMoniteurs(); }, []);

  const handleAddMonitor = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await apiFetch('/api/monitors', {
        method: 'POST',
        body: JSON.stringify(newMonitor)
      });
      if (res.ok) {
        setIsModalOpen(false);
        setNewMonitor({ first_name: '', email: '', password: '', role: 'monitor' });
        fetchMoniteurs();
      } else {
        const err = await res.json();
        alert(err.message || "Erreur lors de la création");
      }
    } catch (err) {
      alert("Erreur réseau");
    }
  };

  const changeRole = async (id: number, currentRole: string) => {
    const nextRole = currentRole === 'admin' ? 'monitor' : 'admin';
    if(!confirm(`Changer le rôle en ${nextRole.toUpperCase()} ?`)) return;
    
    try {
      const res = await apiFetch(`/api/monitors/${id}/role`, {
        method: 'PUT',
        body: JSON.stringify({ role: nextRole })
      });
      if (res.ok) fetchMoniteurs();
    } catch (err) {
      alert("Erreur changement rôle");
    }
  };

  const toggleStatus = async (id: number, currentStatus: string) => {
    const newStatus = currentStatus === 'Actif' ? 'Inactif' : 'Actif';
    try {
      const res = await apiFetch(`/api/monitors/${id}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) fetchMoniteurs();
    } catch (err) {
      alert("Erreur de mise à jour");
    }
  };

  const deleteMonitor = async (id: number, name: string) => {
    if (!confirm(`Supprimer définitivement ${name} ?`)) return;
    try {
      const res = await apiFetch(`/api/monitors/${id}`, { method: 'DELETE' });
      if (res.ok) fetchMoniteurs();
    } catch (err) {
      alert("Erreur lors de la suppression");
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-400 uppercase italic">Chargement de l'équipe...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase leading-none">Équipe & Staff</h1>
          <p className="text-slate-500 font-medium">Gestion des accès et de la disponibilité.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-sky-600 transition-all shadow-xl active:scale-95"
        >
          + Ajouter un membre
        </button>
      </div>

      <div className="grid gap-6">
        {moniteurs.map((m: any) => (
          <div key={m.id} className="bg-white p-8 rounded-[40px] border border-slate-200 flex flex-col md:flex-row justify-between items-center group hover:border-sky-400 transition-all shadow-sm">
            <div className="flex items-center gap-8">
              <div 
                onClick={() => changeRole(m.id, m.role)}
                className={`w-16 h-16 rounded-[24px] flex items-center justify-center text-xl font-black text-white cursor-pointer hover:scale-105 transition-transform ${m.role === 'admin' ? 'bg-slate-900' : 'bg-sky-500'}`}
                title="Cliquer pour changer le rôle"
              >
                {m.first_name?.[0] || '?'}
              </div>
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-black text-slate-900 uppercase italic text-2xl">{m.first_name}</h3>
                  <span className={`text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest ${m.role === 'admin' ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-500'}`}>
                    {m.role}
                  </span>
                </div>
                <p className="text-slate-400 font-bold text-sm">{m.email}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4 mt-6 md:mt-0">
              <button 
                onClick={() => toggleStatus(m.id, m.status)}
                className={`px-6 py-3 rounded-full font-black text-xs uppercase transition-all ${m.status === 'Actif' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' : 'bg-rose-50 text-rose-500 border border-rose-100'}`}
              >
                {m.status || 'Inactif'}
              </button>
              {m.role !== 'admin' && (
                <button onClick={() => deleteMonitor(m.id, m.first_name)} className="p-3 text-slate-300 hover:text-rose-500 transition-all">
                   🗑️
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* MODALE D'AJOUT */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <form onSubmit={handleAddMonitor} className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl space-y-4">
            <h2 className="text-2xl font-black uppercase italic mb-6">Nouveau Moniteur</h2>
            
            <input 
              type="text" placeholder="Prénom" required
              className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold"
              value={newMonitor.first_name}
              onChange={e => setNewMonitor({...newMonitor, first_name: e.target.value})}
            />
            
            <input 
              type="email" placeholder="Email" required
              className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold"
              value={newMonitor.email}
              onChange={e => setNewMonitor({...newMonitor, email: e.target.value})}
            />

            <input 
              type="password" placeholder="Mot de passe" required
              className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold"
              value={newMonitor.password}
              onChange={e => setNewMonitor({...newMonitor, password: e.target.value})}
            />

            <select 
              className="w-full bg-slate-50 border-none rounded-2xl p-4 font-bold"
              value={newMonitor.role}
              onChange={e => setNewMonitor({...newMonitor, role: e.target.value})}
            >
              <option value="monitor">Pilote (Monitor)</option>
              <option value="admin">Administrateur</option>
            </select>

            <div className="flex gap-4 pt-4">
              <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 font-black uppercase text-xs text-slate-400">Annuler</button>
              <button type="submit" className="flex-1 bg-sky-500 text-white py-4 rounded-2xl font-black uppercase text-xs shadow-lg">Créer le compte</button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}