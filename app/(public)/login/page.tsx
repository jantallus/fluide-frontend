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
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // 1. On prépare l'objet utilisateur (rôle en minuscules)
        const userToStore = {
          id: data.user.id,
          role: data.user.role ? data.user.role.toLowerCase() : 'user',
          first_name: data.user.first_name || data.user.firstName
        };

        // 2. Stockage propre
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(userToStore));

        // 3. Redirection
        if (userToStore.role === 'admin') {
          router.push('/dashboard');
        } else if (userToStore.role === 'monitor' || userToStore.role === 'permanent') {
          router.push('/planning');
        } else {
          router.push('/');
        }
      } else {
        setError(data.error || data.message || "Identifiants invalides");
      }
    } catch (err) {
      console.error("Erreur login:", err);
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