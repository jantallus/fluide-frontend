"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function MonitorsPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editingUserId, setEditingUserId] = useState<number | null>(null);
  
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

  const openModal = (user?: any) => {
    if (user) {
      setEditingUserId(user.id);
      
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
        available_start_date: '',
        available_end_date: '',
        daily_start_time: '',
        daily_end_time: ''
      });
    } else {
      setEditingUserId(null);
      setAvailabilities([]);
      setNewUser({ 
        first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true, 
        available_start_date: '', available_end_date: '', daily_start_time: '', daily_end_time: '' 
      });
    }
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!newUser.first_name || !newUser.email) {
      alert("Veuillez remplir le nom et l'email.");
      return;
    }
    
    if (!editingUserId && !newUser.password) {
      alert("Le mot de passe est obligatoire pour un nouveau compte.");
      return;
    }

    const url = editingUserId ? `/api/users/${editingUserId}` : '/api/users';
    const method = editingUserId ? 'PATCH' : 'POST';

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

  // 🎯 NOUVEAU : Fonction pour copier le lien secret iCal
  const copyIcalLink = (userId: number) => {
    // ⚠️ Assurez-vous que c'est la bonne URL de votre backend sur Railway
    const backendUrl = "https://fluide-production.up.railway.app"; 
    const fullLink = `${backendUrl}/api/ical/${userId}`;
    
    navigator.clipboard.writeText(fullLink);
    alert("Lien d'agenda copié ! 📋\n\nIl ne vous reste plus qu'à l'ajouter dans Google Calendar ou Apple Calendar (S'abonner à un calendrier via URL).");
  };

  return (
    <div className="p-4 md:p-8 bg-slate-50 min-h-screen">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8 md:mb-12">
        <div>
          <p className="text-orange-500 font-black uppercase text-xs tracking-widest mb-1 md:mb-2">Gestion d'équipe</p>
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter text-slate-900">
            {currentUser?.role === 'admin' ? 'Équipe ' : 'Mon '}<span className="text-orange-500">Profil</span>
          </h1>
        </div>
        {currentUser?.role === 'admin' && (
          <button onClick={() => openModal()} className="w-full md:w-auto bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-xl hover:scale-105 transition-transform text-sm md:text-base">
            + Ajouter un prestataire
          </button>
        )}
      </header>

      <div className="grid gap-4 md:gap-6">
        {loading ? (
          <div className="text-center py-12 font-bold text-slate-400 animate-pulse uppercase">Chargement...</div>
        ) : (
          users.filter(u => currentUser?.role === 'admin' || u.id === currentUser?.id).map(u => (
            <div key={u.id} className="bg-white p-5 md:p-6 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 group hover:border-orange-100 transition-all">
              
              <div className="flex items-center gap-4 w-full md:w-auto">
                <div className="w-12 h-12 bg-slate-50 rounded-2xl flex shrink-0 items-center justify-center text-xl border border-slate-100">
                  {u.role === 'admin' ? '🛡️' : u.role === 'permanent' ? '🔑' : '🏃'}
                </div>
                <div className="overflow-hidden">
                  <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-none mb-1 truncate">
                    {u.first_name}
                  </h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{u.email}</p>
                </div>
              </div>
              
              <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3 md:gap-6 pt-4 md:pt-0 mt-2 md:mt-0 border-t border-slate-50 md:border-t-0 flex-wrap">
                <div className={`px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 text-center flex-1 md:flex-none ${
                  u.role === 'admin' 
                    ? 'border-rose-100 bg-rose-50 text-rose-500' 
                    : u.role === 'permanent'
                      ? 'border-sky-100 bg-sky-50 text-sky-500'
                      : 'border-slate-100 bg-slate-50 text-slate-400'
                }`}>
                  {u.role === 'admin' ? 'Administrateur' : u.role === 'permanent' ? 'Permanent' : 'Moniteur Journée'}
                </div>
                
                {/* 🎯 NOUVEAU : BOUTON AGENDA */}
                <button
                  onClick={() => copyIcalLink(u.id)}
                  className="bg-white border-2 border-slate-200 text-slate-500 px-3 py-2 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none whitespace-nowrap"
                  title="Copier le flux iCal pour Google Calendar / iPhone"
                >
                  📅 Agenda
                </button>

                <div className="flex items-center gap-2 shrink-0">
                  <button 
                    onClick={() => openModal(u)}
                    className="p-2 md:p-3 text-slate-500 md:text-slate-300 bg-slate-100 md:bg-transparent hover:text-sky-500 hover:bg-sky-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                    title="Modifier ce prestataire"
                  >
                    <span className="text-lg md:text-xl">✏️</span>
                  </button>

                  {currentUser?.role === 'admin' && (
                    <button 
                      onClick={() => handleDelete(u.id, u.first_name)}
                      className="p-2 md:p-3 text-slate-500 md:text-slate-300 bg-slate-100 md:bg-transparent hover:text-rose-500 hover:bg-rose-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100"
                      title="Supprimer définitivement"
                    >
                      <span className="text-lg md:text-xl">🗑️</span>
                    </button>
                  )}
                </div>
              </div>

            </div>
          ))
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
            <h2 className="text-xl md:text-2xl font-black uppercase italic mb-6">
              {editingUserId ? "Modifier le Prestataire" : "Nouveau Prestataire"}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prénom</label>
                <input 
                  type="text" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.first_name}
                  onChange={e => setNewUser({...newUser, first_name: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email (Identifiant)</label>
                <input 
                  type="email" 
                  className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.email}
                  onChange={e => setNewUser({...newUser, email: e.target.value})} 
                />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex justify-between flex-wrap">
                  Mot de passe 
                  {editingUserId && <span className="normal-case">(Laisser vide pour garder l'actuel)</span>}
                </label>
                <input 
                  type="password" 
                  placeholder={editingUserId ? "••••••••" : ""}
                  className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" 
                  value={newUser.password}
                  onChange={e => setNewUser({...newUser, password: e.target.value})} 
                />
              </div>
              
              <div className="bg-sky-50 p-4 rounded-3xl border border-sky-100 space-y-4">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-2">
                  <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">📅 Périodes d'activité</p>
                  <button 
                    onClick={() => setAvailabilities([...availabilities, { start_date: '', end_date: '', daily_start_time: '09:00', daily_end_time: '18:00' }])}
                    className="w-full sm:w-auto bg-sky-500 text-white text-[9px] font-black px-3 py-2 sm:py-1 rounded-lg shadow-sm hover:bg-sky-600 uppercase"
                  >
                    + Ajouter
                  </button>
                </div>

                {availabilities.map((a, idx) => (
                  <div key={idx} className="bg-white p-3 rounded-2xl border border-sky-200 relative group/item">
                    <div className="flex flex-col sm:flex-row gap-3 mb-2">
                      <div className="w-full">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Début</label>
                        <input type="date" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.start_date} onChange={e => { const newA = [...availabilities]; newA[idx].start_date = e.target.value; setAvailabilities(newA); }} />
                      </div>
                      <div className="w-full">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Fin</label>
                        <input type="date" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.end_date} onChange={e => { const newA = [...availabilities]; newA[idx].end_date = e.target.value; setAvailabilities(newA); }} />
                      </div>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                      <div className="w-full">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Heure Début</label>
                        <input type="time" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_start_time} onChange={e => { const newA = [...availabilities]; newA[idx].daily_start_time = e.target.value; setAvailabilities(newA); }} />
                      </div>
                      <div className="w-full">
                        <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Heure Fin</label>
                        <input type="time" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_end_time} onChange={e => { const newA = [...availabilities]; newA[idx].daily_end_time = e.target.value; setAvailabilities(newA); }} />
                      </div>
                    </div>
                    <button 
                      onClick={() => setAvailabilities(availabilities.filter((_, i) => i !== idx))}
                      className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 sm:w-5 sm:h-5 rounded-full text-[10px] flex items-center justify-center shadow-md sm:opacity-0 group-hover/item:opacity-100 transition-opacity"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                
                {availabilities.length === 0 && <p className="text-[10px] text-sky-400 italic text-center py-2">Aucune restriction (dispo 24h/24)</p>}
              </div>

              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Accès & Rôle</label>
                <select 
                  className={`w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold outline-none text-sm md:text-base ${currentUser?.role !== 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-orange-300'}`}
                  value={newUser.role}
                  disabled={currentUser?.role !== 'admin'}
                  onChange={e => setNewUser({...newUser, role: e.target.value})}
                >
                  <option value="monitor">🏃 Moniteur Journée (Pas d'accès logiciel)</option>
                  <option value="permanent">🔑 Moniteur Permanent (Accès calendrier)</option>
                  <option value="admin">🛡️ Administrateur (Accès total)</option>
                </select>
                {currentUser?.role !== 'admin' && <p className="text-[9px] text-slate-400 mt-1 ml-4 italic">Seul un administrateur peut modifier ce champ.</p>}
              </div>
              
              <div className="pt-4 space-y-3">
                <button 
                  onClick={handleSave} 
                  className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-orange-600 transition-all text-sm md:text-base"
                >
                  {editingUserId ? "Enregistrer les modifications" : "Créer le compte"}
                </button>
                <button 
                  onClick={() => setShowModal(false)} 
                  className="w-full text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-slate-600 transition-colors pb-2 md:pb-0"
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