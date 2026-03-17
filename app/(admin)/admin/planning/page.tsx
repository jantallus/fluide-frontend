"use client";
import React, { useState, useEffect } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import { apiFetch } from '@/lib/api';

export default function PlanningColonnes() {
  const [events, setEvents] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const [resMonitors, resSlots] = await Promise.all([
        apiFetch('/api/monitors'),
        apiFetch('/api/appointments') // Ou /api/slots selon ton back
      ]);

      if (resMonitors.ok) {
        const monData = await resMonitors.json();
        // Transformation pour FullCalendar : il faut 'id' et 'title'
        setMonitors(monData.map((m: any) => ({
          id: m.id.toString(),
          title: m.first_name || m.name
        })));
      }

      if (resSlots.ok) {
        const slotData = await resSlots.json();
        setEvents(slotData.map((s: any) => ({
          id: s.id.toString(),
          resourceId: s.monitor_id?.toString() || s.resourceId?.toString(),
          title: s.status === 'booked' ? `💰 ${s.customer_name || 'Réservé'}` : '✅ DISPO',
          start: s.start_time,
          end: s.end_time,
          backgroundColor: s.status === 'booked' ? '#2563eb' : '#10b981',
          borderColor: 'transparent'
        })));
      }
    } catch (err) {
      console.error("Erreur chargement:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="p-20 text-center font-black italic">FLUIDE : CHARGEMENT DES COLONNES...</div>;

  return (
    <div className="min-h-screen bg-white p-4">
      {/* HEADER SIMPLE SANS GÉNÉRATEUR À GAUCHE */}
      <div className="flex justify-between items-center mb-8 px-4">
        <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
          Planning Moniteurs
        </h1>
        <div className="flex gap-2">
           <button onClick={loadData} className="bg-slate-100 text-slate-600 px-4 py-2 rounded-xl font-bold text-xs uppercase">Actualiser</button>
           <button className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase italic text-sm shadow-lg">Action</button>
        </div>
      </div>

      {/* CALENDRIER PLEINE LARGEUR */}
      <div className="shadow-2xl rounded-[40px] overflow-hidden border border-slate-100 bg-white p-4">
        <FullCalendar
          plugins={[resourceTimeGridPlugin, interactionPlugin]}
          initialView="resourceTimeGridDay" // Vue par colonnes (1 colonne = 1 moniteur)
          resources={monitors}
          events={events}
          locale={frLocale}
          headerToolbar={{
            left: 'prev,next today',
            center: 'title',
            right: 'resourceTimeGridDay,resourceTimeGridWeek'
          }}
          slotMinTime="08:00:00"
          slotMaxTime="19:00:00"
          slotDuration="00:15:00"
          allDaySlot={false}
          height="80vh"
          nowIndicator={true}
          stickyHeaderDates={true}
          resourceOrder="title"
          eventClassNames="rounded-lg shadow-sm font-bold text-[10px] border-none"
        />
      </div>

      <style jsx global>{`
        .fc-resource-timeline-divider { width: 0 !important; }
        .fc-col-header-cell { background: #f8fafc !important; padding: 15px 0 !important; border-bottom: 2px solid #e2e8f0 !important; }
        .fc-col-header-cell-cushion { font-weight: 900 !important; text-transform: uppercase; font-style: italic; color: #0f172a; }
        .fc-timegrid-slot { height: 40px !important; border-bottom: 1px solid #f1f5f9 !important; }
        .fc-toolbar-title { font-weight: 900 !important; text-transform: uppercase; font-style: italic; letter-spacing: -1px; }
      `}</style>
    </div>
  );
}