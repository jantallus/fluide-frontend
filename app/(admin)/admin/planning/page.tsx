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
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [calendarKey, setCalendarKey] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);
  const [genConfig, setGenConfig] = useState<any>({ startDate: '', endDate: '', daysToApply: [1, 2, 3, 4, 5, 6, 0] });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [app, mon] = await Promise.all([apiFetch('/api/admin/appointments'), apiFetch('/api/monitors')]);
    if (app.ok) setAppointments(await app.json());
    if (mon.ok) setMonitors(await mon.json());
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans">
      
      {/* HEADER AVEC BOUTON RÉTABLI */}
      <div className="max-w-7xl mx-auto mb-8 flex justify-between items-center">
        <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">
            Planning <span className="text-sky-500">Pro</span>
        </h1>
        <button 
            onClick={() => setShowGenModal(true)} 
            className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic shadow-xl hover:bg-sky-500 transition-all"
        >
            ⚙️ Générer auto
        </button>
      </div>

      {/* CALENDRIER AVEC COULEUR BLEU PÂLE */}
      <div className="max-w-7xl mx-auto bg-white rounded-[40px] shadow-2xl p-6 overflow-hidden border border-slate-200">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments.map(a => ({
            ...a,
            title: a.status === 'booked' ? `${a.title} 📞 ${a.notes}` : '',
            // DESIGN : Bleu pâle (#bae6fd) pour les réservations, blanc pour le vide
            backgroundColor: a.status === 'booked' ? '#bae6fd' : '#ffffff', 
            textColor: a.status === 'booked' ? '#0369a1' : '#94a3b8', // Texte bleu foncé sur fond bleu pâle
            borderColor: a.status === 'booked' ? '#7dd3fc' : '#f1f5f9',
            extendedProps: { ...a }
          }))}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          allDaySlot={false}
          height="auto"
          eventClick={(info) => { setSelectedEvent(info.event); setShowEditModal(true); }}
        />
      </div>

      {/* MODALE RÉSERVATION */}
      {showEditModal && selectedEvent && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl text-slate-900">
            <h2 className="text-xl font-black mb-6 uppercase italic">
              {selectedEvent.extendedProps.status === 'booked' ? 'Fiche Vol' : 'Nouvelle Réservation'}
            </h2>
            <div className="space-y-4">
              {selectedEvent.extendedProps.status === 'booked' ? (
                <div className="space-y-4">
                  <div className="bg-sky-50 p-6 rounded-3xl">
                    <p className="text-[9px] font-black text-sky-400 uppercase">Passager</p>
                    <p className="font-black text-lg text-sky-900">{selectedEvent.extendedProps.title}</p>
                    <p className="text-[9px] font-black text-sky-400 uppercase mt-4">Contact</p>
                    <p className="font-bold text-sky-700">{selectedEvent.extendedProps.notes}</p>
                  </div>
                  <button onClick={async () => {
                    if(confirm("Annuler ce vol ?")) {
                      await apiFetch(`/api/admin/appointments/${selectedEvent.id}/cancel`, { method: 'DELETE' });
                      setShowEditModal(false); loadData(); setCalendarKey(k => k + 1);
                    }
                  }} className="w-full bg-rose-50 text-rose-500 py-4 rounded-2xl font-black uppercase text-[10px]">Libérer le créneau</button>
                </div>
              ) : (
                <div className="space-y-4">
                  <input id="in_name" type="text" placeholder="Nom du passager" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none" />
                  <input id="in_phone" type="text" placeholder="Téléphone" className="w-full p-4 rounded-2xl bg-slate-50 border-none font-bold outline-none" />
                  <button 
                    onClick={async () => {
                      const name = (document.getElementById('in_name') as HTMLInputElement).value;
                      const phone = (document.getElementById('in_phone') as HTMLInputElement).value;
                      if (!name) return alert("Nom requis");
                      const res = await apiFetch(`/api/admin/appointments/${selectedEvent.id}/book`, { method: 'PUT', body: JSON.stringify({ name, phone }) });
                      if (res.ok) { setShowEditModal(false); await loadData(); setCalendarKey(k => k + 1); }
                    }}
                    className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase italic"
                  >Enregistrer</button>
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
                  if (res.ok) { setShowGenModal(false); await loadData(); setCalendarKey(prev => prev + 1); }
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