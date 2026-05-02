"use client";
import { useState, useEffect } from 'react';
import type { GiftCard } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export function useGiftCardsData() {
  const { confirm } = useToast();
  const [cards, setCards] = useState<GiftCard[]>([]);
  const [flights, setFlights] = useState<any[]>([]);
  const [complements, setComplements] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [cRes, fRes, compRes] = await Promise.all([
        apiFetch('/api/gift-cards'),
        apiFetch('/api/flight-types'),
        apiFetch('/api/complements'),
      ]);
      if (cRes.ok) setCards(await cRes.json());
      if (fRes.ok) setFlights(await fRes.json());
      if (compRes.ok) setComplements(await compRes.json());
    } catch (err) {
      console.error('Erreur chargement données:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const toggleCardStatus = async (id: number, currentStatus: string | undefined) => {
    const newStatus = currentStatus === 'valid' ? 'used' : 'valid';
    if (!await confirm(newStatus === 'valid' ? 'Réactiver ce code ?' : 'Marquer ce code comme inactif/utilisé ?')) return;
    const res = await apiFetch(`/api/gift-cards/${id}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ status: newStatus }),
    });
    if (res.ok) loadData();
  };

  const deleteCard = async (id: number) => {
    if (!await confirm('Êtes-vous sûr de vouloir supprimer définitivement ce code/bon ?')) return;
    const res = await apiFetch(`/api/gift-cards/${id}`, { method: 'DELETE' });
    if (res.ok) loadData();
  };

  return { cards, flights, complements, loading, loadData, toggleCardStatus, deleteCard };
}
