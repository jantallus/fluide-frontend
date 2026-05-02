"use client";
import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import FullCalendar from '@fullcalendar/react';
import resourceTimeGridPlugin from '@fullcalendar/resource-timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import frLocale from '@fullcalendar/core/locales/fr';
import scrollgridPlugin from '@fullcalendar/scrollgrid';
import { usePlanningData } from '@/hooks/usePlanningData';
import EditSlotModal from '@/components/planning/EditSlotModal';
import GenSlotsModal from '@/components/planning/GenSlotsModal';
import { useToast } from '@/components/ui/ToastProvider';
import { RefreshCw, PauseCircle, Wrench, CalendarDays } from 'lucide-react';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';
import type { CurrentUser, Slot, FlightType } from '@/lib/types';

export default function PlanningAdmin() {
  const { toast } = useToast();
  const dateRangeRef = useRef({ start: '', end: '' });
  const getDateRange = useCallback(() => dateRangeRef.current, []);

  const {
    appointments, setAppointments,
    monitors, flightTypes, openingPeriods, slotDefs,
    availablePlans, timeBounds, isGoogleSyncEnabled,
    isLoading,
    loadAppointments, toggleGoogleSync,
  } = usePlanningData(getDateRange);

  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [showGenModal, setShowGenModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<(Slot & { isOutOfSeason?: boolean }) | null>(null);
  const [slotDuration, setSlotDuration] = useState<number>(0);
  const calendarRef = useRef<FullCalendar>(null);
  const [currentDate, setCurrentDate] = useState(() => new Date().toISOString().split('T')[0]);

  useEffect(() => {
    const u = localStorage.getItem('user');
    if (u) setCurrentUser(JSON.parse(u));
  }, []);

  const handleEventClick = useCallback((info: any) => {
    if (currentUser?.role === 'monitor') return;
    if (currentUser?.role === 'permanent' && info.event.getResources()[0]?.id !== currentUser?.id?.toString()) {
      toast.warning("Vous ne pouvez agir que sur votre propre colonne.");
      return;
    }
    const event = info.event;
    if (event.extendedProps.title?.startsWith('↪️ Suite')) {
      toast.warning("Pour modifier, déplacer ou supprimer ce vol, cliquez sur son premier créneau (celui contenant le nom du client).");
      return;
    }
    const start = new Date(event.start);
    const end = new Date(event.end);
    setSlotDuration(Math.round((end.getTime() - start.getTime()) / 60000));
    setSelectedEvent({
      id: event.id,
      title: event.extendedProps.title,
      start: event.start,
      monitor_id: event.getResources()[0]?.id,
      ...event.extendedProps,
    });
    setShowEditModal(true);
  }, [currentUser, toast]);

  const parsedOpeningPeriods = useMemo(() =>
    openingPeriods.map(p => {
      if (!p.start || !p.end) return null;
      const s = new Date(p.start); s.setHours(0, 0, 0, 0);
      const e = new Date(p.end); e.setHours(23, 59, 59, 999);
      return { start: s, end: e };
    }).filter(Boolean), [openingPeriods]);

  const calendarEvents = useMemo(() => {
    return appointments.map(a => {
      const flight = flightTypes?.find((f: FlightType) => f.id === a.flight_type_id);
      const flightColor = flight?.color_code || '#0ea5e9';
      let isSlotOutOfSeason = false;
      if (parsedOpeningPeriods.length > 0) {
        const slotDate = new Date(a.start_time);
        isSlotOutOfSeason = !parsedOpeningPeriods.some(p => p && slotDate >= p.start && slotDate <= p.end);
      }
      const isPause = a.title?.includes('☕') || a.title?.toUpperCase().includes('PAUSE');
      const isAlert = a.title?.includes('❌') || a.title?.toUpperCase().includes('NON DISPO');
      const isEmptyAndOOS = isSlotOutOfSeason && !a.title && !a.notes && a.status === 'available';
      let displayTitle = a.title || (isEmptyAndOOS ? 'HORS SAISON' : (a.status === 'available' ? 'LIBRE' : ''));
      if (a.phone) displayTitle += ' 📞';
      if (a.booking_options) displayTitle += ' 📸';
      if (a.client_message) displayTitle += ' 💬';
      if (a.notes && a.notes.trim() !== '') displayTitle += ' 📝';
      return {
        id: a.id?.toString() || Math.random().toString(),
        resourceId: a.monitor_id?.toString() || '',
        start: a.start_time,
        end: a.end_time,
        title: displayTitle,
        backgroundColor: isPause ? '#f1f5f9' : isAlert ? '#fee2e2' : isEmptyAndOOS ? '#f8fafc' : (a.status === 'available' ? '#ffffff' : flightColor),
        textColor: a.status === 'available' ? (a.title === 'NOTE' ? '#f59e0b' : (isEmptyAndOOS ? '#94a3b8' : '#cbd5e1')) : isPause ? '#94a3b8' : isAlert ? '#ef4444' : '#ffffff',
        borderColor: a.status === 'available' ? (a.title === 'NOTE' ? '#fcd34d' : '#e2e8f0') : isAlert ? '#fca5a5' : flightColor,
        extendedProps: { ...a, isOutOfSeason: isSlotOutOfSeason },
      };
    });
  }, [appointments, flightTypes, parsedOpeningPeriods]);

  const memoizedCalendar = useMemo(() => (
    <FullCalendar
      ref={calendarRef}
      schedulerLicenseKey="CC-Attribution-NonCommercial-NoDerivatives"
      plugins={[resourceTimeGridPlugin, interactionPlugin, scrollgridPlugin]}
      initialView="resourceTimeGridDay"
      resources={monitors}
      datesSet={(arg) => {
        setCurrentDate(arg.startStr.split('T')[0]);
        const start = new Date(arg.view.activeStart);
        start.setDate(start.getDate() - 15);
        const end = new Date(arg.view.activeEnd);
        end.setDate(end.getDate() + 15);
        dateRangeRef.current = { start: start.toISOString(), end: end.toISOString() };
        loadAppointments();
      }}
      events={calendarEvents}
      locale={frLocale}
      headerToolbar={{ left: 'prev,next today', center: 'title', right: 'resourceTimeGridDay,resourceTimeGridFourDay' }}
      views={{ resourceTimeGridFourDay: { type: 'resourceTimeGrid', duration: { days: 4 }, buttonText: '4 jours' } }}
      slotMinTime={timeBounds.min}
      slotMaxTime={timeBounds.max}
      allDaySlot={false}
      height="auto"
      eventClick={handleEventClick}
      slotDuration="00:15:00"
      snapDuration="00:05:00"
      eventOverlap={false}
      slotEventOverlap={false}
      displayEventTime={true}
      eventTimeFormat={{ hour: '2-digit', minute: '2-digit', meridiem: false, hour12: false }}
      dayMinWidth={130}
    />
  ), [calendarEvents, monitors, timeBounds, handleEventClick, loadAppointments]);

  return (
    <div className="p-2 md:p-4 bg-slate-50 min-h-screen">
      <style dangerouslySetInnerHTML={{ __html: `
        .fc-scrollgrid-section-header .fc-scroller {
          overflow-x: hidden !important;
          touch-action: pan-y !important;
        }
        @media (max-width: 768px) {
          .fc-header-toolbar { flex-direction: column !important; gap: 12px; }
          .fc-toolbar-title { font-size: 1.2rem !important; }
          .fc-button { padding: 0.3em 0.6em !important; font-size: 0.85em !important; }
        }
      `}} />

      <header className="flex flex-col md:flex-row justify-between items-center gap-4 mb-6 md:mb-8 px-2 md:px-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900 text-center md:text-left">
            Planning <span className="text-sky-500">Vols</span>
          </h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center bg-white border-2 border-slate-200 rounded-2xl px-4 py-1 shadow-sm hover:border-sky-300 transition-colors">
            <CalendarDays size={18} className="mr-2 text-slate-500" />
            <input
              type="date"
              className="bg-transparent font-bold text-sm text-slate-700 outline-none cursor-pointer"
              value={currentDate}
              onChange={(e) => {
                setCurrentDate(e.target.value);
                calendarRef.current?.getApi().gotoDate(e.target.value);
              }}
            />
          </div>
          <button
            onClick={toggleGoogleSync}
            className={`px-4 py-2 rounded-2xl font-black uppercase text-[10px] shadow-sm transition-all border-2 ${isGoogleSyncEnabled ? 'bg-sky-50 text-sky-600 border-sky-200 hover:bg-sky-100' : 'bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100'}`}
          >
            {isGoogleSyncEnabled
              ? <><RefreshCw size={13} className="inline mr-1" />Google Sync : ON</>
              : <><PauseCircle size={13} className="inline mr-1" />Google Sync : OFF</>
            }
          </button>
          <button
            onClick={() => setShowGenModal(true)}
            className="bg-slate-900 text-white px-6 py-3 rounded-2xl font-black uppercase text-[10px] shadow-xl hover:scale-105 transition-transform"
          >
            <Wrench size={13} className="inline mr-1" />Générer la semaine
          </button>
        </div>
      </header>

      <div className="bg-white rounded-2xl md:rounded-[35px] shadow-2xl border border-slate-200 p-2 md:p-6 overflow-hidden">
        {isLoading ? (
          /* Skeleton calendrier — simule des colonnes de moniteurs avec des créneaux */
          <div className="animate-pulse">
            {/* Barre de titre fictive */}
            <div className="flex gap-3 mb-4 px-2">
              <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
              <div className="h-8 bg-slate-200 rounded-xl w-24"></div>
              <div className="flex-1"></div>
              <div className="h-8 bg-slate-100 rounded-xl w-48"></div>
            </div>
            {/* Header colonnes moniteurs */}
            <div className="flex gap-2 mb-3 px-2">
              <div className="w-14 shrink-0"></div>
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="flex-1 h-10 bg-slate-200/70 rounded-xl"></div>
              ))}
            </div>
            {/* Lignes de créneaux */}
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="flex gap-2 mb-2 items-center px-2">
                <div className="w-14 shrink-0 h-4 bg-slate-100 rounded"></div>
                {[1, 2, 3, 4].map(j => (
                  <div key={j} className={`flex-1 rounded-xl ${i % 3 === 1 && j === 2 ? 'h-16 bg-sky-100' : 'h-10 bg-slate-50 border border-slate-100'}`}></div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <ErrorBoundary variant="widget" zone="planning/fullcalendar">
            {memoizedCalendar}
          </ErrorBoundary>
        )}
      </div>

      {showEditModal && selectedEvent && (
        <EditSlotModal
          selectedEvent={selectedEvent}
          currentUser={currentUser}
          slotDuration={slotDuration}
          appointments={appointments}
          setAppointments={setAppointments}
          flightTypes={flightTypes}
          monitors={monitors}
          slotDefs={slotDefs}
          openingPeriods={openingPeriods}
          loadAppointments={loadAppointments}
          onClose={() => setShowEditModal(false)}
        />
      )}

      {showGenModal && (
        <GenSlotsModal
          availablePlans={availablePlans}
          monitors={monitors}
          loadAppointments={loadAppointments}
          onClose={() => setShowGenModal(false)}
        />
      )}
    </div>
  );
}
