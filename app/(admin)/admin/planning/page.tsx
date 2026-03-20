"use client";
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '@/lib/api';

export default function PlanningAdmin() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [activeTab, setActiveTab] = useState('reserver');
  const [calendarKey, setCalendarKey] = useState(0);
  const [genConfig, setGenConfig] = useState({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
  });

  const loadData = async () => {
    try {
      const [apptsRes, monRes, flightRes] = await Promise.all([
        apiFetch('/api/appointments'),
        apiFetch('/api/monitors'),
        apiFetch('/api/flight-types')
      ]);

      if (apptsRes.ok) setAppointments(await apptsRes.json());
      if (monRes.ok) {
        const mons = await monRes.json();
        setMonitors(mons.map((m: any) => ({ id: m.id, title: m.first_name })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
      
      setCalendarKey(prev => prev + 1);
    } catch (err) { console.error(err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleSave = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/appointments/${selectedEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify({
          title: selectedEvent.title,
          notes: selectedEvent.notes,
          status: selectedEvent.title ? 'booked' : 'available',
          flight_type_id: selectedEvent.flight_type_id
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        loadData();
      }
    } catch (err) { alert("Erreur de sauvegarde"); }
  };

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-2xl font-black uppercase italic tracking-tighter">Planning <span className="text-sky-500">Fluide V3</span></h1>
          <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-6 py-2 rounded-xl font-bold uppercase text-[10px] shadow-lg">⚙️ Générer la semaine</button>
        </div>

        <div className="bg-white rounded-[35px] shadow-2xl border border-slate-200 p-6 overflow-hidden">
          <FullCalendar
            key={calendarKey}
            plugins={[resourceTimeGridPlugin, interactionPlugin]}
            initialView="resourceTimeGridDay"
            resources={monitors}
            events={appointments.map(a => ({
              id: a.id,
              resourceId: a.monitor_id,
              start: a.start_time,
              end: a.end_time,
              title: a.title || (a.status === 'available' ? 'LIBRE' : ''),
              backgroundColor: a.color_code || (a.status === 'available' ? '#ffffff' : '#f1f5f9'),
              textColor: a.status === 'available' ? '#cbd5e1' : '#0f172a',
              extendedProps: { notes: a.notes, status: a.status, flight_type_id: a.flight_type_id }
            }))}
            locale={frLocale}
            slotMinTime="08:00:00"
            slotMaxTime="19:00:00"
            allDaySlot={false}
            height="auto"
            eventClick={(info) => {
              const e = info.event;
              setSelectedEvent({
                id: e.id,
                title: e.title === 'LIBRE' ? '' : e.title,
                notes: e.extendedProps.notes || '',
                status: e.extendedProps.status,
                flight_type_id: e.extendedProps.flight_type_id
              });
              setShowEditModal(true);
            }}
          />
        </div>
      </div>

      {/* MODAL EDITION */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-md p-8 shadow-2xl">
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
              <button onClick={() => setActiveTab('reserver')} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'reserver' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400'}`}>Réservation</button>
              <button onClick={() => setActiveTab('block')} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'block' ? 'bg-white shadow-sm text-rose-600' : 'text-slate-400'}`}>Bloquer</button>
            </div>

            {activeTab === 'reserver' ? (
              <div className="space-y-4">
                <select 
                  className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none"
                  value={selectedEvent.flight_type_id || ""}
                  onChange={(e) => setSelectedEvent({...selectedEvent, flight_type_id: e.target.value})}
                >
                  <option value="">Choisir un type de vol</option>
                  {flightTypes.map((ft: any) => (
                    <option key={ft.id} value={ft.id}>{ft.name} - {ft.price_cents/100}€</option>
                  ))}
                </select>
                <input className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" placeholder="Nom du client" value={selectedEvent.title} onChange={e => setSelectedEvent({...selectedEvent, title: e.target.value})} />
                <textarea className="w-full border-2 border-slate-100 rounded-2xl p-4 h-24" placeholder="Notes..." value={selectedEvent.notes} onChange={e => setSelectedEvent({...selectedEvent, notes: e.target.value})} />
                <button onClick={handleSave} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">Enregistrer</button>
              </div>
            ) : (
              <div className="space-y-4 text-center">
                <button onClick={() => { setSelectedEvent({...selectedEvent, title: '🚫 BLOQUÉ', status: 'booked'}); }} className="w-full bg-rose-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">Bloquer le créneau</button>
                <button onClick={() => { setSelectedEvent({...selectedEvent, title: '', status: 'available', notes: '', flight_type_id: null}); }} className="w-full bg-slate-100 text-slate-400 py-4 rounded-3xl font-black uppercase italic">Libérer le créneau</button>
              </div>
            )}
            <button onClick={() => setShowEditModal(false)} className="w-full mt-4 text-slate-300 font-bold uppercase text-[10px]">Fermer</button>
          </div>
        </div>
      )}

      {/* MODAL GENERATION (Identique à ton ancienne mais typée) */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 mb-4" onChange={e => setGenConfig({...genConfig, startDate: e.target.value})} />
            <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 mb-4" onChange={e => setGenConfig({...genConfig, endDate: e.target.value})} />
            <button onClick={async () => {
              const res = await apiFetch('/api/admin/generate-slots', { method: 'POST', body: JSON.stringify(genConfig) });
              if (res.ok) { setShowGenModal(false); loadData(); }
            }} className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic shadow-xl">Lancer la génération</button>
            <button onClick={() => setShowGenModal(false)} className="w-full mt-4 text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
          </div>
        </div>
      )}
    </div>
  );
}