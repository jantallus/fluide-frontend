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
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [availableSlots, setAvailableSlots] = useState<any[]>([]);
  const [moveDate, setMoveDate] = useState("");
  const [calendarKey, setCalendarKey] = useState(0);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [app, mon] = await Promise.all([apiFetch('/api/admin/appointments'), apiFetch('/api/monitors')]);
    if (app.ok) setAppointments(await app.json());
    if (mon.ok) setMonitors(await mon.json());
  };

  const fetchAvailableForMove = async (date: string) => {
    setMoveDate(date);
    const res = await apiFetch(`/api/admin/available-slots?date=${date}`);
    if (res.ok) setAvailableSlots(await res.json());
  };

  const moveBooking = async (newSlotId: number) => {
    const res = await apiFetch('/api/admin/appointments/move', {
      method: 'PUT',
      body: JSON.stringify({ oldSlotId: selectedEvent.id, newSlotId })
    });
    if (res.ok) { setShowEditModal(false); loadData(); setCalendarKey(k => k + 1); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8 font-sans">
      <div className="bg-white rounded-[40px] shadow-2xl p-6 overflow-hidden">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments.map(a => ({
            ...a,
            title: a.status === 'booked' ? `${a.title} 📞 ${a.notes}` : '',
            backgroundColor: a.status === 'booked' ? '#0ea5e9' : 'transparent',
            borderColor: '#e2e8f0',
            extendedProps: { ...a }
          }))}
          eventClick={(info) => { setSelectedEvent(info.event); setMoveDate(""); setAvailableSlots([]); setShowEditModal(true); }}
        />
      </div>

      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase italic text-slate-900">
              {selectedEvent.extendedProps.status === 'booked' ? 'Gérer le Vol' : 'Inscription'}
            </h2>
            
            <div className="space-y-4">
              {selectedEvent.extendedProps.status === 'booked' ? (
                <div className="space-y-6">
                  <div className="bg-slate-50 p-6 rounded-3xl">
                    <p className="font-black text-lg">{selectedEvent.extendedProps.title}</p>
                    <p className="text-sky-600 font-bold">{selectedEvent.extendedProps.notes}</p>
                  </div>
                  
                  <div className="border-t pt-4 space-y-4">
                    <p className="text-[10px] font-black uppercase text-slate-400">Déplacer le vol :</p>
                    <input type="date" className="w-full p-4 bg-slate-100 rounded-2xl font-bold" onChange={(e) => fetchAvailableForMove(e.target.value)} />
                    
                    {availableSlots.length > 0 && (
                      <select className="w-full p-4 bg-sky-50 rounded-2xl font-bold text-sky-900" onChange={(e) => moveBooking(Number(e.target.value))}>
                        <option>Choisir un nouveau créneau...</option>
                        {availableSlots.map(s => (
                          <option key={s.id} value={s.id}>
                            {new Date(s.start_time).toLocaleTimeString('fr-FR', {hour:'2-digit', minute:'2-digit'})} - Moniteur {s.monitor_id}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  <button onClick={async () => {
                    if(confirm("Annuler ?")) {
                      await apiFetch(`/api/admin/appointments/${selectedEvent.id}/cancel`, { method: 'DELETE' });
                      setShowEditModal(false); loadData(); setCalendarKey(k => k + 1);
                    }
                  }} className="w-full bg-rose-100 text-rose-600 py-4 rounded-2xl font-black uppercase text-[10px]">Annuler la réservation</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input id="n" placeholder="Nom" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" />
                  <input id="p" placeholder="Tel" className="w-full p-4 bg-slate-50 rounded-2xl font-bold" />
                  <button onClick={async () => {
                    const name = (document.getElementById('n') as HTMLInputElement).value;
                    const phone = (document.getElementById('p') as HTMLInputElement).value;
                    await apiFetch(`/api/admin/appointments/${selectedEvent.id}/book`, { method: 'PUT', body: JSON.stringify({ name, phone }) });
                    setShowEditModal(false); loadData(); setCalendarKey(k => k + 1);
                  }} className="w-full bg-sky-500 text-white py-5 rounded-3xl font-black uppercase">Réserver</button>
                </div>
              )}
              <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px] text-center">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}