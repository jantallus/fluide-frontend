import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useAvailabilities } from '@/hooks/useAvailabilities';
import type { PublicSlot } from '@/lib/types';

// ── Helpers ───────────────────────────────────────────────────────────────────

const MOCK_FLIGHT = {
  id: 1,
  name: 'Vol Découverte',
  price_cents: 9900,
};

const MOCK_SLOTS: PublicSlot[] = [
  { id: 10, start_time: '2025-06-01T09:00:00', end_time: '2025-06-01T09:30:00', status: 'available', monitor_id: 'm1' },
  { id: 11, start_time: '2025-06-01T10:00:00', end_time: '2025-06-01T10:30:00', status: 'booked',    monitor_id: 'm2' },
];

// ── Setup global fetch mock ───────────────────────────────────────────────────

beforeEach(() => {
  vi.stubGlobal('fetch', vi.fn());
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests : pas de fetch sans les deux params requis ──────────────────────────

describe('useAvailabilities - condition de demarrage', () => {
  it('ne fait pas de fetch si gridStartDate est vide', async () => {
    renderHook(() => useAvailabilities('', MOCK_FLIGHT, 7));
    await new Promise(r => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ne fait pas de fetch si selectedFlight est null', async () => {
    renderHook(() => useAvailabilities('2025-06-01', null, 7));
    await new Promise(r => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
  });

  it('ne fait pas de fetch si les deux params sont absents', async () => {
    renderHook(() => useAvailabilities('', null, 7));
    await new Promise(r => setTimeout(r, 50));
    expect(fetch).not.toHaveBeenCalled();
  });
});

// ── Tests : etat initial ──────────────────────────────────────────────────────

describe('useAvailabilities - etat initial', () => {
  it('rawSlots est vide au montage', () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);
    const { result } = renderHook(() => useAvailabilities('', null, 7));
    expect(result.current.rawSlots).toEqual([]);
  });

  it('isSearchingTimes est false au montage sans params', () => {
    const { result } = renderHook(() => useAvailabilities('', null, 7));
    expect(result.current.isSearchingTimes).toBe(false);
  });
});

// ── Tests : fetch et peuplement des slots ─────────────────────────────────────

describe('useAvailabilities - fetch et slots', () => {
  it('remplit rawSlots avec la reponse du serveur', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => MOCK_SLOTS } as Response);

    const { result } = renderHook(() =>
      useAvailabilities('2025-06-01', MOCK_FLIGHT, 7)
    );

    await waitFor(() => {
      expect(result.current.rawSlots).toHaveLength(2);
    });

    expect(result.current.rawSlots[0].id).toBe(10);
    expect(result.current.rawSlots[1].status).toBe('booked');
  });

  it('appelle fetch avec start et end autour de gridStartDate (±10 jours)', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);

    renderHook(() => useAvailabilities('2025-06-10', MOCK_FLIGHT, 7));

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toContain('start=2025-05-31'); // 10 - 10 = 31 mai
    expect(url).toContain('end=2025-06-20');   // 10 + 10 = 20 juin
    expect(url).toContain('/api/proxy/public/availabilities');
  });

  it('ajoute un cache-buster dans l\'URL', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);

    renderHook(() => useAvailabilities('2025-06-01', MOCK_FLIGHT, 7));

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const url = vi.mocked(fetch).mock.calls[0][0] as string;
    expect(url).toMatch(/t=\d+/);
  });

  it('passe cache: no-store au fetch', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);

    renderHook(() => useAvailabilities('2025-06-01', MOCK_FLIGHT, 7));

    await waitFor(() => expect(fetch).toHaveBeenCalled());

    const options = vi.mocked(fetch).mock.calls[0][1];
    expect(options).toMatchObject({ cache: 'no-store' });
  });
});

// ── Tests : etat isSearchingTimes ────────────────────────────────────────────

describe('useAvailabilities - isSearchingTimes', () => {
  it('passe a true pendant le fetch puis revient a false', async () => {
    let resolveFetch!: (v: unknown) => void;
    vi.mocked(fetch).mockReturnValue(
      new Promise(resolve => { resolveFetch = resolve; }) as unknown as Promise<Response>
    );

    const { result } = renderHook(() =>
      useAvailabilities('2025-06-01', MOCK_FLIGHT, 7)
    );

    // En attente : isSearchingTimes doit passer a true
    await waitFor(() => expect(result.current.isSearchingTimes).toBe(true));

    // On resout la promesse
    resolveFetch({ json: async () => MOCK_SLOTS });

    // Apres resolution : isSearchingTimes revient a false
    await waitFor(() => expect(result.current.isSearchingTimes).toBe(false));
  });
});

// ── Tests : gestion d'erreur ─────────────────────────────────────────────────

describe('useAvailabilities - gestion d\'erreur', () => {
  it('reste en etat propre si le fetch echoue', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() =>
      useAvailabilities('2025-06-01', MOCK_FLIGHT, 7)
    );

    await waitFor(() => expect(result.current.isSearchingTimes).toBe(false));

    expect(result.current.rawSlots).toEqual([]);
    expect(consoleError).toHaveBeenCalledWith('Erreur dispos', expect.any(Error));

    consoleError.mockRestore();
  });

  it('remet isSearchingTimes a false meme en cas d\'erreur', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    vi.mocked(fetch).mockRejectedValue(new Error('timeout'));

    const { result } = renderHook(() =>
      useAvailabilities('2025-06-01', MOCK_FLIGHT, 7)
    );

    await waitFor(() => expect(result.current.isSearchingTimes).toBe(false));
  });
});

// ── Tests : refetch sur changement de params ──────────────────────────────────

describe('useAvailabilities - refetch sur changement de params', () => {
  it('refetch quand gridStartDate change', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);

    const { rerender } = renderHook(
      ({ date }: { date: string }) => useAvailabilities(date, MOCK_FLIGHT, 7),
      { initialProps: { date: '2025-06-01' } }
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender({ date: '2025-06-08' });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));

    const secondUrl = vi.mocked(fetch).mock.calls[1][0] as string;
    expect(secondUrl).toContain('start=2025-05-29'); // 8 juin - 10 = 29 mai
  });

  it('refetch quand selectedFlight change', async () => {
    vi.mocked(fetch).mockResolvedValue({ json: async () => [] } as Response);

    const { rerender } = renderHook(
      ({ flight }: { flight: typeof MOCK_FLIGHT }) =>
        useAvailabilities('2025-06-01', flight, 7),
      { initialProps: { flight: MOCK_FLIGHT } }
    );

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));

    rerender({ flight: { ...MOCK_FLIGHT, id: 2, name: 'Vol Expert' } });

    await waitFor(() => expect(fetch).toHaveBeenCalledTimes(2));
  });
});
