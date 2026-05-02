'use client';
import { useState, useEffect, useRef } from 'react';
import type { Client, User, FlightType, GiftCard, Complement } from '@/lib/types';
import { apiFetch } from '@/lib/api';

export function useClientsData({ q, page }: { q: string; page: number }) {
  const [clients, setClients] = useState<Client[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [monitors, setMonitors] = useState<User[]>([]);
  const [flightTypes, setFlightTypes] = useState<FlightType[]>([]);
  const [giftCards, setGiftCards] = useState<GiftCard[]>([]);
  const [complements, setComplements] = useState<Complement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    Promise.all([
      apiFetch('/api/monitors'),
      apiFetch('/api/flight-types'),
      apiFetch('/api/gift-cards'),
      apiFetch('/api/complements'),
    ]).then(([resM, resF, resG, resComp]) => {
      if (resM.ok) resM.json().then(setMonitors);
      if (resF.ok) resF.json().then(setFlightTypes);
      if (resG.ok) resG.json().then(setGiftCards);
      if (resComp.ok) resComp.json().then(setComplements);
    });
  }, []);

  useEffect(() => {
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const params = new URLSearchParams({ page: String(page), limit: '30' });
        if (q) params.set('q', q);
        const res = await apiFetch(`/api/clients?${params}`);
        if (res.ok) {
          const data = await res.json();
          setClients(data.clients);
          setTotal(data.total);
          setTotalPages(data.totalPages);
        }
      } catch (err) {
        console.error('Erreur chargement:', err);
      } finally {
        setIsLoading(false);
      }
    }, 400);
    return () => clearTimeout(debounceRef.current);
  }, [q, page]);

  return { clients, setClients, total, totalPages, monitors, flightTypes, giftCards, setGiftCards, complements, isLoading };
}
