'use client';
import { useState } from 'react';
import type { Client, User, GiftCard, Complement, ClientFlight, PaymentData } from '@/lib/types';
import { apiFetch } from '@/lib/api';
import { useToast } from '@/components/ui/ToastProvider';

interface UseQuickEditProps {
  clients: Client[];
  monitors: User[];
  giftCards: GiftCard[];
  setClients: React.Dispatch<React.SetStateAction<Client[]>>;
  setGiftCards: React.Dispatch<React.SetStateAction<GiftCard[]>>;
}

export function useQuickEdit({ clients, monitors, giftCards, setClients, setGiftCards }: UseQuickEditProps) {
  const { toast } = useToast();
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'monitor' | 'payment' | null>(null);
  const [tempMonitorId, setTempMonitorId] = useState('');
  const [tempPayMethod, setTempPayMethod] = useState('CB');
  const [tempPayAmount, setTempPayAmount] = useState(0);
  const [tempPayCode, setTempPayCode] = useState('');
  const [tempPayMethod2, setTempPayMethod2] = useState('');
  const [tempPayAmount2, setTempPayAmount2] = useState(0);
  const [tempGcId, setTempGcId] = useState<number | null>(null);
  const [tempAddedOptions, setTempAddedOptions] = useState<Complement[]>([]);

  const closeEdit = () => {
    setEditingSlotId(null);
    setEditType(null);
  };

  const openPaymentEdit = (flight: ClientFlight) => {
    setTempPayAmount(flight.payment_data ? 0 : (flight.price_cents ? flight.price_cents / 100 : 0));
    setTempPayMethod('CB');
    setTempPayCode('');
    setTempPayMethod2('');
    setTempPayAmount2(0);
    setTempGcId(null);
    setTempAddedOptions([]);
    setEditingSlotId(flight.id);
    setEditType('payment');
  };

  const openMonitorEdit = (flight: ClientFlight) => {
    setTempMonitorId(flight.monitor_id?.toString() || '');
    setEditingSlotId(flight.id);
    setEditType('monitor');
  };

  const methodToKey = (method: string): keyof PaymentData => {
    const map: Record<string, keyof PaymentData> = {
      'CB': 'cb', 'Espèces': 'especes', 'Chèque': 'cheque', 'ANCV': 'ancv',
    };
    return map[method] ?? 'cb';
  };

  const saveQuickEdit = async (slotId: number, clientId: number) => {
    const payload: Record<string, unknown> = {};
    let newPaymentData: PaymentData | null = null;

    const clientObj = clients.find(c => c.id === clientId);
    const flightObj = clientObj?.flights?.find(fl => fl.id === slotId);
    const existingData = flightObj?.payment_data ?? null;

    if (editType === 'monitor') {
      payload.monitor_id = tempMonitorId;
    } else if (editType === 'payment') {
      if (tempPayAmount === 0 && tempPayAmount2 === 0 && tempAddedOptions.length === 0) {
        closeEdit();
        return;
      }

      const built: PaymentData = {};
      if (tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') {
        built.voucher = Math.round(tempPayAmount * 100);
        if (tempPayCode) { built.code = tempPayCode.toUpperCase(); built.code_type = tempPayMethod === 'Bon Cadeau' ? 'gift_card' : 'promo'; }
      } else {
        built[methodToKey(tempPayMethod)] = Math.round(tempPayAmount * 100);
      }
      if (tempPayMethod2 && tempPayAmount2 > 0) {
        built[methodToKey(tempPayMethod2)] = Math.round(tempPayAmount2 * 100);
      }
      if (tempAddedOptions.length > 0) built.options = tempAddedOptions.map(o => o.name);

      if (existingData) {
        newPaymentData = {
          ...existingData,
          cb: ((existingData.cb ?? 0) + (built.cb ?? 0)) || undefined,
          especes: ((existingData.especes ?? 0) + (built.especes ?? 0)) || undefined,
          cheque: ((existingData.cheque ?? 0) + (built.cheque ?? 0)) || undefined,
          ancv: ((existingData.ancv ?? 0) + (built.ancv ?? 0)) || undefined,
          voucher: built.voucher ?? existingData.voucher,
          code: built.code ?? existingData.code,
          code_type: built.code_type ?? existingData.code_type,
          options: [...(existingData.options ?? []), ...(built.options ?? [])],
        };
        // Nettoie les zéros
        (Object.keys(newPaymentData) as (keyof PaymentData)[]).forEach(k => {
          if (newPaymentData![k] === 0 || (Array.isArray(newPaymentData![k]) && (newPaymentData![k] as string[]).length === 0)) {
            delete newPaymentData![k];
          }
        });
      } else {
        newPaymentData = built;
      }
      payload.payment_data = newPaymentData;
    }

    try {
      const res = await apiFetch(`/api/slots/${slotId}/quick`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        if (editType === 'payment' && tempGcId && tempPayCode) {
          const usedGc = giftCards.find(g => g.id === tempGcId);
          if (usedGc && usedGc.type === 'gift_card') {
            await apiFetch(`/api/gift-cards/${tempGcId}/status`, {
              method: 'PATCH',
              body: JSON.stringify({ status: 'used' }),
            });
            setGiftCards(prev =>
              prev.map(g => g.id === tempGcId ? { ...g, status: 'used' } as unknown as GiftCard : g)
            );
          }
        }

        setClients(prev =>
          prev.map(c => {
            if (c.id !== clientId) return c;
            const newFlights = c.flights?.map(f => {
              if (f.id !== slotId) return f;
              if (editType === 'monitor') {
                const m = monitors.find(x => x.id.toString() === tempMonitorId);
                return { ...f, monitor_id: tempMonitorId, monitor_name: m ? m.first_name : 'Non assigné' };
              }
              return { ...f, payment_data: newPaymentData };
            });
            return { ...c, flights: newFlights };
          })
        );
        closeEdit();
      } else {
        const errorData = await res.json();
        toast.error('Impossible : ' + (errorData.error || 'Erreur de modification'));
      }
    } catch (err) {
      console.error(err);
    }
  };

  return {
    editingSlotId, setEditingSlotId,
    editType,
    tempMonitorId, setTempMonitorId,
    tempPayMethod, setTempPayMethod,
    tempPayAmount, setTempPayAmount,
    tempPayCode, setTempPayCode,
    tempPayMethod2, setTempPayMethod2,
    tempPayAmount2, setTempPayAmount2,
    tempGcId, setTempGcId,
    tempAddedOptions, setTempAddedOptions,
    openPaymentEdit,
    openMonitorEdit,
    closeEdit,
    saveQuickEdit,
  };
}

export type QuickEditState = ReturnType<typeof useQuickEdit>;
