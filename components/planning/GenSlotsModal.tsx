"use client";
import React, { useState } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import type { Monitor } from '@/lib/types';

interface Props {
  availablePlans: string[];
  monitors: Monitor[];
  loadAppointments: () => Promise<void>;
  onClose: () => void;
}

export default function GenSlotsModal({ availablePlans, monitors, loadAppointments, onClose }: Props) {
  const { toast, confirm } = useToast();
  const [genConfig, setGenConfig] = useState({
    startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0], plan_name: 'Standard', monitor_id: 'all',
  });
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  const activeMonitors = monitors.filter(m => m.is_active !== false);
  const inactiveMonitors = monitors.filter(m => m.is_active === false);
  const activeCount = genConfig.monitor_id === 'all' ? activeMonitors.length : (monitors.find(m => m.id === genConfig.monitor_id)?.is_active !== false ? 1 : 0);

  const sendGenerationRequest = async (force = false) => {
    try {
      const res = await apiFetch('/api/generate-slots', {
        method: 'POST',
        body: JSON.stringify({ ...genConfig, forceOverwrite: force }),
      });
      const data = await res.json();
      if (res.status === 409 && data.warning) {
        const confirmed = await confirm(data.message);
        if (confirmed) return sendGenerationRequest(true);
        else { setIsGenerating(false); return; }
      }
      if (res.ok) {
        if (data.count === 0 && data.debug) {
          const { monitorsFound, defsFound } = data.debug;
          if (defsFound === 0) toast.warning('0 créneau généré — aucune rotation configurée dans ce profil (Configuration → Modèles de Rotations)');
          else if (monitorsFound === 0) toast.warning('0 créneau généré — aucun pilote actif trouvé en base de données (vérifiez is_active_monitor et statut "Actif")');
          else toast.warning(`0 créneau généré — ${monitorsFound} pilote(s), ${defsFound} rotation(s) trouvé(s) mais filtrés par disponibilités`);
          onClose();
          await loadAppointments();
        } else {
          toast.success(`✅ ${data.count} créneaux générés avec succès !`);
          onClose();
          await loadAppointments();
        }
      } else {
        toast.error('Erreur : ' + (data.error || 'Erreur inconnue'));
      }
    } catch {
      toast.error('Erreur de connexion au serveur.');
    }
  };

  const sendDeleteRequest = async (force = false) => {
    try {
      const res = await apiFetch('/api/delete-slots', {
        method: 'POST',
        body: JSON.stringify({ startDate: genConfig.startDate, endDate: genConfig.endDate, monitor_id: genConfig.monitor_id, forceOverwrite: force }),
      });
      const data = await res.json();
      if (res.status === 409 && data.warning) {
        const confirmed = await confirm(data.message);
        if (confirmed) return sendDeleteRequest(true);
        else { setIsDeleting(false); return; }
      }
      if (res.ok) {
        toast.success(`🗑️ ${data.deleted || 0} créneau(x) supprimé(s).`);
        onClose();
        await loadAppointments();
      } else {
        toast.error('Erreur : ' + (data.error || 'Erreur inconnue'));
      }
    } catch {
      toast.error('Erreur de connexion au serveur.');
    }
  };

  const handleGenerate = async () => {
    if (!genConfig.startDate || !genConfig.endDate) { toast.warning('Veuillez sélectionner des dates.'); return; }
    setIsGenerating(true);
    await sendGenerationRequest(false);
    setIsGenerating(false);
  };

  const handleDelete = async () => {
    if (!genConfig.startDate || !genConfig.endDate) { toast.warning('Veuillez sélectionner des dates.'); return; }
    setIsDeleting(true);
    await sendDeleteRequest(false);
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
        <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
        <div className="space-y-4">
          <input
            type="date"
            className="w-full border-2 border-slate-100 rounded-2xl p-4"
            onChange={e => setGenConfig({ ...genConfig, startDate: e.target.value })}
          />
          <input
            type="date"
            className="w-full border-2 border-slate-100 rounded-2xl p-4"
            onChange={e => setGenConfig({ ...genConfig, endDate: e.target.value })}
          />

          <select
            className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700"
            value={genConfig.plan_name}
            onChange={e => setGenConfig({ ...genConfig, plan_name: e.target.value })}
          >
            <option value="" disabled>-- Choisir le Modèle --</option>
            {availablePlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
          </select>

          <div>
            <select
              className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700"
              value={genConfig.monitor_id}
              onChange={e => setGenConfig({ ...genConfig, monitor_id: e.target.value })}
            >
              <option value="all">👥 Tous les pilotes actifs</option>
              {activeMonitors.length > 0 && (
                <optgroup label="Pilotes actifs">
                  {activeMonitors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                </optgroup>
              )}
              {inactiveMonitors.length > 0 && (
                <optgroup label="Pilotes inactifs (aucun créneau généré)">
                  {inactiveMonitors.map(m => <option key={m.id} value={m.id} disabled style={{ color: '#94a3b8' }}>{m.title} — inactif</option>)}
                </optgroup>
              )}
            </select>
            {genConfig.startDate && genConfig.endDate && (
              <p className={`text-[11px] font-bold mt-2 ml-1 ${activeCount === 0 ? 'text-rose-500' : 'text-slate-400'}`}>
                {activeCount === 0
                  ? '⚠️ Aucun pilote actif — aucun créneau ne sera généré'
                  : `✓ ${activeCount} pilote${activeCount > 1 ? 's' : ''} actif${activeCount > 1 ? 's' : ''} pris en compte`}
              </p>
            )}
          </div>

          <button
            disabled={isGenerating}
            onClick={handleGenerate}
            className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isGenerating ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-105'}`}
          >
            {isGenerating ? '⏳ Génération en cours...' : '🚀 Lancer la génération'}
          </button>
          <button
            disabled={isDeleting}
            onClick={handleDelete}
            className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isDeleting ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600'}`}
          >
            {isDeleting ? '⏳ Suppression...' : '🗑️ Supprimer ces créneaux'}
          </button>
          <button onClick={onClose} className="w-full text-slate-300 font-bold uppercase text-[10px]">Fermer</button>
        </div>
      </div>
    </div>
  );
}
