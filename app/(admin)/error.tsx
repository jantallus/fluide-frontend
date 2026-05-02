"use client";
import { useEffect } from 'react';
import * as Sentry from '@sentry/nextjs';

interface Props {
  error: Error & { digest?: string };
  reset: () => void;
}

export default function AdminError({ error, reset }: Props) {
  useEffect(() => {
    console.error('[Admin Error]', error);
    // Envoie l'erreur à Sentry si configuré (no-op sinon)
    Sentry.captureException(error, { tags: { boundary: 'admin' } });
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8">
      <div className="bg-white rounded-[40px] p-10 max-w-md w-full shadow-xl border border-rose-100 text-center">
        <div className="text-5xl mb-6">⚠️</div>
        <h1 className="text-2xl font-black uppercase italic text-slate-900 tracking-tighter mb-2">
          Quelque chose a planté
        </h1>
        <p className="text-slate-400 font-bold text-sm mb-8">
          Une erreur inattendue s'est produite sur cette page.
          {error.digest && (
            <span className="block mt-2 text-[10px] font-mono text-slate-300">
              Réf : {error.digest}
            </span>
          )}
        </p>
        <div className="flex flex-col gap-3">
          <button
            onClick={reset}
            className="w-full bg-slate-900 text-white py-4 rounded-2xl font-black uppercase italic text-sm hover:bg-sky-600 transition-colors"
          >
            Réessayer
          </button>
          <a
            href="/dashboard"
            className="w-full block text-slate-400 font-bold uppercase text-[10px] tracking-widest py-2 hover:text-slate-700 transition-colors"
          >
            Retour au tableau de bord
          </a>
        </div>
      </div>
    </div>
  );
}
