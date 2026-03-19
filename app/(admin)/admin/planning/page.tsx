"use client";
import React, { useState, useEffect, useRef } from 'react';
import FullCalendar from '@fullcalendar/react';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '@/lib/api';

export default function PlanningAdmin() {
  // Ajout des types <any[]> pour satisfaire TypeScript
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [genConfig, setGenConfig] = useState<any>({ 
    startDate: '', 
    endDate: '', 
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
  });

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [apptsRes, monRes] = await Promise.all([
        apiFetch('/api/appointments'), 
        apiFetch('/api/monitors')
      ]);
      
      if (apptsRes.ok) setAppointments(await apptsRes.json());
      
      if (monRes.ok) {
        const monData = await monRes.json();
        // Typage explicite du paramètre 'm'
        setMonitors(monData.map((m: any) => ({ 
          id: m.id, 
          title: m.first_name 
        })));
      }
      setCalendarKey(prev => prev + 1);
    } catch (err) { console.error(err); }
  };

  // Typage explicite du paramètre 'info'
  const handleEventClick = (info: any) => {
    const event = info.event;
    const d = event.start;
    if(!d) return;

    const formattedDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
    
    setSelectedEvent({
      id: event.id,
      title: event.title || '',
      start: formattedDate,
      monitorId: event.getResources()[0]?.id,
      notes: event.extendedProps.notes || '',
      status: event.extendedProps.status
    });
    setShowEditModal(true);
  };

  const handleSaveMove = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/appointments/${selectedEvent.id}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          monitorId: selectedEvent.monitorId,
          notes: selectedEvent.notes,
          title: selectedEvent.title.trim() !== "" ? selectedEvent.title : null,
          status: selectedEvent.title.trim() !== "" ? 'booked' : 'available'
        })
      });
      if (res.ok) { 
        setShowEditModal(false); 
        loadInitialData(); 
      }
    } catch (err) { alert("Erreur de connexion."); }
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
       <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black uppercase italic text-slate-900 tracking-tighter">
          Planning <span className="text-sky-500 text-xs bg-white px-3 py-1 rounded-full shadow-sm ml-2 border border-sky-100">PROD FINAL</span>
        </h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-8 py-3 rounded-2xl font-black uppercase italic shadow-lg hover:bg-slate-800 transition-all">
          ⚙️ Générer
        </button>
      </div>

      <div className="bg-white shadow-2xl rounded-[40px] overflow-hidden p-6 border border-slate-200">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          timeZone="local"
          resources={monitors}
          events={appointments.map(a => ({
            ...a,
            backgroundColor: a.status === 'booked' ? (a.title?.includes('PAUSE') ? '#fecaca' : '#bae6fd') : '#ffffff',
            textColor: a.status === 'booked' ? (a.title?.includes('PAUSE') ? '#991b1b' : '#0369a1') : '#94a3b8',
            borderColor: '#f1f5f9'
          }))}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          height="auto"
          allDaySlot={false}
          eventClick={handleEventClick}
        />
      </div>

      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] w-full max-w-lg p-8 shadow-2xl">
             <h2 className="text-xl font-black uppercase italic mb-6">Modifier le créneau</h2>
             <input 
                className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold mb-4 outline-none focus:ring-2 focus:ring-sky-500" 
                placeholder="Nom du Passager" 
                value={selectedEvent.title} 
                onChange={(e) => setSelectedEvent({...selectedEvent, title: e.target.value})} 
             />
             <textarea 
                className="w-full border-2 border-slate-100 rounded-2xl p-4 mb-4 outline-none h-32 resize-none" 
                placeholder="Notes (téléphone, etc...)" 
                value={selectedEvent.notes} 
                onChange={(e) => setSelectedEvent({...selectedEvent, notes: e.target.value})} 
             />
             <div className="flex gap-4">
                <button onClick={handleSaveMove} className="flex-1 bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl hover:bg-sky-400 transition-all">
                  Enregistrer
                </button>
                <button onClick={() => setShowEditModal(false)} className="px-6 py-4 font-bold text-slate-300 uppercase text-[10px] hover:text-slate-500">
                  Fermer
                </button>
             </div>
          </div>
        </div>
      )}

      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black uppercase italic mb-6 text-center">Génération auto</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5, 6, 0].map((d: number) => (
                  <button 
                    key={d} 
                    onClick={() => setGenConfig((prev: any) => ({
                      ...prev, 
                      daysToApply: prev.daysToApply.includes(d) ? prev.daysToApply.filter((x: number) => x !== d) : [...prev.daysToApply, d]
                    }))} 
                    className={`w-8 h-8 rounded-lg text-[10px] font-black ${genConfig.daysToApply.includes(d) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}
                  >
                    {['D','L','M','M','J','V','S'][d]}
                  </button>
                ))}
              </div>

              <button onClick={async () => {
                const res = await apiFetch('/api/admin/generate-slots', { method: 'POST', body: JSON.stringify(genConfig) });
                if (res.ok) { setShowGenModal(false); loadInitialData(); }
              }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl">
                Lancer la génération
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-center text-slate-400 font-bold uppercase text-[10px]">
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}