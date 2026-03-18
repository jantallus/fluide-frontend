"use client";
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '@/lib/api';

export default function PlanningAdmin() {
  const [appointments, setAppointments] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState<any>({ startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0] });

  useEffect(() => { loadInitialData(); }, []);

  const loadInitialData = async () => {
    try {
      const [appRes, monRes] = await Promise.all([
        apiFetch('/api/admin/appointments'),
        apiFetch('/api/monitors')
      ]);
      if (appRes.ok) setAppointments(await appRes.json());
      if (monRes.ok) setMonitors(await monRes.json());
    } catch (err) { console.error("Erreur chargement planning:", err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black italic uppercase text-slate-900">Planning <span className="text-sky-500">Pro</span></h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic shadow-xl">⚙️ Générer</button>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl p-6 overflow-hidden border border-slate-100">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin, timeGridPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments.map(a => ({
            ...a,
            // Titre vide si libre, sinon Nom + Tel
            title: a.status === 'booked' ? `${a.title || 'Client'} 📞 ${a.notes || ''}` : '',
            backgroundColor: a.status === 'booked' ? '#0f172a' : 'transparent',
            textColor: '#ffffff',
            borderColor: a.status === 'booked' ? '#0f172a' : '#e2e8f0',
            extendedProps: { ...a }
          }))}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          height="auto"
          allDaySlot={false}
          eventClick={(info) => { setSelectedEvent(info.event); setShowEditModal(true); }}
        />
      </div>

      {/* MODALE RÉSERVATION */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-slate-900">
            <h2 className="text-xl font-black mb-6 uppercase italic text-center">
              {selectedEvent.extendedProps.status === 'booked' ? 'Fiche Vol' : 'Nouvelle Réservation'}
            </h2>
            <div className="space-y-4">
              {selectedEvent.extendedProps.status === 'booked' ? (
                <div className="bg-slate-50 p-6 rounded-3xl space-y-4">
                  <div><p className="text-[9px] font-black text-slate-400 uppercase">Passager</p><p className="font-black text-lg">{selectedEvent.extendedProps.title}</p></div>
                  <div><p className="text-[9px] font-black text-slate-400 uppercase">Téléphone</p><p className="font-bold text-sky-600">{selectedEvent.extendedProps.notes}</p></div>
                </div>
              ) : (
                <div className="space-y-4">
                  <input id="in_name" type="text" placeholder="Nom du passager" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  <input id="in_phone" type="text" placeholder="Téléphone" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none focus:ring-2 focus:ring-sky-500" />
                  <button 
                    onClick={async () => {
                      const name = (document.getElementById('in_name') as HTMLInputElement).value;
                      const phone = (document.getElementById('in_phone') as HTMLInputElement).value;
                      if (!name) return alert("Nom requis");
                      const res = await apiFetch(`/api/admin/appointments/${selectedEvent.id}/book`, { method: 'PUT', body: JSON.stringify({ name, phone }) });
                      if (res.ok) { setShowEditModal(false); await loadInitialData(); setCalendarKey(k => k + 1); }
                    }}
                    className="w-full bg-sky-500 text-white py-5 rounded-3xl font-black uppercase italic shadow-xl"
                  >Enregistrer le vol</button>
                </div>
              )}
              <button onClick={() => setShowEditModal(false)} className="w-full py-2 font-bold text-slate-300 uppercase text-[10px] text-center">Fermer</button>
            </div>
          </div>
        </div>
      )}

      {/* MODALE GÉNÉRATION */}
      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase italic text-center">Génération Auto</h2>
            <div className="space-y-6">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              <button 
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  const res = await apiFetch('/api/admin/appointments/generate', { method: 'POST', body: JSON.stringify(genConfig) });
                  if (res.ok) { setShowGenModal(false); await loadInitialData(); setCalendarKey(prev => prev + 1); }
                  setIsGenerating(false);
                }} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl disabled:bg-slate-300"
              >
                {isGenerating ? "⏳ Génération..." : "Lancer la génération"}
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-[10px] text-center">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}