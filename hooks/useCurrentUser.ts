'use client';
import { useState, useEffect } from 'react';
import type { CurrentUser } from '@/lib/types';

/**
 * Lit l'utilisateur courant depuis le localStorage (clé 'user').
 * Retourne null si non connecté ou si la clé est absente/invalide.
 */
export function useCurrentUser(): CurrentUser | null {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem('user');
      if (raw) setCurrentUser(JSON.parse(raw) as CurrentUser);
    } catch {
      // localStorage inaccessible ou JSON invalide — on reste null
    }
  }, []);

  return currentUser;
}
