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
    startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0], plan_name: 'Standard',
  });
  const [selectedPilotIds, setSelectedPilotIds] = useState<string[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [availCheck, setAvailCheck] = useState<{ pilots: PilotStatus[] } | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [showWizard, setShowWizard] = useState(false);
  const [pilotsToActivate, setPilotsToActivate] = useState<string[]>([]);
  const [pilotsToGenerate, setPilotsToGenerate] = useState<string[]>([]);
  const [blockedPilotIds, setBlockedPilotIds] = useState<string[]>([]);
  const [isActivating, setIsActivating] = useState(false);

  const activeMonitors = monitors.filter(m => m.is_active !== false);
  const inactiveMonitors = monitors.filter(m => m.is_active === false);

  // Initialise la sélection à tous les pilotes actifs au chargement
  useEffect(() => {
    if (monitors.length > 0 && selectedPilotIds.length === 0) {
      setSelectedPilotIds(activeMonitors.map(m => m.id));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [monitors]);

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

  // Disponibilité filtrée sur les pilotes sélectionnés
  const unavailablePilots: PilotStatus[] = availCheck
    ? availCheck.pilots.filter(p => !p.available && selectedPilotIds.includes(p.id))
    : [];
  const availableSelectedCount: number | null = availCheck
    ? availCheck.pilots.filter(p => p.available && selectedPilotIds.includes(p.id)).length
    : null;
  const hasUnavailable = unavailablePilots.length > 0;

  const availStatusFor = (id: string): PilotStatus | undefined =>
    availCheck?.pilots.find(p => p.id === id);

  const openWizard = () => {
    setPilotsToActivate(unavailablePilots.map(p => p.id));
    setPilotsToGenerate([...selectedPilotIds]);
    setShowWizard(true);
  };

  const sendGenerationRequest = async (force = false, generateForIds?: string[], blockedIds?: string[]) => {
    try {
      const ids = generateForIds ?? selectedPilotIds;
      const payload: Record<string, unknown> = {
        ...genConfig,
        forceOverwrite: force,
        monitor_ids: ids,
        blocked_pilot_ids: blockedIds ?? blockedPilotIds,
      };
      const res = await apiFetch('/api/generate-slots', {
        method: 'POST',
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 409 && data.warning) {
        const confirmed = await confirm(data.message);
        if (confirmed) return sendGenerationRequest(true, generateForIds, blockedIds);
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
    if (selectedPilotIds.length === 0) { toast.warning('Sélectionnez au moins un pilote.'); return; }
    if (hasUnavailable) { openWizard(); return; }
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
    if (pilotsToGenerate.length === 0) { onClose(); return; }
    setIsGenerating(true);
    await sendGenerationRequest(false, pilotsToGenerate);
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
        body: JSON.stringify({ startDate: genConfig.startDate, endDate: genConfig.endDate, monitor_ids: selectedPilotIds, forceOverwrite: force }),
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

  const toggleActivate = (id: string, checked: boolean) => {
    setPilotsToActivate(prev => checked ? [...prev, id] : prev.filter(x => x !== id));
    if (checked) setPilotsToGenerate(prev => prev.includes(id) ? prev : [...prev, id]);
  };

  const wizardGeneratePilots = [
    ...activeMonitors,
    ...unavailablePilots
      .filter(p => !activeMonitors.find(m => m.id === p.id))
      .map(p => ({ id: p.id, title: p.name, is_active: true as const })),
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">

        {showWizard ? (
          <div className="space-y-5">
            <h2 className="text-lg font-black uppercase italic leading-tight">
              {availableSelectedCount === 0 ? 'Ouvrir des pilotes au planning ?' : 'Ajouter des pilotes au planning ?'}
            </h2>

            {unavailablePilots.length > 0 && (
              <div>
                <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-1">Pilotes à activer sur cette période</p>
                <div className="space-y-1">
                  {unavailablePilots.map(p => (
                    <label key={p.id} className="flex items-center gap-3 p-3 bg-rose-50 border border-rose-100 rounded-2xl cursor-pointer hover:bg-rose-100 transition-colors">
                      <input type="checkbox" className="w-4 h-4 accent-rose-500 shrink-0"
                        checked={pilotsToActivate.includes(p.id)}
                        onChange={e => toggleActivate(p.id, e.target.checked)} />
                      <span className="text-sm font-bold text-slate-700">{p.name}</span>
                      <span className="text-[9px] text-rose-400 ml-auto">hors période</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div>
              <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest mb-2 ml-1">Générer des créneaux pour</p>
              <div className="space-y-1 max-h-44 overflow-y-auto pr-1">
                {wizardGeneratePilots.map(m => (
                  <label key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 transition-colors">
                    <input type="checkbox" className="w-4 h-4 accent-orange-500 shrink-0"
                      checked={pilotsToGenerate.includes(m.id)}
                      onChange={e => {
                        if (e.target.checked) setPilotsToGenerate(prev => [...prev, m.id]);
                        else setPilotsToGenerate(prev => prev.filter(id => id !== m.id));
                      }} />
                    <span className="text-sm font-bold text-slate-700">{m.title}</span>
                    {unavailablePilots.find(p => p.id === m.id) && pilotsToActivate.includes(m.id) && (
                      <span className="text-[9px] text-orange-400 ml-auto">sera activé</span>
                    )}
                  </label>
                ))}
                {inactiveMonitors.map(m => (
                  <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl opacity-40">
                    <input type="checkbox" className="w-4 h-4 shrink-0" disabled />
                    <span className="text-sm font-bold text-slate-400">{m.title}</span>
                    <span className="text-[9px] text-slate-400 ml-auto">inactif</span>
                  </div>
                ))}
              </div>
            </div>

            <button disabled={isActivating || isGenerating} onClick={handleActivateAndGenerate}
              className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isActivating || isGenerating ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-105'}`}>
              {isActivating ? '⏳ Activation...' : isGenerating ? '⏳ Génération...' : pilotsToActivate.length > 0 ? '🚀 Activer et générer' : '🚀 Générer'}
            </button>
            <button onClick={handleGenerateAnyway} className="w-full text-slate-400 text-[10px] font-bold uppercase tracking-widest hover:text-slate-600 transition-colors">
              Ignorer et générer sans modification
            </button>
            <button onClick={() => setShowWizard(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
          </div>

        ) : (
          <>
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4"
                onChange={e => setGenConfig({ ...genConfig, startDate: e.target.value })} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4"
                onChange={e => setGenConfig({ ...genConfig, endDate: e.target.value })} />

              <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700"
                value={genConfig.plan_name}
                onChange={e => setGenConfig({ ...genConfig, plan_name: e.target.value })}>
                <option value="" disabled>-- Choisir le Modèle --</option>
                {availablePlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
              </select>

              {/* Sélection des pilotes avec cases à cocher */}
              <div>
                <div className="flex items-center justify-between mb-2 px-1">
                  <p className="text-[9px] font-black uppercase text-slate-400 tracking-widest">Pilotes</p>
                  <div className="flex gap-3">
                    <button onClick={() => setSelectedPilotIds(activeMonitors.map(m => m.id))}
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase">Tous</button>
                    <button onClick={() => setSelectedPilotIds([])}
                      className="text-[9px] font-bold text-slate-400 hover:text-slate-600 uppercase">Aucun</button>
                  </div>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto pr-1">
                  {activeMonitors.map(m => {
                    const status = availStatusFor(m.id);
                    const isSelected = selectedPilotIds.includes(m.id);
                    const isUnavail = status && !status.available;
                    const isBlocked = blockedPilotIds.includes(m.id);
                    return (
                      <div key={m.id} className={`flex items-center gap-2 p-3 rounded-2xl transition-colors ${isSelected ? 'bg-slate-100' : 'bg-slate-50 opacity-50'}`}>
                        <label className="flex items-center gap-2 flex-1 cursor-pointer">
                          <input type="checkbox" className="w-4 h-4 accent-orange-500 shrink-0"
                            checked={isSelected}
                            onChange={e => {
                              if (e.target.checked) setSelectedPilotIds(prev => [...prev, m.id]);
                              else {
                                setSelectedPilotIds(prev => prev.filter(id => id !== m.id));
                                setBlockedPilotIds(prev => prev.filter(id => id !== m.id));
                              }
                            }} />
                          <span className="text-sm font-bold text-slate-700">{m.title}</span>
                        </label>
                        {genConfig.startDate && genConfig.endDate && !isChecking && isUnavail && (
                          <span className="text-[9px] font-bold text-amber-400">hors période</span>
                        )}
                        {isSelected && (
                          <button
                            onClick={() => setBlockedPilotIds(prev => isBlocked ? prev.filter(id => id !== m.id) : [...prev, m.id])}
                            className={`text-[9px] font-black px-2 py-1 rounded-lg transition-colors whitespace-nowrap ${isBlocked ? 'bg-slate-700 text-white' : 'bg-slate-200 text-slate-400 hover:bg-slate-300'}`}
                            title={isBlocked ? 'Créneaux bloqués — cliquer pour générer en disponible' : 'Cliquer pour générer en bloqué'}
                          >
                            {isBlocked ? '🔒 Bloqué' : '🔓'}
                          </button>
                        )}
                      </div>
                    );
                  })}
                  {inactiveMonitors.map(m => (
                    <div key={m.id} className="flex items-center gap-3 p-3 bg-slate-50 rounded-2xl opacity-30">
                      <input type="checkbox" className="w-4 h-4 shrink-0" disabled />
                      <span className="text-sm font-bold text-slate-400 flex-1">{m.title}</span>
                      <span className="text-[9px] text-slate-400">inactif</span>
                    </div>
                  ))}
                </div>

                {genConfig.startDate && genConfig.endDate && !isChecking && unavailablePilots.length > 0 && (
                  <div className="flex items-center justify-between gap-2 mt-2 ml-1">
                    <p className="text-[11px] font-bold text-amber-500">
                      ⚠️ {unavailablePilots.length} pilote{unavailablePilots.length > 1 ? 's' : ''} hors période
                    </p>
                    <button onClick={openWizard} className="text-[10px] font-black uppercase text-orange-500 hover:text-orange-700 whitespace-nowrap transition-colors">
                      Ajouter →
                    </button>
                  </div>
                )}
              </div>

              <button disabled={isGenerating} onClick={handleGenerate}
                className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isGenerating ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-105'}`}>
                {isGenerating ? '⏳ Génération en cours...' : '🚀 Lancer la génération'}
              </button>
              <button disabled={isDeleting} onClick={handleDelete}
                className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isDeleting ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-rose-500 text-white hover:bg-rose-600'}`}>
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
