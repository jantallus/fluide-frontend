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
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState<any>({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
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
      if (apptsRes.ok) setAppointments(await apptsRes.json());
      if (monRes.ok) {
          const monData = await monRes.json();
          setMonitors(monData.map((m: any) => ({ id: m.id.toString(), title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
    } catch (err) { console.error(err); }
  };

  const handleEventClick = (info: any) => {
    const event = info.event;
    const d = event.start;
    if (!d) return;
    const formattedDate = d.toISOString().slice(0, 16);
    setSelectedEvent({
      id: event.id,
      title: event.title || '',
      start: formattedDate,
      monitorId: event.getResources()[0]?.id,
      notes: event.extendedProps.notes || '',
      status: event.extendedProps.status
    });
    setTargetDate(formattedDate);
    setActiveTab('reserver');
    setShowEditModal(true);
  };

  const handleSaveMove = async () => {
    if (!selectedEvent?.id) return;
    const res = await apiFetch(`/api/appointments/${selectedEvent.id}`, {
      method: 'PUT',
      body: JSON.stringify({ 
        title: selectedEvent.title,
        monitorId: selectedEvent.monitorId,
        notes: selectedEvent.notes,
        status: selectedEvent.title ? 'booked' : 'available'
      })
    });
    if (res.ok) { setShowEditModal(false); loadInitialData(); }
  };

  const handleClearReservation = async () => {
    if (!selectedEvent?.id || !confirm("Libérer ce créneau ?")) return;
    const res = await apiFetch(`/api/appointments/${selectedEvent.id}/clear`, { method: 'PUT' });
    if (res.ok) { setShowEditModal(false); loadInitialData(); }
  };

  return (
    <div className="p-4 bg-white min-h-screen">
      <style jsx global>{`
        .fc-timegrid-slot { height: 30px !important; }
        .fc-event-main { padding: 4px !important; border-radius: 8px; }
      `}</style>

      <div className="flex justify-between items-center mb-6 px-2">
        <h1 className="text-2xl font-black uppercase italic text-slate-900">Planning Pro</h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-sm shadow-xl transition-all">⚙️ Générer</button>
      </div>

      <div className="calendar-container shadow-2xl rounded-[40px] overflow-hidden bg-white p-2">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, interactionPlugin, timeGridPlugin, dayGridPlugin]}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridWeek,dayGridMonth' }}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors}
          events={appointments}
          eventClick={handleEventClick}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          height="auto"
        />
      </div>

      {/* MODALE EDITION */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg overflow-hidden shadow-2xl">
            <div className="flex bg-slate-50 p-2 gap-2">
              <button onClick={() => setActiveTab('reserver')} className={`flex-1 py-4 rounded-3xl font-black uppercase italic text-xs ${activeTab === 'reserver' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>👤 Réservation</button>
              <button onClick={() => setActiveTab('config')} className={`flex-1 py-4 rounded-3xl font-black uppercase italic text-xs ${activeTab === 'config' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}>📝 Notes</button>
            </div>
            <div className="p-8 space-y-6">
              {activeTab === 'reserver' ? (
                <div className="space-y-4">
                  <input className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" placeholder="Nom du Passager" value={selectedEvent.title} onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})} />
                  <select className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" value={selectedEvent.monitorId} onChange={(e) => setSelectedEvent({...selectedEvent, monitorId: e.target.value})}>
                    {monitors.map(m => <option key={m.id} value={m.id}>{m.title}</option>)}
                  </select>
                </div>
              ) : (
                <div className="space-y-4">
                  <textarea className="w-full border-2 border-slate-100 rounded-2xl p-4 min-h-[120px]" value={selectedEvent.notes} onChange={(e) => setSelectedEvent({...selectedEvent, notes: e.target.value})} />
                  {selectedEvent.title && <button onClick={handleClearReservation} className="w-full py-4 bg-orange-50 text-orange-600 rounded-2xl font-black uppercase italic text-[10px]">🚫 Libérer le créneau</button>}
                </div>
              )}
              <div className="flex gap-4">
                <button onClick={handleSaveMove} className="flex-1 bg-sky-500 text-white py-4 rounded-[25px] font-black uppercase italic shadow-lg">Enregistrer</button>
                <button onClick={() => setShowEditModal(false)} className="px-6 py-4 font-bold text-slate-300 uppercase text-[10px]">Fermer</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GENERATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center">Génération Auto</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5, 6, 0].map(d => (
                  <button 
  disabled={isGenerating}
  onClick={async () => {
    setIsGenerating(true);
    try {
      const res = await apiFetch('/api/admin/appointments/generate', { 
        method: 'POST', 
        body: JSON.stringify(genConfig) 
      });
      if (res.ok) { 
        setShowGenModal(false); 
        await loadInitialData(); 
      } else {
        alert("Erreur lors de la génération");
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion");
    } finally {
      setIsGenerating(false);
    }
  }} 
  className={`w-full py-5 rounded-2xl font-black uppercase italic shadow-xl transition-all ${
    isGenerating ? 'bg-slate-400 cursor-not-allowed text-white' : 'bg-slate-900 text-white hover:bg-sky-500'
  }`}
>
  {isGenerating ? (
    <span className="flex items-center justify-center gap-2">
      <span className="animate-spin text-xl">⏳</span> Génération en cours...
    </span>
  ) : (
    "Lancer la génération"
  )}
</button>
                ))}
              </div>
              <button onClick={async () => {
                const res = await apiFetch('/api/admin/appointments/generate', { method: 'POST', body: JSON.stringify(genConfig) });
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