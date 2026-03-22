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
  const [selectedMonitors, setSelectedMonitors] = useState<string[]>([]);
  
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
    daysToApply: [1, 2, 3, 4, 5, 6, 0] 
  });

  const loadData = async () => {
    try {
      const [apptsRes, monRes, flightRes] = await Promise.all([
        apiFetch('/api/slots'),
        apiFetch('/api/monitors-admin'),
        apiFetch('/api/flight-types')
      ]);

      if (apptsRes.ok) setAppointments(await apptsRes.json());
      
      if (monRes.ok) {
        const mons = await monRes.json();
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
      title: event.extendedProps.title, 
      start: event.start,
      monitor_id: event.getResources()[0]?.id,
      ...event.extendedProps
    });

    // CORRECTION 1 : On ne remplit pas le formulaire si le vrai titre est vide ou s'il s'agit d'une simple NOTE
    const realTitle = event.extendedProps.title;
    setFormData({
      title: realTitle === 'NOTE' ? '' : (realTitle || ''),
      flight_type_id: event.extendedProps.flight_type_id || '',
      weight: event.extendedProps.weight || '',
      notes: event.extendedProps.notes || ''
    });

    setActiveTab('client');
    setBlockType('none');
    setSelectedMonitors([]);
    setShowEditModal(true);
  };

  const handleSaveNote = async () => {
    if (!selectedEvent) return;
    try {
      // CORRECTION 2 & 3 : On définit le titre intelligemment selon l'action
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
      } else if (blockType === 'specific') {
        const slotsToBlock = appointments.filter(a => 
          a.start_time === selectedEvent.start_time && selectedMonitors.includes(a.monitor_id?.toString() || "")
        );
        await Promise.all(slotsToBlock.map(slot => 
          apiFetch(`/api/slots/${slot.id}`, {
            method: 'PATCH',
            body: JSON.stringify({ title: finalTitle || 'NON DISPO', notes: formData.notes, status: 'booked' })
          })
        ));
      } else {
        // Simple client ou Note non-bloquante
        const isNonBlockingNote = (finalTitle === 'NOTE' && activeTab === 'note');
        await apiFetch(`/api/slots/${selectedEvent.id}`, {
          method: 'PATCH',
          body: JSON.stringify({
            ...formData,
            title: finalTitle,
            status: isNonBlockingNote ? 'available' : (finalTitle.trim() ? 'booked' : 'available')
          })
        });
      }
      setShowEditModal(false);
      await loadData();
    } catch (err) { alert("Erreur lors de la sauvegarde"); }
  };

  const handleRelease = async () => {
    if (!selectedEvent || !confirm("Libérer ce créneau ?")) return;
    try {
      const res = await apiFetch(`/api/slots/${selectedEvent.id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          title: '',
          flight_type_id: null,
          weight: null,
          notes: '',
          status: 'available'
        })
      });
      if (res.ok) {
        setShowEditModal(false);
        await loadData();
      }
    } catch (err) { console.error(err); }
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
          events={appointments.map(a => {
            const flight = flightTypes?.find(f => f.id === a.flight_type_id);
            const flightColor = flight?.color_code || '#0ea5e9'; 

            const isPause = a.title?.includes('☕') || a.title?.toUpperCase().includes('PAUSE');
            const isAlert = a.title?.includes('❌') || a.title?.toUpperCase().includes('NON DISPO');

            return {
              id: a.id?.toString() || Math.random().toString(),
              resourceId: a.monitor_id?.toString() || "",
              start: a.start_time,
              end: a.end_time,
              title: a.title || (a.status === 'available' ? 'LIBRE' : ''),
              
              backgroundColor: isPause ? '#f1f5f9'
                             : isAlert ? '#fee2e2'
                             : (a.status === 'available' ? '#ffffff' : flightColor),
              
              textColor: a.status === 'available' ? (a.title === 'NOTE' ? '#f59e0b' : '#cbd5e1') 
                       : isPause ? '#94a3b8' 
                       : isAlert ? '#ef4444' 
                       : '#ffffff',
              
              borderColor: a.status === 'available' ? (a.title === 'NOTE' ? '#fcd34d' : '#e2e8f0') 
                         : isAlert ? '#fca5a5' 
                         : flightColor,
              
              extendedProps: { ...a }
            };
          })}
          locale={frLocale}
          headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridFourDay' }}
          views={{ resourceTimeGridFourDay: { type: 'resourceTimeGrid', duration: { days: 4 }, buttonText: '4 jours' } }}
          slotMinTime="08:00:00"
          slotMaxTime="20:00:00"
          allDaySlot={false}
          height="auto"
          eventClick={handleEventClick}
          slotDuration="00:05:00"
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
            
            <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-xl">
              <button onClick={() => setActiveTab('client')} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase ${activeTab === 'client' ? 'bg-white text-sky-500 shadow-sm' : 'text-slate-400'}`}>👤 Client</button>
              <button onClick={() => setActiveTab('note')} className={`flex-1 py-2 rounded-lg font-black text-[10px] uppercase ${activeTab === 'note' ? 'bg-white text-amber-500 shadow-sm' : 'text-slate-400'}`}>📝 Note / Alerte</button>
            </div>

            <div className="space-y-4">
              {activeTab === 'client' ? (
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
                      {flightTypes?.map(f => (
                        <option key={f.id?.toString()} value={f.id}>
                          {f.name} - {f.price_cents ? f.price_cents/100 : 0}€
                        </option>
                      ))}
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
              ) : (
                <>
                  <div className="flex gap-2">
                    <button 
                      disabled={blockType === 'none'}
                      onClick={() => setFormData({...formData, title: '☕ PAUSE'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${
                        blockType === 'none' 
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' 
                          : 'bg-slate-50 border-slate-100 hover:border-amber-200 text-slate-700 hover:shadow-sm'
                      }`}
                    >
                      ☕ Pause
                    </button>
                    
                    <button 
                      disabled={blockType === 'none'}
                      onClick={() => setFormData({...formData, title: 'NON DISPO'})} 
                      className={`flex-1 p-2 rounded-xl border-2 font-black text-[10px] uppercase transition-all ${
                        blockType === 'none' 
                          ? 'bg-slate-100 border-slate-200 text-slate-300 cursor-not-allowed opacity-60' 
                          : 'bg-slate-50 border-slate-100 hover:border-rose-200 text-slate-700 hover:shadow-sm'
                      }`}
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
                      className="w-full bg-white border border-slate-200 rounded-xl p-2 text-xs font-bold"
                      value={blockType}
                      onChange={(e: any) => setBlockType(e.target.value)}
                    >
                      <option value="none">Simple note (pas de blocage)</option>
                      <option value="all">🚫 Bloquer TOUS les pilotes</option>
                      <option value="specific">👥 Bloquer certains pilotes</option>
                    </select>

                    {blockType === 'specific' && (
                      <div className="mt-3 grid grid-cols-2 gap-2">
                        {monitors.map(m => (
                          <label key={m.id} className="flex items-center gap-2 p-2 bg-white rounded-lg border border-slate-100 text-[10px] font-bold cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={selectedMonitors.includes(m.id.toString())}
                              onChange={(e) => {
                                const id = m.id.toString();
                                setSelectedMonitors(prev => e.target.checked ? [...prev, id] : prev.filter(x => x !== id));
                              }}
                            />
                            {m.title}
                          </label>
                        ))}
                      </div>
                    )}
                  </div>
                </>
              )}

              <div className="pt-4 space-y-3">
                <button onClick={handleSaveNote} className="w-full bg-sky-500 text-white py-4 rounded-3xl font-black uppercase italic shadow-xl mt-4 hover:bg-sky-600 transition-colors">
                  Enregistrer {blockType !== 'none' ? 'et bloquer' : ''}
                </button>
                {selectedEvent?.title && (
                  <button onClick={handleRelease} className="w-full text-rose-500 font-black uppercase italic text-[10px] tracking-widest pt-2">
                    🗑️ Libérer le créneau
                  </button>
                )}
                <button onClick={() => setShowEditModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px]">
                  Annuler
                </button>
              </div>
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