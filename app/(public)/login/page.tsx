"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. Stockage des informations de session
        localStorage.setItem('token', data.token);
        localStorage.setItem('userId', data.user.id);
        localStorage.setItem('userRole', data.user.role);
        localStorage.setItem('userName', data.user.firstName);

        // 2. Redirection dynamique selon le rôle
        if (data.user.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (data.user.role === 'monitor') {
          router.push('/planning');
        } else {
          // Si c'est un client ou un rôle inconnu
          router.push('/');
        }
      } else {
        setError(data.message || "Identifiants invalides");
      }
    } catch (err) {
      setError("Impossible de joindre le serveur de vol.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="max-w-md w-full bg-white p-10 rounded-[40px] shadow-2xl border border-slate-100">
        <div className="text-center mb-10">
          <div className="inline-block p-4 bg-sky-100 rounded-2xl mb-4">
            <span className="text-3xl">🪂</span>
          </div>
          <h1 className="text-3xl font-black italic uppercase text-slate-900 tracking-tighter">
            Fluide <span className="text-sky-600">Pro</span>
          </h1>
          <p className="text-slate-500 font-medium">Accès moniteurs et administration</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-rose-50 border-l-4 border-rose-500 text-rose-700 text-sm font-bold rounded-r-xl">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Email Professionnel
            </label>
            <input
              type="email"
              required
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700"
              placeholder="ex: leo@fluide.fr"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2 ml-1">
              Mot de passe
            </label>
            <input
              type="password"
              required
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-2xl outline-none transition-all font-medium text-slate-700"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-slate-900 text-white font-black rounded-2xl hover:bg-sky-600 hover:shadow-xl hover:shadow-sky-200 transition-all active:scale-95 disabled:opacity-50 uppercase tracking-widest text-sm"
          >
            {loading ? "Connexion..." : "Prendre son service"}
          </button>
        </form>

        <p className="mt-8 text-center text-slate-400 text-xs">
          Problème d'accès ? Contactez Ju.
        </p>
      </div>
    </div>
  );
}