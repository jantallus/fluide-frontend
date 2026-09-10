"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import type { Monitor } from '@/lib/types';

interface PilotStatus {
  id: string;
  name: string;
  available: boolean;
  hasRestrictions: boolean;
}

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
  const [availCheck, setAvailCheck] = useState<{ pilots: PilotStatus[] } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [pilotsToActivate, setPilotsToActivate] = useState<string[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  const activeMonitors = monitors.filter(m => m.is_active !== false);
  const inactiveMonitors = monitors.filter(m => m.is_active === false);

  const checkAvailability = useCallback(async (startDate: string, endDate: string) => {
    if (!startDate || !endDate) { setAvailCheck(null); return; }
    setIsChecking(true);
    try {
      const res = await apiFetch('/api/pilots/check-availability', {
        method: 'POST',
        body: JSON.stringify({ startDate, endDate }),
      });
      if (res.ok) setAvailCheck(await res.json());
    } catch { /* silent */ }
    finally { setIsChecking(false); }
  }, []);

  useEffect(() => {
    checkAvailability(genConfig.startDate, genConfig.endDate);
  }, [genConfig.startDate, genConfig.endDate, checkAvailability]);

  const unavailablePilots: PilotStatus[] = availCheck
    ? (genConfig.monitor_id === 'all'
        ? availCheck.pilots.filter(p => !p.available)
        : availCheck.pilots.filter(p => p.id === genConfig.monitor_id && !p.available))
    : [];

  const availableCount: number | null = availCheck
    ? (genConfig.monitor_id === 'all'
        ? availCheck.pilots.filter(p => p.available).length
        : availCheck.pilots.filter(p => p.id === genConfig.monitor_id && p.available).length)
    : null;

  const allUnavailable = availCheck !== null && availableCount === 0 && unavailablePilots.length > 0;
  const wizardPilots = allUnavailable ? availCheck!.pilots : unavailablePilots;

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
          if (defsFound === 0) toast.warning('0 créneau généré — aucune rotation configurée dans ce profil');
          else if (monitorsFound === 0) toast.warning('0 créneau généré — aucun pilote actif trouvé');
          else toast.warning(`0 créneau généré — ${monitorsFound} pilote(s), ${defsFound} rotation(s) mais filtrés par disponibilités`);
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

  const handleGenerate = async () => {
    if (!genConfig.startDate || !genConfig.endDate) { toast.warning('Veuillez sélectionner des dates.'); return; }
    if (unavailablePilots.length > 0) {
      setPilotsToActivate(unavailablePilots.map(p => p.id));
      setShowWizard(true);
      return;
    }
    setIsGenerating(true);
    await sendGenerationRequest(false);
    setIsGenerating(false);
  };

  const handleActivateAndGenerate = async () => {
    if (pilotsToActivate.length > 0) {
      setIsActivating(true);
      try {
        const res = await apiFetch('/api/pilots/bulk-add-availability', {
          method: 'POST',
          body: JSON.stringify({ pilotIds: pilotsToActivate, startDate: genConfig.startDate, endDate: genConfig.endDate }),
        });
        if (!res.ok) {
          const err = await res.json();
          toast.error('Erreur activation : ' + (err.error || 'Erreur inconnue'));
          setIsActivating(false);
          return;
        }
        toast.success(`✅ ${pilotsToActivate.length} pilote(s) ajouté(s) au planning`);
      } catch {
        toast.error('Erreur de connexion au serveur.');
        setIsActivating(false);
        return;
      }
      setIsActivating(false);
    }
    setShowWizard(false);
    setIsGenerating(true);
    await sendGenerationRequest(false);
    setIsGenerating(false);
  };

  const handleGenerateAnyway = async () => {
    setShowWizard(false);
    setIsGenerating(true);
    await sendGenerationRequest(false);
    setIsGenerating(false);
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

  const handleDelete = async () => {
    if (!genConfig.startDate || !genConfig.endDate) { toast.warning('Veuillez sélectionner des dates.'); return; }
    setIsDeleting(true);
    await sendDeleteRequest(false);
    setIsDeleting(false);
  };

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
        {showWizard ? (
          <div className="space-y-4">
            <h2 className="text-lg font-black uppercase italic">
              {allUnavailable ? 'Ouvrir des pilotes au planning ?' : 'Ajouter des pilotes au planning ?'}
            </h2>
            <p className="text-[11px] text-slate-400 ml-1">
              {allUnavailable
                ? 'Aucun pilote n\'est disponible sur cette période.'
                : `${unavailablePilots.length} pilote(s) ne couvrent pas cette période.`}
            </p>
            <div className="space-y-2 max-h-52 overflow-y-auto">
              {wizardPilots.map(p => (
                <label key={p.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                  <input
                    type="checkbox"
                    className="w-4 h-4 accent-orange-500 shrink-0"
                    checked={pilotsToActivate.includes(p.id)}
                    onChange={e => {
                      if (e.target.checked) setPilotsToActivate(prev => [...prev, p.id]);
                      else setPilotsToActivate(prev => prev.filter(id => id !== p.id));
                    }}
                  />
                  <span className="text-sm font-bold text-slate-700">{p.name}</span>
                </label>
              ))}
            </div>
            <button
              disabled={isActivating || isGenerating}
              onClick={handleActivateAndGenerate}
              className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isActivating || isGenerating ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-105'}`}
            >
              {isActivating ? '⏳ Activation...' : isGenerating ? '⏳ Génération...' : pilotsToActivate.length > 0 ? '🚀 Activer et générer' : '🚀 Générer'}
            </button>
            <button onClick={handleGenerateAnyway} className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">
              Ignorer et générer sans ces pilotes
            </button>
            <button onClick={() => setShowWizard(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
          </div>
        ) : (
          <>
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
                  <p className={`text-[11px] font-bold mt-2 ml-1 ${
                    isChecking ? 'text-slate-300' :
                    availableCount === 0 ? 'text-rose-500' :
                    unavailablePilots.length > 0 ? 'text-amber-500' : 'text-slate-400'
                  }`}>
                    {isChecking ? '⏳ Vérification des disponibilités...' :
                     availCheck === null ? '' :
                     availableCount === 0
                       ? '⚠️ Aucun pilote disponible sur cette période'
                       : unavailablePilots.length > 0
                         ? `⚠️ ${availableCount} disponible(s), ${unavailablePilots.length} hors période`
                         : `✓ ${availableCount} pilote${availableCount! > 1 ? 's' : ''} disponible${availableCount! > 1 ? 's' : ''} sur cette période`}
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
          </>
        )}
      </div>
    </div>
  );
}
