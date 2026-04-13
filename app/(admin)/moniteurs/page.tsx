"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function MonitorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null); // 🎯 NOUVEAU
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  const [newUser, setNewUser] = useState({ 
    first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true,
    available_start_date: '', available_end_date: '', daily_start_time: '', daily_end_time: ''
  });

  const [availabilities, setAvailabilities] = useState<any[]>([]);

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

  // 🎯 NOUVEAU : Fonction unique pour Ouvrir la modale (AVEC HORAIRES)
  const openModal = (user?: any) => {
    if (user) {
      setEditingUserId(user.id);
      
      // 🎯 NOUVEAU : On s'assure de bien charger les périodes si on modifie un membre
      apiFetch(`/api/users/${user.id}/availabilities`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAvailabilities(data))
        .catch(() => setAvailabilities([]));

      setNewUser({
        first_name: user.first_name, 
        email: user.email, 
        password: '', 
        role: user.role, 
        is_active_monitor: user.is_active_monitor ?? true,
        // Les champs suivants ne servent plus directement si on utilise le tableau multi-périodes,
        // mais on les garde pour éviter des erreurs avec l'ancien code.
        available_start_date: '',
        available_end_date: '',
        daily_start_time: '',
        daily_end_time: ''
      });
    } else {
      setEditingUserId(null);
      setAvailabilities([]); // 🎯 On vide la liste des périodes pour un nouveau moniteur
      setNewUser({ 
        first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true, 
        available_start_date: '', available_end_date: '', daily_start_time: '', daily_end_time: '' 
      });
    }
    setShowModal(true);
  };

  // 🎯 NOUVEAU : Sauvegarder (Création OU Modification)
  const handleSave = async () => {
    if (!newUser.first_name || !newUser.email) {
      alert("Veuillez remplir le nom et l'email.");
      return;
    }
    
    // Le mot de passe est obligatoire uniquement si c'est un nouveau compte
    if (!editingUserId && !newUser.password) {
      alert("Le mot de passe est obligatoire pour un nouveau compte.");
      return;
    }

    const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PATCH' : 'POST';

    // On prépare les données (on ne renvoie pas le mot de passe s'il est vide en modification)
    const payload: any = { ...newUser, status: 'Actif' };
    if (editingUserId && !payload.password) {
      delete payload.password;
    }

    const res = await apiFetch(url, {
      method: method,
      body: JSON.stringify(payload)
    });

    if (res.ok) {
      const userData = await res.json();
      const userId = editingUserId || userData.id;
      
      await apiFetch(`/api/users/${userId}/availabilities`, {
        method: 'PUT',
        body: JSON.stringify({ availabilities })
      });

      setShowModal(false);
      loadUsers();
    } else {
      const err = await res.json();
      alert(err.error || "Erreur lors de l'enregistrement");
    }
  };

  const handleDelete = async (id: number, name: string) => {
    if (!confirm(`Supprimer définitivement le compte de ${name} ?`)) return;

      const res = await apiFetch(`/api/users/${id}`, {
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
            {currentUser?.role === 'admin' ? 'Équipe ' : 'Mon '}<span className="text-orange-500">Profil</span>
          </h1>
        </div>
        {currentUser?.role === 'admin' && (
          <button onClick={() => openModal()} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform">
            + Ajouter un prestataire
          </button>
        )}
      </header>

      <div className="grid gap-6">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse uppercase">Chargement...</div>
        ) : (
          users.filter(u => currentUser?.role === 'admin' || u.id === currentUser?.id).map(u => (
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
                {/* 🎯 NOUVEAU : Bouton Modifier */}
                <button 
                  onClick={() => openModal(u)}
                  className="p-3 text-slate-300 hover:text-sky-500 hover:bg-sky-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                  title="Modifier ce prestataire"
                >
                  <span className="text-xl">✏️</span>
                </button>

                {/* 🛡️ NOUVEAU : Seul l'admin peut voir le bouton Supprimer */}
                {currentUser?.role === 'admin' && (
                  <button 
                    onClick={() => handleDelete(u.id, u.first_name)}
                    className="p-3 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-2xl transition-all opacity-0 group-hover:opacity-100"
                    title="Supprimer définitivement"
                  >
                    <span className="text-xl">🗑️</span>
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* MODALE DE CRÉATION */}
      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          {/* 🎯 NOUVEAU : max-h-[95vh] et overflow-y-auto ajoutent le scrolling vertical ! */}
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-2xl font-black uppercase italic mb-6">
              {editingUserId ? "Modifier le Prestataire" : "Nouveau Prestataire"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prénom</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.first_name}
                  onChange={e => setNewUser({...newUser, first_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email (Identifiant)</label>
                <input 
                  type="email" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex justify-between">
                  Mot de passe 
                  {editingUserId && <span className="normal-case">(Laisser vide pour ne pas changer)</span>}
                </label>
                <input 
                  type="password" 
                  placeholder={editingUserId ? "••••••••" : ""}
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                />
              </div>
              
              {/* --- 🎯 NOUVEAU : BLOC BLEU DES DISPONIBILITÉS --- */}
              <div className="bg-sky-50 p-4 rounded-3xl border border-sky-100 space-y-4">
                <div className="flex justify-between items-center px-2">
                  <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">📅 Périodes d'activité</p>
                  <button 
                    onClick={() => setAvailabilities([...availabilities, { start_date: '', end_date: '', daily_start_time: '09:00', daily_end_time: '18:00' }])}
                    className="bg-sky-500 text-white text-[9px] font-black px-3 py-1 rounded-lg shadow-sm hover:bg-sky-600 uppercase"
                  >
                    + Ajouter une période
                  </button>
                </div>

                {availabilities.map((a, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-sky-200 relative group/item">
                    <div className="grid grid-cols-2 gap-3 mb-2">
                      <input type="date" className="border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.start_date} onChange={e => { const newA = [...availabilities]; newA[idx].start_date = e.target.value; setAvailabilities(newA); }} />
                      <input type="date" className="border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.end_date} onChange={e => { const newA = [...availabilities]; newA[idx].end_date = e.target.value; setAvailabilities(newA); }} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <input type="time" className="border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_start_time} onChange={e => { const newA = [...availabilities]; newA[idx].daily_start_time = e.target.value; setAvailabilities(newA); }} />
                      <input type="time" className="border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_end_time} onChange={e => { const newA = [...availabilities]; newA[idx].daily_end_time = e.target.value; setAvailabilities(newA); }} />
                    </div>
                    <button 
                      onClick={() => setAvailabilities(availabilities.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white w-5 h-5 rounded-full text-[10px] flex items-center justify-center shadow-md opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {availabilities.length === 0 && <p className="text-[10px] text-sky-400 italic text-center py-2 italic">Aucune restriction (dispo 24h/24 par défaut)</p>}
              </div>

              {/* --- 🎯 ACCÈS & RÔLE (Vérrouillé si on n'est pas Admin) --- */}
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Accès & Rôle</label>
                <select 
                  className={`w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none ${currentUser?.role !== 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-orange-300'}`}
                  value={newUser.role}
                  disabled={currentUser?.role !== 'admin'}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="monitor">🏃 Moniteur Journée (Pas d'accès au logiciel)</option>
                  <option value="permanent">🔑 Moniteur Permanent (Accès calendrier)</option>
                  <option value="admin">🛡️ Administrateur (Accès total)</option>
                </select>
                {currentUser?.role !== 'admin' && <p className="text-[9px] text-slate-400 mt-1 ml-4 italic">Seul un administrateur peut modifier les droits d'accès.</p>}
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleSave} 
                  className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-orange-600 transition-all"
                >
                  {editingUserId ? "Enregistrer les modifications" : "Créer le compte"}
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full text-slate-400 font-bold uppercase text-[10px] tracking-widest hover:text-slate-600 transition-colors"
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