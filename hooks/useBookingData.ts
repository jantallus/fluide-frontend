"use client";
import { useState, useEffect } from 'react';
import { getLocalYYYYMMDD } from '@/lib/booking-utils';
import type { FlightType, GiftCardShopTemplate, Complement, Setting } from '@/lib/types';

export function useBookingData(
  onReady: (dateStr: string, daysCount: number) => void
) {
  const [flights, setFlights] = useState<FlightType[]>([]);
  const [giftTemplates, setGiftTemplates] = useState<GiftCardShopTemplate[]>([]);
  const [complementsList, setComplementsList] = useState<Complement[]>([]);
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
        // Passe par le proxy Next.js (/api/proxy/...) pour ne pas exposer
        // l'URL du backend dans le bundle client et garder une architecture cohérente.
        const [resFlights, resComplements, resSettings, resTemplates] = await Promise.all([
          fetch(`/api/proxy/flight-types?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/proxy/complements?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/proxy/settings?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`/api/proxy/gift-card-templates?publicOnly=true&t=${Date.now()}`, { cache: 'no-store' }),
        ]);

        if (resFlights.ok) setFlights(await resFlights.json());
        if (resComplements.ok) setComplementsList(await resComplements.json());
        if (resTemplates.ok) setGiftTemplates(await resTemplates.json());

        let count = 7;
        if (resSettings.ok) {
          const s = await resSettings.json();
          const countSetting = s.find((x: Setting) => x.key === 'display_days_count');
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
