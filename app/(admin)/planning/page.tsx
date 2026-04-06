"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
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
  // 🎯 NOUVEAU : On mémorise l'heure de fin exacte du blocage (en ms)
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
  
  const [formData, setFormData] = useState<{
    title: string, flight_type_id: string, weightChecked: boolean, phone: string, email: string, notes: string, booking_options: string, client_message: string
  }>({
    title: '', flight_type_id: '', weightChecked: false, phone: '', email: '', notes: '', booking_options: '', client_message: ''
  });

  const [genConfig, setGenConfig] = useState({ 
    startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0], plan_name: 'Standard', monitor_id: 'all' 
  });

  // 🎯 NOUVEAU : État pour la taille du groupe
  const [groupSize, setGroupSize] = useState<number>(1);

  // 🎯 NOUVEAU : Le cerveau qui calcule la répartition du groupe automatiquement
  const groupDistribution = useMemo(() => {
    if (!selectedEvent || groupSize <= 1 || !formData.flight_type_id) return null;

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;

    const startMs = new Date(selectedEvent.start).getTime();
    const dayStr = new Date(selectedEvent.start).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

    // 1. Trouver tous les créneaux libres de la journée après le clic
    const allDayAvailable = appointments.filter(a =>
       a.status === 'available' &&
       new Date(a.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' }) === dayStr &&
       new Date(a.start_time).getTime() >= startMs
    );

    // 2. Ne garder que les créneaux où le moniteur a assez de temps pour le vol entier
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

    // 3. Trier par ordre chronologique
    validStartSlots.sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime());

    // 4. Distribuer les passagers
    let remaining = groupSize;
    const distribution: {time: string, count: number}[] = [];
    const slotsToUse: any[] = [];
    let currentTimeGroup: any = null;

    for (const slot of validStartSlots) {
       if (remaining === 0) break;
       const timeStr = new Date(slot.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });

       if (!currentTimeGroup || currentTimeGroup.time !== timeStr) {
           if (currentTimeGroup) distribution.push(currentTimeGroup);
           currentTimeGroup = { time: timeStr, count: 0 };
       }

       currentTimeGroup.count++;
       slotsToUse.push(slot);
       remaining--;
    }
    if (currentTimeGroup && currentTimeGroup.count > 0) distribution.push(currentTimeGroup);

    return { distribution, slotsToUse, canFit: remaining === 0 };
  }, [groupSize, selectedEvent, formData.flight_type_id, appointments, flightTypes, slotDuration]);

  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  const loadData = async () => {
    try {
      const [apptsRes, monRes, flightRes, settingsRes, defsRes] = await Promise.all([
        apiFetch('/api/slots'),
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

      if (apptsRes.ok) {
        const appts = await apptsRes.json();
        setAppointments(appts);

        if (appts.length > 0) {
          let minHour = 24;
          let maxHour = 0;
          
          appts.forEach((a: any) => {
            const start = new Date(a.start_time);
            const end = new Date(a.end_time);
            if (start.getHours() < minHour) minHour = start.getHours();
            let endH = end.getHours() + (end.getMinutes() > 0 ? 1 : 0);
            if (endH > maxHour) maxHour = endH;
          });
          
          minHour = Math.max(0, minHour);
          maxHour = Math.min(24, maxHour);

          setTimeBounds({ min: `${String(minHour).padStart(2, '0')}:00:00`, max: `${String(maxHour).padStart(2, '0')}:00:00` });
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

  // 🎯 NOUVEAU : On fige la fonction pour le calendrier
  const handleEventClick = useCallback((info: any) => {
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
    setMoveConfig({ date: dStr, time: '', monitorId: 'random' });
    setActiveTab('client');
    setBlockType('none');
    setSelectedMonitors([]);
    setBlockUntilMs(end.getTime());
    setGroupSize(1);
    setShowEditModal(true);
  }, []); // <-- 🎯 LE SECRET EST CE PETIT TABLEAU VIDE À LA FIN !

  const handleSaveNote = async () => {
    if (!selectedEvent) return;

    let targetMonitors: string[] = [];
    let slotsToUpdate: any[] = [];
    let isNonBlockingNote = false;
    let selectedFlight: any = null;
    let slotsNeeded = 1;

    // --- VALIDATIONS ---
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
        const hasClientBooking = slotsToUpdate.some(slot => slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].includes(slot.title) && !slot.title.includes('❌'));
        if (hasClientBooking) return alert("❌ Impossible de bloquer : Un ou plusieurs clients sont déjà réservés.");
      }
    } else {
      if (!formData.flight_type_id) return alert("❌ Veuillez choisir un type de vol.");
      if (!formData.phone || formData.phone.trim() === '') return alert("❌ Le numéro de téléphone est obligatoire.");
      selectedFlight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
      const flightDuration = selectedFlight?.duration_minutes || selectedFlight?.duration || 0;
      slotsNeeded = (selectedFlight?.allow_multi_slots && slotDuration > 0 && flightDuration > slotDuration) ? Math.ceil(flightDuration / slotDuration) : 1;
    }

    // 🎯 1. ON PRÉPARE LES DONNÉES LOCALEMENT
    const updatesToApply: any[] = [];

    if (activeTab === 'note') {
      slotsToUpdate.forEach(slot => {
        let payload: any = { title: isNonBlockingNote ? 'NOTE' : 'NON DISPO', notes: formData.notes, status: isNonBlockingNote ? 'available' : 'booked' };
        if (isNonBlockingNote) {
          const isClientSlot = slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].includes(slot.title) && !slot.title.includes('❌');
          if (isClientSlot) {
            payload.title = slot.title; payload.status = slot.status;
            if (slot.notes && slot.notes.trim() !== '' && slot.notes !== formData.notes && !formData.notes.includes(slot.notes)) {
               payload.notes = slot.notes + " | " + formData.notes;
            }
            payload.flight_type_id = slot.flight_type_id; payload.phone = slot.phone; payload.email = slot.email; payload.weightChecked = slot.weight_checked || slot.weightChecked; payload.booking_options = slot.booking_options; payload.client_message = slot.client_message; payload.weight = slot.weight;
          } else {
            payload.flight_type_id = null; payload.phone = ''; payload.email = ''; payload.weightChecked = false; payload.booking_options = ''; payload.client_message = '';
          }
        } else {
           payload.flight_type_id = null; payload.phone = ''; payload.email = ''; payload.weightChecked = false; payload.booking_options = ''; payload.client_message = '';
        }
        updatesToApply.push({ id: slot.id, data: payload });
      });
    } else {
      
      // 🚀 LOGIQUE DE GROUPE ICI !
      if (groupSize > 1) {
        if (!groupDistribution || !groupDistribution.canFit) {
          return alert("❌ Pas assez de créneaux disponibles pour placer tout le groupe.");
        }
        groupDistribution.slotsToUse.forEach((baseSlot, index) => {
          const passengerTitle = formData.title ? `${formData.title} (${index + 1}/${groupSize})` : `Passager ${index + 1}`;
          updatesToApply.push({ id: baseSlot.id, data: { ...formData, title: passengerTitle, status: 'booked' } });

          // S'il faut plusieurs créneaux pour ce vol
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
        // Mode solo classique
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

    // 🚀 2. LA MAGIE : On met à jour le calendrier IMMÉDIATEMENT à l'écran !
    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    // 🚀 3. On envoie au serveur en silence
    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      const res = await apiFetch('/api/slots');
      if (res.ok) setAppointments(await res.json()); 
    } catch (err) { console.error("Erreur de sauvegarde silencieuse"); }
  };

  const handleRelease = async () => {
    if (!selectedEvent || !confirm("Action irréversible. Confirmer ?")) return;

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
        updatesToApply.push({
          id: slotToFree.id,
          data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' }
        });
      }
    }

    // 🚀 MAGIE : Effacement instantané à l'écran !
    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      const res = await apiFetch('/api/slots');
      if (res.ok) setAppointments(await res.json());
    } catch (err) { console.error(err); }
  };

  // 🎯 NOUVEAU : Fonction pour effacer/libérer tout un lot de notes ou de blocages
  const handleBulkRelease = async () => {
    if (!selectedEvent) return;
    if (!confirm("🧹 Voulez-vous vraiment effacer les notes et blocages sur TOUTE la sélection actuelle (Cible + Durée) ?\n\n(Les réservations clients existantes seront conservées, seule la note ajoutée sera retirée).")) return;

    const targetMonitors = blockType === 'all' ? monitors.map(m => m.id.toString()) : blockType === 'specific' ? selectedMonitors : [selectedEvent.monitor_id?.toString()];
    const startMs = new Date(selectedEvent.start).getTime();

    const slotsToUpdate = appointments.filter(a => {
      if (!targetMonitors.includes(a.monitor_id?.toString())) return false;
      const aTime = new Date(a.start_time).getTime();
      return aTime >= startMs && aTime < blockUntilMs;
    });

    const updatesToApply: any[] = [];
    slotsToUpdate.forEach(slot => {
      const isClientSlot = slot.status === 'booked' && slot.title && !['NOTE', '☕ PAUSE', 'NON DISPO'].includes(slot.title) && !slot.title.includes('❌');
      if (isClientSlot) {
        updatesToApply.push({ id: slot.id, data: { ...slot, weightChecked: slot.weight_checked || slot.weightChecked, notes: '' } });
      } else {
        updatesToApply.push({ id: slot.id, data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    });

    // 🚀 MAGIE : Effacement instantané !
    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      const res = await apiFetch('/api/slots');
      if (res.ok) setAppointments(await res.json());
    } catch (err) { console.error(err); }
  };

  // 🎯 1. Mémoire : Créneaux liés à la réservation
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

  // 🎯 2. Mémoire : Créneaux de destination (Déplacement)
  const availableTargetSlots = useMemo(() => {
    return appointments.filter(a => {
      if (a.status !== 'available' && !currentBookingSlotIds.includes(a.id)) return false; 
      if (openingPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        const inSeason = openingPeriods.some((p: any) => {
          if (!p.start || !p.end) return false;
          const start = new Date(p.start); start.setHours(0, 0, 0, 0);
          const end = new Date(p.end); end.setHours(23, 59, 59, 999);
          return slotDate >= start && slotDate <= end;
        });
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
  }, [appointments, currentBookingSlotIds, openingPeriods, moveConfig, formData.flight_type_id, flightTypes, slotDuration]);

  // 🎯 3. Mémoire : Heures disponibles
  const availableTimes = useMemo(() => {
    return Array.from(new Set(availableTargetSlots.map(a => {
      const d = new Date(a.start_time);
      return d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    }))).sort();
  }, [availableTargetSlots]);

  // 🎯 4. Mémoire : Liste intelligente des vols
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

  // 🎯 5. Mémoire : Créneaux de la journée pour l'onglet Note
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

    const targetSlot = availableTargetSlots.find(a => {
      const d = new Date(a.start_time);
      const timeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
      return timeStr === moveConfig.time;
    });

    if (!targetSlot) return alert("Erreur: Créneau introuvable.");

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration) ? Math.ceil(flightDur / slotDuration) : 1;

    const updatesToApply: any[] = [];
    const oldStartMs = new Date(selectedEvent.start).getTime();
    
    for (let i = 0; i < slotsNeeded; i++) {
      const ms = oldStartMs + (i * slotDuration * 60000);
      const slotToFree = appointments.find(a => a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() && new Date(a.start_time).getTime() === ms && (i === 0 || a.title?.startsWith('↪️ Suite')));
      if (slotToFree) {
         updatesToApply.push({ id: slotToFree.id, data: { title: '', flight_type_id: null, weight: null, notes: '', status: 'available', phone: '', email: '', weightChecked: false, booking_options: '', client_message: '' } });
      }
    }

    const newStartMs = new Date(targetSlot.start_time).getTime();
    for (let i = 0; i < slotsNeeded; i++) {
      const ms = newStartMs + (i * slotDuration * 60000);
      const slotToBook = appointments.find(a => a.monitor_id?.toString() === targetSlot.monitor_id?.toString() && new Date(a.start_time).getTime() === ms);
      if (slotToBook) {
         updatesToApply.push({ id: slotToBook.id, data: { ...formData, title: i === 0 ? formData.title : `↪️ Suite ${formData.title || 'Vol'}`, status: 'booked', notes: i === 0 ? formData.notes : 'Extension auto' } });
      }
    }

    // 🚀 MAGIE : Transfert instantané sur la grille !
    setAppointments(prev => prev.map(slot => {
      const update = updatesToApply.find(u => u.id === slot.id);
      return update ? { ...slot, ...update.data } : slot;
    }));
    setShowEditModal(false);

    try {
      const promises = updatesToApply.map(u => apiFetch(`/api/slots/${u.id}`, { method: 'PATCH', body: JSON.stringify(u.data) }));
      await Promise.all(promises);
      const res = await apiFetch('/api/slots');
      if (res.ok) setAppointments(await res.json());
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

  // 🎯 1. On "mémorise" les événements du calendrier
  const calendarEvents = useMemo(() => {
    return appointments.map(a => {
      const flight = flightTypes?.find(f => f.id === a.flight_type_id);
      const flightColor = flight?.color_code || '#0ea5e9'; 

      let isSlotOutOfSeason = false;
      if (openingPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        isSlotOutOfSeason = !openingPeriods.some((p: any) => {
          if (!p.start || !p.end) return false;
          const start = new Date(p.start); start.setHours(0, 0, 0, 0);
          const end = new Date(p.end); end.setHours(23, 59, 59, 999);
          return slotDate >= start && slotDate <= end;
        });
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
  }, [appointments, flightTypes, openingPeriods]);


  // 🎯 2. LE BOUCLIER ANTI-LATENCE : On isole le calendrier en dessous !
  const memoizedCalendar = useMemo(() => {
    return (
        <FullCalendar
          ref={calendarRef}
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          resources={monitors}
          datesSet={(arg) => {
            setCurrentDate(arg.startStr.split('T')[0]);
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
        />
    );
  }, [calendarEvents, monitors, timeBounds, handleEventClick]);

    

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
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

      <div className="bg-white rounded-[35px] shadow-2xl border border-slate-200 p-6 overflow-hidden">
        {memoizedCalendar}
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl max-h-[95vh] overflow-y-auto">
            <h2 className="text-xl font-black uppercase italic mb-6 text-slate-900">Gestion du Créneau</h2>
            
            <div className="flex gap-1 mb-6 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('client')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'client' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400'}`}>👤 Client</button>
              <button onClick={() => setActiveTab('note')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'note' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400'}`}>📝 Note</button>
              {selectedEvent?.status !== 'available' && (
                <button onClick={() => setActiveTab('move')} className={`flex-1 py-2 rounded-lg font-black text-[9px] uppercase ${activeTab === 'move' ? 'bg-white text-emerald-500 shadow-sm' : 'text-slate-400'}`}>🔄 Déplacer</button>
              )}
            </div>

            <div className="space-y-4">
              
              {/* ONGLET 1 : CLIENT */}
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
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom du passager</label>
                      <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Jean Dupont" />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type de Vol</label>
                      <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.flight_type_id} onChange={e => setFormData({...formData, flight_type_id: e.target.value})}>
                        <option value="">Choisir un vol...</option>
                        
                        {/* 🎯 On utilise la liste intelligente en mémoire ! */}
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

                    {/* 🎯 NOUVEAU : CHOIX DU NOMBRE DE PERSONNES */}
                    {formData.flight_type_id && (
                      <div className="bg-white p-4 rounded-2xl border-2 border-slate-100 mt-4 shadow-sm">
                        <label className="text-[10px] font-black uppercase text-slate-400 block mb-3">Taille du groupe</label>
                        <div className="flex items-center gap-4">
                          <button onClick={() => setGroupSize(Math.max(1, groupSize - 1))} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center">-</button>
                          <span className="text-2xl font-black text-slate-900 w-8 text-center">{groupSize}</span>
                          <button onClick={() => setGroupSize(groupSize + 1)} className="w-10 h-10 rounded-full bg-slate-100 text-slate-600 font-black text-xl hover:bg-slate-200 transition-colors flex items-center justify-center">+</button>
                          <span className="text-sm font-bold text-slate-500 ml-2">Passager(s)</span>
                        </div>
                        
                        {groupSize > 1 && groupDistribution && (
                          <div className={`mt-4 p-3 rounded-xl text-xs font-bold border-2 transition-all ${groupDistribution.canFit ? 'bg-emerald-50 border-emerald-200 text-emerald-800' : 'bg-rose-50 border-rose-200 text-rose-800'}`}>
                            {groupDistribution.canFit ? (
                              <>
                                <span className="block mb-2 uppercase tracking-wider text-[10px] opacity-70">✅ Répartition automatique :</span>
                                <ul className="list-none space-y-1">
                                  {groupDistribution.distribution.map((d, i) => (
                                    <li key={i} className="flex items-center gap-2">
                                      <span className="w-5 h-5 rounded bg-emerald-200 text-emerald-900 flex items-center justify-center">{d.count}</span>
                                      <span>Passager(s) décollant à <strong className="text-sm">{d.time}</strong></span>
                                    </li>
                                  ))}
                                </ul>
                              </>
                            ) : (
                              <span className="flex items-center gap-2">
                                <span className="text-xl">❌</span> 
                                Capacité insuffisante : Impossible de trouver {groupSize} places à la suite pour ce type de vol.
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
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Téléphone <span className="text-rose-500">*</span></label>
                        <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} placeholder="06 12 34 56 78" />
                      </div>
                      <div>
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
                        <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 focus:border-sky-300 outline-none rounded-2xl p-3 font-bold text-sm transition-colors" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} placeholder="Optionnel" />
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

              {/* ONGLET 2 : NOTE ET BLOCAGE */}
              {activeTab === 'note' && (
                <>
                  <div className="flex gap-2 mb-4">
                    <button 
                      disabled={isOutOfSeason} 
                      onClick={() => setFormData({...formData, title: 'NOTE'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title !== 'NON DISPO' ? 'bg-amber-100 border-amber-400 text-amber-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-amber-200')}`}
                    >
                      📝 Note simple (Reste libre)
                    </button>
                    <button 
                      disabled={isOutOfSeason} 
                      onClick={() => setFormData({...formData, title: 'NON DISPO'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${isOutOfSeason ? 'opacity-50 cursor-not-allowed' : (formData.title === 'NON DISPO' ? 'bg-rose-100 border-rose-400 text-rose-800 shadow-inner' : 'bg-slate-50 border-slate-200 text-slate-500 hover:border-rose-200')}`}
                    >
                      ❌ Bloquer (Non dispo)
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Note interne au pilote</label>
                    <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Infos météo, retard..." />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Cible (Qui ?)</label>
                    <select className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all mb-4 ${isOutOfSeason ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} value={blockType} onChange={(e: any) => setBlockType(e.target.value)} disabled={isOutOfSeason}>
                      <option value="none">Ce pilote uniquement</option>
                      <option value="all">🚫 TOUS les pilotes</option>
                      <option value="specific">👥 Certains pilotes</option>
                    </select>

                    {blockType === 'specific' && !isOutOfSeason && (
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
                        <select 
                          className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all ${isOutOfSeason ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} 
                          value={blockUntilMs} 
                          onChange={(e: any) => setBlockUntilMs(Number(e.target.value))} 
                          disabled={isOutOfSeason}
                        >
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
              )}

              {/* BOUTONS PARTAGÉS */}
              {(activeTab === 'client' || activeTab === 'note') && (
                <div className="pt-4 space-y-3 border-t border-slate-100">
                  {!(activeTab === 'client' && isClientLocked) && (
                    <>
                      <button onClick={handleSaveNote} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-sky-600 transition-colors">
                        Enregistrer la modification
                      </button>
                      
                      {/* 🎯 NOUVEAU : Boutons de libération intelligents */}
                      {(selectedEvent?.title || selectedEvent?.notes || selectedEvent?.status !== 'available') && (
                        activeTab === 'note' ? (
                          <div className="flex gap-2 pt-2">
                            <button onClick={handleRelease} className="flex-1 text-rose-400 font-black uppercase italic text-[9px] tracking-widest hover:bg-rose-50 transition-colors border border-rose-100 rounded-xl py-3">
                              🗑️ Libérer (Ce créneau)
                            </button>
                            <button onClick={handleBulkRelease} className="flex-1 bg-rose-50 text-rose-600 font-black uppercase italic text-[9px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm rounded-xl py-3">
                              🧹 Libérer (Le Lot complet)
                            </button>
                          </div>
                        ) : (
                          <button onClick={handleRelease} className="w-full text-rose-500 font-black uppercase italic text-[10px] tracking-widest pt-2 hover:text-rose-600 transition-colors">
                            🗑️ Libérer ce créneau
                          </button>
                        )
                      )}
                    </>
                  )}
                  <button onClick={() => setShowEditModal(false)} className="w-full text-slate-400 font-bold uppercase text-[10px] hover:text-slate-600 pt-2">Fermer sans sauvegarder</button>
                </div>
              )}

              {/* ONGLET 3 : MOVE */}
              {activeTab === 'move' && (
                isClientLocked ? (
                  <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100 mt-4">
                    <span className="text-4xl block mb-2">🔒</span>
                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Déplacement bloqué</p>
                    <p className="text-xs text-slate-500 px-4 font-medium mb-6">Vous ne pouvez pas déplacer un créneau hors saison ou en pause.</p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date ciblée</label>
                      <input type="date" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={moveConfig.date} onChange={e => setMoveConfig({...moveConfig, date: e.target.value, time: ''})} />
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
                            isBusy = !appointments.some(a => {
                              if (a.monitor_id?.toString() !== m.id.toString()) return false;
                              const d = new Date(a.start_time);
                              const dateStr = d.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
                              const timeStr = d.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
                              return dateStr === moveConfig.date && timeStr === moveConfig.time;
                            });
                          }
                          return <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? "text-slate-300" : ""}>{m.title} {isBusy ? '(Occupé)' : ''}</option>;
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

      {/* MODALE DE GÉNÉRATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, endDate: e.target.value})} />
              
              <select 
                className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700"
                value={genConfig.plan_name}
                onChange={e => setGenConfig({...genConfig, plan_name: e.target.value})}
              >
                <option value="" disabled>-- Choisir le Modèle --</option>
                {availablePlans.map(plan => (
                   <option key={plan} value={plan}>{plan}</option>
                ))}
              </select>

              <select 
                className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-slate-700"
                value={genConfig.monitor_id}
                onChange={e => setGenConfig({...genConfig, monitor_id: e.target.value})}
              >
                <option value="all">👥 Tous les pilotes</option>
                <optgroup label="Pilotes spécifiques">
                  {monitors.map(m => (
                    <option key={m.id} value={m.id}>{m.title}</option>
                  ))}
                </optgroup>
              </select>

              <button 
                disabled={isGenerating}
                onClick={async () => {
                  if (!genConfig.startDate || !genConfig.endDate) {
                    return alert("Veuillez sélectionner des dates.");
                  }
                  
                  setIsGenerating(true); 
                  
                  const sendGenerationRequest = async (force = false) => {
                    try {
                      const res = await apiFetch('/api/generate-slots', { 
                        method: 'POST', 
                        body: JSON.stringify({ ...genConfig, forceOverwrite: force }) 
                      });
                      
                      const data = await res.json();

                      if (res.status === 409 && data.warning) {
                        const userConfirmed = window.confirm(data.message);
                        if (userConfirmed) {
                          return await sendGenerationRequest(true);
                        } else {
                           setIsGenerating(false);
                           return;
                        }
                      }

                      if (res.ok) { 
                        alert(`✅ ${data.count || 0} créneaux générés avec succès !`);
                        setShowGenModal(false); 
                        await loadData(); 
                      } else {
                        alert("Erreur : " + (data.error || "Erreur inconnue"));
                      }
                    } catch (err) {
                      alert("Erreur de connexion au serveur.");
                    }
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