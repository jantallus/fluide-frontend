"use client";
import { useState, useEffect } from 'react';
import type { FlightType, SlotDefinition } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

export function usePrestationsData() {
  const { toast, confirm } = useToast();
  const [flights, setFlights] = useState<FlightType[]>([]);
  const [slotDefs, setSlotDefs] = useState<SlotDefinition[]>([]);
  const [loading, setLoading] = useState(true);

  const loadData = async () => {
    setLoading(true);
    try {
      const [flightsRes, slotsRes] = await Promise.all([
        apiFetch('/api/flight-types'),
        apiFetch('/api/slot-definitions'),
      ]);
      if (flightsRes.ok) setFlights(await flightsRes.json());
      if (slotsRes.ok) setSlotDefs(await slotsRes.json());
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadData(); }, []);

  const deleteFlight = async (id: number) => {
    if (!await confirm("Supprimer définitivement ce vol ? (Impossible s'il est déjà lié à des réservations ou des bons cadeaux)")) return;
    const res = await apiFetch(`/api/flight-types/${id}`, { method: 'DELETE' });
    if (res.ok) {
      loadData();
    } else {
      toast.error("Ce vol est lié à des réservations passées ou des bons cadeaux. Astuce: Modifiez-le pour décocher tous ses créneaux afin de le masquer du site client !");
    }
  };

  return { flights, slotDefs, loading, loadData, deleteFlight };
}
