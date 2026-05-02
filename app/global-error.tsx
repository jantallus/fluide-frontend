"use client";
import { useEffect } from 'react';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

// Filet de sécurité ultime : remplace le root layout en cas de crash critique.
// Doit inclure <html> et <body>.
export default function GlobalError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Global Error]', error);
  }, [error]);

  return (
    <html lang="fr">
      <body style={{ margin: 0, fontFamily: 'sans-serif', background: '#f8fafc' }}>
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>🪂</div>
            <h1 style={{ fontSize: '1.5rem', fontWeight: 900, textTransform: 'uppercase', fontStyle: 'italic', marginBottom: '0.5rem' }}>
              Fluide est temporairement indisponible
            </h1>
            <p style={{ color: '#94a3b8', marginBottom: '2rem', fontSize: '0.875rem' }}>
              Une erreur critique s'est produite. L'équipe technique en a été notifiée.
            </p>
            <button
              onClick={reset}
              style={{ background: '#0f172a', color: 'white', border: 'none', padding: '1rem 2rem', borderRadius: '1rem', fontWeight: 900, textTransform: 'uppercase', cursor: 'pointer', fontSize: '0.75rem', letterSpacing: '0.1em' }}
            >
              Réessayer
            </button>
          </div>
        </div>
      </body>
    </html>
  );
}
