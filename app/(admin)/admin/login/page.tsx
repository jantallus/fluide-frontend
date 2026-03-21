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
      // On utilise l'URL de ton backend Railway
      const res = await fetch('https://fluide-production.up.railway.app/api/login', {
        method: 'POST',
        mode: 'cors', // Crucial pour autoriser la communication cross-domain
        headers: { 
          'Content-Type': 'application/json',
          'Accept': 'application/json'
        },
        // .trim() supprime les espaces accidentels avant/après l'email
        body: JSON.stringify({ email: email.trim(), password }), 
      });

      const data = await res.json();

      if (res.ok) {
        const data = await res.json();
        
        // --- ÉTAPE A : SAUVEGARDE ---
        localStorage.setItem('token', data.token);
        localStorage.setItem('user', JSON.stringify({ 
          first_name: data.first_name, 
          role: data.role 
        }));

        // --- ÉTAPE B : ALERTE DE SÉCURITÉ (Pour confirmer que le code arrive ici) ---
        // Tu peux supprimer cette ligne après le test réussi
        alert("Connexion validée ! Rôle : " + data.role + ". Redirection en cours...");

        // --- ÉTAPE C : REDIRECTION FORCÉE ---
        // On utilise l'URL absolue pour éviter tout problème de dossier
        if (data.role === 'admin') {
          window.location.assign('/admin/dashboard');
        } else if (data.role === 'permanent') {
          window.location.assign('/admin/planning');
        } else {
          setError("Accès non autorisé pour le rôle : " + data.role);
        }

      } else {
        const errData = await res.json();
        setError(errData.message || 'Identifiants invalides');
      }
    } catch (err) {
      // Diagnostic précis en cas d'échec de liaison
      console.error("Détails de l'erreur réseau :", err);
      setError('Impossible de joindre le serveur. Vérifiez votre connexion ou l\'état du service Railway.');
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
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-[0.3em] mt-2 italic">Espace Équipage</p>
        </div>

        {error && (
          <div className="bg-rose-50 text-rose-500 p-4 rounded-2xl mb-6 font-bold text-xs text-center border border-rose-100 animate-pulse">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Email</label>
            <input
              name="email"
              type="email"
              autoComplete="email"
              placeholder="votre@email.com"
              className="w-full p-5 bg-slate-50 border-2 border-transparent focus:border-sky-500 focus:bg-white rounded-3xl outline-none font-bold transition-all text-slate-900"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-black uppercase text-slate-400 ml-4">Mot de passe</label>
            <input
              name="password"
              type="password"
              autoComplete="current-password"
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
            className={`w-full py-5 rounded-3xl font-black uppercase italic shadow-xl transition-all flex items-center justify-center gap-2 ${
              loading 
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                : 'bg-slate-900 text-white hover:bg-sky-600 active:scale-95'
            }`}
          >
            {loading ? (
              <>
                <span className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></span>
                Vérification...
              </>
            ) : (
              "Prendre les commandes 🚀"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}