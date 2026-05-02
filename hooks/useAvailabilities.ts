"use client";
import { useState, useEffect } from 'react';
import { getLocalYYYYMMDD } from '@/lib/booking-utils';
import type { FlightType, PublicSlot } from '@/lib/types';

export function useAvailabilities(
  gridStartDate: string,
  selectedFlight: FlightType | null,
  displayDaysCount: number
) {
  const [rawSlots, setRawSlots] = useState<PublicSlot[]>([]);
  const [isSearchingTimes, setIsSearchingTimes] = useState(false);

  useEffect(() => {
    if (!gridStartDate || !selectedFlight) return;

    const fetchWeekData = async () => {
      setIsSearchingTimes(true);
      try {
        const dStart = new Date(gridStartDate);
        dStart.setDate(dStart.getDate() - 10);

        const dEnd = new Date(gridStartDate);
        dEnd.setDate(dEnd.getDate() + 10);

        // Passe par le proxy Next.js pour ne pas exposer l'URL du backend dans le bundle client.
        const res = await fetch(
          `/api/proxy/public/availabilities?start=${getLocalYYYYMMDD(dStart)}&end=${getLocalYYYYMMDD(dEnd)}&t=${Date.now()}`,
          { cache: 'no-store' }
        );
        setRawSlots(await res.json());
      } catch (err) {
        console.error('Erreur dispos', err);
      } finally {
        setIsSearchingTimes(false);
      }
    };
    fetchWeekData();
  }, [gridStartDate, selectedFlight, displayDaysCount]);

  return { rawSlots, isSearchingTimes };
}
