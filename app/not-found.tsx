import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-8 font-sans">
      <div className="text-center max-w-sm">
        <div className="text-6xl mb-6">🪂</div>
        <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Erreur 404</p>
        <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-4">
          Page introuvable
        </h1>
        <p className="text-slate-400 font-bold text-sm mb-8">
          Cette page n'existe pas ou a été déplacée.
        </p>
        <Link
          href="/"
          className="inline-block bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase italic text-sm hover:bg-sky-600 transition-colors"
        >
          Retour à l'accueil
        </Link>
      </div>
    </div>
  );
}
