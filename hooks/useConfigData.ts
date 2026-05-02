"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import type { SlotDefinition, SettingsMap, GiftCardShopTemplate, FlightType, Setting, OpeningPeriod, Season } from '@/lib/types';
import { useToast } from '@/components/ui/ToastProvider';

export function useConfigData() {
  const { toast, confirm } = useToast();
  const [definitions, setDefinitions] = useState<SlotDefinition[]>([]);
  const [settings, setSettings] = useState<SettingsMap>({});
  const [loading, setLoading] = useState(true);
  const [seasons, setSeasons] = useState<{ id: string; name: string; start: string; end: string }[]>([]);
  const [templates, setTemplates] = useState<GiftCardShopTemplate[]>([]);
  const [flights, setFlights] = useState<FlightType[]>([]);

  const loadData = async () => {
    setLoading(true);
    try {
      const [defRes, setRes, tplRes, flightsRes] = await Promise.all([
        apiFetch('/api/slot-definitions'),
        apiFetch('/api/settings'),
        apiFetch('/api/gift-card-templates'),
        apiFetch('/api/flight-types'),
      ]);
      if (defRes.ok) setDefinitions(await defRes.json());
      if (tplRes.ok) setTemplates(await tplRes.json());
      if (flightsRes.ok) setFlights(await flightsRes.json());
      if (setRes.ok) {
        const s = await setRes.json();
        const obj = s.reduce((acc: SettingsMap, curr: Setting) => ({ ...acc, [curr.key]: curr.value }), {});
        setSettings(obj);
        if (obj.opening_periods) {
          try { setSeasons(JSON.parse(obj.opening_periods)); } catch { setSeasons([]); }
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  // ── Slot definitions ────────────────────────────────────────────────────────
  const deleteDef = async (id: number) => {
    if (!await confirm('Supprimer cette rotation ?')) return;
    await apiFetch(`/api/slot-definitions/${id}`, { method: 'DELETE' });
    loadData();
  };

  const renamePlan = async (oldName: string, newName: string, setActivePlan: (n: string) => void) => {
    if (oldName === 'Standard') return toast.warning('Le plan Standard ne peut pas être renommé.');
    if (!newName || newName === oldName) return;
    await apiFetch(`/api/plans/${oldName}`, { method: 'PUT', body: JSON.stringify({ newName }) });
    setActivePlan(newName);
    loadData();
  };

  const deletePlan = async (name: string, setActivePlan: (n: string) => void) => {
    if (name === 'Standard') return toast.warning('Le plan Standard ne peut pas être supprimé.');
    if (!await confirm(`Voulez-vous vraiment supprimer le plan "${name}" ?`)) return;
    await apiFetch(`/api/plans/${name}`, { method: 'DELETE' });
    setActivePlan('Standard');
    loadData();
  };

  // ── Seasons ─────────────────────────────────────────────────────────────────
  const saveSeasonsToDB = async (updated: Season[]) => {
    await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ key: 'opening_periods', value: JSON.stringify(updated) }) });
  };

  const handleAddSeason = () => {
    const updated = [...seasons, { id: Date.now().toString(), name: '', start: '', end: '' }];
    setSeasons(updated);
    saveSeasonsToDB(updated);
  };

  const handleSeasonChange = (id: string, field: string, value: string) => {
    setSeasons(seasons.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const handleDeleteSeason = async (id: string) => {
    if (!await confirm('Supprimer cette période ?')) return;
    const updated = seasons.filter(s => s.id !== id);
    setSeasons(updated);
    saveSeasonsToDB(updated);
  };

  // ── Settings ────────────────────────────────────────────────────────────────
  const saveEmailSetting = async (key: string, value: string) => {
    try {
      const res = await apiFetch('/api/settings', { method: 'POST', body: JSON.stringify({ key, value }) });
      if (res.ok) toast.success('Sauvegardé avec succès !');
      else toast.error('Erreur lors de la sauvegarde côté serveur.');
    } catch { toast.error('Erreur de connexion avec le serveur.'); }
  };

  // ── Templates ───────────────────────────────────────────────────────────────
  const deleteTemplate = async (id: number) => {
    if (!await confirm('Supprimer définitivement ce modèle de la boutique ?')) return;
    await apiFetch(`/api/gift-card-templates/${id}`, { method: 'DELETE' });
    loadData();
  };

  return {
    definitions, settings, setSettings, loading,
    seasons, setSeasons,
    templates, flights,
    loadData,
    deleteDef, renamePlan, deletePlan,
    saveSeasonsToDB, handleAddSeason, handleSeasonChange, handleDeleteSeason,
    saveEmailSetting, deleteTemplate,
  };
}
