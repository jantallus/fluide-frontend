"use client";
import React, { useState, useEffect, useRef } from 'react';
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
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [slotDuration, setSlotDuration] = useState<number>(0); 
  const [availablePlans, setAvailablePlans] = useState<string[]>(['Standard']);
  const [blockType, setBlockType] = useState<'none' | 'all' | 'specific'>('none');
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
    title: string,
    flight_type_id: string,
    weight: string | number,
    notes: string
  }>({
    title: '',
    flight_type_id: '',
    weight: '',
    notes: ''
  });

  const [genConfig, setGenConfig] = useState({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6, 0],
    plan_name: 'Standard',
    monitor_id: 'all' // <-- NOUVEAU : 'all' par défaut
  });

  // NOUVEAU : Référence pour contrôler le calendrier depuis l'extérieur
  const calendarRef = useRef<FullCalendar>(null);
  // NOUVEAU : État pour le sélecteur de date rapide
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

          setTimeBounds({
            min: `${String(minHour).padStart(2, '0')}:00:00`,
            max: `${String(maxHour).padStart(2, '0')}:00:00`
          });
        }
      }
      
      if (monRes.ok) {
        const mons = await monRes.json();
        setMonitors(mons.map((m: any) => ({ id: String(m.id), title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
      
      // On a supprimé le setCalendarKey ici pour éviter le rechargement brutal !
    } catch (err) { console.error("Erreur chargement planning:", err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEventClick = (info: any) => {
    const event = info.event;
    if (event.extendedProps.title?.startsWith('↪️ Suite')) {
      alert("⚠️ Pour modifier, déplacer ou supprimer ce vol, veuillez cliquer sur son premier créneau (celui contenant le nom du client).");
      return; // On bloque l'ouverture de la fenêtre
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
    setSlotDuration(durationMins);

    setSelectedEvent({
      id: event.id,
      title: event.extendedProps.title, 
      start: event.start,
      monitor_id: event.getResources()[0]?.id,
      ...event.extendedProps
    });

    const realTitle = event.extendedProps.title;
    setFormData({
      title: realTitle === 'NOTE' ? '' : (realTitle || ''),
      flight_type_id: event.extendedProps.flight_type_id || '',
      weight: event.extendedProps.weight || '',
      notes: event.extendedProps.notes || ''
    });

    const d = new Date(event.start);
    const dateStr = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
    setMoveConfig({ date: dateStr, time: '', monitorId: 'random' });
    setActiveTab('client');
    setBlockType('none');
    setSelectedMonitors([]);
    setShowEditModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedEvent) return;
    try {
      let finalTitle = formData.title;
      if (activeTab === 'note' && !formData.title.trim()) {
        if (blockType === 'all' || blockType === 'specific') finalTitle = 'NON DISPO';
        else if (formData.notes.trim()) finalTitle = 'NOTE';
      }

      if (blockType === 'all') {
        const allSlots = appointments.filter(a => a.start_time === selectedEvent.start_time);
        await Promise.all(allSlots.map(slot => 
          apiFetch(`/api/slots/${slot.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: finalTitle || 'NON DISPO', notes: formData.notes, status: 'booked' })
          })
        ));
      } else {
        const isNonBlockingNote = (finalTitle === 'NOTE' && activeTab === 'note');
        const selectedFlight = flightTypes.find(f => f.id.toString() === formData.flight_type_id.toString());
        const flightDuration = selectedFlight?.duration_minutes || selectedFlight?.duration || 0;
        
        // On calcule les créneaux nécessaires si l'option est activée
        const slotsNeeded = (activeTab === 'client' && selectedFlight?.allow_multi_slots && slotDuration > 0 && flightDuration > slotDuration) 
          ? Math.ceil(flightDuration / slotDuration) 
          : 1;

        if (slotsNeeded > 1) {
          // 1. Sauvegarde du créneau principal
          await apiFetch(`/api/slots/${selectedEvent.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ ...formData, title: finalTitle, status: 'booked' })
          });

          // 2. Blocage des suivants
          const startMs = new Date(selectedEvent.start).getTime();
          for (let i = 1; i < slotsNeeded; i++) {
            const nextMs = startMs + (i * slotDuration * 60000);
            const nextSlot = appointments.find(a =>
              a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
              new Date(a.start_time).getTime() === nextMs &&
              a.status === 'available'
            );
            
            if (nextSlot) {
              await apiFetch(`/api/slots/${nextSlot.id}`, {
                method: 'PATCH',
                body: JSON.stringify({
                  title: `↪️ Suite ${finalTitle || 'Vol'}`,
                  flight_type_id: formData.flight_type_id,
                  status: 'booked',
                  notes: 'Extension auto'
                })
              });
            }
          }
        } else {
          // Logique classique
          await apiFetch(`/api/slots/${selectedEvent.id}`, {
            method: 'PATCH',
            body: JSON.stringify({
              ...formData,
              title: finalTitle,
              status: isNonBlockingNote ? 'available' : (finalTitle.trim() ? 'booked' : 'available')
            })
          });
        }
      }
      setShowEditModal(false);
      await loadData(); // Va mettre à jour les données sans vous renvoyer à aujourd'hui
    } catch (err) { alert("Erreur lors de la sauvegarde"); }
  };

  const handleRelease = async () => {
    if (!selectedEvent || !confirm("Action irréversible. Confirmer ?")) return;
    try {
      const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
      const flightDur = flight?.duration_minutes || flight?.duration || 0;
      const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration)
        ? Math.ceil(flightDur / slotDuration) : 1;

      const startMs = new Date(selectedEvent.start).getTime();
      
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = startMs + (i * slotDuration * 60000);
        const slotToFree = appointments.find(a =>
           a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
           new Date(a.start_time).getTime() === ms &&
           (i === 0 || a.title?.startsWith('↪️ Suite'))
        );
        
        if (slotToFree) {
          await apiFetch(`/api/slots/${slotToFree.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: '', flight_type_id: null, weight: null, notes: '', status: 'available' })
          });
        }
      }
      
      setShowEditModal(false);
      await loadData();
    } catch (err) { console.error(err); }
  };

  const currentBookingSlotIds = (() => {
    if (!selectedEvent) return [];
    const flight = flightTypes.find(f => f.id?.toString() === selectedEvent.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration)
      ? Math.ceil(flightDur / slotDuration) : 1;

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
  })();

  const availableTargetSlots = appointments.filter(a => {
    // MAGIE ICI : On ignore si c'est occupé, SI ça appartient à notre propre vol !
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
    const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
              (appt.status === 'available' || currentBookingSlotIds.includes(appt.id)) // MAGIE ICI AUSSI
            );
            if (!nextSlot) return false;
          }
        } else {
          const dur = Math.round((new Date(a.end_time).getTime() - d.getTime()) / 60000);
          if (flightDur > dur) return false;
        }

        const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
        const allowedSlots = Array.isArray(flight.allowed_time_slots) ? flight.allowed_time_slots : [];
        if (allowedSlots.length > 0 && !allowedSlots.includes(timeStr)) return false; 
      }
    }
    return true;
  });

  const availableTimes = Array.from(new Set(availableTargetSlots.map(a => {
    const d = new Date(a.start_time);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }))).sort();

  const handleMove = async () => {
    if (!moveConfig.time || !selectedEvent) return;

    const targetSlot = availableTargetSlots.find(a => {
      const d = new Date(a.start_time);
      return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}` === moveConfig.time;
    });

    if (!targetSlot) return alert("Erreur: Créneau introuvable.");

    const flight = flightTypes.find(f => f.id.toString() === formData.flight_type_id?.toString());
    const flightDur = flight?.duration_minutes || flight?.duration || 0;
    const slotsNeeded = (flight?.allow_multi_slots && slotDuration > 0 && flightDur > slotDuration)
      ? Math.ceil(flightDur / slotDuration) : 1;

    try {
      // 1. Libérer les anciens créneaux (le principal + les suites)
      const oldStartMs = new Date(selectedEvent.start).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = oldStartMs + (i * slotDuration * 60000);
        const slotToFree = appointments.find(a =>
           a.monitor_id?.toString() === selectedEvent.monitor_id?.toString() &&
           new Date(a.start_time).getTime() === ms &&
           (i === 0 || a.title?.startsWith('↪️ Suite'))
        );
        if (slotToFree) {
           await apiFetch(`/api/slots/${slotToFree.id}`, {
              method: 'PATCH',
              body: JSON.stringify({ title: '', flight_type_id: null, weight: null, notes: '', status: 'available' })
           });
        }
      }

      // 2. Réserver les nouveaux créneaux
      const newStartMs = new Date(targetSlot.start_time).getTime();
      for (let i = 0; i < slotsNeeded; i++) {
        const ms = newStartMs + (i * slotDuration * 60000);
        const slotToBook = appointments.find(a =>
           a.monitor_id?.toString() === targetSlot.monitor_id?.toString() &&
           new Date(a.start_time).getTime() === ms
        );
        if (slotToBook) {
           await apiFetch(`/api/slots/${slotToBook.id}`, {
              method: 'PATCH',
              body: JSON.stringify({
                 ...formData,
                 title: i === 0 ? formData.title : `↪️ Suite ${formData.title || 'Vol'}`,
                 status: 'booked',
                 notes: i === 0 ? formData.notes : 'Extension auto'
              })
           });
        }
      }

      setShowEditModal(false);
      await loadData();
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

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Planning <span className="text-sky-500">Vols</span>
          </h1>
        </div>
        
        {/* NOUVEAU : Bloc avec Sélecteur de date + Bouton Générer */}
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
                // On ordonne au calendrier de sauter à cette date instantanément
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
        <FullCalendar
          ref={calendarRef} // NOUVEAU : On relie le calendrier à notre sélecteur
          schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          resources={monitors}
          // NOUVEAU : On écoute les changements de vue (ex: clic sur "Suivant") pour synchroniser notre sélecteur de date en haut
          datesSet={(arg) => {
            setCurrentDate(arg.startStr.split('T')[0]);
          }}
          events={appointments.map(a => {
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
            
            if (a.notes && a.notes.trim() !== '') {
              displayTitle += ' 📝'; 
            }

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
          })}
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
          eventTimeFormat={{
            hour: '2-digit',
            minute: '2-digit',
            meridiem: false,
            hour12: false
          }}
        />
      </div>

      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
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
                    <p className="text-xs text-slate-500 px-4 font-medium mb-6">
                      Ce créneau est bloqué ou en pause. Pour y ajouter un client, vous devez d'abord le libérer.
                    </p>
                    <button 
                      onClick={handleRelease} 
                      className="bg-rose-100 text-rose-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      🗑️ Libérer ce créneau
                    </button>
                  </div>
                ) : isOutOfSeason ? (
                  <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100">
                    <span className="text-4xl block mb-2">❄️</span>
                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Hors Saison</p>
                    <p className="text-xs text-slate-500 px-4 font-medium mb-6">
                      Ce créneau est en dehors de vos périodes d'ouverture. Vous ne pouvez pas y ajouter de réservation.
                    </p>
                    <button 
                      onClick={handleRelease} 
                      className="bg-slate-200 text-slate-500 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-rose-500 hover:text-white transition-all shadow-sm"
                    >
                      🗑️ {(selectedEvent?.title || selectedEvent?.notes) ? 'Effacer la note' : 'Supprimer le créneau'}
                    </button>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom du passager</label>
                      <input 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        placeholder="Ex: Jean Dupont"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Type de Vol</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                        value={formData.flight_type_id}
                        onChange={e => setFormData({...formData, flight_type_id: e.target.value})}
                      >
                        <option value="">Choisir un vol...</option>
                        {flightTypes?.map(f => {
                          const flightDuration = f.duration_minutes || f.duration || 0; 
                          const isMultiSlotAllowed = f.allow_multi_slots === true;
                          const slotsNeeded = (isMultiSlotAllowed && slotDuration > 0 && flightDuration > slotDuration) 
                            ? Math.ceil(flightDuration / slotDuration) 
                            : 1;
                          
                          let canFit = true;
                          let reason = '';

                          if (isMultiSlotAllowed && slotsNeeded > 1) {
                            const startMs = new Date(selectedEvent?.start).getTime();
                            for (let i = 1; i < slotsNeeded; i++) {
                              const nextMs = startMs + (i * slotDuration * 60000);
                              const nextSlot = appointments.find(a =>
                                a.monitor_id?.toString() === selectedEvent?.monitor_id?.toString() &&
                                new Date(a.start_time).getTime() === nextMs &&
                                a.status === 'available'
                              );
                              if (!nextSlot) {
                                canFit = false;
                                reason = `(Bloqué : nécessite ${slotsNeeded} créneaux libres)`;
                                break;
                              }
                            }
                          } else if (!isMultiSlotAllowed && flightDuration > slotDuration) {
                             canFit = false;
                             reason = `(Trop long : ${flightDuration} min)`;
                          }

                          const slotHours = String(selectedEvent?.start?.getHours()).padStart(2, '0');
                          const slotMins = String(selectedEvent?.start?.getMinutes()).padStart(2, '0');
                          const slotTimeStr = `${slotHours}:${slotMins}`;
                          const allowedSlots = Array.isArray(f.allowed_time_slots) ? f.allowed_time_slots : [];
                          const isAllowedTime = allowedSlots.includes(slotTimeStr);
                          
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
                    <div className="flex gap-4">
                      <div className="flex-1">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Poids (kg)</label>
                        <input 
                          type="number"
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                          value={formData.weight} 
                          onChange={e => {
                            const val = e.target.value === '' ? '' : Number(e.target.value);
                            setFormData({...formData, weight: val});
                          }}
                        />
                      </div>
                    </div>
                  </>
                )
              )}

              {/* ONGLET 2 : NOTE ET BLOCAGE */}
              {activeTab === 'note' && (
                <>
                  <div className="flex gap-2">
                    <button 
                      disabled={blockType === 'none' || isClientLocked} 
                      onClick={() => setFormData({...formData, title: '☕ PAUSE'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${(blockType === 'none' || isClientLocked) ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' : 'bg-slate-50 border-slate-100 hover:border-amber-200 text-slate-700'}`}
                    >
                      ☕ Pause
                    </button>
                    <button 
                      disabled={blockType === 'none' || isClientLocked} 
                      onClick={() => setFormData({...formData, title: 'NON DISPO'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${(blockType === 'none' || isClientLocked) ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' : 'bg-slate-50 border-slate-100 hover:border-rose-200 text-slate-700'}`}
                    >
                      ❌ Non Dispo
                    </button>
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Message / Note</label>
                    <textarea 
                      className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold h-24"
                      value={formData.notes}
                      onChange={e => setFormData({...formData, notes: e.target.value})}
                      placeholder="Infos météo, retard..."
                    />
                  </div>
                  <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
                    <label className="text-[10px] font-black uppercase text-slate-400 block mb-2">Action sur le planning</label>
                    <select 
                      className={`w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold transition-all ${isClientLocked ? 'bg-slate-100 text-slate-400 cursor-not-allowed opacity-60' : ''}`} 
                      value={blockType} 
                      onChange={(e: any) => setBlockType(e.target.value)}
                      disabled={isClientLocked}
                    >
                      <option value="none">Simple note (pas de blocage)</option>
                      <option value="all">🚫 Bloquer TOUS les pilotes</option>
                      <option value="specific">👥 Bloquer certains pilotes</option>
                    </select>
                    {blockType === 'specific' && !isClientLocked && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {monitors.map(m => (
                          <label key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold cursor-pointer">
                            <input type="checkbox" checked={selectedMonitors.includes(m.id.toString())} onChange={(e) => { const id = m.id.toString(); setSelectedMonitors(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id)); }}/>
                            {m.title}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              {/* BOUTONS PARTAGÉS (CLIENT & NOTE UNIQUEMENT) */}
              {(activeTab === 'client' || activeTab === 'note') && (
                <div className="pt-4 space-y-3">
                  {!(activeTab === 'client' && isClientLocked) && (
                    <>
                      <button onClick={handleSaveNote} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl mt-4 hover:bg-sky-600 transition-colors">
                        Enregistrer {blockType !== 'none' && !isClientLocked ? 'et bloquer' : ''}
                      </button>
                      
                      {(selectedEvent?.title || selectedEvent?.notes || selectedEvent?.status !== 'available') && (
                        <button onClick={handleRelease} className="w-full text-rose-500 font-black uppercase italic text-[10px] tracking-widest pt-2">
                          🗑️ Libérer / Effacer la note
                        </button>
                      )}
                    </>
                  )}
                  <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px] hover:text-slate-600">Annuler</button>
                </div>
              )}

              {/* ONGLET 3 : MOVE */}
              {activeTab === 'move' && (
                isClientLocked ? (
                  <div className="text-center py-8 bg-slate-50 rounded-3xl border-2 border-slate-100 mt-4">
                    <span className="text-4xl block mb-2">🔒</span>
                    <p className="font-black text-slate-900 uppercase tracking-widest text-sm mb-2">Déplacement bloqué</p>
                    <p className="text-xs text-slate-500 px-4 font-medium mb-6">
                      Vous ne pouvez pas déplacer un créneau hors saison ou en pause.
                    </p>
                  </div>
                ) : (
                  <>
                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date ciblée</label>
                      <input 
                        type="date" 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                        value={moveConfig.date}
                        onChange={e => setMoveConfig({...moveConfig, date: e.target.value, time: ''})}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Créneau disponible</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                        value={moveConfig.time}
                        onChange={e => setMoveConfig({...moveConfig, time: e.target.value})}
                      >
                        <option value="">Choisir une heure...</option>
                        {availableTimes.map(t => (
                          <option key={t} value={t}>{t}</option>
                        ))}
                      </select>
                      {availableTimes.length === 0 && moveConfig.date && (
                        <p className="text-[10px] text-rose-500 mt-2 ml-2 font-bold">Aucun créneau compatible trouvé à cette date.</p>
                      )}
                    </div>

                    <div>
                      <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Pilote</label>
                      <select 
                        className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                        value={moveConfig.monitorId}
                        onChange={e => setMoveConfig({...moveConfig, monitorId: e.target.value})} 
                      >
                        <option value="random">🎲 Aléatoire (Peu importe)</option>
                        {monitors.map(m => {
                          let isBusy = false;
                          let reason = '';

                          if (moveConfig.date && moveConfig.time) {
                            const hasSlot = appointments.some(a => {
                              if (a.monitor_id?.toString() !== m.id.toString()) return false;
                              
                              // On laisse passer si c'est un créneau de notre propre vol
                              if (a.status !== 'available' && !currentBookingSlotIds.includes(a.id)) return false;
                              
                              const d = new Date(a.start_time);
                              const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
                              const timeStr = `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
                              
                              if (dateStr !== moveConfig.date || timeStr !== moveConfig.time) return false;
                              
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
                                }
                              }
                              return true;
                            });
                            
                            isBusy = !hasSlot;
                            if (isBusy) reason = ' (Occupé)';
                          }

                          return (
                            <option 
                              key={m.id} 
                              value={m.id} 
                              disabled={isBusy} 
                              className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}
                            >
                              {m.title} {reason}
                            </option>
                          );
                        })}
                      </select>
                    </div>

                    <div className="pt-4 space-y-3">
                      <button 
                        onClick={handleMove} 
                        disabled={!moveConfig.time}
                        className={`w-full py-4 rounded-3xl font-black uppercase italic shadow-xl transition-all ${!moveConfig.time ? 'bg-slate-200 text-slate-400 cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                      >
                        Transférer le créneau
                      </button>
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
              
              {/* NOUVEAU : Choix du Plan à générer */}
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

              {/* NOUVEAU : Choix du Pilote cible */}
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
                  
                  // Fonction interne pour gérer l'appel
                  const sendGenerationRequest = async (force = false) => {
                    try {
                      const res = await apiFetch('/api/generate-slots', { 
                        method: 'POST', 
                        body: JSON.stringify({ ...genConfig, forceOverwrite: force }) 
                      });
                      
                      const data = await res.json();

                      // Si le radar anti-écrasement s'active (Code 409)
                      if (res.status === 409 && data.warning) {
                        const userConfirmed = window.confirm(data.message);
                        if (userConfirmed) {
                          // On relance la fonction en forçant le passage
                          return await sendGenerationRequest(true);
                        } else {
                           // L'utilisateur annule
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

                  // On lance la première tentative sans forcer
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