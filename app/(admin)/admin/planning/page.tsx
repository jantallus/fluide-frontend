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
    } catch (err) { console.error(err); }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-black italic uppercase">Planning <span className="text-sky-500">Pro</span></h1>
        <button onClick={() => setShowGenModal(true)} className="bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic shadow-xl">⚙️ Générer</button>
      </div>

      <div className="bg-white rounded-[40px] shadow-2xl p-6 overflow-hidden">
        <FullCalendar
          key={calendarKey}
          plugins={[resourceTimeGridPlugin, interactionPlugin, timeGridPlugin]}
          initialView="resourceTimeGridDay"
          locale={frLocale}
          resources={monitors.map(m => ({ id: m.id.toString(), title: m.first_name }))}
          events={appointments}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          height="auto"
        />
      </div>

      {showGenModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-md z-[110] flex items-center justify-center p-4">
          <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-2xl">
            <h2 className="text-2xl font-black mb-8 uppercase italic text-center text-slate-900">Génération Auto</h2>
            <div className="space-y-6">
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, startDate: e.target.value})} />
              <input type="date" className="w-full border-2 border-slate-100 rounded-2xl p-4 font-bold" onChange={(e) => setGenConfig({...genConfig, endDate: e.target.value})} />
              <div className="flex gap-2 justify-center py-2">
                {[1, 2, 3, 4, 5, 6, 0].map(d => (
                  <button key={d} onClick={() => setGenConfig((prev: any) => ({...prev, daysToApply: prev.daysToApply.includes(d) ? prev.daysToApply.filter((x: any) => x !== d) : [...prev.daysToApply, d]}))} className={`w-10 h-10 rounded-xl font-black ${genConfig.daysToApply.includes(d) ? 'bg-slate-900 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    {['D','L','M','M','J','V','S'][d]}
                  </button>
                ))}
              </div>
              <button 
                disabled={isGenerating}
                onClick={async () => {
                  setIsGenerating(true);
                  const res = await apiFetch('/api/admin/appointments/generate', { method: 'POST', body: JSON.stringify(genConfig) });
                  if (res.ok) { 
                    setShowGenModal(false); 
                    await loadInitialData(); 
                    setCalendarKey(prev => prev + 1); // <--- FORCER LE RAFRAÎCHISSEMENT VISUEL
                  }
                  setIsGenerating(false);
                }} 
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black uppercase italic shadow-xl transition-all disabled:bg-slate-300"
              >
                {isGenerating ? "⏳ Génération..." : "Lancer la génération"}
              </button>
              <button onClick={() => setShowGenModal(false)} className="w-full text-slate-300 font-bold uppercase text-xs tracking-widest text-center">Annuler</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}