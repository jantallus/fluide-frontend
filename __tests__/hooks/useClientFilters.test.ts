import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useClientFilters } from '@/hooks/useClientFilters';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  localStorage.clear();
});

// ── Tests : état initial ──────────────────────────────────────────────────────

describe('useClientFilters - état initial', () => {
  it('tous les filtres sont vides au montage', async () => {
    const { result } = renderHook(() => useClientFilters());

    await waitFor(() => {
      expect(result.current.search).toBe('');
      expect(result.current.filterMonitors).toEqual([]);
      expect(result.current.filterFlights).toEqual([]);
      expect(result.current.filterPayments).toEqual([]);
      expect(result.current.filterStartDate).toBe('');
      expect(result.current.filterEndDate).toBe('');
    });
  });

  it('hasActiveFilters est false au démarrage', async () => {
    const { result } = renderHook(() => useClientFilters());

    await waitFor(() => expect(result.current.hasActiveFilters).toBe(false));
  });
});

// ── Tests : hasActiveFilters ──────────────────────────────────────────────────

describe('useClientFilters - hasActiveFilters', () => {
  it('passe à true quand search est renseigné', async () => {
    const { result } = renderHook(() => useClientFilters());

    act(() => result.current.setSearch('martin'));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('passe à true quand filterMonitors contient une valeur', async () => {
    const { result } = renderHook(() => useClientFilters());

    act(() => result.current.setFilterMonitors(['Jean']));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('passe à true quand filterFlights contient une valeur', async () => {
    const { result } = renderHook(() => useClientFilters());

    act(() => result.current.setFilterFlights(['Découverte']));

    expect(result.current.hasActiveFilters).toBe(true);
  });

  it('passe à true quand filterStartDate est renseignée', async () => {
    const { result } = renderHook(() => useClientFilters());

    act(() => result.current.setFilterStartDate('2025-01-01'));

    expect(result.current.hasActiveFilters).toBe(true);
  });
});

// ── Tests : resetFilters ──────────────────────────────────────────────────────

describe('useClientFilters - resetFilters', () => {
  it('remet tous les filtres à zéro', async () => {
    const { result } = renderHook(() => useClientFilters());

    act(() => {
      result.current.setSearch('test');
      result.current.setFilterMonitors(['Jean']);
      result.current.setFilterFlights(['Vol Expert']);
      result.current.setFilterPayments(['cb']);
      result.current.setFilterStartDate('2025-01-01');
      result.current.setFilterEndDate('2025-12-31');
    });

    act(() => result.current.resetFilters());

    expect(result.current.search).toBe('');
    expect(result.current.filterMonitors).toEqual([]);
    expect(result.current.filterFlights).toEqual([]);
    expect(result.current.filterPayments).toEqual([]);
    expect(result.current.filterStartDate).toBe('');
    expect(result.current.filterEndDate).toBe('');
    expect(result.current.hasActiveFilters).toBe(false);
  });
});

// ── Tests : persistance localStorage ─────────────────────────────────────────

describe('useClientFilters - persistance localStorage', () => {
  it('recharge les filtres sauvegardés au montage', async () => {
    // Simule un utilisateur connecté
    localStorage.setItem('user', JSON.stringify({ id: 42 }));
    localStorage.setItem(
      'fluide_filters_42',
      JSON.stringify({ filterMonitors: ['Sophie'], filterFlights: [], filterPayments: [], search: 'dupont', filterStartDate: '', filterEndDate: '' })
    );

    const { result } = renderHook(() => useClientFilters());

    await waitFor(() => {
      expect(result.current.filterMonitors).toEqual(['Sophie']);
      expect(result.current.search).toBe('dupont');
    });
  });

  it('persiste les filtres dans localStorage quand ils changent', async () => {
    localStorage.setItem('user', JSON.stringify({ id: 7 }));

    const { result } = renderHook(() => useClientFilters());
    await waitFor(() => expect(result.current.search).toBe(''));

    act(() => result.current.setSearch('martin'));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('fluide_filters_7') || '{}');
      expect(stored.search).toBe('martin');
    });
  });

  it('utilise la clé "default" si aucun utilisateur connecté', async () => {
    const { result } = renderHook(() => useClientFilters());
    await waitFor(() => expect(result.current.search).toBe(''));

    act(() => result.current.setSearch('test'));

    await waitFor(() => {
      const stored = JSON.parse(localStorage.getItem('fluide_filters_default') || '{}');
      expect(stored.search).toBe('test');
    });
  });
});
