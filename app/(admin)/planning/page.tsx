"use client";
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '../../../lib/api';

export default function PlanningAdmin() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  
  const [formData, setFormData] = useState({
    title: '',
    flight_type_id: '',
    weight: '',
    notes: ''
  });

  const [genConfig, setGenConfig] = useState({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
  });

  const loadData = async () => {
    try {
      const [appRes, monRes, flyRes] = await Promise.all([
        apiFetch('/api/slots'),
        apiFetch('/api/monitors-admin'),
        apiFetch('/api/flight-types')
      ]);

      if (appRes.ok) setAppointments(await appRes.json());
      if (monRes.ok) setMonitors(await monRes.json());
      if (flyRes.ok) setFlightTypes(await flyRes.json());
      
      setCalendarKey(prev => prev + 1);
    } catch (err) {
      console.error("Erreur chargement planning:", err);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEventClick = (info: any) => {
    const eventData = info.event.extendedProps;
    setSelectedEvent(eventData);
    setFormData({
      title: eventData.title || '',
      flight_type_id: eventData.flight_type_id?.toString() || '',
      weight: eventData.weight || '',
      notes: eventData.notes || ''
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/slots/${selectedEvent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...formData,
          status: formData.title.trim() !== "" ? 'booked' : 'available'
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        loadData();
      }
    } catch (err) {
      console.error("Erreur update:", err);
    }
  };

  return (
    <div className="p-4 h-screen bg-white flex flex-col font-sans">
      <div className="mb-4 flex justify-between items-center">
        <h1 className="text-2xl font-black italic uppercase tracking-tighter">Planning <span className="text-sky-500">Pro</span></h1>
        <button 
          onClick={() => setShowGenModal(true)}
          className="bg-slate-900 text-white px-6 py-2 rounded-full font-black uppercase italic text-xs shadow-lg hover:scale-105 transition-transform"
        >
          ⚙️ Générer la semaine
        </button>
      </div>

      <div className="flex-1 bg-slate-50 rounded-[30px] overflow-hidden border-4 border-slate-100 shadow-inner p-4">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          locales={[frLocale]}
          locale="fr"
          resources={monitors.map(m => ({ 
            id: m.id?.toString() || Math.random().toString(), 
            title: m.first_name 
          }))}
          events={appointments.map(a => ({
            id: a.id?.toString() || Math.random().toString(),
            resourceId: a.monitor_id?.toString() || "", // Protection cruciale ici
            start: a.start_time,
            end: a.end_time,
            title: a.title || (a.status === 'available' ? 'LIBRE' : ''),
            backgroundColor: a.title?.includes('☕') ? '#f1f5f9' : (a.status === 'available' ? '#ffffff' : '#0ea5e9'),
            textColor: a.status === 'available' ? '#cbd5e1' : (a.title?.includes('☕') ? '#94a3b8' : '#ffffff'),
            borderColor: a.status === 'available' ? '#e2e8f0' : '#0ea5e9',
            extendedProps: { ...a }
          }))}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridFourDay' }}
          views={{ resourceTimeGridFourDay: { type: 'resourceTimeGrid', duration: { days: 4 }, buttonText: '4 jours' } }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          eventClick={handleEventClick}
          height="100%"
        />
      </div>

      {/* MODALE ÉDITION */}
      {showEditModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-slate-900">Réservation</h2>
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Client</label>
                <input 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                  value={formData.title} 
                  onChange={e => setFormData({...formData, title: e.target.value})}
                  placeholder="Nom du client..."
                />
              </div>
              
              <div>
                <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prestation</label>
                <select 
                  className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                  value={formData.flight_type_id}
                  onChange={e => setFormData({...formData, flight_type_id: e.target.value})}
                >
                  <option value="">Choisir un vol...</option>
                  {flightTypes?.map(f => (
                    <option key={f.id?.toString()} value={f.id}>
                      {f.name} - {f.price_cents ? f.price_cents/100 : 0}€
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Poids (kg)</label>
                  <input 
                    type="number"
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold"
                    value={formData.weight}
                    onChange={e => setFormData({...formData, weight: e.target.value})}
                  />
                </div>
              </div>

              <div className="pt-4 space-y-3">
                <button onClick={handleUpdate} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">
                  Enregistrer
                </button>
                <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">
                  Annuler
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GÉNÉRATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={e => setGenConfig({...genConfig, endDate: e.target.value})} />
              <button 
                onClick={async () => {
                  const res = await apiFetch('/api/generate-slots', { 
                    method: 'POST', 
                    body: JSON.stringify(genConfig) 
                  });
                  if (res.ok) { setShowGenModal(false); loadData(); }
                }} 
                className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl"
              >
                Lancer la génération
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}