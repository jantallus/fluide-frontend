"use client";
import { useState, useEffect } from 'react';
import { getLocalYYYYMMDD } from '@/lib/booking-utils';

export function useBookingData(
  onReady: (dateStr: string, daysCount: number) => void
) {
  const [flights, setFlights] = useState<any[]>([]);
  const [giftTemplates, setGiftTemplates] = useState<any[]>([]);
  const [complementsList, setComplementsList] = useState<any[]>([]);
  const [displayDaysCount, setDisplayDaysCount] = useState<number>(7);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<'Standard' | 'Hiver'>('Standard');

  useEffect(() => {
    const currentMonth = new Date().getMonth();
    let defaultSeason: 'Standard' | 'Hiver' = (currentMonth >= 9 || currentMonth <= 3) ? 'Hiver' : 'Standard';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('saison')?.toLowerCase() === 'hiver') defaultSeason = 'Hiver';
      if (params.get('saison')?.toLowerCase() === 'ete') defaultSeason = 'Standard';
    }
    setActiveSeason(defaultSeason);

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

        const [resFlights, resComplements, resSettings, resTemplates] = await Promise.all([
          fetch(`${apiUrl}/api/flight-types?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${apiUrl}/api/complements?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${apiUrl}/api/settings?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${apiUrl}/api/gift-card-templates?publicOnly=true&t=${Date.now()}`, { cache: 'no-store' }),
        ]);

        if (resFlights.ok) setFlights(await resFlights.json());
        if (resComplements.ok) setComplementsList(await resComplements.json());
        if (resTemplates.ok) setGiftTemplates(await resTemplates.json());

        let count = 7;
        if (resSettings.ok) {
          const s = await resSettings.json();
          const countSetting = s.find((x: any) => x.key === 'display_days_count');
          if (countSetting) count = parseInt(countSetting.value);
        }
        setDisplayDaysCount(count);

        const defaultDate = new Date();
        if (defaultDate.getHours() >= 12) defaultDate.setDate(defaultDate.getDate() + 1);
        onReady(getLocalYYYYMMDD(defaultDate), count);
      } catch (err) {
        console.error('Erreur chargement données', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  return { flights, giftTemplates, complementsList, displayDaysCount, isLoading, activeSeason, setActiveSeason };
}
