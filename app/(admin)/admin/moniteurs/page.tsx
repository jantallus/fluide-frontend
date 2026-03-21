"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function MonitorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Initialisation propre de l'état pour garantir que 'role' est envoyé
  const [newUser, setNewUser] = useState({ 
    first_name: '', 
    email: '', 
    password: '', 
    role: 'monitor', 
    is_active_monitor: true 
  });

  const loadUsers = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('/api/monitors-admin');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (err) {
      console.error("Erreur chargement utilisateurs:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadUsers(); }, []);

  const handleCreate = async () => {
    // Validation simple
    if (!newUser.first_name || !newUser.email || !newUser.password) {
      alert("Veuillez remplir tous les champs.");
      return;
    }

    const res = await apiFetch('/api/admin/users', {
      method: 'POST',
      body: JSON.stringify(newUser)
    });

    if (res.ok) {
      setShowModal(false);
      // Reset du formulaire
      setNewUser({ first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true });
      loadUsers();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la création");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${name} ?`)) return;

    const res = await apiFetch(`/api/admin/users/${id}`, {
      method: 'DELETE'
    });

    if (res.ok) {
      loadUsers();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de la suppression");
    }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-12">
        <div>
          <p className="text-orange-500 font-black uppercase text-xs tracking-widest mb-2">Gestion d'équipe</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            Équipe <span className="text-orange-500">Fluide</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowModal(true)} 
          className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform"
        >
          + Ajouter un membre
        </button>
      </header>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse uppercase">Chargement de l'équipe...</div>
        ) : (
          users.map(u => (
            <div key={u.id} className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 flex justify-between items-center group hover:border-orange-100 transition-all">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center text-xl border border-slate-100">
                  {u.role === 'admin' ? '🛡️' : u.role === 'permanent' ? '🔑' : '🏃'}
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase italic text-slate-800 leading-none mb-1">
                    {u.first_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight">{u.email}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-6">
                {/* AFFICHAGE DU DRAPEAU (Badge de rôle fixe) */}
                <div className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 ${
                  u.role === 'admin' 
                    ? 'border-rose-100 bg-rose-50 text-rose-500' 
                    : u.role === 'permanent'
                      ? 'border-sky-100 bg-sky-50 text-sky-500'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  {u.role === 'admin' ? 'Administrateur' : u.role === 'permanent' ? 'Permanent' : 'Moniteur Journée'}
                </div>

                {/* Bouton Supprimer - Apparaît au survol */}
                <button 
                  onClick={() => handleDelete(u.id, u.first_name)}
                  className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  title="Supprimer définitivement"
                >
                  <span className="text-xl">🗑️</span>
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALE DE CRÉATION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-6">Nouveau Membre</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prénom</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                  value={newUser.first_name}
                  onChange={e => setNewUser({...newUser, first_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email (Identifiant)</label>
                <input 
                  type="email" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Mot de passe</label>
                <input 
                  type="password" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Accès & Rôle</label>
                <select 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50" 
                  value={newUser.role}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="monitor">🏃 Moniteur Journée (Pas d'accès)</option>
                  <option value="permanent">🔑 Moniteur Permanent (Calendrier)</option>
                  <option value="admin">🛡️ Administrateur (Accès total)</option>
                </select>
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleCreate} 
                  className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-orange-600 transition-all"
                >
                  Créer le compte
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full text-slate-300 font-bold uppercase text-[10px] tracking-widest hover:text-slate-500 transition-colors"
                >
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}