import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { useCurrentUser } from '@/hooks/useCurrentUser';

// ── Setup ─────────────────────────────────────────────────────────────────────

const mockUser = { id: 1, role: 'admin', email: 'admin@test.com' };

beforeEach(() => {
  localStorage.clear();
});

afterEach(() => {
  vi.restoreAllMocks();
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useCurrentUser', () => {
  it('retourne null si localStorage est vide', async () => {
    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).toBeNull());
  });

  it('retourne l\'utilisateur parsé depuis localStorage', async () => {
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).not.toBeNull());
    expect(result.current?.id).toBe(1);
    expect(result.current?.role).toBe('admin');
    expect(result.current?.email).toBe('admin@test.com');
  });

  it('retourne null si le JSON est invalide', async () => {
    localStorage.setItem('user', 'json_invalide_{{{');
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {});

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).toBeNull());
    consoleError.mockRestore();
  });

  it('ne plante pas si localStorage lance une exception', async () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('localStorage unavailable');
    });

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).toBeNull());
  });

  it('retourne null si la clé "user" est absente', async () => {
    localStorage.setItem('autre_clé', JSON.stringify(mockUser));

    const { result } = renderHook(() => useCurrentUser());

    await waitFor(() => expect(result.current).toBeNull());
  });
});
