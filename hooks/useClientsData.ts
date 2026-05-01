'use client';
import { useState, useEffect } from 'react';
import type { Client, User, FlightType, GiftCard, Complement } from '@/lib/types';
import { apiFetch } from '@/lib/api';

export function useClientsData() {
  const [clients, setClients] = useState<Client[]>([]);
  const [monitors, setMonitors] = useState<User[]>([]);
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [complements, setComplements] = useState<Complement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resM, resF, resG, resComp] = await Promise.all([
          apiFetch('/api/clients'),
          apiFetch('/api/monitors'),
          apiFetch('/api/flight-types'),
          apiFetch('/api/gift-cards'),
          apiFetch('/api/complements'),
        ]);
        if (resC.ok) setClients(await resC.json());
        if (resM.ok) setMonitors(await resM.json());
        if (resF.ok) setFlightTypes(await resF.json());
        if (resG.ok) setGiftCards(await resG.json());
        if (resComp.ok) setComplements(await resComp.json());
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  return { clients, setClients, monitors, flightTypes, giftCards, setGiftCards, complements, isLoading };
}
