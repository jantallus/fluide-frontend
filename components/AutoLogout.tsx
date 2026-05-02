"use client";
import { useEffect } from 'react';

export default function AutoLogout() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const logout = async () => {
      // 1. On demande au serveur d'effacer le cookie HttpOnly (seul lui peut le faire)
      try {
        await fetch('/api/auth/logout', { method: 'POST' });
      } catch (_) {
        // Même si le réseau est coupé, on déconnecte quand même localement
      }

      // 2. On efface les infos d'affichage
      localStorage.removeItem('user');

      // 3. On renvoie vers la page de connexion
      window.location.href = '/login';
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(logout, 1800000); // 30 minutes
    };

    const events = ['mousemove', 'keydown', 'click', 'scroll'];
    events.forEach(event => window.addEventListener(event, resetTimer));
    resetTimer();

    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null;
}
