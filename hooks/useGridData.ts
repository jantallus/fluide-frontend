"use client";
import { useMemo } from 'react';
import { getLocalYYYYMMDD } from '@/lib/booking-utils';
import type { PublicSlot, FlightType } from '@/lib/types';

type MutableSlot = Omit<PublicSlot, 'status'> & { status: string };

export function useGridData(
  rawSlots: PublicSlot[],
  selectedFlight: FlightType | null,
  cart: Record<string, number>,
  gridStartDate: string,
  flights: FlightType[]
) {
  return useMemo(() => {
    if (!selectedFlight || rawSlots.length === 0) return {};

    const delayHours = selectedFlight.booking_delay_hours || 0;
    const cutoffMs = Date.now() + delayHours * 60 * 60 * 1000;

    const flightDur = selectedFlight.duration_minutes || 0;
    const allowedSlots = Array.isArray(selectedFlight.allowed_time_slots) ? selectedFlight.allowed_time_slots : [];

    let baseDur = 15;
    const sample = rawSlots[0];
    if (sample) baseDur = Math.round((new Date(sample.end_time).getTime() - new Date(sample.start_time).getTime()) / 60000) || 15;

    const isMulti = selectedFlight.allow_multi_slots === true;
    const slotsNeeded = isMulti && flightDur > baseDur ? Math.ceil(flightDur / baseDur) : 1;

    const monSchedules: Record<string, Record<number, MutableSlot>> = {};
    const timeToMs: Record<string, number> = {};
    const uniqueTimesByDate: Record<string, Set<string>> = {};

    rawSlots.forEach(s => {
      const dObj = new Date(s.start_time);
      const ms = dObj.getTime();

      if (!monSchedules[s.monitor_id]) monSchedules[s.monitor_id] = {};
      monSchedules[s.monitor_id][ms] = { ...s };

      const dStr = dObj.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
      const tStr = dObj.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });

      if (!uniqueTimesByDate[dStr]) uniqueTimesByDate[dStr] = new Set();
      uniqueTimesByDate[dStr].add(tStr);
      timeToMs[`${dStr}|${tStr}`] = ms;
    });

    Object.entries(cart).forEach(([key, qty]) => {
      if (qty === 0) return;
      const [fId, dStr, tStr] = key.split('|');
      const flightInCart = flights.find(f => f.id.toString() === fId);
      if (!flightInCart) return;

      const fDurCart = flightInCart.duration_minutes || 0;
      const isMultiCart = flightInCart.allow_multi_slots === true;
      const sNeededCart = isMultiCart && fDurCart > baseDur ? Math.ceil(fDurCart / baseDur) : 1;

      const targetMs = timeToMs[`${dStr}|${tStr}`];
      if (!targetMs) return;

      let consumed = 0;
      for (const monId of Object.keys(monSchedules)) {
        if (consumed >= qty) break;
        let canBook = true;
        for (let i = 0; i < sNeededCart; i++) {
          const ms = targetMs + i * baseDur * 60000;
          const slot = monSchedules[monId][ms];
          if (!slot || slot.status !== 'available') { canBook = false; break; }
        }
        if (canBook) {
          for (let i = 0; i < sNeededCart; i++) {
            monSchedules[monId][targetMs + i * baseDur * 60000].status = 'booked_by_cart';
          }
          consumed++;
        }
      }
    });

    const grid: Record<string, Record<string, number>> = {};
    const weekDays = Array.from({ length: 21 }).map((_, i) => {
      const d = new Date(gridStartDate);
      d.setDate(d.getDate() - 10 + i);
      return getLocalYYYYMMDD(d);
    });
    weekDays.forEach(d => { grid[d] = {}; });

    weekDays.forEach(dateStr => {
      if (!uniqueTimesByDate[dateStr]) return;
      Array.from(uniqueTimesByDate[dateStr]).forEach(timeStr => {
        if (allowedSlots.length > 0 && !allowedSlots.includes(timeStr)) return;
        const targetMs = timeToMs[`${dateStr}|${timeStr}`];
        if (!targetMs || targetMs <= cutoffMs) return;

        let capacity = 0;
        for (const monId of Object.keys(monSchedules)) {
          let isFree = true;
          for (let i = 0; i < slotsNeeded; i++) {
            const slot = monSchedules[monId][targetMs + i * baseDur * 60000];
            if (!slot || slot.status !== 'available') { isFree = false; break; }
          }
          if (isFree) capacity++;
        }
        const key = `${selectedFlight.id}|${dateStr}|${timeStr}`;
        if (capacity > 0 || (cart[key] || 0) > 0) grid[dateStr][timeStr] = capacity;
      });
    });

    return grid;
  }, [rawSlots, selectedFlight, cart, gridStartDate, flights]);
}
