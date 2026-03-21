"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function MonitorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [newUser, setNewUser] = useState({ first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true });

  const loadUsers = async () => {
    const res = await apiFetch('/api/monitors-admin');
    if (res.ok) setUsers(await res.json());
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    const res = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });
    if (res.ok) {
      setShowModal(false);
      loadUsers();
    }
  };

  const updateRole = async (id: number, newRole: string) => {
    const res = await apiFetch(`/api/admin/users/${id}/role`, {
      method: 'PATCH',
      body: JSON.stringify({ role: newRole })
    });
    if (res.ok) loadUsers();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <h1 className="text-4xl font-black uppercase italic tracking-tighter">Équipe <span className="text-orange-500">Fluide</span></h1>
        <button onClick={() => setShowModal(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl">
          + Ajouter un membre
        </button>
      </header>

      <div className="grid gap-6">
        {users.map(u => (
          <div key={u.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center">
            <div>
              <h3 className="text-xl font-black uppercase italic">{u.first_name}</h3>
              <p className="text-xs text-slate-400 font-bold uppercase">{u.email}</p>
            </div>
            
            <div className="flex gap-2">
              {['admin', 'permanent', 'monitor'].map(r => (
                <button 
                  key={r}
                  onClick={() => updateRole(u.id, r)}
                  className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all ${
                    u.role === r ? 'bg-orange-500 text-white' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'
                  }`}
                >
                  {r === 'monitor' ? 'Journée' : r}
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-6">Nouveau Membre</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Prénom" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewUser({...newUser, first_name: e.target.value})} />
              <input type="email" placeholder="Email (pour le login)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewUser({...newUser, email: e.target.value})} />
              <input type="password" placeholder="Mot de passe" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewUser({...newUser, password: e.target.value})} />
              <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setNewUser({...newUser, role: e.target.value})}>
                <option value="monitor">Moniteur Journée (Pas d'accès)</option>
                <option value="permanent">Moniteur Permanent (Calendrier seul)</option>
                <option value="admin">Administrateur (Accès total)</option>
              </select>
              <button onClick={handleCreate} className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">Créer le compte</button>
              <button onClick={() => setShowModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}