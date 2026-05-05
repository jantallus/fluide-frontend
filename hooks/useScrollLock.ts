'use client';
import { useEffect, useRef } from 'react';

/**
 * Quand `isOpen` passe à true :
 *   - mémorise la position de scroll courante
 *   - remonte en haut de page (smooth)
 *   - verrouille le scroll du body
 *
 * Quand `isOpen` repasse à false :
 *   - déverrouille le scroll
 *   - retourne à la position mémorisée (smooth, 50 ms de délai)
 *
 * Utilisé pour les popups/modales légères des pages publiques
 * (infoFlight sur /booking, infoTemplate sur /bons-cadeaux).
 */
export function useScrollLock(isOpen: boolean): void {
  const savedPos = useRef(0);

  useEffect(() => {
    if (isOpen) {
      savedPos.current = window.scrollY;
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      if (savedPos.current > 0) {
        const target = savedPos.current;
        setTimeout(() => window.scrollTo({ top: target, behavior: 'smooth' }), 50);
        savedPos.current = 0;
      }
    }

    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);
}
