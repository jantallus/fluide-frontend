"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

interface Props {
  rotationToEdit: any | null;
  activePlan: string;
  onClose: () => void;
  onSaved: () => void;
}

export function RotationModal({ rotationToEdit, activePlan, onClose, onSaved }: Props) {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [rotation, setRotation] = useState({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: activePlan });

  useEffect(() => {
    if (rotationToEdit) {
      setRotation({
        start_time: rotationToEdit.start_time.slice(0, 5),
        duration_minutes: rotationToEdit.duration_minutes,
        label: rotationToEdit.label,
        plan_name: rotationToEdit.plan_name || 'Standard',
      });
    } else {
      setRotation({ start_time: '', duration_minutes: 60, label: 'VOL', plan_name: activePlan });
    }
  }, [rotationToEdit, activePlan]);

  const handleSave = async () => {
    if (!rotation.start_time || rotation.duration_minutes <= 0) return;
    setIsSaving(true);
    try {
      const url = rotationToEdit ? `/api/slot-definitions/${rotationToEdit.id}` : '/api/slot-definitions';
      const method = rotationToEdit ? 'PUT' : 'POST';
      const res = await apiFetch(url, { method, body: JSON.stringify({ ...rotation, plan_name: activePlan }) });
      if (res.ok) { onSaved(); onClose(); }
      else toast.error("Erreur lors de l'enregistrement");
    } catch { toast.error('Erreur de connexion'); } finally { setIsSaving(false); }
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-xl font-black uppercase italic mb-6">{rotationToEdit ? 'Modifier Rotation' : 'Nouvelle Rotation'}</h2>
        <div className="space-y-4">
          <input type="time" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={rotation.start_time} onChange={e => setRotation({ ...rotation, start_time: e.target.value })} />
          <input type="number" placeholder="Durée (min)" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={rotation.duration_minutes || ''} onChange={e => setRotation({ ...rotation, duration_minutes: parseInt(e.target.value) || 0 })} />
          <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={rotation.label} onChange={e => setRotation({ ...rotation, label: e.target.value })}>
            <option value="VOL">VOL</option>
            <option value="PAUSE">PAUSE</option>
          </select>
          <button onClick={handleSave} disabled={isSaving} className="w-full bg-indigo-600 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">
            {isSaving ? '⏳' : 'Enregistrer'}
          </button>
          <button onClick={onClose} className="w-full text-slate-400 font-bold uppercase text-[10px]">Annuler</button>
        </div>
      </div>
    </div>
  );
}
