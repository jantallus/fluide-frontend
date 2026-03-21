"use client";
import { useState } from 'react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      // LOG POUR DEBUG
      console.log("Statut HTTP reçu :", res.status);

      const data = await res.json();
      console.log("Données JSON reçues :", data);

      if (res.ok) {
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ first_name: data.first_name, role: data.role }));
        
        // ALERTE DE FORCE (Si ça s'affiche, c'est gagné)
        alert("BRAVO ! Connexion réussie. Rôle : " + data.role);

        // REDIRECTION BRUTALE
        if (data.role === 'admin') {
          window.location.href = '/admin/dashboard';
        } else {
          window.location.href = '/admin/planning';
        }
      } else {
        setError(data.message || "Erreur d'identifiants");
      }
    } catch (err) {
      console.error("ERREUR CAPTURÉE :", err);
      // On affiche l'erreur technique pour comprendre pourquoi le navigateur bloque
      setError("Erreur technique : " + (err instanceof Error ? err.message : "Inconnue"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-900 p-4 font-sans">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl w-full max-w-md">
        <h1 className="text-3xl font-black text-center mb-8 uppercase italic">Fluide <span className="text-sky-500">Pro</span></h1>
        
        {error && (
          <div className="bg-rose-100 text-rose-600 p-4 rounded-2xl mb-6 text-sm font-bold border border-rose-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            placeholder="Email"
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Mot de passe"
            className="w-full p-4 bg-slate-100 rounded-2xl outline-none focus:ring-2 focus:ring-sky-500 text-slate-900"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button 
            type="submit" 
            className="w-full py-4 bg-slate-900 text-white rounded-2xl font-bold uppercase hover:bg-sky-600 transition-colors"
          >
            {loading ? "Chargement..." : "Connexion 🚀"}
          </button>
        </form>
      </div>
    </div>
  );
}