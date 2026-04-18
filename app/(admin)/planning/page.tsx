"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import scrollgridPlugin from '@fullcalendar/scrollgrid';
import { apiFetch } from '../../../lib/api';

export default function PlanningAdmin() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [openingPeriods, setOpeningPeriods] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]); 
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [slotDuration, setSlotDuration] = useState<number>(0); 
  const [availablePlans, setAvailablePlans] = useState<string[]>(['Standard']);
  const [blockType, setBlockType] = useState<'none' | 'all' | 'specific'>('none');
  const [blockUntilMs, setBlockUntilMs] = useState<number>(0);
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  const [timeBounds, setTimeBounds] = useState({ min: "08:00:00", max: "20:00:00" });
  const [activeTab, setActiveTab] = useState<'client' | 'note' | 'move'>('client');
  const [isGenerating, setIsGenerating] = useState(false);
  const [moveConfig, setMoveConfig] = useState({
    date: '',
    time: '',
    monitorId: 'random'
  });
  const [moveGroup, setMoveGroup] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  const dateRangeRef = useRef({ start: '', end: '' });

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);
  
  const [formData, setFormData] = useState<{
    title: string, flight_type_id: string, weightChecked: boolean, phone: string, email: string, notes: string, booking_options: string, client_message: string
  }>({
    title: '', flight_type_id: '', weightChecked: false, phone: '', email: '', notes: '', booking_options: '', client_message: ''
  });

  const [genConfig, setGenConfig] = useState({ 
    startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0], plan_name: 'Standard', monitor_id: 'all' 
  });

  const [groupSize, setGroupSize] = useState<number>(1);
  const [manualCounts, setManualCounts] = useState<Record<string, number>>({});
  const [isManual, setIsManual] = useState(false);

  const availableTimeGroups = useMemo(() => {
    if (!selectedEvent || !formData.flight_type_id) return [];
    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
    const startMs = new Date(selectedEvent.start).getTime();
    const dayStr = new Date(selectedEvent.start).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

    const allDayAvailable = appointments.filter(a =>
       a.status === 'available' &&
       new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === dayStr &&
       new Date(a.start_time).getTime() >= startMs
    );

    const validStartSlots: any[] = [];
    allDayAvailable.forEach(slot => {
       const sTime = new Date(slot.start_time).getTime();
       let canDoFlight = true;
       for(let i=0; i<slotsNeeded; i++) {
          const checkMs = sTime + (i * slotDuration * 60000);
          const hasSlot = allDayAvailable.find(x => x.monitor_id === slot.monitor_id && new Date(x.start_time).getTime() === checkMs);
          if (!hasSlot) { canDoFlight = false; break; }
       }
       if (canDoFlight) validStartSlots.push(slot);
    });

    const groups: Record<string, any[]> = {};
    validStartSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()).forEach(slot => {
      const timeStr = new Date(slot.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
      if (!groups[timeStr]) groups[timeStr] = [];
      groups[timeStr].push(slot);
    });

    return Object.keys(groups).map(time => ({ time, capacity: groups[time].length, slots: groups[time] })).sort((a, b) => a.time.localeCompare(b.time));
  }, [selectedEvent, formData.flight_type_id, appointments, flightTypes, slotDuration]);

  const displayDistribution = useMemo(() => {
     let remaining = groupSize;
     const result: {time: string, count: number, capacity: number, slots: any[]}[] = [];
     let canFit = true;

     if (!isManual) {
         for (const group of availableTimeGroups) {
             if (remaining <= 0) break;
             const take = Math.min(remaining, group.capacity);
             result.push({ ...group, count: take });
             remaining -= take;
         }
         if (remaining > 0) canFit = false;
         
         if (remaining <= 0 && availableTimeGroups[result.length]) {
             result.push({ ...availableTimeGroups[result.length], count: 0 });
         }
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
     
     const slotsToUse: any[] = [];
     result.forEach(r => { for(let i = 0; i < r.count; i++) slotsToUse.push(r.slots[i]); });

     return { items: result, canFit, slotsToUse };
  }, [availableTimeGroups, groupSize, manualCounts, isManual]);

  const handleMainChange = (delta: number) => {
      setGroupSize(prev => Math.max(1, prev + delta));
      setIsManual(false); 
  };

  const handleSubChange = (time: string, delta: number) => {
      setManualCounts(prev => {
          const newCounts = { ...prev };
          if (!isManual) displayDistribution.items.forEach((item: any) => newCounts[item.time] = item.count);
          
          const current = newCounts[time] || 0;
          const capacity = availableTimeGroups.find((g: any) => g.time === time)?.capacity || 0;
          newCounts[time] = Math.max(0, Math.min(capacity, current + delta));
          
          setGroupSize(Object.values(newCounts).reduce((a, b) => a + b, 0)); 
          setIsManual(true); 
          return newCounts;
      });
  };

  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadAppointments = async () => {
    const { start, end } = dateRangeRef.current;
    const url = start && end ? `/api/slots?start=${start}&end=${end}` : '/api/slots';
    try {
      const res = await apiFetch(url);
      if (res.ok) {
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
          setTimeBounds({ min: `${String(Math.max(0, minHour)).padStart(2, '0')}:00:00`, max: `${String(Math.min(24, maxHour)).padStart(2, '0')}:00:00` });
        }
      }
    } catch(e) { console.error("Erreur chargement créneaux:", e); }
  };

  const loadData = async () => {
    try {
      const [monRes, flightRes, settingsRes, defsRes] = await Promise.all([
        apiFetch('/api/monitors-admin'), 
        apiFetch('/api/flight-types'),
        apiFetch('/api/settings'),
        apiFetch('/api/slot-definitions')
      ]);

      if (defsRes.ok) {
        const defs = await defsRes.json();
        setSlotDefs(defs); 
        const plans = Array.from(new Set(defs.map((d: any) => d.plan_name || 'Standard'))) as string[];
        setAvailablePlans(plans.length > 0 ? plans : ['Standard']);
      }

      if (settingsRes.ok) {
        const s = await settingsRes.json();
        const periodsSetting = s.find((x: any) => x.key === 'opening_periods');
        if (periodsSetting && periodsSetting.value) {
          try { setOpeningPeriods(JSON.parse(periodsSetting.value)); } catch (e) {}
        }
      }
      
      if (monRes.ok) {
        const mons = await monRes.json();
        setMonitors(mons.map((m: any) => ({ id: String(m.id), title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
      
    } catch (err) { console.error("Erreur chargement planning:", err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEventClick = useCallback((info: any) => {
    if (currentUser?.role === 'monitor') return;
    
    if (currentUser?.role === 'permanent' && info.event.getResources()[0]?.id !== currentUser?.id?.toString()) {
      alert("Vous ne pouvez agir que sur votre propre colonne.");
      return;
    }

    const event = info.event;
    if (event.extendedProps.title?.startsWith('↪️ Suite')) {
      alert("⚠️ Pour modifier, déplacer ou supprimer ce vol, veuillez cliquer sur son premier créneau (celui contenant le nom du client).");
      return; 
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
    setSlotDuration(durationMins);

    setSelectedEvent({
      id: event.id, title: event.extendedProps.title, start: event.start, monitor_id: event.getResources()[0]?.id, ...event.extendedProps
    });

    const realTitle = event.extendedProps.title;
    
    setFormData({
      title: realTitle === 'NOTE' ? '' : (realTitle || ''),
      flight_type_id: event.extendedProps.flight_type_id || '',
      weightChecked: event.extendedProps.weight_checked || false,
      phone: event.extendedProps.phone || '', 
      email: event.extendedProps.email || '', 
      notes: event.extendedProps.notes || '',
      booking_options: event.extendedProps.booking_options || '',
      client_message: event.extendedProps.client_message || ''
    });

    const dStr = start.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const tStr = start.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    const mId = event.getResources()[0]?.id || 'random';
    
    setMoveConfig({ date: dStr, time: tStr, monitorId: mId });
    setActiveTab(currentUser?.role === 'admin' ? 'client' : 'note'); 
    setBlockType('none');
    setSelectedMonitors([]);
    setBlockUntilMs(end.getTime());
    setGroupSize(1);
    setManualCounts({});
    setIsManual(false);
    setMoveGroup(false);
    setShowEditModal(true);
  }, [currentUser]);

  const handleSaveNote = async () => {
    if (!selectedEvent) return;

    let targetMonitors: string[] = [];
    let slotsToUpdate: any[] = [];
    let isNonBlockingNote = false;
    let selectedFlight: any = null;
    let slotsNeeded = 1;

    if (activeTab === 'note') {
      isNonBlockingNote = (formData.title !== 'NON DISPO');
      targetMonitors = blockType === 'all' ? monitors.map(m => m.id.toString()) : blockType === 'specific' ? selectedMonitors : [selectedEvent.monitor_id?.toString()];
      const startMs = new Date(selectedEvent.start).getTime();
      slotsToUpdate = appointments.filter(a => {
        if (!targetMonitors.includes(a.monitor_id?.toString())) return false; 
        const aTime = new Date(a.start_time).getTime();
        return aTime >= startMs && aTime < blockUntilMs;
      });

      if (!isNonBlockingNote) {
        // 🎯 FIX: Syntaxe TypeScript sécurisée
        const hasClientBooking = slotsToUpdate.some(slot => slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].some(t => slot.title?.includes(t)) && !slot.title?.includes('❌'));
        if (hasClientBooking) return alert("❌ Impossible de bloquer : Un ou plusieurs clients sont déjà réservés.");
      }
    } else {
      if (!formData.title || formData.title.trim() === '') return alert("❌ Le nom du contact est obligatoire pour une réservation.");
      if (!formData.flight_type_id) return alert("❌ Veuillez choisir un type de vol.");
      if (!formData.phone || formData.phone.trim() === '') return alert("❌ Le numéro de téléphone est obligatoire.");
      selectedFlight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
      const flightDuration = selectedFlight?.duration_minutes || selectedFlight?.duration || 0;
      slotsNeeded = (selectedFlight?.allow_multi_slots && slotDuration > 0 && flightDuration > slotDuration) ? Math.ceil(flightDuration / slotDuration) : 1;
    }

    const updatesToApply: any[] = [];

    if (activeTab === 'note') {
      slotsToUpdate.forEach(slot => {
        let payload: any = { title: isNonBlockingNote ? 'NOTE' : 'NON DISPO', notes: formData.notes, status: isNonBlockingNote ? 'available' : 'booked' };
        if (isNonBlockingNote) {
          // 🎯 FIX: Syntaxe TypeScript sécurisée
          const isClientSlot = slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].some(t => slot.title?.includes(t)) && !slot.title?.includes('❌');
          if (isClientSlot) {
            payload.title = slot.title; 
            payload.status = slot.status;
            payload.notes = formData.notes;
            payload.flight_type_id = slot.flight_type_id; 
            payload.phone = slot.phone; 
            payload.email = slot.email; 
            payload.weightChecked = slot.weight_checked || slot.weightChecked; 
            payload.booking_options = slot.booking_options; 
            payload.client_message = slot.client_message; 
            payload.weight = slot.weight;
          } else {
            payload.flight_type_id = null; payload.phone = ''; payload.email = ''; payload.weightChecked = false; payload.booking_options = ''; payload.client_message = '';
          }
        } else {
           payload.flight_type_id = null; payload.phone = ''; payload.email = ''; payload.weightChecked = false; payload.booking_options = ''; payload.client_message = '';
        }
        updatesToApply.push({ id: slot.id, data: payload });
      });
    } else {
      if (groupSize > 1 || isManual) {
        if (!displayDistribution || !displayDistribution.canFit || displayDistribution.slotsToUse.length === 0) {
          return alert("❌ Pas assez de créneaux disponibles ou aucune place sélectionnée.");
        }
        displayDistribution.slotsToUse.forEach((baseSlot: any, index: number) => {
          let passengerTitle = '';
          const namesList = formData.title.split(',').map(n => n.trim()).filter(n => n);

          if (namesList.length === groupSize + 1) {
            const booker = namesList[0]; 
            const passName = namesList[index + 1]; 
            passengerTitle = `${passName} (${booker})`;
          } else if (namesList.length > 0) {
            const booker = namesList[0];
            if (index === 0) {
              passengerTitle = booker; 
            } else if (namesList[index]) {
              passengerTitle = `${namesList[index]} (${booker})`; 
            } else {
              passengerTitle = `Passager ${index + 1} (${booker})`; 
            }
          } else {
            passengerTitle = groupSize > 1 ? `Passager ${index + 1}` : (formData.title || '');
          }
              
          updatesToApply.push({ id: baseSlot.id, data: { ...formData, title: passengerTitle, status: 'booked' } });

          if (slotsNeeded > 1) {
            const baseStartMs = new Date(baseSlot.start_time).getTime();
            for (let i = 1; i < slotsNeeded; i++) {
              const nextMs = baseStartMs + (i * slotDuration * 60000);
              const nextSlot = appointments.find(a => a.monitor_id?.toString() === baseSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs && a.status === 'available');
              if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${passengerTitle}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
            }
          }
        });
      } else {
        if (slotsNeeded > 1) {
          updatesToApply.push({ id: selectedEvent.id, data: { ...formData, title: formData.title, status: 'booked' } });
          const startMs = new Date(selectedEvent.start).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nextMs = startMs + (i * slotDuration * 60000);
            const nextSlot = appointments.find(a => a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs && a.status === 'available');
            if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${formData.title || 'Vol'}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
          }
        } else {
          updatesToApply.push({ id: selectedEvent.id, data: { ...formData, title: formData.title, status: formData.title.trim() ? 'booked' : 'available' } });
        }
      }
    }

    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      await loadAppointments(); 
    } catch (err) { console.error("Erreur de sauvegarde silencieuse"); }
  };

  const handleRelease = async () => {
    const isNoteOnly = selectedEvent?.status === 'available' && selectedEvent?.title === 'NOTE';
    const confirmMsg = isNoteOnly 
      ? "🗑️ Voulez-vous vraiment effacer cette note ?"
      : "🗑️ Action irréversible. Libérer ce créneau ?\n\n(Les notes éventuelles seront conservées)";
      
    if (!selectedEvent || !confirm(confirmMsg)) return;

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;

    const startMs = new Date(selectedEvent.start).getTime();
    const updatesToApply: any[] = [];
    
    for (let i = 0; i < slotsNeeded; i++) {
      const ms = startMs + (i * slotDuration * 60000);
      const slotToFree = appointments.find(a =>
         a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
         new Date(a.start_time).getTime() === ms &&
         (i === 0 || a.title?.startsWith('↪️ Suite'))
      );
      
      if (slotToFree) {
        // 🎯 FIX: Syntaxe TypeScript sécurisée
        const isClientSlot = slotToFree.status === 'booked' && slotToFree.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].some(t => slotToFree.title?.includes(t)) && !slotToFree.title?.includes('❌');
        
        let newTitle = '';
        let newNotes = '';
        
        if (isClientSlot && i === 0 && slotToFree.notes && slotToFree.notes !== 'Extension auto') {
          newTitle = 'NOTE';
          newNotes = slotToFree.notes;
        }

        updatesToApply.push({
          id: slotToFree.id,
          data: { title: newTitle, flight_type_id: null, weight: null, notes: newNotes, status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' }
        });
      }
    }

    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      await loadAppointments(); 
    } catch (err) { console.error(err); }
  };

  const handleReleaseGroup = async () => {
    if (!selectedEvent || !confirm(`🧹 Action irréversible. Libérer les ${groupRootSlots.length} créneaux de ce groupe ?`)) return;

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;

    const updatesToApply: any[] = [];

    groupRootSlots.forEach(baseSlot => {
      const startMs = new Date(baseSlot.start_time).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = startMs + (i * slotDuration * 60000);
        const slotToFree = appointments.find(a =>
           a.monitor_id?.toString() === baseSlot.monitor_id?.toString() &&
           new Date(a.start_time).getTime() === ms &&
           (i === 0 || a.title?.startsWith('↪️ Suite'))
        );
        if (slotToFree) {
          updatesToApply.push({
            id: slotToFree.id,
            data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' }
          });
        }
      }
    });

    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      await loadAppointments(); 
    } catch (err) { console.error(err); }
  };

  const handleBulkRelease = async () => {
    if (!selectedEvent) return;

    const isPlural = blockType === 'all' || 
                     (blockType === 'specific' && selectedMonitors.length > 1) || 
                     (upcomingBlockingSlots.length > 0 && blockUntilMs > new Date(upcomingBlockingSlots[0].end_time).getTime());

    const confirmMsg = isPlural 
      ? "🧹 Voulez-vous vraiment effacer les notes et blocages sur TOUTE la sélection (Pilotes + Durée) ?\n\n(Les réservations clients existantes seront conservées, seules les notes/blocages seront retirés)."
      : "🗑️ Voulez-vous vraiment effacer la note / le blocage de ce créneau ?\n\n(Si un client est présent, il sera conservé).";

    if (!confirm(confirmMsg)) return;

    const targetMonitors = blockType === 'all' ? monitors.map(m => m.id.toString()) : blockType === 'specific' ? selectedMonitors : [selectedEvent.monitor_id?.toString()];
    const startMs = new Date(selectedEvent.start).getTime();

    const slotsToUpdate = appointments.filter(a => {
      if (!targetMonitors.includes(a.monitor_id?.toString())) return false;
      const aTime = new Date(a.start_time).getTime();
      return aTime >= startMs && aTime < blockUntilMs;
    });

    const updatesToApply: any[] = [];
    slotsToUpdate.forEach(slot => {
      // 🎯 FIX: Syntaxe TypeScript sécurisée
      const isClientSlot = slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].some(t => slot.title?.includes(t)) && !slot.title?.includes('❌');
      
      if (isClientSlot) {
        updatesToApply.push({ 
          id: slot.id, 
          data: { 
            title: slot.title, status: slot.status, notes: '', flight_type_id: slot.flight_type_id, phone: slot.phone,
            email: slot.email, weightChecked: slot.weight_checked || slot.weightChecked, booking_options: slot.booking_options, client_message: slot.client_message, weight: slot.weight 
          } 
        });
      } else {
        updatesToApply.push({ id: slot.id, data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    });

    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      await loadAppointments(); 
    } catch (err) { console.error(err); }
  };

  const groupRootSlots = useMemo(() => {
    if (!selectedEvent || selectedEvent.status !== 'booked' || selectedEvent.title?.startsWith('↪️ Suite')) return [];
    const phone = selectedEvent.phone;
    const baseTitle = selectedEvent.title?.replace(/\s*\(\d+\/\d+\)$/, '').trim();
    if (!phone && !baseTitle) return [selectedEvent]; 

    const dStr = new Date(selectedEvent.start).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const rootSlots = appointments.filter(a => {
      if (a.status !== 'booked' || a.title?.startsWith('↪️ Suite')) return false;
      const aDate = new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
      if (aDate !== dStr) return false;
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
    const startMs = new Date(selectedEvent.start).getTime();
    const ids = [selectedEvent.id];
    for (let i = 1; i < slotsNeeded; i++) {
      const ms = startMs + (i * slotDuration * 60000);
      const slot = appointments.find(a =>
         a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
         new Date(a.start_time).getTime() === ms &&
         a.title?.startsWith('↪️ Suite')
      );
      if (slot) ids.push(slot.id);
    }
    return ids;
  }, [selectedEvent, flightTypes, slotDuration, appointments]);

  const parsedOpeningPeriods = useMemo(() => {
    return openingPeriods.map(p => {
      if (!p.start || !p.end) return null;
      const s = new Date(p.start); s.setHours(0, 0, 0, 0);
      const e = new Date(p.end); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }).filter(Boolean);
  }, [openingPeriods]);

  const availableTargetSlots = useMemo(() => {
    return appointments.filter(a => {
      if (a.status !== 'available' && !currentBookingSlotIds.includes(a.id)) return false; 
      
      if (parsedOpeningPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        const inSeason = parsedOpeningPeriods.some(p => p && slotDate >= p.start && slotDate <= p.end);
        if (!inSeason) return false;
      }
      
      const d = new Date(a.start_time);
      const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
      if (dateStr !== moveConfig.date) return false;
      if (moveConfig.monitorId !== 'random' && a.monitor_id?.toString() !== moveConfig.monitorId) return false;
      if (formData.flight_type_id) {
        const flight = flightTypes?.find(f => f.id?.toString() === formData.flight_type_id?.toString());
        if (flight) {
          const flightDur = flight.duration_minutes || flight.duration || 0;
          const isMultiSlotAllowed = flight.allow_multi_slots === true;
          const slotsNeeded = (isMultiSlotAllowed && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
          if (slotsNeeded > 1) {
            const startMs = new Date(a.start_time).getTime();
            for (let i = 1; i < slotsNeeded; i++) {
              const nextMs = startMs + (i * slotDuration * 60000);
              const nextSlot = appointments.find(appt =>
                appt.monitor_id?.toString() === a.monitor_id?.toString() &&
                new Date(appt.start_time).getTime() === nextMs &&
                (appt.status === 'available' || currentBookingSlotIds.includes(appt.id))
              );
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

  const availableTimes = useMemo(() => {
    return Array.from(new Set(availableTargetSlots.map(a => {
      const d = new Date(a.start_time);
      return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    }))).sort();
  }, [availableTargetSlots]);

  useEffect(() => {
    if (moveConfig.time && !availableTimes.includes(moveConfig.time)) {
      setMoveConfig(prev => ({ ...prev, time: '' }));
    }
  }, [availableTimes]);

  const smartFlightOptions = useMemo(() => {
    const dateStr = selectedEvent?.start ? selectedEvent.start.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) : '';
    const planSchedules: Record<string, Set<string>> = {};
    slotDefs.forEach(d => {
      const pName = d.plan_name || 'Standard';
      if (!planSchedules[pName]) planSchedules[pName] = new Set();
      const t = typeof d.start_time === 'string' ? d.start_time.substring(0, 5) : '';
      if (t) planSchedules[pName].add(t);
    });
    const dayTimesArray = appointments.filter(a => {
      const d = new Date(a.start_time);
      return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === dateStr;
    }).map(a => {
      const d = new Date(a.start_time);
      return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    });
    let inferredPlan = 'Standard';
    let maxMatches = -1;
    for (const [pName, pSet] of Object.entries(planSchedules)) {
      let matches = 0;
      dayTimesArray.forEach(t => { if (pSet.has(t)) matches++; });
      if (matches > maxMatches) { maxMatches = matches; inferredPlan = pName; }
    }
    const activePlanTimes = planSchedules[inferredPlan] || new Set();
    return flightTypes?.filter(f => {
      const allowed = Array.isArray(f.allowed_time_slots) ? f.allowed_time_slots : [];
      if (allowed.length === 0) return true;
      return allowed.some((t: string) => activePlanTimes.has(t));
    }) || [];
  }, [selectedEvent, slotDefs, appointments, flightTypes]);

  const upcomingBlockingSlots = useMemo(() => {
    if (!selectedEvent) return [];
    const startMs = new Date(selectedEvent.start).getTime();
    const sDate = new Date(selectedEvent.start).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    return appointments
      .filter(a =>
        a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
        new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === sDate &&
        new Date(a.start_time).getTime() >= startMs
      )
      .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());
  }, [appointments, selectedEvent]);

  const handleMove = async () => {
    if (!moveConfig.time || !selectedEvent) return;

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;

    const updatesToApply: any[] = [];

    if (moveGroup && groupRootSlots.length > 1) {
      const slotsToFree: any[] = [];
      groupRootSlots.forEach(baseSlot => {
        slotsToFree.push(baseSlot.id);
        if (slotsNeeded > 1) {
           const bMs = new Date(baseSlot.start_time).getTime();
           for(let i=1; i<slotsNeeded; i++) {
              const nMs = bMs + (i * slotDuration * 60000);
              const nSlot = appointments.find(a => a.monitor_id === baseSlot.monitor_id && new Date(a.start_time).getTime() === nMs);
              if (nSlot) slotsToFree.push(nSlot.id);
           }
        }
      });

      const targetDateStr = moveConfig.date;
      const [targetHour, targetMin] = moveConfig.time.split(':').map(Number);
      const targetTimeMs = (targetHour * 60 + targetMin) * 60000;

      const allDayAvailable = appointments.filter(a => {
        const isFreedNow = slotsToFree.includes(a.id);
        if (a.status !== 'available' && !isFreedNow) return false;
        const d = new Date(a.start_time);
        if (d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) !== targetDateStr) return false;
        if ((d.getHours() * 60 + d.getMinutes()) * 60000 < targetTimeMs) return false;
        if (moveConfig.monitorId !== 'random' && a.monitor_id?.toString() !== moveConfig.monitorId) return false;
        return true;
      });

      const validStartSlots: any[] = [];
      allDayAvailable.forEach(slot => {
        const sTime = new Date(slot.start_time).getTime();
        let canDoFlight = true;
        for(let i=0; i<slotsNeeded; i++) {
          const checkMs = sTime + (i * slotDuration * 60000);
          if (!allDayAvailable.find(x => x.monitor_id === slot.monitor_id && new Date(x.start_time).getTime() === checkMs)) { canDoFlight = false; break; }
        }
        if (canDoFlight) validStartSlots.push(slot);
      });

      validStartSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

      let remaining = groupRootSlots.length;
      const assignedSlots: any[] = [];
      
      for (const slot of validStartSlots) {
        if (remaining === 0) break;
        const sTime = new Date(slot.start_time).getTime();
        const conflict = assignedSlots.some(a => a.monitor_id === slot.monitor_id && Math.abs(new Date(a.start_time).getTime() - sTime) < (slotsNeeded * slotDuration * 60000));
        if (!conflict) { assignedSlots.push(slot); remaining--; }
      }

      if (remaining > 0) return alert(`❌ Impossible : Pas assez de créneaux simultanés pour placer les ${groupRootSlots.length} passagers à partir de ${moveConfig.time}.`);
      
      const isExactlySame = assignedSlots.length === groupRootSlots.length && assignedSlots.every((s, i) => s.id === groupRootSlots[i].id);
      if (isExactlySame) return alert("ℹ️ Le groupe est déjà assigné exactement à ces mêmes créneaux et pilotes.");

      slotsToFree.forEach(id => {
        updatesToApply.push({ id, data: { status: 'available', title: '', phone: '', email: '', flight_type_id: null } });
      });

      groupRootSlots.forEach((oldSlot, g) => {
        const newBaseSlot = assignedSlots[g];
        const passengerTitle = oldSlot.title || formData.title;
        updatesToApply.push({ id: newBaseSlot.id, data: { ...formData, title: passengerTitle, status: 'booked', notes: oldSlot.notes, payment_status: oldSlot.payment_status } });

        if (slotsNeeded > 1) {
          const baseStartMs = new Date(newBaseSlot.start_time).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nextMs = baseStartMs + (i * slotDuration * 60000);
            const nextSlot = allDayAvailable.find(a => a.monitor_id?.toString() === newBaseSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs);
            if (nextSlot) updatesToApply.push({ id: nextSlot.id, data: { title: `↪️ Suite ${passengerTitle}`, flight_type_id: formData.flight_type_id, status: 'booked', notes: 'Extension auto' } });
          }
        }
      });

    } else {
      const targetDateStr = moveConfig.date;
      const [targetHour, targetMin] = moveConfig.time.split(':').map(Number);
      const targetTimeMs = (targetHour * 60 + targetMin) * 60000;

      const targetSlot = availableTargetSlots.find(a => {
        const d = new Date(a.start_time);
        return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === targetDateStr &&
               (d.getHours() * 60 + d.getMinutes()) * 60000 === targetTimeMs &&
               (moveConfig.monitorId === 'random' || a.monitor_id?.toString() === moveConfig.monitorId);
      });

      if (!targetSlot) return alert("❌ Le créneau cible n'est plus disponible.");
      
      if (targetSlot.id === selectedEvent.id) {
          return alert("ℹ️ Le créneau est déjà à cet emplacement avec ce pilote.");
      }

      currentBookingSlotIds.forEach(id => {
        updatesToApply.push({ id, data: { status: 'available', title: '', phone: '', email: '', flight_type_id: null } });
      });

      const newStartMs = new Date(targetSlot.start_time).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = newStartMs + (i * slotDuration * 60000);
        const slotToBook = appointments.find(a => a.monitor_id?.toString() === targetSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === ms);
        
        if (slotToBook) {
          updatesToApply.push({ 
            id: slotToBook.id, 
            data: { 
              ...formData, 
              title: i === 0 ? formData.title : `↪️ Suite ${formData.title || 'Vol'}`, 
              status: 'booked', 
              notes: i === 0 ? formData.notes : 'Extension auto',
              payment_status: selectedEvent.payment_status
            } 
          });
        }
      }
    }

    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      await loadAppointments(); 
    } catch (err) { console.error(err); }
  };

  const isEventBlocked = selectedEvent && (
    selectedEvent.title?.includes('☕') || 
    selectedEvent.title?.toUpperCase().includes('PAUSE') || 
    selectedEvent.title?.includes('❌') || 
    selectedEvent.title?.toUpperCase().includes('NON DISPO')
  );

  const isOutOfSeason = selectedEvent?.isOutOfSeason === true;
  const isClientLocked = isEventBlocked || isOutOfSeason;
  const isClientSlotLocal = selectedEvent?.status === 'booked' && selectedEvent?.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].some((t: string) => selectedEvent?.title?.includes(t)) && !selectedEvent?.title?.includes('❌');
  const isAdminBlockLocal = selectedEvent?.title?.includes('(Admin)');
  const isLockedForMe = currentUser?.role === 'permanent' && (isClientSlotLocal || isAdminBlockLocal);

  const calendarEvents = useMemo(() => {
    return appointments.map(a => {
      const flight = flightTypes?.find(f => f.id === a.flight_type_id);
      const flightColor = flight?.color_code || '#0ea5e9'; 

      let isSlotOutOfSeason = false;
      if (parsedOpeningPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        isSlotOutOfSeason = !parsedOpeningPeriods.some(p => p && slotDate >= p.start && slotDate <= p.end);
      }

      const isPause = a.title?.includes('☕') || a.title?.toUpperCase().includes('PAUSE');
      const isAlert = a.title?.includes('❌') || a.title?.toUpperCase().includes('NON DISPO');
      
      const isEmptyAndOOS = isSlotOutOfSeason && !a.title && !a.notes && a.status === 'available';

      let displayTitle = a.title || (isEmptyAndOOS ? 'HORS SAISON' : (a.status === 'available' ? 'LIBRE' : ''));
      
      if (a.phone) displayTitle += ' 📞';
      if (a.booking_options) displayTitle += ' 📸'; 
      if (a.client_message) displayTitle += ' 💬';
      if (a.notes && a.notes.trim() !== '') displayTitle += ' 📝'; 

      return {
        id: a.id?.toString() || Math.random().toString(),
        resourceId: a.monitor_id?.toString() || "",
        start: a.start_time,
        end: a.end_time,
        title: displayTitle,
        backgroundColor: isPause ? '#f1f5f9'
                       : isAlert ? '#fee2e2'
                       : isEmptyAndOOS ? '#f8fafc' 
                       : (a.status === 'available' ? '#ffffff' : flightColor),
        textColor: a.status === 'available' ? (a.title === 'NOTE' ? '#f59e0b' : (isEmptyAndOOS ? '#94a3b8' : '#cbd5e1')) 
                 : isPause ? '#94a3b8' 
                 : isAlert ? '#ef4444' 
                 : '#ffffff',
        borderColor: a.status === 'available' ? (a.title === 'NOTE' ? '#fcd34d' : '#e2e8f0') 
                   : isAlert ? '#fca5a5' 
                   : flightColor,
        extendedProps: { ...a, isOutOfSeason: isSlotOutOfSeason }
      };
    });
  }, [appointments, flightTypes, parsedOpeningPeriods]);

  const memoizedCalendar = useMemo(() => {
    return (
        <FullCalendar
          ref={calendarRef}
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[resourceTimeGridPlugin, interactionPlugin, scrollgridPlugin]}
          initialView="resourceTimeGridDay"
          resources={monitors}
          datesSet={(arg) => {
            setCurrentDate(arg.startStr.split('T')[0]);
            
            const start = new Date(arg.view.activeStart);
            start.setDate(start.getDate() - 15);
            const end = new Date(arg.view.activeEnd);
            end.setDate(end.getDate() + 15);

            dateRangeRef.current = { start: start.toISOString(), end: end.toISOString() };
            loadAppointments(); 
          }}
          events={calendarEvents}
          locale={frLocale}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridFourDay' }}
          views={{ resourceTimeGridFourDay: { type: 'resourceTimeGrid', duration: { days: 4 }, buttonText: '4 jours' } }}
          slotMinTime={timeBounds.min}
          slotMaxTime={timeBounds.max}
          allDaySlot={false}
          height="auto"
          eventClick={handleEventClick}
          slotDuration="00:15:00" 
          snapDuration="00:05:00"
          eventOverlap={false}
          slotEventOverlap={false}
          displayEventTime={true}
          eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false }}
          dayMinWidth={130} 
        />
    );
  }, [calendarEvents, monitors, timeBounds, handleEventClick]);

    
    return (
    <div className="p-2 md:p-4 bg-slate-50 min-h-screen">
      
      <style dangerouslySetInnerHTML={{ __html: `
        .fc-scrollgrid-section-header .fc-scroller {
          overflow-x: hidden !important;
          touch-action: pan-y !important;
        }

        @media (max-width: 768px) {
          .fc-header-toolbar { flex-direction: column !important; gap: 12px; }
          .fc-toolbar-title { font-size: 1.2rem !important; }
          .fc-button { padding: 0.3em 0.6em !important; font-size: 0.85em !important; }
        }
      `}} />

      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-8 px-2 md:px-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 text-center md:text-left">
            Planning <span className="text-sky-500">Vols</span>
          </h1>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl px-4 py-1 shadow-sm hover:border-sky-300 transition-colors">
            <span className="text-xl mr-2">📅</span>
            <input 
              type="date"
              className="bg-transparent font-bold text-sm text-slate-700 outline-none cursor-pointer"
              value={currentDate}
              onChange={(e) => {
                const newDate = e.target.value;
                setCurrentDate(newDate);
                if (calendarRef.current) {
                  calendarRef.current.getApi().gotoDate(newDate);
                }
              }}
            />
          </div>

          <button 
            onClick={() => setShowGenModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-transform"
          >
            ⚙️ Générer la semaine
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl md:rounded-[35px] shadow-2xl border border-slate-200 p-2 md:p-6 overflow-hidden">
        {memoizedCalendar}
      </div>

      {showEditModal && (
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
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold text-sm" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Julien, Christophe, Alexandre..." />
                      <span className="text-[9px] text-slate-400 ml-2 mt-1 block leading-tight">
                        💡 <b>Astuce :</b> Le 1er nom est le contact. Séparez par des virgules.<br/>
                        <i>Ex (3 places) : "léo, Alex, Paul, Léa" ➔ léo ne vole pas, Alex, Paul et Léa volent.</i><br/>
                        <i>Ex (3 places) : "léo, Alex, Paul" ➔ léo, Alex et Paul volent.</i>
                      </span>
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type de Vol</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.flight_type_id} onChange={e => setFormData({...formData, flight_type_id: e.target.value})}>
                        <option value="">Choisir un vol...</option>
                        {smartFlightOptions.map(f => {
                          const flightDuration = f.duration_minutes || f.duration || 0; 
                          const isMultiSlotAllowed = f.allow_multi_slots === true;
                          const slotsNeeded = (isMultiSlotAllowed && slotDuration > 0 && flightDuration > slotDuration) ? Math.ceil(flightDuration / slotDuration) : 1;
                          
                          let canFit = true;
                          let reason = '';

                          if (isMultiSlotAllowed && slotsNeeded > 1) {
                            const startMs = new Date(selectedEvent?.start).getTime();
                            for (let i = 1; i < slotsNeeded; i++) {
                              const nextMs = startMs + (i * slotDuration * 60000);
                              const nextSlot = appointments.find(a => a.monitor_id?.toString() === selectedEvent?.monitor_id?.toString() && new Date(a.start_time).getTime() === nextMs && a.status === 'available');
                              if (!nextSlot) { canFit = false; reason = `(Bloqué : nécessite ${slotsNeeded} créneaux)`; break; }
                            }
                          } else if (!isMultiSlotAllowed && flightDuration > slotDuration) {
                             canFit = false; reason = `(Trop long : ${flightDuration} min)`;
                          }

                          let slotTimeStr = '';
                          if (selectedEvent?.start) {
                            slotTimeStr = selectedEvent.start.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
                          }

                          const allowedSlots = Array.isArray(f.allowed_time_slots) ? f.allowed_time_slots : [];
                          const isAllowedTime = allowedSlots.length === 0 || allowedSlots.includes(slotTimeStr);
                          
                          const isDisabled = !canFit || !isAllowedTime;
                          if (!isAllowedTime && canFit) reason = `(Interdit à ${slotTimeStr})`;

                          return (
                            <option key={f.id?.toString()} value={f.id} disabled={isDisabled} className={isDisabled ? "text-slate-300 bg-slate-100" : "text-slate-900"}>
                              {f.name} - {f.price_cents ? f.price_cents/100 : 0}€ {reason}
                            </option>
                          );
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
                                  <span className={`uppercase tracking-wider text-[10px] font-black ${isManual ? 'text-indigo-800' : 'text-emerald-800'} opacity-70`}>
                                    {isManual ? '⚙️ Répartition Manuelle :' : '✅ Répartition Automatique :'}
                                  </span>
                                  {isManual && (
                                    <button onClick={() => { setIsManual(false); setGroupSize(groupSize); }} className="text-[9px] uppercase font-bold text-indigo-500 hover:text-indigo-700 bg-white px-2 py-1 rounded-md border border-indigo-100 transition-all shadow-sm">
                                      ↻ Remettre en auto
                                    </button>
                                  )}
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
                                        <span className="text-sm font-medium text-slate-700">
                                          à <strong>{d.time}</strong>
                                        </span>
                                      </div>
                                      <span className="text-[10px] font-bold text-slate-400 uppercase">
                                        ({d.capacity} max)
                                      </span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <span className="flex items-center gap-2 text-rose-800 text-xs font-bold">
                                <span className="text-xl">❌</span> 
                                Capacité insuffisante pour {groupSize} passager(s).
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    )}

                    {formData.flight_type_id && (() => {
                      const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
                      const wMin = flight?.weight_min ?? 20;
                      const wMax = flight?.weight_max ?? 110;
                      return (
                        <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors ${formData.weightChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                          <input type="checkbox" className={`w-6 h-6 mt-0.5 ${formData.weightChecked ? 'accent-emerald-500' : 'accent-rose-500'}`} checked={formData.weightChecked} onChange={e => setFormData({...formData, weightChecked: e.target.checked})} />
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
                          <div className="w-full flex items-center justify-center gap-2 text-[10px] bg-slate-100 text-slate-400 py-2 rounded-xl font-black uppercase">
                            📞 Téléphone <span className="text-rose-500 -ml-1">*</span>
                          </div>
                        )}
                        <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-emerald-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors text-center" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="06 12 34 56 78" />
                      </div>

                      <div className="flex flex-col gap-1.5">
                        {formData.email ? (
                          <a href={`mailto:${formData.email}`} className="w-full flex items-center justify-center gap-2 text-[10px] bg-sky-100 text-sky-700 py-2 rounded-xl font-black uppercase hover:bg-sky-200 transition-colors shadow-sm">✉️ Écrire</a>
                        ) : (
                          <div className="w-full flex items-center justify-center gap-2 text-[10px] bg-slate-100 text-slate-400 py-2 rounded-xl font-black uppercase">✉️ Écrire</div>
                        )}
                        <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors text-center" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Email (Optionnel)" />
                      </div>
                    </div>

                    {(formData.booking_options || formData.client_message) && (
                      <div className="mt-4 pt-4 border-t border-slate-100 space-y-3">
                        {formData.booking_options && (
                          <div className="bg-sky-50 p-3 rounded-2xl border border-sky-100 flex items-start gap-3">
                            <span className="text-xl mt-1">📸</span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-sky-500 mb-0.5">Options choisies</p>
                              <p className="font-bold text-sky-900 text-sm leading-tight">{formData.booking_options}</p>
                            </div>
                          </div>
                        )}
                        {formData.client_message && (
                          <div className="bg-slate-50 p-3 rounded-2xl border border-slate-100 flex items-start gap-3">
                            <span className="text-xl mt-1">💬</span>
                            <div>
                              <p className="text-[10px] font-black uppercase text-slate-400 mb-0.5">Message du client</p>
                              <p className="font-medium text-slate-700 text-sm italic leading-tight">"{formData.client_message}"</p>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )
              )}

              {activeTab === 'note' && (
                isLockedForMe ? (
                  <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 text-center mt-4 shadow-inner">
                    <span className="text-3xl block mb-2">🔒</span>
                    <p className="text-slate-700 font-bold text-[11px] uppercase tracking-widest">{isAdminBlockLocal ? "Verrouillé par la direction" : "Réservation Client"}</p>
                    <p className="text-slate-500 text-[10px] mt-2 font-medium">Vous ne pouvez pas modifier ce créneau.</p>
                  </div>
                ) : (
                <>
                  <div className="flex gap-2 mb-4">
                    <button disabled={isOutOfSeason} onClick={() => setFormData({...formData, title: 'NOTE'})} className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title !== 'NON DISPO' ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-200')}`}>📝 Note simple (Reste libre)</button>
                    <button disabled={isOutOfSeason} onClick={() => setFormData({...formData, title: 'NON DISPO'})} className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title === 'NON DISPO' ? 'bg-rose-100 border-rose-400 text-rose-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-rose-200')}`}>❌ Bloquer (Non dispo)</button>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Note interne au pilote</label>
                    <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Infos météo, retard..." />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                   <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Cible (Qui ?)</label>
                    <select className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all mb-4 ${isOutOfSeason || currentUser?.role !== 'admin' ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} value={blockType} onChange={(e: any) => setBlockType(e.target.value)} disabled={isOutOfSeason || currentUser?.role !== 'admin'}>
                      <option value="none">Ce pilote uniquement</option>
                      {currentUser?.role === 'admin' && (
                        <><option value="all">🚫 TOUS les pilotes</option><option value="specific">👥 Certains pilotes</option></>
                      )}
                    </select>

                    {blockType === 'specific' && !isOutOfSeason && currentUser?.role === 'admin' && (
                      <div className="mb-4 grid grid-cols-2 gap-2">
                        {monitors.map(m => (
                          <label key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold cursor-pointer hover:bg-slate-50">
                            <input type="checkbox" className="accent-amber-500" checked={selectedMonitors.includes(m.id.toString())} onChange={(e) => { const id = m.id.toString(); setSelectedMonitors(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id)); }}/>
                            {m.title}
                          </label>
                        ))}
                      </div>
                    )}

                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Durée (Jusqu'à quand ?)</label>
                    {selectedEvent && (
                        <select className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all ${isOutOfSeason ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} value={blockUntilMs} onChange={(e: any) => setBlockUntilMs(Number(e.target.value))} disabled={isOutOfSeason}>
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
                              const btnText = !isBlock ? (isPlural ? "🧹 Effacer les notes sélectionnées" : "🗑️ Effacer la note") : (isPlural ? "🧹 Libérer les créneaux sélectionnés" : "🗑️ Libérer le créneau");
                              return (
                                <button onClick={handleBulkRelease} className={`w-full font-black uppercase italic tracking-widest transition-all rounded-xl py-3 shadow-sm ${isPlural ? 'bg-rose-50 text-rose-600 hover:bg-rose-500 hover:text-white text-[10px]' : 'bg-white text-rose-500 border border-rose-200 hover:bg-rose-50 text-[10px]'}`}>{btnText}</button>
                              );
                            })()}
                          </div>
                        ) : (
                          <div className="flex gap-2 pt-2">
                            {(() => {
                              const isNoteOnly = selectedEvent?.status === 'available' && selectedEvent?.title === 'NOTE';
                              const hasNote = !!selectedEvent?.notes && selectedEvent?.notes !== 'Extension auto';
                              return (
                                <>
                                  <button onClick={handleRelease} className="flex-1 text-rose-500 font-black uppercase italic text-[9px] tracking-widest hover:text-rose-600 hover:bg-rose-50 border border-rose-100 rounded-xl transition-colors py-2 shadow-sm">{isNoteOnly ? "🗑️ Effacer la note" : (hasNote ? "🗑️ Libérer (Garder note)" : "🗑️ Libérer ce créneau")}</button>
                                  {groupRootSlots.length > 1 && (<button onClick={handleReleaseGroup} className="flex-1 bg-rose-50 border border-rose-200 text-rose-600 rounded-xl font-black uppercase italic text-[9px] tracking-widest hover:bg-rose-500 hover:text-white transition-colors py-2 shadow-sm">🧹 Libérer groupe ({groupRootSlots.length})</button>)}
                                </>
                              );
                            })()}
                          </div>
                        )
                      )}
                    </>
                  )}
                  <button onClick={() => setShowEditModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600 pt-2">Fermer sans sauvegarder</button>
                </div>
              )}

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
                      <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.date} onChange={e => setMoveConfig({...moveConfig, date: e.target.value})} />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Créneau disponible</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.time} onChange={e => setMoveConfig({...moveConfig, time: e.target.value})}>
                        <option value="">Choisir une heure...</option>
                        {availableTimes.map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pilote</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.monitorId} onChange={e => setMoveConfig({...moveConfig, monitorId: e.target.value})}>
                        <option value="random">🎲 Aléatoire (Peu importe)</option>
                        {monitors.map(m => {
                          let isBusy = false;
                          if (moveConfig.date && moveConfig.time) {
                            const flight = flightTypes.find(f => f.id?.toString() === formData.flight_type_id?.toString());
                            const flightDur = flight?.duration_minutes || flight?.duration || 0;
                            const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;
                            const targetSlot = appointments.find(a => {
                              if (a.monitor_id?.toString() !== m.id.toString()) return false;
                              const d = new Date(a.start_time);
                              return d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === moveConfig.date && d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }) === moveConfig.time;
                            });

                            if (!targetSlot) isBusy = true; 
                            else if (targetSlot.status !== 'available' && !currentBookingSlotIds.includes(targetSlot.id)) isBusy = true; 
                            else if (slotsNeeded > 1) {
                              const startMs = new Date(targetSlot.start_time).getTime();
                              for (let i = 1; i < slotsNeeded; i++) {
                                const nextMs = startMs + (i * slotDuration * 60000);
                                const nextSlot = appointments.find(a => a.monitor_id?.toString() === m.id.toString() && new Date(a.start_time).getTime() === nextMs && (a.status === 'available' || currentBookingSlotIds.includes(a.id)));
                                if (!nextSlot) { isBusy = true; break; }
                              }
                            }
                          }
                          return <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}>{m.title} {isBusy ? '(Occupé)' : ''}</option>;
                        })}
                      </select>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button onClick={handleMove} disabled={!moveConfig.time} className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${!moveConfig.time ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}>Transférer le créneau</button>
                      <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
                    </div>
                  </>
                )
              )}
            </div>
          </div>
        </div>
      )}

      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, endDate: e.target.value})} />
              
              <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700" value={genConfig.plan_name} onChange={e => setGenConfig({...genConfig, plan_name: e.target.value})}>
                <option value="" disabled>-- Choisir le Modèle --</option>
                {availablePlans.map(plan => <option key={plan} value={plan}>{plan}</option>)}
              </select>

              <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700" value={genConfig.monitor_id} onChange={e => setGenConfig({...genConfig, monitor_id: e.target.value})}>
                <option value="all">👥 Tous les pilotes</option>
                <optgroup label="Pilotes spécifiques">{monitors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}</optgroup>
              </select>

              <button 
                disabled={isGenerating}
                onClick={async () => {
                  if (!genConfig.startDate || !genConfig.endDate) return alert("Veuillez sélectionner des dates.");
                  setIsGenerating(true); 
                  const sendGenerationRequest = async (force = false) => {
                    try {
                      const res = await apiFetch('/api/generate-slots', { method: 'POST', body: JSON.stringify({ ...genConfig, forceOverwrite: force }) });
                      const data = await res.json();
                      if (res.status === 409 && data.warning) {
                        const userConfirmed = window.confirm(data.message);
                        if (userConfirmed) return await sendGenerationRequest(true);
                        else { setIsGenerating(false); return; }
                      }
                      if (res.ok) { 
                        alert(`✅ ${data.count || 0} créneaux générés avec succès !`);
                        setShowGenModal(false); 
                        await loadAppointments(); 
                      } else { alert("Erreur : " + (data.error || "Erreur inconnue")); }
                    } catch (err) { alert("Erreur de connexion au serveur."); }
                  };
                  await sendGenerationRequest(false);
                  setIsGenerating(false); 
                }}
                className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${isGenerating ? 'bg-slate-400 text-slate-200 cursor-not-allowed' : 'bg-slate-900 text-white hover:scale-105'}`}
              >
                {isGenerating ? '⏳ Génération en cours...' : '🚀 Lancer la génération'}
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}