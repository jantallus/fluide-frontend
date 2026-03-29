"use client";
import { useEffect } from 'react';

export default function AutoLogout() {
  useEffect(() => {
    let timeoutId: NodeJS.Timeout;

    const logout = () => {
      // 1. On efface le badge de sécurité de la mémoire du navigateur
      localStorage.removeItem('token');
      localStorage.removeItem('user'); 
      
      // 2. On renvoie l'utilisateur à la porte d'entrée (page de connexion)
      window.location.href = '/login'; 
    };

    const resetTimer = () => {
      clearTimeout(timeoutId);
      // Réglage du temps d'inactivité (ici : 30 minutes)
      // 30 min * 60 sec * 1000 millisecondes = 1 800 000 ms
      timeoutId = setTimeout(logout, 1800000); 
    };

    // La liste des actions qui prouvent que l'utilisateur est "vivant"
    const events = ['mousemove', 'keydown', 'click', 'scroll'];

    // On écoute ces actions
    events.forEach(event => window.addEventListener(event, resetTimer));

    // On lance le chrono une première fois au chargement de la page
    resetTimer();

    // Nettoyage propre si on quitte la page
    return () => {
      clearTimeout(timeoutId);
      events.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, []);

  return null; // Ce composant est un "fantôme", il ne s'affiche pas à l'écran !
}