"use client";
import React, { useState, useEffect } from 'react';
import { useMoniteursData } from '@/hooks/useMoniteursData';
import { MoniteurModal } from '@/components/moniteurs/MoniteurModal';

export default function MonitorsPage() {
  const { users, loading, loadUsers, handleDelete, copyIcalLink } = useMoniteursData();
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [userToEdit, setUserToEdit] = useState<any | null>(null);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  const openModal = (user?: any) => {
    setUserToEdit(user ?? null);
    setShowModal(true);
  };
  const handleClose = () => { setShowModal(false); setUserToEdit(null); };

  const visibleUsers = users.filter(u => currentUser?.role === 'admin' || u.id === currentUser?.id);

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
        ) : visibleUsers.map(u => (
          <div key={u.id} className="bg-white p-5 md:p-6 rounded-[30px] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-0 group hover:border-orange-100 transition-all">
            <div className="flex items-center gap-4 w-full md:w-auto">
              <div className="w-12 h-12 bg-slate-50 rounded-2xl flex shrink-0 items-center justify-center text-xl border border-slate-100">
                {u.role === 'admin' ? '🛡️' : u.role === 'permanent' ? '🔑' : '🏃'}
              </div>
              <div className="overflow-hidden">
                <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-none mb-1 truncate">{u.first_name}</h3>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tight truncate">{u.email}</p>
              </div>
            </div>

            <div className="flex items-center justify-between md:justify-end w-full md:w-auto gap-3 md:gap-6 pt-4 md:pt-0 mt-2 md:mt-0 border-t border-slate-50 md:border-t-0 flex-wrap">
              <div className={`px-3 md:px-4 py-2 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest border-2 text-center flex-1 md:flex-none ${u.role === 'admin' ? 'border-rose-100 bg-rose-50 text-rose-500' : u.role === 'permanent' ? 'border-sky-100 bg-sky-50 text-sky-500' : 'border-slate-100 bg-slate-50 text-slate-400'}`}>
                {u.role === 'admin' ? 'Administrateur' : u.role === 'permanent' ? 'Permanent' : 'Moniteur Journée'}
              </div>

              <button onClick={() => copyIcalLink(u.id)} className="bg-white border-2 border-slate-200 text-slate-500 px-3 py-2 rounded-xl font-black uppercase text-[9px] md:text-[10px] tracking-widest hover:border-indigo-500 hover:text-indigo-600 transition-all shadow-sm flex items-center justify-center gap-2 flex-1 md:flex-none whitespace-nowrap" title="Copier le flux iCal pour Google Calendar / iPhone">
                📅 Agenda
              </button>

              <div className="flex items-center gap-2 shrink-0">
                <button onClick={() => openModal(u)} className="p-2 md:p-3 text-slate-500 md:text-slate-300 bg-slate-100 md:bg-transparent hover:text-sky-500 hover:bg-sky-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Modifier ce prestataire">
                  <span className="text-lg md:text-xl">✏️</span>
                </button>
                {currentUser?.role === 'admin' && (
                  <button onClick={() => handleDelete(u.id, u.first_name)} className="p-2 md:p-3 text-slate-500 md:text-slate-300 bg-slate-100 md:bg-transparent hover:text-rose-500 hover:bg-rose-50 rounded-xl md:rounded-2xl transition-all opacity-100 md:opacity-0 md:group-hover:opacity-100" title="Supprimer définitivement">
                    <span className="text-lg md:text-xl">🗑️</span>
                  </button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {showModal && (
        <MoniteurModal
          userToEdit={userToEdit}
          currentUser={currentUser}
          onClose={handleClose}
          onSaved={loadUsers}
        />
      )}
    </div>
  );
}
