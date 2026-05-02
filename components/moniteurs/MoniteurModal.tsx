"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import type { User, CurrentUser, Availability } from '@/lib/types';

const EMPTY_USER = {
  first_name: '', email: '', password: '', role: 'monitor', is_active_monitor: true,
  available_start_date: '', available_end_date: '', daily_start_time: '', daily_end_time: '',
};

interface Props {
  userToEdit: User | null;
  currentUser: CurrentUser | null;
  onClose: () => void;
  onSaved: () => void;
}

export function MoniteurModal({ userToEdit, currentUser, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [newUser, setNewUser] = useState({ ...EMPTY_USER });
  const [availabilities, setAvailabilities] = useState<Availability[]>([]);

  useEffect(() => {
    if (userToEdit) {
      setNewUser({
        first_name: userToEdit.first_name,
        email: userToEdit.email,
        password: '',
        role: userToEdit.role,
        is_active_monitor: userToEdit.is_active_monitor ?? true,
        available_start_date: '', available_end_date: '', daily_start_time: '', daily_end_time: '',
      });
      apiFetch(`/api/users/${userToEdit.id}/availabilities`)
        .then(res => res.ok ? res.json() : [])
        .then(data => setAvailabilities(data))
        .catch(() => setAvailabilities([]));
    } else {
      setNewUser({ ...EMPTY_USER });
      setAvailabilities([]);
    }
  }, [userToEdit]);

  const handleSave = async () => {
    if (!newUser.first_name || !newUser.email) {
      toast.warning("Veuillez remplir le nom et l'email.");
      return;
    }
    if (!userToEdit && !newUser.password) {
      toast.warning("Le mot de passe est obligatoire pour un nouveau compte.");
      return;
    }

    const url = userToEdit ? `/api/users/${userToEdit.id}` : '/api/users';
    const method = userToEdit ? 'PATCH' : 'POST';
    const payload: Record<string, unknown> = { ...newUser, status: 'Actif' };
    if (userToEdit && !payload.password) delete payload.password;

    const res = await apiFetch(url, { method, body: JSON.stringify(payload) });
    if (res.ok) {
      const userData = await res.json();
      const userId = userToEdit?.id || userData.id;
      await apiFetch(`/api/users/${userId}/availabilities`, {
        method: 'PUT',
        body: JSON.stringify({ availabilities }),
      });
      onSaved();
      onClose();
    } else {
      const err = await res.json();
      toast.error(err.error || "Erreur lors de l'enregistrement");
    }
  };

  const updateAvailability = (idx: number, field: string, value: string) => {
    setAvailabilities(prev => prev.map((a, i) => i === idx ? { ...a, [field]: value } : a));
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl md:text-2xl font-black uppercase italic mb-6">
          {userToEdit ? "Modifier le Prestataire" : "Nouveau Prestataire"}
        </h2>
        <div className="space-y-4">
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prénom</label>
            <input type="text" className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" value={newUser.first_name} onChange={e => setNewUser({ ...newUser, first_name: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email (Identifiant)</label>
            <input type="email" className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4 flex justify-between flex-wrap">
              Mot de passe
              {userToEdit && <span className="normal-case">(Laisser vide pour garder l'actuel)</span>}
            </label>
            <input type="password" placeholder={userToEdit ? "••••••••" : ""} className="w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold bg-slate-50 focus:border-orange-300 outline-none" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} />
          </div>

          <div className="bg-sky-50 p-4 rounded-3xl border border-sky-100 space-y-4">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center px-2 gap-2">
              <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest">📅 Périodes d'activité</p>
              <button onClick={() => setAvailabilities(prev => [...prev, { start_date: '', end_date: '', daily_start_time: '09:00', daily_end_time: '18:00' }])} className="w-full sm:w-auto bg-sky-500 text-white text-[9px] font-black px-3 py-2 sm:py-1 rounded-lg shadow-sm hover:bg-sky-600 uppercase">
                + Ajouter
              </button>
            </div>

            {availabilities.map((a, idx) => (
              <div key={idx} className="bg-white p-3 rounded-2xl border border-sky-200 relative group/item">
                <div className="flex flex-col sm:flex-row gap-3 mb-2">
                  <div className="w-full">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Début</label>
                    <input type="date" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.start_date} onChange={e => updateAvailability(idx, 'start_date', e.target.value)} />
                  </div>
                  <div className="w-full">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Fin</label>
                    <input type="date" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.end_date} onChange={e => updateAvailability(idx, 'end_date', e.target.value)} />
                  </div>
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <div className="w-full">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Heure Début</label>
                    <input type="time" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_start_time} onChange={e => updateAvailability(idx, 'daily_start_time', e.target.value)} />
                  </div>
                  <div className="w-full">
                    <label className="text-[8px] font-black uppercase text-slate-400 ml-1">Heure Fin</label>
                    <input type="time" className="w-full border border-slate-100 rounded-lg p-2 text-[10px] font-bold" value={a.daily_end_time} onChange={e => updateAvailability(idx, 'daily_end_time', e.target.value)} />
                  </div>
                </div>
                <button onClick={() => setAvailabilities(prev => prev.filter((_, i) => i !== idx))} className="absolute -top-2 -right-2 bg-rose-500 text-white w-6 h-6 sm:w-5 sm:h-5 rounded-full text-[10px] flex items-center justify-center shadow-md sm:opacity-0 group-hover/item:opacity-100 transition-opacity">✕</button>
              </div>
            ))}

            {availabilities.length === 0 && <p className="text-[10px] text-sky-400 italic text-center py-2">Aucune restriction (dispo 24h/24)</p>}
          </div>

          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Accès & Rôle</label>
            <select className={`w-full border-2 border-slate-100 rounded-2xl p-3 md:p-4 font-bold outline-none text-sm md:text-base ${currentUser?.role !== 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-50 focus:border-orange-300'}`} value={newUser.role} disabled={currentUser?.role !== 'admin'} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
              <option value="monitor">🏃 Moniteur Journée (Pas d'accès logiciel)</option>
              <option value="permanent">🔑 Moniteur Permanent (Accès calendrier)</option>
              <option value="admin">🛡️ Administrateur (Accès total)</option>
            </select>
            {currentUser?.role !== 'admin' && <p className="text-[9px] text-slate-400 mt-1 ml-4 italic">Seul un administrateur peut modifier ce champ.</p>}
          </div>

          <div className="pt-4 space-y-3">
            <button onClick={handleSave} className="w-full bg-orange-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-orange-600 transition-all text-sm md:text-base">
              {userToEdit ? "Enregistrer les modifications" : "Créer le compte"}
            </button>
            <button onClick={onClose} className="w-full text-slate-400 font-bold uppercase text-[10px] md:text-xs tracking-widest hover:text-slate-600 transition-colors pb-2 md:pb-0">Annuler</button>
          </div>
        </div>
      </div>
    </div>
  );
}
