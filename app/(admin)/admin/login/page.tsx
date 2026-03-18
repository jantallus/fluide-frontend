"use client";
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  // On nettoie les vieux restes de localhost au chargement de la page
  useEffect(() => {
    localStorage.clear();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // URL FORCEE VERS RAILWAY POUR EVITER LE LOCALHOST
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (res.ok) {
        // On enregistre le token pour api.ts
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirection vers le tableau de bord
        router.push('/admin/dashboard'); 
      } else {
        setError(data.message || 'Identifiants invalides');
      }
    } catch (err) {
      console.error("Erreur login:", err);
      setError('Impossible de joindre le serveur Railway. Vérifie ta connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-8 rounded-[32px] shadow-2xl w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-black uppercase italic tracking-tighter text-slate-900">
            FLUIDE <span className="text-sky-500">PROD</span>
          </h1>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-2">Accès Administration</p>
        </div>
        
        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-red-100 text-center">
            {error}
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none font-medium transition-all text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>
          <div>
            <input
              type="password"
              placeholder="Mot de passe"
              className="w-full p-4 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-2xl outline-none font-medium transition-all text-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`w-full py-4 rounded-2xl font-black uppercase italic tracking-widest transition-all shadow-lg ${
              loading 
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-sky-500 shadow-sky-900/20'
            }`}
          >
            {loading ? 'Connexion...' : 'Entrer'}
          </button>
        </form>
        
        <p className="mt-8 text-center text-slate-300 text-[10px] font-bold uppercase tracking-widest">
          &copy; 2026 Fluide Parapente - Production Mode
        </p>
      </div>
    </div>
  );
}