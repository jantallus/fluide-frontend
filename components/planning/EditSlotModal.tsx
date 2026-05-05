"use client";
import React, { useState, useEffect, useMemo } from 'react';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';
import type { Slot, CurrentUser, FlightType, Monitor, SlotDefinition, OpeningPeriod } from '@/lib/types';

type FormData = {
  title: string; flight_type_id: string; weightChecked: boolean;
  phone: string; email: string; notes: string; booking_options: string; client_message: string;
};

/** Mise à jour d'un slot envoyée à l'API et appliquée en local */
type SlotUpdate = { id: number; data: Record<string, unknown> };

/** Groupe horaire pour la répartition multi-passagers */
type TimeGroup = { time: string; count: number; capacity: number; slots: Slot[] };

interface Props {
  selectedEvent: Slot & { isOutOfSeason?: boolean };
  currentUser: CurrentUser | null;
  slotDuration: number;
  appointments: Slot[];
  setAppointments: React.Dispatch<React.SetStateAction<Slot[]>>;
  flightTypes: FlightType[];
  monitors: Monitor[];
  slotDefs: SlotDefinition[];
  openingPeriods: OpeningPeriod[];
  loadAppointments: () => Promise<void>;
  onClose: () => void;
}

const IS_CLIENT_SLOT = (slot: Slot) =>
  slot.status === 'booked' && slot.title &&
  !['NOTE', '☕ PAUSE', 'NON DISPO'].some((t: string) => slot.title?.includes(t)) &&
  !slot.title?.includes('❌');

export default function EditSlotModal({
  selectedEvent, currentUser, slotDuration,
  appointments, setAppointments, flightTypes, monitors, slotDefs, openingPeriods,
  loadAppointments, onClose,
}: Props) {
  const { toast, confirm } = useToast();
  // ── State modal ────────────────────────────────────────────────────────────
  const [formData, setFormData] = useState<FormData>({
    title: '', flight_type_id: '', weightChecked: false, phone: '', email: '', notes: '', booking_options: '', client_message: '',
  });
  const [activeTab, setActiveTab] = useState<'client' | 'note' | 'move'>('client');
  const [blockType, setBlockType] = useState<'none' | 'all' | 'specific'>('none');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [blockUntilMs, setBlockUntilMs] = useState<number>(0);
  const [groupSize, setGroupSize] = useState(1);
  const [manualCounts, setManualCounts] = useState<Record<string, number>>({});
  const [isManual, setIsManual] = useState(false);
  const [moveConfig, setMoveConfig] = useState({ date: '', time: '', monitorId: 'random' });
  const [moveGroup, setMoveGroup] = useState(false);

  // ── Init depuis selectedEvent ──────────────────────────────────────────────
  useEffect(() => {
    if (!selectedEvent) return;
    const realTitle = selectedEvent.title;
    setFormData({
      title: realTitle === 'NOTE' ? '' : (realTitle || ''),
      flight_type_id: selectedEvent.flight_type_id?.toString() ?? '',
      weightChecked: selectedEvent.weight_checked || false,
      phone: selectedEvent.phone || '',
      email: selectedEvent.email || '',
      notes: selectedEvent.notes || '',
      booking_options: selectedEvent.booking_options || '',
      client_message: selectedEvent.client_message || '',
    });
    const start = new Date(selectedEvent.start as Date | string);
    const dStr = start.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const tStr = start.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    setMoveConfig({ date: dStr, time: tStr, monitorId: selectedEvent.monitor_id || 'random' });
    setActiveTab(currentUser?.role === 'admin' ? 'client' : 'note');
    setBlockType('none');
    setSelectedMonitors([]);
    setBlockUntilMs(selectedEvent.end_time ? new Date(selectedEvent.end_time).getTime() : 0);
    setGroupSize(1);
    setManualCounts({});
    setIsManual(false);
    setMoveGroup(false);
  }, [selectedEvent, currentUser]);

  // ── useMemos ───────────────────────────────────────────────────────────────
  const parsedOpeningPeriods = useMemo(() =>
    openingPeriods.map(p => {
      if (!p.start || !p.end) return null;
      const s = new Date(p.start); s.setHours(0, 0, 0, 0);
      const e = new Date(p.end); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }).filter(Boolean), [openingPeriods]);

  const groupRootSlots = useMemo(() => {
    if (!selectedEvent || selectedEvent.status !== 'booked' || selectedEvent.title?.startsWith('↪️ Suite')) return [];
    const phone = selectedEvent.phone;
    const baseTitle = selectedEvent.title?.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    if (!phone && !baseTitle) return [selectedEvent];
    const dStr = new Date(selectedEvent.start as Date | string).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const rootSlots = appointments.filter(a => {
      if (a.status !== 'booked' || a.title?.startsWith('↪️ Suite')) return false;
      if (new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) !== dStr) return false;
      if (phone && a.phone === phone) return true;
      if (!phone && baseTitle && a.title?.replace(/\s*\(\d+\/\d+\)$/, '').trim() === baseTitle) return true;
      return false;
    });
    if (!rootSlots.some(s => s.id === selectedEvent.id)) rootSlots.push(selectedEvent);
    return rootSlots;
  }, [appointments, selectedEvent]);

  const currentBookingSlotIds = useMemo(() => {
    if (!selectedEvent) return [];
    const flight = flightTypes.find(f => f.id?.toString() === selectedEvent.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const startMs = new Date(selectedEvent.start as Date | string).getTime();
    const ids = [selectedEvent.id];
    for (let i = 1; i < slotsNeeded; i++) {
      const ms = startMs + i * slotDuration * 60000;
      const slot = appointments.find(a => a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() && new Date(a.start_time).getTime() === ms && a.title?.startsWith('↪️ Suite'));
      if (slot) ids.push(slot.id);
    }
    return ids;
  }, [selectedEvent, flightTypes, slotDuration, appointments]);

  const upcomingBlockingSlots = useMemo(() => {
    if (!selectedEvent) return [];
    const startMs = new Date(selectedEvent.start as Date | string).getTime();
    const sDate = new Date(selectedEvent.start as Date | string).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    return appointments
      .filter(a =>
        a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
        new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === sDate &&
        new Date(a.start_time).getTime() >= startMs
      )
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments, selectedEvent]);

  const availableTargetSlots = useMemo(() => {
    return appointments.filter(a => {
      if (a.status !== 'available' && !currentBookingSlotIds.includes(a.id)) return false;
      if (parsedOpeningPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        if (!parsedOpeningPeriods.some(p => p && slotDate >= p.start && slotDate <= p.end)) return false;
      }
      const d = new Date(a.start_time);
      if (d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) !== moveConfig.date) return false;
      if (moveConfig.monitorId !== 'random' && a.monitor_id?.toString() !== moveConfig.monitorId) return false;
      if (formData.flight_type_id) {
        const flight = flightTypes.find(f => f.id?.toString() === formData.flight_type_id?.toString());
        if (flight) {
          const flightDur = flight.duration_minutes || flight.duration || 0;
          const slotsNeeded = (flight.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
          if (slotsNeeded > 1) {
            const startMs = new Date(a.start_time).getTime();
            for (let i = 1; i < slotsNeeded; i++) {
              const nextSlot = appointments.find(appt => appt.monitor_id?.toString() === a.monitor_id?.toString() && new Date(appt.start_time).getTime() === startMs + i * slotDuration * 60000 && (appt.status === 'available' || currentBookingSlotIds.includes(appt.id)));
              if (!nextSlot) return false;
            }
          } else {
            const dur = Math.round((new Date(a.end_time).getTime() - d.getTime()) / 60000);
            if (flightDur > dur) return false;
          }
          const slotTimeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
          const allowedSlots = Array.isArray(flight.allowed_time_slots) ? flight.allowed_time_slots : [];
          if (allowedSlots.length > 0 && !allowedSlots.includes(slotTimeStr)) return false;
        }
      }
      return true;
    });
  }, [appointments, currentBookingSlotIds, parsedOpeningPeriods, moveConfig, formData.flight_type_id, flightTypes, slotDuration]);

  const availableTimes = useMemo(() =>
    Array.from(new Set(availableTargetSlots.map(a =>
      new Date(a.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false })
    ))).sort(), [availableTargetSlots]);

  useEffect(() => {
    if (moveConfig.time && !availableTimes.includes(moveConfig.time)) {
      setMoveConfig(prev => ({ ...prev, time: '' }));
    }
  }, [availableTimes]);

  const smartFlightOptions = useMemo(() => {
    const dateStr = selectedEvent?.start ? new Date(selectedEvent.start as Date | string).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) : '';
    const planSchedules: Record<string, Set<string>> = {};
    slotDefs.forEach(d => {
      const pName = d.plan_name || 'Standard';
      if (!planSchedules[pName]) planSchedules[pName] = new Set();
      const t = typeof d.start_time === 'string' ? d.start_time.substring(0, 5) : '';
      if (t) planSchedules[pName].add(t);
    });
    const dayTimesArray = appointments.filter(a =>
      new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === dateStr
    ).map(a => new Date(a.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }));
    let inferredPlan = 'Standard'; let maxMatches = -1;
    for (const [pName, pSet] of Object.entries(planSchedules)) {
      let matches = 0;
      dayTimesArray.forEach(t => { if (pSet.has(t)) matches++; });
      if (matches > maxMatches) { maxMatches = matches; inferredPlan = pName; }
    }
    const activePlanTimes = planSchedules[inferredPlan] || new Set();
    return flightTypes.filter(f => {
      const allowed = Array.isArray(f.allowed_time_slots) ? f.allowed_time_slots : [];
      return allowed.length === 0 || allowed.some((t: string) => activePlanTimes.has(t));
    });
  }, [selectedEvent, slotDefs, appointments, flightTypes]);

  const availableTimeGroups = useMemo(() => {
    if (!selectedEvent || !formData.flight_type_id) return [];
    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const startMs = new Date(selectedEvent.start as Date | string).getTime();
    const dayStr = new Date(selectedEvent.start as Date | string).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const allDayAvailable = appointments.filter(a =>
      a.status === 'available' &&
      new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === dayStr &&
      new Date(a.start_time).getTime() >= startMs
    );
    const validStartSlots: Slot[] = [];
    allDayAvailable.forEach(slot => {
      const sTime = new Date(slot.start_time).getTime();
      let canDoFlight = true;
      for (let i = 0; i < slotsNeeded; i++) {
        if (!allDayAvailable.find(x => x.monitor_id === slot.monitor_id && new Date(x.start_time).getTime() === sTime + i * slotDuration * 60000)) { canDoFlight = false; break; }
      }
      if (canDoFlight) validStartSlots.push(slot);
    });
    const groups: Record<string, Slot[]> = {};
    validStartSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).forEach(slot => {
      const timeStr = new Date(slot.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
      if (!groups[timeStr]) groups[timeStr] = [];
      groups[timeStr].push(slot);
    });
    return Object.keys(groups).map(time => ({ time, capacity: groups[time].length, slots: groups[time] })).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedEvent, formData.flight_type_id, appointments, flightTypes, slotDuration]);

  const displayDistribution = useMemo(() => {
    let remaining = groupSize;
    const result: TimeGroup[] = [];
    let canFit = true;
    if (!isManual) {
      for (const group of availableTimeGroups) {
        if (remaining <= 0) break;
        const take = Math.min(remaining, group.capacity);
        result.push({ ...group, count: take });
        remaining -= take;
      }
      if (remaining > 0) canFit = false;
      if (remaining <= 0 && availableTimeGroups[result.length]) result.push({ ...availableTimeGroups[result.length], count: 0 });
    } else {
      let lastNonZeroIndex = -1;
      for (let i = 0; i < availableTimeGroups.length; i++) {
        if ((manualCounts[availableTimeGroups[i].time] || 0) > 0) lastNonZeroIndex = i;
      }
      const showUpTo = Math.min(lastNonZeroIndex + 1, availableTimeGroups.length - 1);
      for (let i = 0; i <= Math.max(0, showUpTo); i++) {
        const group = availableTimeGroups[i];
        result.push({ ...group, count: manualCounts[group.time] || 0 });
      }
    }
    const slotsToUse: Slot[] = [];
    result.forEach(r => { for (let i = 0; i < r.count; i++) slotsToUse.push(r.slots[i]); });
    return { items: result, canFit, slotsToUse };
  }, [availableTimeGroups, groupSize, manualCounts, isManual]);

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleMainChange = (delta: number) => { setGroupSize(prev => Math.max(1, prev + delta)); setIsManual(false); };

  const handleSubChange = (time: string, delta: number) => {
    setManualCounts(prev => {
      const newCounts = { ...prev };
      if (!isManual) displayDistribution.items.forEach(item => { newCounts[item.time] = item.count; });
      const capacity = availableTimeGroups.find(g => g.time === time)?.capacity || 0;
      newCounts[time] = Math.max(0, Math.min(capacity, (newCounts[time] || 0) + delta));
      setGroupSize(Object.values(newCounts).reduce((a, b) => a + b, 0));
      setIsManual(true);
      return newCounts;
    });
  };

  const applyAll = async (updatesToApply: SlotUpdate[]) => {
    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    onClose();
    try {
      await Promise.all(updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) })));
      await loadAppointments();
    } catch { console.error('Erreur de sauvegarde silencieuse'); }
  };

  const handleSaveNote = async () => {
    if (!selectedEvent) return;
    let slotsNeeded = 1;
    let targetMonitors: string[] = [];
    let slotsToUpdate: Slot[] = [];

    if (activeTab === 'note') {
      const isNonBlockingNote = formData.title !== 'NON DISPO';
      targetMonitors = blockType === 'all' ? monitors.map(m => m.id.toString()) : blockType === 'specific' ? selectedMonitors : [selectedEvent.monitor_id?.toString()];
      const startMs = new Date(selectedEvent.start as Date | string).getTime();
      slotsToUpdate = appointments.filter(a => targetMonitors.includes(a.monitor_id?.toString()) && new Date(a.start_time).getTime() >= startMs && new Date(a.start_time).getTime() < blockUntilMs);
      if (!isNonBlockingNote) {
        if (slotsToUpdate.some(slot => IS_CLIENT_SLOT(slot))) { toast.error('❌ Impossible de bloquer : Un ou plusieurs clients sont déjà réservés.'); return; }
      }
      const updatesToApply: SlotUpdate[] = [];
      slotsToUpdate.forEach(slot => {
        let payload: Record<string, unknown> = { title: isNonBlockingNote ? 'NOTE' : 'NON DISPO', notes: formData.notes, status: isNonBlockingNote ? 'available' : 'booked' };
        if (isNonBlockingNote) {
          if (IS_CLIENT_SLOT(slot)) {
            payload = { ...payload, title: slot.title, status: slot.status, flight_type_id: slot.flight_type_id, phone: slot.phone, email: slot.email, weightChecked: slot.weight_checked || slot.weightChecked, booking_options: slot.booking_options, client_message: slot.client_message, weight: slot.weight };
          } else {
            payload = { ...payload, flight_type_id: null, phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' };
          }
        } else {
          payload = { ...payload, flight_type_id: null, phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' };
        }
        updatesToApply.push({ id: slot.id, data: payload });
      });
      return applyAll(updatesToApply);
    }

    if (!formData.title?.trim()) { toast.error('❌ Le nom du contact est obligatoire pour une réservation.'); return; }
    if (!formData.flight_type_id) { toast.error('❌ Veuillez choisir un type de vol.'); return; }
    if (!formData.phone?.trim()) { toast.error('❌ Le numéro de téléphone est obligatoire.'); return; }
    const selectedFlight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
    const flightDuration = selectedFlight?.duration_minutes || selectedFlight?.duration || 0;
    slotsNeeded = (selectedFlight?.allow_multi_slots && slotDuration > 0 && flightDuration > slotDuration) ? Math.ceil(flightDuration / slotDuration) : 1;

    const updatesToApply: SlotUpdate[] = [];
    if (groupSize > 1 || isManual) {
      if (!displayDistribution.canFit || displayDistribution.slotsToUse.length === 0) { toast.error('❌ Pas assez de créneaux disponibles ou aucune place sélectionnée.'); return; }
      displayDistribution.slotsToUse.forEach((baseSlot, index) => {
        const namesList = formData.title.split(',').map((n: string) => n.trim()).filter((n: string) => n);
        let passengerTitle = '';
        if (namesList.length === groupSize + 1) { const booker = namesList[0]; passengerTitle = `${namesList[index + 1]} (${booker})`; }
        else if (namesList.length > 0) { const booker = namesList[0]; passengerTitle = index === 0 ? booker : (namesList[index] ? `${namesList[index]} (${booker})` : `Passager ${index + 1} (${booker})`); }
        else { passengerTitle = groupSize > 1 ? `Passager ${index + 1}` : (formData.title || ''); }
        updatesToApply.push({ id: baseSlot.id, data: { ...formData, title: passengerTitle, status: 'booked' } });
        if (slotsNeeded > 1) {
          const baseStartMs = new Date(baseSlot.start_time).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nextMs = baseStartMs + i * slotDuration * 60000;
            const nextSlot = appointments.find(a => a.monitor_id?.toString() === baseSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs && a.status === 'available');
            if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${passengerTitle}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
          }
        }
      });
    } else if (slotsNeeded > 1) {
      updatesToApply.push({ id: selectedEvent.id, data: { ...formData, title: formData.title, status: 'booked' } });
      const startMs = new Date(selectedEvent.start as Date | string).getTime();
      for (let i = 1; i < slotsNeeded; i++) {
        const nextMs = startMs + i * slotDuration * 60000;
        const nextSlot = appointments.find(a => a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs && a.status === 'available');
        if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${formData.title || 'Vol'}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
      }
    } else {
      updatesToApply.push({ id: selectedEvent.id, data: { ...formData, title: formData.title, status: formData.title.trim() ? 'booked' : 'available' } });
    }
    applyAll(updatesToApply);
  };

  const handleRelease = async () => {
    const isNoteOnly = selectedEvent?.status === 'available' && selectedEvent?.title === 'NOTE';
    const confirmMsg = isNoteOnly ? '🗑️ Voulez-vous vraiment effacer cette note ?' : '🗑️ Action irréversible. Libérer ce créneau ?\n\n(Les notes éventuelles seront conservées)';
    if (!selectedEvent || !await confirm(confirmMsg)) return;
    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const startMs = new Date(selectedEvent.start as Date | string).getTime();
    const updatesToApply: SlotUpdate[] = [];
    for (let i = 0; i < slotsNeeded; i++) {
      const ms = startMs + i * slotDuration * 60000;
      const slotToFree = appointments.find(a => a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() && new Date(a.start_time).getTime() === ms && (i === 0 || a.title?.startsWith('↪️ Suite')));
      if (slotToFree) {
        let newTitle = ''; let newNotes = '';
        if (IS_CLIENT_SLOT(slotToFree) && i === 0 && slotToFree.notes && slotToFree.notes !== 'Extension auto') { newTitle = 'NOTE'; newNotes = slotToFree.notes; }
        updatesToApply.push({ id: slotToFree.id, data: { title: newTitle, flight_type_id: null, weight: null, notes: newNotes, status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    }
    applyAll(updatesToApply);
  };

  const handleReleaseGroup = async () => {
    if (!selectedEvent || !await confirm(`🧹 Action irréversible. Libérer les ${groupRootSlots.length} créneaux de ce groupe ?`)) return;
    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const updatesToApply: SlotUpdate[] = [];
    groupRootSlots.forEach(baseSlot => {
      const startMs = new Date(baseSlot.start_time).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = startMs + i * slotDuration * 60000;
        const slotToFree = appointments.find(a => a.monitor_id?.toString() === baseSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === ms && (i === 0 || a.title?.startsWith('↪️ Suite')));
        if (slotToFree) updatesToApply.push({ id: slotToFree.id, data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    });
    applyAll(updatesToApply);
  };

  const handleBulkRelease = async () => {
    if (!selectedEvent) return;
    const isPlural = blockType === 'all' || (blockType === 'specific' && selectedMonitors.length > 1) || (upcomingBlockingSlots.length > 0 && blockUntilMs > new Date(upcomingBlockingSlots[0].end_time).getTime());
    const confirmMsg = isPlural ? '🧹 Voulez-vous vraiment effacer les notes et blocages sur TOUTE la sélection ?\n\n(Les réservations clients existantes seront conservées).' : '🗑️ Voulez-vous vraiment effacer la note / le blocage de ce créneau ?\n\n(Si un client est présent, il sera conservé).';
    if (!await confirm(confirmMsg)) return;
    const targetMonitors = blockType === 'all' ? monitors.map(m => m.id.toString()) : blockType === 'specific' ? selectedMonitors : [selectedEvent.monitor_id?.toString()];
    const startMs = new Date(selectedEvent.start as Date | string).getTime();
    const slotsToUpdate = appointments.filter(a => targetMonitors.includes(a.monitor_id?.toString()) && new Date(a.start_time).getTime() >= startMs && new Date(a.start_time).getTime() < blockUntilMs);
    const updatesToApply: SlotUpdate[] = [];
    slotsToUpdate.forEach(slot => {
      if (IS_CLIENT_SLOT(slot)) {
        updatesToApply.push({ id: slot.id, data: { title: slot.title, status: slot.status, notes: '', flight_type_id: slot.flight_type_id, phone: slot.phone, email: slot.email, weightChecked: slot.weight_checked || slot.weightChecked, booking_options: slot.booking_options, client_message: slot.client_message, weight: slot.weight } });
      } else {
        updatesToApply.push({ id: slot.id, data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    });
    applyAll(updatesToApply);
  };

  const handleMove = async () => {
    if (!moveConfig.time || !selectedEvent) return;
    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const updatesToApply: SlotUpdate[] = [];

    if (moveGroup && groupRootSlots.length > 1) {
      const slotsToFree: number[] = [];
      groupRootSlots.forEach(baseSlot => {
        slotsToFree.push(baseSlot.id);
        if (slotsNeeded > 1) {
          const bMs = new Date(baseSlot.start_time).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nSlot = appointments.find(a => a.monitor_id === baseSlot.monitor_id && new Date(a.start_time).getTime() === bMs + i * slotDuration * 60000);
            if (nSlot) slotsToFree.push(nSlot.id);
          }
        }
      });
      const [targetHour, targetMin] = moveConfig.time.split(':').map(Number);
      const targetTimeMs = (targetHour * 60 + targetMin) * 60000;
      const allDayAvailable = appointments.filter(a => {
        if (a.status !== 'available' && !slotsToFree.includes(a.id)) return false;
        const d = new Date(a.start_time);
        if (d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) !== moveConfig.date) return false;
        if ((d.getHours() * 60 + d.getMinutes()) * 60000 < targetTimeMs) return false;
        if (moveConfig.monitorId !== 'random' && a.monitor_id?.toString() !== moveConfig.monitorId) return false;
        return true;
      });
      const validStartSlots: Slot[] = [];
      allDayAvailable.forEach(slot => {
        const sTime = new Date(slot.start_time).getTime();
        let canDoFlight = true;
        for (let i = 0; i < slotsNeeded; i++) {
          if (!allDayAvailable.find(x => x.monitor_id === slot.monitor_id && new Date(x.start_time).getTime() === sTime + i * slotDuration * 60000)) { canDoFlight = false; break; }
        }
        if (canDoFlight) validStartSlots.push(slot);
      });
      validStartSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
      let remaining = groupRootSlots.length;
      const assignedSlots: Slot[] = [];
      for (const slot of validStartSlots) {
        if (remaining === 0) break;
        const sTime = new Date(slot.start_time).getTime();
        if (!assignedSlots.some(a => a.monitor_id === slot.monitor_id && Math.abs(new Date(a.start_time).getTime() - sTime) < slotsNeeded * slotDuration * 60000)) { assignedSlots.push(slot); remaining--; }
      }
      if (remaining > 0) { toast.error(`❌ Impossible : Pas assez de créneaux simultanés pour placer les ${groupRootSlots.length} passagers à partir de ${moveConfig.time}.`); return; }
      if (assignedSlots.length === groupRootSlots.length && assignedSlots.every((s, i) => s.id === groupRootSlots[i].id)) { toast.info('ℹ️ Le groupe est déjà assigné exactement à ces mêmes créneaux et pilotes.'); return; }
      slotsToFree.forEach(id => updatesToApply.push({ id, data: { status: 'available', title: '', phone: '', email: '', flight_type_id: null } }));
      groupRootSlots.forEach((oldSlot, g) => {
        const newBaseSlot = assignedSlots[g];
        const passengerTitle = oldSlot.title || formData.title;
        updatesToApply.push({ id: newBaseSlot.id, data: { ...formData, title: passengerTitle, status: 'booked', notes: oldSlot.notes, payment_data: oldSlot.payment_data } });
        if (slotsNeeded > 1) {
          const baseStartMs = new Date(newBaseSlot.start_time).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nextSlot = allDayAvailable.find(a => a.monitor_id?.toString() === newBaseSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === baseStartMs + i * slotDuration * 60000);
            if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${passengerTitle}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
          }
        }
      });
    } else {
      const [targetHour, targetMin] = moveConfig.time.split(':').map(Number);
      const targetTimeMs = (targetHour * 60 + targetMin) * 60000;
      const targetSlot = availableTargetSlots.find(a => {
        const d = new Date(a.start_time);
        return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === moveConfig.date && (d.getHours() * 60 + d.getMinutes()) * 60000 === targetTimeMs && (moveConfig.monitorId === 'random' || a.monitor_id?.toString() === moveConfig.monitorId);
      });
      if (!targetSlot) { toast.error("❌ Le créneau cible n'est plus disponible."); return; }
      if (targetSlot.id === selectedEvent.id) { toast.info('ℹ️ Le créneau est déjà à cet emplacement avec ce pilote.'); return; }
      currentBookingSlotIds.forEach(id => updatesToApply.push({ id, data: { status: 'available', title: '', phone: '', email: '', flight_type_id: null } }));
      const newStartMs = new Date(targetSlot.start_time).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = newStartMs + i * slotDuration * 60000;
        const slotToBook = appointments.find(a => a.monitor_id?.toString() === targetSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === ms);
        if (slotToBook) updatesToApply.push({ id: slotToBook.id, data: { ...formData, title: i === 0 ? formData.title : `↪️ Suite ${formData.title || 'Vol'}`, status: 'booked', notes: i === 0 ? formData.notes : 'Extension auto', payment_data: selectedEvent.payment_data } });
      }
    }
    applyAll(updatesToApply);
  };

  // ── Booleans dérivés ───────────────────────────────────────────────────────
  const isEventBlocked = !!(selectedEvent?.title?.includes('☕') || selectedEvent?.title?.toUpperCase().includes('PAUSE') || selectedEvent?.title?.includes('❌') || selectedEvent?.title?.toUpperCase().includes('NON DISPO'));
  const isOutOfSeason = selectedEvent?.isOutOfSeason === true;
  const isClientLocked = isEventBlocked || isOutOfSeason;
  const isClientSlotLocal = IS_CLIENT_SLOT(selectedEvent || {});
  const isAdminBlockLocal = !!(selectedEvent?.title?.includes('(Admin)'));
  const isLockedForMe = currentUser?.role === 'permanent' && (isClientSlotLocal || isAdminBlockLocal);

  // ── JSX ────────────────────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl max-h-[95vh] overflow-y-auto custom-scrollbar">
        <h2 className="text-xl font-black uppercase italic mb-6 text-slate-900">Gestion du Créneau</h2>

        <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
          {currentUser?.role === 'admin' && (
            <button onClick={() => setActiveTab('client')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'client' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400'}`}>👤 Client</button>
          )}
          <button onClick={() => setActiveTab('note')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'note' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400'}`}>📝 Note</button>
          {currentUser?.role === 'admin' && selectedEvent?.status !== 'available' && !isClientLocked && (
            <button onClick={() => setActiveTab('move')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'move' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}>🔄 Déplacer</button>
          )}
        </div>

        <div className="space-y-4">
          {/* ── Tab Client ── */}
          {activeTab === 'client' && (
            isEventBlocked ? (
              <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100">
                <span className="text-4xl block mb-2">🔒</span>
                <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Créneau Verrouillé</p>
                <p className="text-xs text-slate-500 px-4 font-medium mb-6">Ce créneau est bloqué ou en pause. Pour y ajouter un client, libérez-le d'abord.</p>
                <button onClick={handleRelease} className="bg-rose-100 text-rose-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">🗑️ Libérer ce créneau</button>
              </div>
            ) : isOutOfSeason ? (
              <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100">
                <span className="text-4xl block mb-2">❄️</span>
                <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Hors Saison</p>
                <p className="text-xs text-slate-500 px-4 font-medium mb-6">Ce créneau est en dehors de vos périodes d'ouverture.</p>
                <button onClick={handleRelease} className="bg-slate-200 text-slate-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm">🗑️ {(selectedEvent?.title || selectedEvent?.notes) ? 'Effacer la note' : 'Supprimer le créneau'}</button>
              </div>
            ) : (
              <>
                <div className="mb-2">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom du contact et passagers</label>
                  <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} placeholder="Ex: Julien, Christophe, Alexandre..." />
                  <span className="text-[9px] text-slate-400 ml-2 mt-1 block leading-tight">
                    💡 <b>Astuce :</b> Le 1er nom est le contact. Séparez par des virgules.<br />
                    <i>Ex (3 places) : "léo, Alex, Paul, Léa" ➔ léo ne vole pas, Alex, Paul et Léa volent.</i>
                  </span>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type de Vol</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.flight_type_id} onChange={e => setFormData({ ...formData, flight_type_id: e.target.value })}>
                    <option value="">Choisir un vol...</option>
                    {smartFlightOptions.map(f => {
                      const flightDuration = f.duration_minutes || f.duration || 0;
                      const slotsNeededOption = (f.allow_multi_slots && slotDuration > 0 && flightDuration > slotDuration) ? Math.ceil(flightDuration / slotDuration) : 1;
                      let canFit = true; let reason = '';
                      if (f.allow_multi_slots && slotsNeededOption > 1) {
                        const startMs = new Date((selectedEvent?.start ?? selectedEvent?.start_time) as Date | string).getTime();
                        for (let i = 1; i < slotsNeededOption; i++) {
                          if (!appointments.find(a => a.monitor_id?.toString() === selectedEvent?.monitor_id?.toString() && new Date(a.start_time).getTime() === startMs + i * slotDuration * 60000 && a.status === 'available')) { canFit = false; reason = `(Bloqué : nécessite ${slotsNeededOption} créneaux)`; break; }
                        }
                      } else if (!f.allow_multi_slots && flightDuration > slotDuration) { canFit = false; reason = `(Trop long : ${flightDuration} min)`; }
                      const slotTimeStr = selectedEvent?.start ? new Date(selectedEvent.start as Date | string).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }) : '';
                      const allowedSlots = Array.isArray(f.allowed_time_slots) ? f.allowed_time_slots : [];
                      const isAllowedTime = allowedSlots.length === 0 || allowedSlots.includes(slotTimeStr);
                      const isDisabled = !canFit || !isAllowedTime;
                      if (!isAllowedTime && canFit) reason = `(Interdit à ${slotTimeStr})`;
                      return <option key={f.id?.toString()} value={f.id} disabled={isDisabled} className={isDisabled ? 'text-slate-300 bg-slate-100' : 'text-slate-900'}>{f.name} - {f.price_cents ? f.price_cents / 100 : 0}€ {reason}</option>;
                    })}
                  </select>
                </div>

                {formData.flight_type_id && (
                  <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 mt-4 shadow-sm">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-3">Taille du groupe (Total)</label>
                    <div className="flex items-center gap-4">
                      <button onClick={() => handleMainChange(-1)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center">-</button>
                      <span className="text-2xl font-black text-slate-900 w-8 text-center">{groupSize}</span>
                      <button onClick={() => handleMainChange(1)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center">+</button>
                      <span className="text-sm font-bold text-slate-500 ml-2">Passager(s) au total</span>
                    </div>
                    {groupSize > 0 && displayDistribution && (
                      <div className={`mt-4 p-3 rounded-xl border-2 transition-all ${displayDistribution.canFit ? (isManual ? 'bg-indigo-50 border-indigo-200' : 'bg-emerald-50 border-emerald-200') : 'bg-rose-50 border-rose-200'}`}>
                        {displayDistribution.canFit ? (
                          <>
                            <div className="flex items-center justify-between mb-3">
                              <span className={`uppercase tracking-wider text-[10px] font-black ${isManual ? 'text-indigo-800' : 'text-emerald-800'} opacity-70`}>{isManual ? '⚙️ Répartition Manuelle :' : '✅ Répartition Automatique :'}</span>
                              {isManual && (<button onClick={() => { setIsManual(false); setGroupSize(groupSize); }} className="text-[9px] uppercase font-bold text-indigo-500 hover:text-indigo-700 bg-white px-2 py-1 rounded-md border border-indigo-100 transition-all shadow-sm">↻ Remettre en auto</button>)}
                            </div>
                            <ul className="list-none space-y-2">
                              {displayDistribution.items.map((d, i) => (
                                <li key={i} className="flex items-center justify-between bg-white/60 p-2 rounded-lg">
                                  <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-1 bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
                                      <button onClick={() => handleSubChange(d.time, -1)} disabled={d.count === 0} className={`w-6 h-6 flex items-center justify-center rounded-md font-bold transition-colors ${d.count === 0 ? 'text-slate-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`}>-</button>
                                      <span className={`w-4 text-center font-black text-sm ${d.count > 0 ? 'text-slate-800' : 'text-slate-400'}`}>{d.count}</span>
                                      <button onClick={() => handleSubChange(d.time, 1)} disabled={d.count >= d.capacity} className={`w-6 h-6 flex items-center justify-center rounded-md font-bold transition-colors ${d.count >= d.capacity ? 'text-slate-300' : 'bg-slate-50 text-slate-600 hover:bg-slate-200'}`}>+</button>
                                    </div>
                                    <span className="text-sm font-medium text-slate-700">à <strong>{d.time}</strong></span>
                                  </div>
                                  <span className="text-[10px] font-bold text-slate-400 uppercase">({d.capacity} max)</span>
                                </li>
                              ))}
                            </ul>
                          </>
                        ) : (
                          <span className="flex items-center gap-2 text-rose-800 text-xs font-bold"><span className="text-xl">❌</span> Capacité insuffisante pour {groupSize} passager(s).</span>
                        )}
                      </div>
                    )}
                  </div>
                )}

                {formData.flight_type_id && (() => {
                  const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
                  const wMin = flight?.weight_min ?? 20; const wMax = flight?.weight_max ?? 110;
                  return (
                    <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors ${formData.weightChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                      <input type="checkbox" className={`w-6 h-6 mt-0.5 ${formData.weightChecked ? 'accent-emerald-500' : 'accent-rose-500'}`} checked={formData.weightChecked} onChange={e => setFormData({ ...formData, weightChecked: e.target.checked })} />
                      <div>
                        <span className={`font-bold block ${formData.weightChecked ? 'text-emerald-900' : 'text-rose-900'}`}>Le client certifie peser entre {wMin} et {wMax} kg</span>
                        <span className={`text-[10px] ${formData.weightChecked ? 'text-emerald-600' : 'text-rose-500'}`}>Cochez pour confirmer au pilote que le poids a été vérifié.</span>
                      </div>
                    </label>
                  );
                })()}

                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-1.5">
                    {formData.phone ? (
                      <div className="flex gap-2 w-full">
                        <a href={`tel:${formData.phone.replace(/\s+/g, '')}`} className="flex-1 flex items-center justify-center text-[14px] bg-emerald-100 text-emerald-700 py-2 rounded-xl hover:bg-emerald-200 transition-colors shadow-sm">📞</a>
                        <a href={`sms:${formData.phone.replace(/\s+/g, '')}`} className="flex-1 flex items-center justify-center gap-1 text-[10px] bg-emerald-100 text-emerald-700 py-2 rounded-xl font-black uppercase hover:bg-emerald-200 transition-colors shadow-sm">💬 SMS</a>
                      </div>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 text-[10px] bg-slate-100 text-slate-400 py-2 rounded-xl font-black uppercase">📞 Téléphone <span className="text-rose-500 -ml-1">*</span></div>
                    )}
                    <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors text-center" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="06 12 34 56 78" />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    {formData.email ? (
                      <a href={`mailto:${formData.email}`} className="w-full flex items-center justify-center gap-2 text-[10px] bg-sky-100 text-sky-700 py-2 rounded-xl font-black uppercase hover:bg-sky-200 transition-colors shadow-sm">✉️ Écrire</a>
                    ) : (
                      <div className="w-full flex items-center justify-center gap-2 text-[10px] bg-slate-100 text-slate-400 py-2 rounded-xl font-black uppercase">✉️ Écrire</div>
                    )}
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors text-center" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="Email (Optionnel)" />
                  </div>
                </div>

                {(formData.booking_options || formData.client_message) && (
                  <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                    {formData.booking_options && (<div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 flex items-start gap-3"><span className="text-xl mt-1">📸</span><div><p className="text-[10px] font-black uppercase text-sky-500 mb-0.5">Options choisies</p><p className="font-bold text-sky-900 text-sm leading-tight">{formData.booking_options}</p></div></div>)}
                    {formData.client_message && (<div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-3"><span className="text-xl mt-1">💬</span><div><p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Message du client</p><p className="font-medium text-slate-700 text-sm italic leading-tight">"{formData.client_message}"</p></div></div>)}
                  </div>
                )}
              </>
            )
          )}

          {/* ── Tab Note ── */}
          {activeTab === 'note' && (
            isLockedForMe ? (
              <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mt-4 shadow-inner">
                <span className="text-3xl block mb-2">🔒</span>
                <p className="text-slate-700 font-bold text-[11px] uppercase tracking-widest">{isAdminBlockLocal ? 'Verrouillé par la direction' : 'Réservation Client'}</p>
                <p className="text-slate-500 text-[10px] mt-2 font-medium">Vous ne pouvez pas modifier ce créneau.</p>
              </div>
            ) : (
              <>
                <div className="flex gap-2 mb-4">
                  <button disabled={isOutOfSeason} onClick={() => setFormData({ ...formData, title: 'NOTE' })} className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title !== 'NON DISPO' ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-200')}`}>📝 Note simple (Reste libre)</button>
                  <button disabled={isOutOfSeason} onClick={() => setFormData({ ...formData, title: 'NON DISPO' })} className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title === 'NON DISPO' ? 'bg-rose-100 border-rose-400 text-rose-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-rose-200')}`}>❌ Bloquer (Non dispo)</button>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Note interne au pilote</label>
                  <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold h-24" value={formData.notes} onChange={e => setFormData({ ...formData, notes: e.target.value })} placeholder="Infos météo, retard..." />
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Cible (Qui ?)</label>
                  <select className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all mb-4 ${isOutOfSeason || currentUser?.role !== 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} value={blockType} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBlockType(e.target.value as 'none' | 'all' | 'specific')} disabled={isOutOfSeason || currentUser?.role !== 'admin'}>
                    <option value="none">Ce pilote uniquement</option>
                    {currentUser?.role === 'admin' && (<><option value="all">🚫 TOUS les pilotes</option><option value="specific">👥 Certains pilotes</option></>)}
                  </select>
                  {blockType === 'specific' && !isOutOfSeason && currentUser?.role === 'admin' && (
                    <div className="mb-4 grid grid-cols-2 gap-2">
                      {monitors.map(m => (
                        <label key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold cursor-pointer hover:bg-slate-50">
                          <input type="checkbox" className="accent-amber-500" checked={selectedMonitors.includes(m.id.toString())} onChange={e => { const id = m.id.toString(); setSelectedMonitors(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id)); }} />
                          {m.title}
                        </label>
                      ))}
                    </div>
                  )}
                  <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Durée (Jusqu'à quand ?)</label>
                  {selectedEvent && (
                    <select className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all ${isOutOfSeason ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} value={blockUntilMs} onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setBlockUntilMs(Number(e.target.value))} disabled={isOutOfSeason}>
                      {upcomingBlockingSlots.map((slot, index) => {
                        const end = new Date(slot.end_time);
                        const timeStr = end.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
                        let label = `Jusqu'à ${timeStr}`;
                        if (index === 0) label = `Ce créneau uniquement (Jusqu'à ${timeStr})`;
                        else if (index === upcomingBlockingSlots.length - 1) label = `Toute la fin de journée (Jusqu'à ${timeStr})`;
                        return <option key={slot.id} value={end.getTime()}>{label}</option>;
                      })}
                    </select>
                  )}
                </div>
              </>
            )
          )}

          {/* ── Boutons save/release ── */}
          {(activeTab === 'client' || activeTab === 'note') && (
            <div className="pt-4 space-y-3 border-t border-slate-100">
              {!(activeTab === 'client' && isClientLocked) && !isLockedForMe && (
                <>
                  <button onClick={handleSaveNote} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-sky-600 transition-colors">Enregistrer la modification</button>
                  {(selectedEvent?.title || selectedEvent?.notes || selectedEvent?.status !== 'available') && (
                    activeTab === 'note' ? (
                      <div className="pt-2">
                        {(() => {
                          const isPlural = blockType === 'all' || (blockType === 'specific' && selectedMonitors.length > 1) || (upcomingBlockingSlots.length > 0 && blockUntilMs > new Date(upcomingBlockingSlots[0].end_time).getTime());
                          const isBlock = ['NON DISPO', '☕ PAUSE'].some(t => selectedEvent?.title?.includes(t)) || selectedEvent?.title?.includes('❌');
                          const btnText = !isBlock ? (isPlural ? '🧹 Effacer les notes sélectionnées' : '🗑️ Effacer la note') : (isPlural ? '🧹 Libérer les créneaux sélectionnés' : '🗑️ Libérer le créneau');
                          return <button onClick={handleBulkRelease} className={`w-full font-black uppercase italic tracking-widest transition-all rounded-xl py-3 shadow-sm ${isPlural ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white text-[10px]' : 'bg-white text-rose-500 border border-rose-200 hover:bg-rose-50 text-[10px]'}`}>{btnText}</button>;
                        })()}
                      </div>
                    ) : (
                      <div className="flex gap-2 pt-2">
                        {(() => {
                          const isNoteOnly = selectedEvent?.status === 'available' && selectedEvent?.title === 'NOTE';
                          const hasNote = !!selectedEvent?.notes && selectedEvent?.notes !== 'Extension auto';
                          return (
                            <>
                              <button onClick={handleRelease} className="flex-1 text-rose-500 font-black uppercase italic text-[9px] tracking-widest hover:text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors py-2 shadow-sm">{isNoteOnly ? '🗑️ Effacer la note' : (hasNote ? '🗑️ Libérer (Garder note)' : '🗑️ Libérer ce créneau')}</button>
                              {groupRootSlots.length > 1 && (<button onClick={handleReleaseGroup} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-black uppercase italic text-[9px] tracking-widest hover:bg-rose-500 hover:text-white transition-colors py-2 shadow-sm">🧹 Libérer groupe ({groupRootSlots.length})</button>)}
                            </>
                          );
                        })()}
                      </div>
                    )
                  )}
                </>
              )}
              <button onClick={onClose} className="w-full text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600 pt-2">Fermer sans sauvegarder</button>
            </div>
          )}

          {/* ── Tab Move ── */}
          {activeTab === 'move' && (
            isClientLocked ? (
              <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100 mt-4">
                <span className="text-4xl block mb-2">🔒</span>
                <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Déplacement bloqué</p>
                <p className="text-xs text-slate-500 px-4 font-medium mb-6">Vous ne pouvez pas déplacer un créneau hors saison ou en pause.</p>
              </div>
            ) : (
              <>
                {groupRootSlots.length > 1 && (
                  <div className="mb-4 bg-emerald-50 p-3 rounded-2xl border border-emerald-100 flex items-center gap-3">
                    <input type="checkbox" className="w-5 h-5 accent-emerald-500 cursor-pointer" checked={moveGroup} onChange={e => setMoveGroup(e.target.checked)} />
                    <label className="text-xs font-bold text-emerald-900 cursor-pointer select-none" onClick={() => setMoveGroup(!moveGroup)}>Déplacer TOUT le groupe ({groupRootSlots.length} passagers)</label>
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date ciblée</label>
                  <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.date} onChange={e => setMoveConfig({ ...moveConfig, date: e.target.value })} />
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Créneau disponible</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.time} onChange={e => setMoveConfig({ ...moveConfig, time: e.target.value })}>
                    <option value="">Choisir une heure...</option>
                    {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pilote</label>
                  <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.monitorId} onChange={e => setMoveConfig({ ...moveConfig, monitorId: e.target.value })}>
                    <option value="random">🎲 Aléatoire (Peu importe)</option>
                    {monitors.map(m => {
                      let isBusy = false;
                      if (moveConfig.date && moveConfig.time) {
                        const flight = flightTypes.find(f => f.id?.toString() === formData.flight_type_id?.toString());
                        const flightDur = flight?.duration_minutes || flight?.duration || 0;
                        const slotsNeeded2 = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
                        const targetSlot = appointments.find(a => {
                          if (a.monitor_id?.toString() !== m.id.toString()) return false;
                          const d = new Date(a.start_time);
                          return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === moveConfig.date && d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }) === moveConfig.time;
                        });
                        if (!targetSlot) isBusy = true;
                        else if (targetSlot.status !== 'available' && !currentBookingSlotIds.includes(targetSlot.id)) isBusy = true;
                        else if (slotsNeeded2 > 1) {
                          const startMs = new Date(targetSlot.start_time).getTime();
                          for (let i = 1; i < slotsNeeded2; i++) {
                            if (!appointments.find(a => a.monitor_id?.toString() === m.id.toString() && new Date(a.start_time).getTime() === startMs + i * slotDuration * 60000 && (a.status === 'available' || currentBookingSlotIds.includes(a.id)))) { isBusy = true; break; }
                          }
                        }
                      }
                      return <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? 'text-slate-300 bg-slate-100' : 'text-slate-900'}>{m.title} {isBusy ? '(Occupé)' : ''}</option>;
                    })}
                  </select>
                </div>
                <div className="pt-4 space-y-3">
                  <button onClick={handleMove} disabled={!moveConfig.time} className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${!moveConfig.time ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>Transférer le créneau</button>
                  <button onClick={onClose} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
                </div>
              </>
            )
          )}
        </div>
      </div>
    </div>
  );
}
