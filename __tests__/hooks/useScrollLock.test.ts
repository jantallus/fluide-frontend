import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useScrollLock } from '@/hooks/useScrollLock';

// ── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  document.body.style.overflow = '';
  vi.spyOn(window, 'scrollTo').mockImplementation(() => {});
  Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
  vi.restoreAllMocks();
  document.body.style.overflow = '';
});

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('useScrollLock', () => {
  it('verrouille overflow quand isOpen passe à true', () => {
    const { rerender } = renderHook(({ isOpen }: { isOpen: boolean }) => useScrollLock(isOpen), {
      initialProps: { isOpen: false },
    });

    expect(document.body.style.overflow).toBe('');

    rerender({ isOpen: true });

    expect(document.body.style.overflow).toBe('hidden');
  });

  it('déverrouille overflow quand isOpen passe à false', () => {
    const { rerender } = renderHook(({ isOpen }: { isOpen: boolean }) => useScrollLock(isOpen), {
      initialProps: { isOpen: true },
    });

    expect(document.body.style.overflow).toBe('hidden');

    rerender({ isOpen: false });

    expect(document.body.style.overflow).toBe('');
  });

  it('appelle scrollTo(0) quand isOpen passe à true', () => {
    const { rerender } = renderHook(({ isOpen }: { isOpen: boolean }) => useScrollLock(isOpen), {
      initialProps: { isOpen: false },
    });

    rerender({ isOpen: true });

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 0, behavior: 'smooth' });
  });

  it('restaure la position de scroll après fermeture si > 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 300, writable: true, configurable: true });

    const { rerender } = renderHook(({ isOpen }: { isOpen: boolean }) => useScrollLock(isOpen), {
      initialProps: { isOpen: false },
    });

    rerender({ isOpen: true });   // mémorise 300
    rerender({ isOpen: false });  // doit restaurer 300 après 50ms

    vi.advanceTimersByTime(50);

    expect(window.scrollTo).toHaveBeenCalledWith({ top: 300, behavior: 'smooth' });
  });

  it('ne restaure pas si la position sauvegardée est 0', () => {
    Object.defineProperty(window, 'scrollY', { value: 0, writable: true, configurable: true });

    const { rerender } = renderHook(({ isOpen }: { isOpen: boolean }) => useScrollLock(isOpen), {
      initialProps: { isOpen: false },
    });

    rerender({ isOpen: true });
    // scrollTo appelé pour remonter en haut
    const callsAfterOpen = (window.scrollTo as ReturnType<typeof vi.fn>).mock.calls.length;

    rerender({ isOpen: false });
    vi.advanceTimersByTime(100);

    // Aucun appel supplémentaire (pas de restauration)
    expect((window.scrollTo as ReturnType<typeof vi.fn>).mock.calls.length).toBe(callsAfterOpen);
  });

  it('déverrouille overflow au démontage', () => {
    const { unmount } = renderHook(() => useScrollLock(true));

    expect(document.body.style.overflow).toBe('hidden');

    act(() => { unmount(); });

    expect(document.body.style.overflow).toBe('');
  });
});
