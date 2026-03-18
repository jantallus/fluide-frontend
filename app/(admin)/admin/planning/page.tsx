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
  const [activeTab, setActiveTab] = useState('reserver');
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState<any>({ startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [app, mon, flight] = await Promise.all([
      apiFetch('/api/admin/appointments'),
      apiFetch('/api/monitors'),
      apiFetch('/api/admin/flight-types')
    ]);
    if (app.ok) setAppointments(await app.json());
    if (mon.ok) setMonitors(await mon.json());
    if (flight.ok) setFlightTypes(await flight.json());
  };

  const handleUpdate = async (data: any) => {
    const res = await apiFetch(`/api/admin/appointments/${selectedEvent.id}`, {
      method: 'PUT',
      body: JSON.stringify({
        ...data,
        start_time: selectedEvent.start,
        end_time: selectedEvent.end,
        monitor_id: data.monitor_id || selectedEvent.extendedProps.monitor_id
      })
    });
    if (res.ok) { setShowEditModal(false); loadData(); setCalendarKey(k => k + 1); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">Planning <span className="text-sky-500">Pro</span></h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic shadow-xl">⚙️ Générer auto</button>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-2xl p-6 overflow-hidden border border-slate-200">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments.map(a => ({
            ...a,
            title: a.status === 'booked' ? `${a.title} ${a.notes ? '📞 ' + a.notes : ''}` : '',
            backgroundColor: a.status === 'booked' ? (a.title.includes('BLOQUÉ') ? '#fecaca' : '#bae6fd') : '#ffffff', 
            textColor: a.status === 'booked' ? (a.title.includes('BLOQUÉ') ? '#991b1b' : '#0369a1') : '#94a3b8',
            borderColor: '#e2e8f0',
            extendedProps: { ...a }
          }))}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          height="auto"
          eventClick={(info) => { setSelectedEvent(info.event); setActiveTab('reserver'); setShowEditModal(true); }}
        />
      </div>

{showEditModal && selectedEvent && (
  <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
    <div className="bg-white rounded-[40px] p-8 max-w-lg w-full shadow-2xl text-slate-900">
      
      {/* ONGLETS */}
      <div className="flex bg-slate-100 p-1 rounded-2xl mb-6">
        <button onClick={() => setActiveTab('reserver')} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'reserver' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400'}`}>Réservation</button>
        <button onClick={() => setActiveTab('notes')} className={`flex-1 py-2 rounded-xl font-black text-[10px] uppercase transition-all ${activeTab === 'notes' ? 'bg-white shadow-sm text-sky-600' : 'text-slate-400'}`}>Notes / Blocage</button>
      </div>

      {activeTab === 'reserver' ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="col-span-2">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Nom du Passager</label>
            <input id="pop_name" type="text" defaultValue={selectedEvent.title.split('📞')[0].trim()} className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          
          <div>
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Téléphone</label>
            <input id="pop_phone" type="text" defaultValue={selectedEvent.extendedProps.notes} className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold outline-none" />
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Moniteur</label>
            <select id="pop_monitor" className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold outline-none">
              {monitors.map(m => (
                <option key={m.id} value={m.id} selected={m.id == selectedEvent.extendedProps.monitor_id}>{m.first_name}</option>
              ))}
            </select>
          </div>

          <div className="col-span-2">
            <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Type de Vol</label>
            <select id="pop_flight" className="w-full p-4 mt-1 rounded-2xl bg-slate-50 border-none font-bold outline-none">
              <option value="">Sélectionner une prestation...</option>
              {flightTypes.map(f => (<option key={f.id} value={f.name}>{f.name}</option>))}
            </select>
          </div>

          <button 
            onClick={() => {
              const name = (document.getElementById('pop_name') as HTMLInputElement).value;
              const phone = (document.getElementById('pop_phone') as HTMLInputElement).value;
              const monId = (document.getElementById('pop_monitor') as HTMLSelectElement).value;
              const flight = (document.getElementById('pop_flight') as HTMLSelectElement).value;
              
              handleUpdate({ 
                title: flight ? `${name} (${flight})` : name, 
                notes: phone, 
                monitor_id: monId, 
                status: 'booked' 
              });
            }} 
            className="col-span-2 bg-sky-500 text-white py-5 rounded-3xl font-black uppercase italic shadow-xl hover:bg-sky-600 transition-all"
          >Confirmer l'inscription</button>
        </div>
      ) : (
        <div className="space-y-4">
          <label className="text-[9px] font-black uppercase text-slate-400 ml-1">Motif du blocage</label>
          <textarea id="pop_notes_text" defaultValue={selectedEvent.extendedProps.notes} className="w-full p-4 h-32 rounded-3xl bg-slate-50 border-none font-bold resize-none outline-none focus:ring-2 focus:ring-slate-200"></textarea>
          
          <div className="grid grid-cols-2 gap-3">
            <button 
              onClick={() => {
                const note = (document.getElementById('pop_notes_text') as HTMLTextAreaElement).value;
                handleUpdate({ title: '🚫 BLOQUÉ', notes: note, status: 'booked' });
              }} 
              className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px]"
            >Bloquer ce pilote</button>
            
            <button 
              onClick={async () => {
                const note = (document.getElementById('pop_notes_text') as HTMLTextAreaElement).value;
                const res = await apiFetch('/api/admin/appointments/block-all', {
                  method: 'POST',
                  body: JSON.stringify({ start_time: selectedEvent.start, notes: note })
                });
                if(res.ok) { setShowEditModal(false); loadData(); setCalendarKey(k => k + 1); }
              }}
              className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]"
            >Bloquer TOUTE l'heure</button>
          </div>
        </div>
      )}
      
      {selectedEvent.extendedProps.status === 'booked' && (
        <button 
          onClick={async () => { 
            if(confirm("Libérer ce créneau ?")) { 
              await apiFetch(`/api/admin/appointments/${selectedEvent.id}/cancel`, { method: 'DELETE' }); 
              setShowEditModal(false); loadData(); setCalendarKey(k=>k+1); 
            }
          }} 
          className="w-full mt-4 text-rose-500 font-black text-[10px] uppercase hover:underline"
        >Réinitialiser (Libre)</button>
      )}

      <button onClick={() => setShowEditModal(false)} className="w-full py-2 font-bold text-slate-300 uppercase text-[10px] text-center mt-2">Fermer</button>
    </div>
  </div>
)}
              </div>
            ) : (
              <div className="space-y-4">
                <textarea id="pop_notes_text" placeholder="Raison du blocage..." className="w-full p-4 h-32 rounded-2xl bg-slate-50 border-none font-bold resize-none outline-none focus:ring-2 focus:ring-slate-200"></textarea>
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={() => handleUpdate({ title: '🚫 BLOQUÉ', notes: (document.getElementById('pop_notes_text') as any).value, status: 'booked' })} className="bg-slate-900 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Bloquer Pilote</button>
                  <button onClick={async () => {
                      const notes = (document.getElementById('pop_notes_text') as any).value;
                      await apiFetch('/api/admin/appointments/block-all', { method: 'POST', body: JSON.stringify({ start_time: selectedEvent.start, notes }) });
                      setShowEditModal(false); loadData(); setCalendarKey(k=>k+1);
                    }} className="bg-rose-500 text-white py-4 rounded-2xl font-black uppercase text-[10px]">Bloquer TOUS</button>
                </div>
              </div>
            )}
            <button onClick={() => setShowEditModal(false)} className="w-full py-2 font-bold text-slate-300 uppercase text-[10px] text-center mt-6">Fermer</button>
          </div>
        </div>
      )}

      {/* MODALE GÉNÉRATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-slate-900">
            <h2 className="text-2xl font-black mb-8 uppercase italic text-center">Génération</h2>
            <div className="space-y-6">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              <button disabled={isGenerating} onClick={async () => {
                  setIsGenerating(true);
                  const res = await apiFetch('/api/admin/appointments/generate', { method: 'POST', body: JSON.stringify(genConfig) });
                  if (res.ok) { setShowGenModal(false); loadData(); setCalendarKey(k => k + 1); }
                  setIsGenerating(false);
                }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl">
                {isGenerating ? "⏳..." : "Générer"}
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px] text-center">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}