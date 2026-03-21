"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // Stockage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ 
          first_name: data.first_name, 
          role: data.role 
        }));

        // Redirection forcée avec window.location si router.push traîne
        if (data.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else if (data.role === 'permanent') {
          window.location.href = '/admin/planning';
        } else {
          setError("Accès non autorisé.");
        }
      } else {
        setError(data.message || 'Identifiants invalides');
      }
    } catch (err) {
      console.error("Erreur Fetch:", err);
      setError('Impossible de joindre le serveur.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase italic text-slate-900 tracking-tighter">
            Fluide <span className="text-sky-500">Pro</span>
          </h1>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl mb-6 font-bold text-xs text-center border border-rose-100">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="email"
            type="email"
            placeholder="Email"
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none font-bold text-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none font-bold text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 rounded-3xl font-black uppercase italic shadow-xl bg-slate-900 text-white hover:bg-sky-600 transition-all"
          >
            {loading ? "Chargement..." : "Prendre les commandes 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}