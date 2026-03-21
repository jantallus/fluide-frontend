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

      if (res.ok) {
        const data = await res.json();
        
        // Stockage
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ 
          first_name: data.first_name, 
          role: data.role 
        }));

        // Redirection intelligente
        if (data.role === 'admin') {
          router.push('/admin/dashboard');
        } else if (data.role === 'permanent') {
          router.push('/admin/planning');
        } else {
          setError("Votre compte n'a pas d'accès au backoffice.");
          localStorage.clear();
        }
      } else {
        const errData = await res.json();
        setError(errData.message || 'Identifiants invalides');
      }
    } catch (err) {
      console.error(err);
      setError('Impossible de joindre le serveur. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-800/10">
        <div className="text-center mb-10">
          <h1 className="text-4xl font-black uppercase italic text-slate-900 tracking-tighter">
            Fluide <span className="text-sky-500">Pro</span>
          </h1>
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2">Espace Équipage</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl mb-6 font-bold text-xs text-center border border-rose-100 animate-shake">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email</label>
            <input
              type="email"
              placeholder="pilote@fluide.fr"
              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-3xl outline-none font-bold transition-all text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Mot de passe</label>
            <input
              type="password"
              placeholder="••••••••"
              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-3xl outline-none font-bold transition-all text-slate-900"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className={`w-full py-5 rounded-3xl font-black uppercase italic shadow-xl transition-all flex items-center justify-center gap-3 ${
              loading 
              ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
              : 'bg-slate-900 text-white hover:bg-sky-600 hover:scale-[1.02] active:scale-95'
            }`}
          >
            {loading ? "Vérification..." : "Prendre les commandes 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}