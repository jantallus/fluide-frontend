"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    try {
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        // IMPORTANT : On enregistre sous le nom 'token' pour correspondre à ton api.ts
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        
        // Redirection vers le planning
        router.push('/planning'); 
      } else {
        setError('Identifiants invalides');
      }
    } catch (err) {
      setError('Erreur de connexion au serveur');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md border border-slate-100">
        <h1 className="text-3xl font-black uppercase italic mb-8 text-slate-900 tracking-tighter">
          Fluide <span className="text-sky-500">Admin</span>
        </h1>
        
        {error && <p className="bg-red-50 text-red-500 p-4 rounded-2xl mb-6 font-bold text-sm text-center">{error}</p>}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none font-bold transition-all"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 rounded-3xl outline-none font-bold transition-all"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="w-full bg-slate-900 text-white py-5 rounded-3xl font-black uppercase italic tracking-widest hover:bg-sky-500 transition-all shadow-xl shadow-sky-900/10"
          >
            Se connecter
          </button>
        </form>
      </div>
    </div>
  );
}