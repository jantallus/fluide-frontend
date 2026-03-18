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

  useEffect(() => {
    loadInitialData();
  }, []);

  const loadInitialData = async () => {
    try {
      const [appRes, monRes, flightRes] = await Promise.all([
        apiFetch('/api/admin/appointments'),
        apiFetch('/api/monitors'),
        apiFetch('/api/admin/config/flight-types')
      ]);
      if (appRes.ok) setAppointments(await appRes.json());
      if (monRes.ok) setMonitors(await monRes.json());
      if (flightRes.ok) setFlightTypes(await flightRes.json());
    } catch (err) {
      console.error("Erreur chargement:", err);
    }
  };

  const handleEventClick = (info: any) => {
    setSelectedEvent(info.event);
    setShowEditModal(true);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-900">
      
      {/* HEADER */}
      <div className="max-w-7xl mx-auto mb-8 flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter">
            Planning <span className="text-sky-500">Pro</span>
          </h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-widest mt-1">Gestion des ressources & vols</p>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setShowGenModal(true)}
            className="bg-white border-2 border-slate-200 hover:border-slate-900 px-6 py-3 rounded-2xl font-black uppercase italic text-xs transition-all shadow-sm"
          >
            Générer auto
          </button>
        </div>
      </div>

      {/* CALENDRIER */}
      <div className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-2xl shadow-slate-200/50 overflow-hidden border border-slate-100 p-4">
        <FullCalendar
          key={calendarKey}
          ref={calendarRef}
          plugins={[resourceTimeGridPlugin, timeGridPlugin, interactionPlugin, dayGridPlugin]}
          initialView="resourceTimeGridDay"
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments.map(a => ({
            id: a.id.toString(),
            resourceId: a.monitor_id.toString(),
            start: a.start_time,
            end: a.end_time,
            title: a.status === 'booked' ? `✅ ${a.title || 'Réservé'}` : '☁️ Libre',
            backgroundColor: a.status === 'booked' ? '#0f172a' : '#f8fafc',
            borderColor: a.status === 'booked' ? '#0f172a' : '#e2e8f0',
            textColor: a.status === 'booked' ? '#ffffff' : '#94a3b8',
            extendedProps: { ...a }
          }))}
          locale={frLocale}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,timeGridWeek,dayGridMonth' }}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          height="auto"
          eventClick={handleEventClick}
          stickyHeaderDates={true}
        />
      </div>

      {/* MODALE GENERATION - CORRIGÉE (BOUTON UNIQUE) */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center">Génération Auto</h2>
            
            <div className="space-y-4">
              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date de début</label>
                <input 
                  type="date" 
                  className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 transition-all" 
                  onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} 
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Date de fin</label>
                <input 
                  type="date" 
                  className="w-full border-2 border-slate-50 bg-slate-50 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 transition-all" 
                  onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} 
                />
              </div>
              
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5, 6, 0].map(d => (
                  <button 
                    key={d} 
                    onClick={() => setGenConfig((prev: any) => ({
                      ...prev, 
                      daysToApply: prev.daysToApply.includes(d) 
                        ? prev.daysToApply.filter((x: any) => x !== d) 
                        : [...prev.daysToApply, d]
                    }))} 
                    className={`w-9 h-9 rounded-xl text-[10px] font-black transition-all ${
                      genConfig.daysToApply.includes(d) ? 'bg-slate-900 text-white shadow-lg shadow-slate-900/20' : 'bg-slate-100 text-slate-400'
                    }`}
                  >
                    {['D','L','M','M','J','V','S'][d]}
                  </button>
                ))}
              </div>

              {/* LE BOUTON DE GÉNÉRATION (SORTI DE LA BOUCLE) */}
              <button 
                disabled={isGenerating}
                onClick={async () => {
                  if (!genConfig.startDate || !genConfig.endDate) return alert("Choisis les dates !");
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
                    alert("Erreur de connexion au serveur");
                  } finally {
                    setIsGenerating(false);
                  }
                }} 
                className={`w-full py-5 rounded-3xl font-black uppercase italic shadow-xl transition-all ${
                  isGenerating ? 'bg-slate-300 cursor-not-allowed text-white' : 'bg-slate-900 text-white hover:bg-sky-500'
                }`}
              >
                {isGenerating ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="animate-spin">⏳</span> Génération...
                  </span>
                ) : (
                  "Lancer la génération"
                )}
              </button>

              <button 
                onClick={() => setShowGenModal(false)} 
                className="w-full py-2 font-bold text-slate-300 uppercase text-[10px] text-center hover:text-slate-500 transition-colors"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE EDITION (Optionnelle, pour voir les détails) */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
            <h2 className="text-xl font-black mb-2 uppercase italic text-slate-900">Détails du créneau</h2>
            <p className="text-[10px] font-black uppercase text-sky-500 mb-6 tracking-widest">Référence #{selectedEvent.id}</p>
            
            <div className="bg-slate-50 p-6 rounded-3xl space-y-3 mb-8">
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase text-slate-400">Statut</span>
                 <span className={`text-[10px] font-black uppercase ${selectedEvent.extendedProps.status === 'booked' ? 'text-green-500' : 'text-slate-400'}`}>
                   {selectedEvent.extendedProps.status === 'booked' ? 'Confirmé' : 'Libre'}
                 </span>
               </div>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase text-slate-400">Client</span>
                 <span className="font-black text-sm">{selectedEvent.extendedProps.title || 'Aucun'}</span>
               </div>
               <div className="flex justify-between">
                 <span className="text-[10px] font-black uppercase text-slate-400">Notes</span>
                 <span className="text-xs font-bold text-slate-500">{selectedEvent.extendedProps.notes || '-'}</span>
               </div>
            </div>

            <button 
              onClick={() => setShowEditModal(false)}
              className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase italic shadow-xl hover:bg-slate-800 transition-all"
            >
              Fermer
            </button>
          </div>
        </div>
      )}

    </div>
  );
}