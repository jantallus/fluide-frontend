"use client";
import { useState, useEffect, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

export function usePlanningData(getDateRange: () => { start: string; end: string }) {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [openingPeriods, setOpeningPeriods] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [availablePlans, setAvailablePlans] = useState<string[]>(['Standard']);
  const [timeBounds, setTimeBounds] = useState({ min: '08:00:00', max: '20:00:00' });
  const [isGoogleSyncEnabled, setIsGoogleSyncEnabled] = useState(false);

  const loadAppointments = useCallback(async () => {
    const { start, end } = getDateRange();
    const url = start && end ? `/api/slots?start=${start}&end=${end}` : '/api/slots';
    try {
      const res = await apiFetch(url);
      if (!res.ok) return;
      const appts = await res.json();
      setAppointments(appts);
      if (appts.length > 0) {
        let minHour = 24; let maxHour = 0;
        appts.forEach((a: any) => {
          const s = new Date(a.start_time).getHours();
          const e = new Date(a.end_time);
          const eH = e.getHours() + (e.getMinutes() > 0 ? 1 : 0);
          if (s < minHour) minHour = s;
          if (eH > maxHour) maxHour = eH;
        });
        setTimeBounds({
          min: `${String(Math.max(0, minHour)).padStart(2, '0')}:00:00`,
          max: `${String(Math.min(24, maxHour)).padStart(2, '0')}:00:00`,
        });
      }
    } catch (e) { console.error('Erreur chargement créneaux:', e); }
  }, [getDateRange]);

  const loadData = useCallback(async () => {
    try {
      const [monRes, flightRes, settingsRes, defsRes] = await Promise.all([
        apiFetch('/api/monitors-admin'),
        apiFetch('/api/flight-types'),
        apiFetch('/api/settings'),
        apiFetch('/api/slot-definitions'),
      ]);

      if (defsRes.ok) {
        const defs = await defsRes.json();
        setSlotDefs(defs);
        const plans = Array.from(new Set(defs.map((d: any) => d.plan_name || 'Standard'))) as string[];
        setAvailablePlans(plans.length > 0 ? plans : ['Standard']);
      }
      if (settingsRes.ok) {
        const s = await settingsRes.json();
        const syncSetting = s.find((x: any) => x.key === 'google_calendar_sync');
        setIsGoogleSyncEnabled(syncSetting ? syncSetting.value === 'true' : false);
        const periodsSetting = s.find((x: any) => x.key === 'opening_periods');
        if (periodsSetting?.value) {
          try { setOpeningPeriods(JSON.parse(periodsSetting.value)); } catch {}
        }
      }
      if (monRes.ok) {
        const mons = await monRes.json();
        setMonitors(mons.map((m: any) => ({ id: String(m.id), title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
    } catch (err) { console.error('Erreur chargement planning:', err); }
  }, []);

  const toggleGoogleSync = useCallback(async () => {
    const newValue = !isGoogleSyncEnabled;
    setIsGoogleSyncEnabled(newValue);
    try {
      await apiFetch('/api/settings', {
        method: 'POST',
        body: JSON.stringify({ key: 'google_calendar_sync', value: newValue ? 'true' : 'false' }),
      });
      alert(newValue
        ? '✅ Synchronisation Google Agenda ACTIVÉE'
        : '⏸️ Synchronisation Google Agenda DÉSACTIVÉE (Navigation ultra-rapide)'
      );
      loadAppointments();
    } catch (err) { console.error(err); }
  }, [isGoogleSyncEnabled, loadAppointments]);

  useEffect(() => { loadData(); }, [loadData]);

  return {
    appointments, setAppointments,
    monitors, flightTypes, openingPeriods, slotDefs,
    availablePlans, timeBounds, isGoogleSyncEnabled,
    loadAppointments, toggleGoogleSync,
  };
}
