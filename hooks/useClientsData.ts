"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export function useClientsData() {
  const [clients, setClients] = useState<any[]>([]);
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [giftCards, setGiftCards] = useState<any[]>([]);
  const [complements, setComplements] = useState<any[]>([]);

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
      } catch (err) { console.error('Erreur chargement:', err); }
    };
    fetchData();
  }, []);

  const updateMonitor = async (slotId: number, clientId: number, monitorId: string): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/slots/${slotId}/quick`, { method: 'PATCH', body: JSON.stringify({ monitor_id: monitorId }) });
      if (res.ok) {
        setClients(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          const m = monitors.find((x: any) => x.id.toString() === monitorId);
          return { ...c, flights: c.flights.map((f: any) => f.id === slotId ? { ...f, monitor_id: monitorId, monitor_name: m ? m.first_name : 'Non assigné' } : f) };
        }));
        return true;
      }
      const data = await res.json();
      alert('❌ Impossible : ' + (data.error || 'Erreur de modification'));
      return false;
    } catch (err) { console.error(err); return false; }
  };

  const applyPayment = async (slotId: number, clientId: number, paymentStatus: string, gcId: number | null): Promise<boolean> => {
    try {
      const res = await apiFetch(`/api/slots/${slotId}/quick`, { method: 'PATCH', body: JSON.stringify({ payment_status: paymentStatus }) });
      if (res.ok) {
        if (gcId) {
          const gc = giftCards.find((g: any) => g.id === gcId);
          if (gc && gc.type === 'gift_card') {
            await apiFetch(`/api/gift-cards/${gcId}/status`, { method: 'PATCH', body: JSON.stringify({ status: 'used' }) });
            setGiftCards(prev => prev.map((g: any) => g.id === gcId ? { ...g, status: 'used' } : g));
          }
        }
        setClients(prev => prev.map(c => {
          if (c.id !== clientId) return c;
          return { ...c, flights: c.flights.map((f: any) => f.id === slotId ? { ...f, payment_status: paymentStatus } : f) };
        }));
        return true;
      }
      const data = await res.json();
      alert('❌ Impossible : ' + (data.error || 'Erreur de modification'));
      return false;
    } catch (err) { console.error(err); return false; }
  };

  const deleteFlight = async (slotId: number, clientId: number) => {
    if (!confirm('Supprimer ce vol ?')) return;
    try {
      const res = await apiFetch(`/api/slots/${slotId}`, { method: 'DELETE' });
      if (res.ok) setClients(prev => prev.map(c => c.id !== clientId ? c : { ...c, flights: c.flights.filter((f: any) => f.id !== slotId) }).filter((c: any) => c.flights.length > 0));
    } catch (err) { console.error(err); }
  };

  const bulkDelete = async (selectedIds: number[]): Promise<boolean> => {
    if (!confirm(`Supprimer ${selectedIds.length} dossiers ?`)) return false;
    try {
      const res = await apiFetch('/api/clients/bulk-delete', { method: 'POST', body: JSON.stringify({ ids: selectedIds }) });
      if (res.ok) { setClients(prev => prev.filter((c: any) => !selectedIds.includes(c.id))); return true; }
    } catch (err) { console.error(err); }
    return false;
  };

  return { clients, monitors, flightTypes, giftCards, complements, updateMonitor, applyPayment, deleteFlight, bulkDelete };
}
