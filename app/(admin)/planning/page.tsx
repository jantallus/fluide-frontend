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
  const [activeTab, setActiveTab] = useState<'client' | 'note'>('client');
  const [blockType, setBlockType] = useState<'none' | 'all' | 'specific'>('none');
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]); // Pour le blocage ciblé
  
  // État pour la réservation
  const [formData, setFormData] = useState<{
  title: string,
  flight_type_id: string,
  weight: string | number, // On autorise les deux types ici
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
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
  });

  const loadData = async () => {
    try {
      const [apptsRes, monRes, flightRes] = await Promise.all([
        apiFetch('/api/slots'),
        apiFetch('/api/monitors'),
        apiFetch('/api/flight-types')
      ]);

      if (apptsRes.ok) setAppointments(await apptsRes.json());
      
      if (monRes.ok) {
        const mons = await monRes.json();
        // On force l'ID en string pour correspondre aux UUIDs de la base de données
        setMonitors(mons.map((m: any) => ({ 
          id: String(m.id), 
          title: m.first_name 
        })));
      }
      if (flightRes.ok) setFlightTypes(await flightRes.json());
      
      setCalendarKey(prev => prev + 1);
    } catch (err) { console.error("Erreur chargement planning:", err); }
  };

  useEffect(() => { loadData(); }, []);

  const handleEventClick = (info: any) => {
    const event = info.event;
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      monitor_id: event.getResources()[0]?.id,
      ...event.extendedProps
    });
    setFormData({
      title: event.title || '',
      flight_type_id: event.extendedProps.flight_type_id || '',
      weight: event.extendedProps.weight || '',
      notes: event.extendedProps.notes || ''
    });
    setShowEditModal(true);
  };

  const handleSave = async () => {
    if (!selectedEvent) return;
    try {
      const res = await apiFetch(`/api/slots/${selectedEvent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          ...formData,
          status: formData.title ? 'booked' : 'available'
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        await loadData(); // Force le rechargement immédiat de la base de données
      }
    } catch (err) { alert("Erreur lors de la sauvegarde"); }
  };

  const handleSaveNote = async () => {
  if (!selectedEvent) return;

  // 1. Si blocage global "TOUT LE MONDE"
  if (blockType === 'all') {
    const allSlotsAtSameTime = appointments.filter(a => a.start_time === selectedEvent.start_time);
    
    await Promise.all(allSlotsAtSameTime.map(slot => 
      apiFetch(`/api/slots/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: formData.title || '❌ BLOCAGE',
          notes: formData.notes,
          status: 'booked'
        })
      })
    ));
  } 
  // 2. Si blocage "MONITEURS SPÉCIFIQUES"
  else if (blockType === 'specific') {
    const slotsToBlock = appointments.filter(a => 
      a.start_time === selectedEvent.start_time && selectedMonitors.includes(a.monitor_id?.toString())
    );

    await Promise.all(slotsToBlock.map(slot => 
      apiFetch(`/api/slots/${slot.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: formData.title || '❌ INDISPO',
          notes: formData.notes,
          status: 'booked'
        })
      })
    ));
  }
  // 3. Simple Note sur le créneau actuel
  else {
    await apiFetch(`/api/slots/${selectedEvent.id}`, {
      method: 'PATCH',
      body: JSON.stringify({
        ...formData,
        status: formData.title.trim() !== "" ? 'booked' : 'available'
      })
    });
  }

  setShowEditModal(false);
  loadData();
};

  return (
    <div className="p-4 bg-slate-50 min-h-screen">
      <header className="flex justify-between items-center mb-8 px-4">
        <div>
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            Planning <span className="text-sky-500">Vols</span>
          </h1>
        </div>
        <button 
          onClick={() => setShowGenModal(true)}
          className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-transform"
        >
          ⚙️ Générer la semaine
        </button>
      </header>

      <div className="bg-white rounded-[35px] shadow-2xl border border-slate-200 p-6 overflow-hidden">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          resources={monitors}
          // MODIFIÉ : Mapping complet pour l'affichage
          events={appointments.map(a => ({
            id: a.id?.toString() || Math.random().toString(),
            resourceId: a.monitor_id?.toString() || "",
            start: a.start_time,
            end: a.end_time,
            title: a.title || (a.status === 'available' ? 'LIBRE' : ''),
            backgroundColor: a.title?.includes('☕') ? '#f1f5f9' : (a.status === 'available' ? '#ffffff' : '#0ea5e9'),
            textColor: a.status === 'available' ? '#cbd5e1' : (a.title?.includes('☕') ? '#94a3b8' : '#ffffff'),
            borderColor: a.status === 'available' ? '#e2e8f0' : '#0ea5e9',
            extendedProps: { ...a }
          }))}
          locale={frLocale}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridFourDay' }}
          views={{ resourceTimeGridFourDay: { type: 'resourceTimeGrid', duration: { days: 4 }, buttonText: '4 jours' } }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="auto"
          eventClick={handleEventClick}
          slotDuration="00:05:00"        // Grain plus fin pour éviter les chevauchements visuels
  snapDuration="00:05:00"
  eventOverlap={false}           // Interdire visuellement la superposition
  slotEventOverlap={false}       // Forcer les événements à se suivre proprement
  displayEventTime={true}
  eventTimeFormat={{
    hour: '2-digit',
    minute: '2-digit',
    meridiem: false,
    hour12: false
  }}
/>
      </div>

      {/* MODALE ÉDITION / RÉSERVATION */}
      {/* MODALE ÉDITION */}
{showEditModal && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
    <div className="bg-white rounded-[40px] p-8 max-w-md w-full shadow-2xl">
      
      <h2 className="text-2xl font-black uppercase italic mb-6 text-slate-900">Gestion Créneau</h2>

      {/* --- C'EST ICI QUE TU COLLES LE BLOC --- */}
      
      {/* ONGLETS */}
      <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
        <button onClick={() => setActiveTab('client')} className={`flex-1 py-2 rounded-lg font-black text-[10px] ${activeTab === 'client' ? 'bg-white text-sky-500' : 'text-slate-400'}`}>👤 CLIENT</button>
        <button onClick={() => setActiveTab('note')} className={`flex-1 py-2 rounded-lg font-black text-[10px] ${activeTab === 'note' ? 'bg-white text-amber-500' : 'text-slate-400'}`}>📝 NOTE / ALERTE</button>
      </div>

      {activeTab === 'client' ? (
        <div className="space-y-4">
          {/* Tes inputs clients (Nom, Prestation, Poids) */}
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Client</label>
            <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} />
          </div>
          <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Prestation</label>
            <select className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold" value={formData.flight_type_id} onChange={e => setFormData({...formData, flight_type_id: e.target.value})}>
              <option value="">Choisir...</option>
              {flightTypes?.map(f => (<option key={f.id} value={f.id}>{f.name}</option>))}
            </select>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
           {/* Le contenu de l'onglet NOTE que tu as fourni */}
           <div>
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Message / Note</label>
            <textarea className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold h-24" value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Infos météo, retard, indispo..." />
          </div>
          <div className="bg-slate-50 p-4 rounded-2xl border-2 border-slate-100">
             {/* ... Reste du bloc select blockType et checkbox monitors ... */}
          </div>
        </div>
      )}

      {/* BOUTONS ACTIONS (En bas de modale) */}
      <div className="pt-6 space-y-3">
        <button onClick={handleSaveNote} className="w-full bg-slate-900 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl">
          Enregistrer {blockType !== 'none' ? 'et bloquer' : ''}
        </button>
        {selectedEvent?.title && (
          <button onClick={handleRelease} className="w-full text-rose-500 font-black uppercase italic text-[10px] tracking-widest pt-2">
            🗑️ Libérer le créneau
          </button>
        )}
        <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Annuler</button>
      </div>

      {/* --- FIN DU BLOC --- */}

    </div>
  </div>
)}

      {/* MODALE GÉNÉRATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[100] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-8 max-w-sm w-full shadow-2xl">
            <h2 className="text-xl font-black uppercase italic mb-6">Générer les créneaux</h2>
            <div className="space-y-4">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4" onChange={e => setGenConfig({...genConfig, endDate: e.target.value})} />
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
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">Fermer</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}