import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useGridData } from '@/hooks/useGridData';
import type { PublicSlot, FlightType } from '@/lib/types';

// ── Fixtures ──────────────────────────────────────────────────────────────────

const GRID_START = '2025-06-10'; // date pivot

const flight: FlightType = {
  id: 1,
  name: 'Vol Découverte',
  price_cents: 9900,
  duration_minutes: 15,
  booking_delay_hours: 0,
  allow_multi_slots: false,
  allowed_time_slots: [],
};

// Crée un slot disponible à une heure donnée pour un monitor donné
function makeSlot(
  id: number,
  dateStr: string,
  timeStr: string,
  monitorId: string,
  status: PublicSlot['status'] = 'available'
): PublicSlot {
  const start = new Date(`${dateStr}T${timeStr}:00.000Z`);
  const end   = new Date(start.getTime() + 15 * 60000);
  return {
    id,
    start_time: start.toISOString(),
    end_time:   end.toISOString(),
    status,
    monitor_id: monitorId,
  };
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useGridData - cas de base', () => {
  it('retourne un objet vide si rawSlots est vide', () => {
    const { result } = renderHook(() =>
      useGridData([], flight, {}, GRID_START, [flight])
    );
    expect(result.current).toEqual({});
  });

  it('retourne un objet vide si selectedFlight est null', () => {
    const slot = makeSlot(1, '2025-06-10', '09:00', 'm1');
    const { result } = renderHook(() =>
      useGridData([slot], null, {}, GRID_START, [flight])
    );
    expect(result.current).toEqual({});
  });
});

describe('useGridData - calcul de capacité', () => {
  beforeEach(() => {
    // Fige le temps pour que le cutoff (delay_hours=0) soit passé
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z')); // 9 jours avant le slot
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('compte 1 monitor disponible → capacity = 1', () => {
    const slot = makeSlot(1, '2025-06-10', '09:00', 'm1');

    const { result } = renderHook(() =>
      useGridData([slot], flight, {}, GRID_START, [flight])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid['2025-06-10'];
    expect(times).toBeDefined();
    // Il doit y avoir au moins un créneau avec capacity >= 1
    const capacity = Object.values(times)[0];
    expect(capacity).toBe(1);
  });

  it('compte 2 monitors disponibles → capacity = 2', () => {
    const slot1 = makeSlot(1, '2025-06-10', '09:00', 'm1');
    const slot2 = makeSlot(2, '2025-06-10', '09:00', 'm2');

    const { result } = renderHook(() =>
      useGridData([slot1, slot2], flight, {}, GRID_START, [flight])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid['2025-06-10'];
    expect(Object.values(times)[0]).toBe(2);
  });

  it('ignore les slots avec status "booked"', () => {
    const available = makeSlot(1, '2025-06-10', '09:00', 'm1', 'available');
    const booked    = makeSlot(2, '2025-06-10', '09:00', 'm2', 'booked');

    const { result } = renderHook(() =>
      useGridData([available, booked], flight, {}, GRID_START, [flight])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid['2025-06-10'];
    expect(Object.values(times)[0]).toBe(1); // m2 est booked, seul m1 compte
  });

  it('n\'affiche pas un créneau si capacity = 0 et pas dans le panier', () => {
    const booked = makeSlot(1, '2025-06-10', '09:00', 'm1', 'booked');

    const { result } = renderHook(() =>
      useGridData([booked], flight, {}, GRID_START, [flight])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid['2025-06-10'] ?? {};
    expect(Object.keys(times)).toHaveLength(0);
  });
});

describe('useGridData - cutoff booking_delay_hours', () => {
  it('masque les slots dans le délai de réservation', () => {
    const flightWithDelay: FlightType = { ...flight, booking_delay_hours: 24 };

    // Slot dans 10 heures seulement → dans le délai de 24h → masqué
    const soon = new Date(Date.now() + 10 * 60 * 60 * 1000);
    const dateStr = soon.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
    const slot: PublicSlot = {
      id: 1,
      start_time: soon.toISOString(),
      end_time:   new Date(soon.getTime() + 15 * 60000).toISOString(),
      status:     'available',
      monitor_id: 'm1',
    };

    const { result } = renderHook(() =>
      useGridData([slot], flightWithDelay, {}, dateStr, [flightWithDelay])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid[dateStr] ?? {};
    expect(Object.keys(times)).toHaveLength(0);
  });
});

describe('useGridData - allowed_time_slots', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2025-06-01T00:00:00Z'));
  });

  afterEach(() => { vi.useRealTimers(); });

  it('filtre les créneaux non autorisés par allowed_time_slots', () => {
    // En juin (UTC+2), 07:00Z → 09:00 Paris / 08:00Z → 10:00 Paris
    const slot09Paris = makeSlot(1, '2025-06-10', '07:00', 'm1'); // Paris : 09:00
    const slot10Paris = makeSlot(2, '2025-06-10', '08:00', 'm1'); // Paris : 10:00

    // On récupère les clés Paris réelles produites par le hook pour construire le filtre
    const t09 = new Date(slot09Paris.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });
    const t10 = new Date(slot10Paris.start_time).toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false });

    // On autorise uniquement l'heure du slot10Paris
    const flightFiltered: FlightType = { ...flight, allowed_time_slots: [t10] };

    const { result } = renderHook(() =>
      useGridData([slot09Paris, slot10Paris], flightFiltered, {}, GRID_START, [flightFiltered])
    );

    const grid = result.current as Record<string, Record<string, number>>;
    const times = grid['2025-06-10'] ?? {};
    expect(Object.keys(times)).toHaveLength(1);
    expect(times[t10]).toBeDefined();
    expect(times[t09]).toBeUndefined();
  });
});
