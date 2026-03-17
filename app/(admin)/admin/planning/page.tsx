"use client";
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import dayGridPlugin from '@fullcalendar/daygrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '@/lib/api';

export default function PlanningAdmin() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [activeTab, setActiveTab] = useState('reserver');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [targetDate, setTargetDate] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);
  const [genConfig, setGenConfig] = useState<any>({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6] 
  });

  const calendarRef = useRef<any>(null);

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [apptsRes, monRes, flightRes] = await Promise.all([
        apiFetch('/api/appointments'), 
        apiFetch('/api/monitors'), 
        apiFetch('/api/vols')
      ]);

      if (apptsRes.ok) {
        const rawEvents = await apptsRes.json();
        setAppointments(rawEvents);
        setCalendarKey(prev => prev + 1);
      }
      
      if (monRes.ok) {
        const monData = await monRes.json();
        setMonitors(monData.map((m: any) => ({ id: m.id, title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
    } catch (err) { console.error(err); }
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    const d = event.start;
    if (!d) return;

    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    setSelectedEvent({
      id: event.id,
      title: event.title || '',
      start: formattedDate,
      oldStart: formattedDate,
      monitorId: event.getResources()[0]?.id,
      oldMonitorId: event.getResources()[0]?.id,
      notes: event.extendedProps.notes || '',
      status: event.extendedProps.status
    });
    
    setTargetDate(formattedDate);
    setActiveTab('reserver');
    setShowEditModal(true);
  };

  const handleSaveMove = async () => {
    if (!selectedEvent) return;
    const hasMoved = targetDate !== selectedEvent.oldStart || selectedEvent.monitorId !== selectedEvent.oldMonitorId;

    try {
      let res;
      if (hasMoved && selectedEvent.title && selectedEvent.title.trim() !== "") {
        const targetSlot = appointments.find(s => {
          const sDate = new Date(s.start);
          const sFormatted = `${sDate.getFullYear()}-${String(sDate.getMonth() + 1).padStart(2, '0')}-${String(sDate.getDate()).padStart(2, '0')}T${String(sDate.getHours()).padStart(2, '0')}:${String(sDate.getMinutes()).padStart(2, '0')}`;
          return sFormatted === targetDate && s.resourceId === selectedEvent.monitorId && s.status === 'available';
        });

        if (!targetSlot) return alert("Destination occupée ou inexistante.");

        await apiFetch(`/api/appointments/${selectedEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: null, status: 'available', notes: '' })
        });

        res = await apiFetch(`/api/appointments/${targetSlot.id}`, {
          method: 'PUT',
          body: JSON.stringify({ title: selectedEvent.title, status: 'booked', notes: selectedEvent.notes })
        });
      } else {
        res = await apiFetch(`/api/appointments/${selectedEvent.id}`, {
          method: 'PUT',
          body: JSON.stringify({ 
            monitorId: selectedEvent.monitorId,
            notes: selectedEvent.notes,
            title: selectedEvent.title && selectedEvent.title.trim() !== "" ? selectedEvent.title : null,
            status: selectedEvent.title && selectedEvent.title.trim() !== "" ? 'booked' : 'available'
          })
        });
      }

      if (res && res.ok) {
        setShowEditModal(false);
        await loadInitialData();
      } else {
        const errJson = await res?.json();
        alert("Erreur serveur : " + (errJson?.error || "Vérifiez vos données"));
      }
    } catch (err) {
      alert("Erreur de connexion réseau.");
    }
  };

  const handleClearReservation = async () => {
    if(!confirm("Libérer ce créneau ?")) return;
    try {
      const res = await apiFetch(`/api/appointments/${selectedEvent.id}`, { 
        method: 'PUT', 
        body: JSON.stringify({ title: null, status: 'available', notes: '' }) 
      });
      if (res.ok) {
        setShowEditModal(false); 
        await loadInitialData();
      }
    } catch (err) { console.error(err); }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <style jsx global>{`
        .fc-timegrid-slot { height: 25px !important; }
        .fc-event-main { padding: 4px !important; border-radius: 8px; }
        .fc-event-title { font-size: 0.75rem !important; font-weight: 900 !important; color: #1e293b; }
        .fc-event-time { font-size: 0.65rem !important; margin-bottom: 2px; }
        .fc-col-header-cell { background: #f8fafc; padding: 10px 0 !important; }
      `}</style>

      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter">Planning Pro</h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-sm shadow-xl active:scale-95 transition-all">⚙️ Générer</button>
      </div>

      <div className="calendar-container shadow-2xl rounded-[40px] overflow-hidden border border-slate-100 bg-white p-2">
        <FullCalendar
          key={calendarKey}
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, interactionPlugin, timeGridPlugin, dayGridPlugin]}
          datesAboveResources={true} 
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth'
          }}
          buttonText={{ today: "Aujourd'hui", month: "Mois", week: "Semaine", day: "Jour" }}
          initialView="resourceTimeGridDay"
          locales={[frLocale]}
          locale="fr"
          resources={monitors}
          events={appointments}
          displayEventEnd={true}
          slotEventOverlap={false}
          eventClick={handleEventClick}
          height="auto"
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          slotDuration="00:15:00"
          slotLabelInterval="01:00:00"
          nowIndicator={true}
        />
      </div>

      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex bg-slate-50 p-2 gap-2">
              <button onClick={() => setActiveTab('reserver')} className={`flex-1 py-4 rounded-3xl font-black uppercase italic text-xs ${activeTab === 'reserver' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>👤 Réservation</button>
              <button onClick={() => setActiveTab('config')} className={`flex-1 py-4 rounded-3xl font-black uppercase italic text-xs ${activeTab === 'config' ? 'bg-white shadow-sm text-slate-900' : 'text-slate-400'}`}>📝 Notes</button>
            </div>
            <div className="p-8 space-y-6">
              {activeTab === 'reserver' ? (
                <div className="space-y-4">
                  <input className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-slate-900" placeholder="Nom du Passager" value={selectedEvent.title} onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})} />
                  <div className="grid grid-cols-2 gap-4">
                    <input type="datetime-local" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold text-xs" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
                    <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none" value={selectedEvent.monitorId} onChange={(e) => setSelectedEvent({...selectedEvent, monitorId: e.target.value})}>
                      {monitors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                    </select>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea className="w-full border-2 border-slate-100 rounded-2xl p-4 min-h-[120px] outline-none" value={selectedEvent.notes} onChange={(e) => setSelectedEvent({...selectedEvent, notes: e.target.value})} />
                  {selectedEvent.title && (
                    <button onClick={handleClearReservation} className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase italic text-[10px] tracking-widest">
                      🚫 Libérer le créneau
                    </button>
                  )}
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={handleSaveMove} className="flex-1 bg-sky-500 text-white py-4 rounded-[25px] font-black uppercase italic shadow-lg active:scale-95 transition-all">Enregistrer</button>
                <button onClick={() => setShowEditModal(false)} className="px-6 py-4 font-bold text-slate-300 uppercase text-[10px]">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center text-slate-900">Génération Auto</h2>
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Début</label>
                <input type="date" className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Fin</label>
                <input type="date" className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              </div>
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5, 6, 0].map(d => (
                  <button key={d} onClick={() => setGenConfig((prev: any) => ({...prev, daysToApply: prev.daysToApply.includes(d) ? prev.daysToApply.filter((x: any) => x !== d) : [...prev.daysToApply, d]}))} className={`w-9 h-9 rounded-xl text-[10px] font-black ${genConfig.daysToApply.includes(d) ? 'bg-slate-900 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}>
                    {['D','L','M','M','J','V','S'][d]}
                  </button>
                ))}
              </div>
              <button onClick={async () => {
                const res = await apiFetch('/api/admin/generate-slots', { method: 'POST', body: JSON.stringify(genConfig) });
                if (res.ok) { setShowGenModal(false); await loadInitialData(); }
              }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl">Lancer la génération</button>
              <button onClick={() => setShowGenModal(false)} className="w-full py-2 font-bold text-slate-300 uppercase text-[10px] text-center">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}