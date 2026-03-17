"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api'; // Import sécurisé

export default function ComplementsPage() {
  const [photoPrice, setPhotoPrice] = useState(30);
  const [loading, setLoading] = useState(false);

  // Note : Idéalement, tu devrais charger ce prix depuis ta DB au montage de la page
  // useEffect(() => { ... charger le prix actuel ... }, []);

  const handleSave = async () => {
    setLoading(true);
    try {
      // On utilise une route générique ou spécifique pour les options/extras
      // Ici, on simule l'envoi vers une configuration de vol ou une table dédiée
      const res = await apiFetch('/api/admin/config/options', {
        method: 'PUT',
        body: JSON.stringify({ 
          option_name: 'photos_videos',
          price_euro: photoPrice 
        }),
      });

      if (res.ok) {
        alert("Tarif des options enregistré avec succès !");
      } else {
        alert("Erreur lors de l'enregistrement.");
      }
    } catch (err) {
      console.error("Erreur réseau:", err);
      alert("Erreur de connexion au serveur.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-12 p-6">
      <div>
        <h1 className="text-3xl font-black text-slate-900 italic uppercase tracking-tighter">Photos & Vidéos</h1>
        <p className="text-slate-500 font-medium">Configurez les options numériques proposées par les moniteurs.</p>
      </div>

      <div className="bg-white rounded-[40px] border border-slate-200 overflow-hidden shadow-sm">
        <div className="p-10 flex flex-col md:flex-row items-center gap-10">
          <div className="w-32 h-32 bg-rose-50 text-rose-500 rounded-[32px] flex items-center justify-center text-5xl">
            📸
          </div>
          <div className="flex-1 space-y-4">
            <div className="flex justify-between items-start">
              <div>
                <h2 className="text-2xl font-black text-slate-900 uppercase italic tracking-tight">Option Photos & Vidéos SD/HD</h2>
                <p className="text-slate-400 font-bold text-sm tracking-widest uppercase mt-1">Livrées sur carte SD ou transfert mobile</p>
              </div>
              <div className="flex items-center gap-2 bg-emerald-50 px-3 py-1 rounded-full">
                <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                <span className="text-[10px] font-black text-emerald-600 uppercase">Actif</span>
              </div>
            </div>

            <div className="flex items-end gap-6 pt-4">
              <div className="flex-1">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-2">Prix de l'option (€)</label>
                <input 
                  type="number" 
                  value={photoPrice} 
                  onChange={(e) => setPhotoPrice(Number(e.target.value))}
                  className="w-full mt-1 bg-slate-50 border-none rounded-2xl p-4 font-black text-xl focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <button 
                onClick={handleSave}
                disabled={loading}
                className={`bg-slate-900 text-white px-8 py-4 rounded-2xl font-black uppercase text-xs tracking-widest hover:bg-emerald-500 transition-all ${loading ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {loading ? 'Enregistrement...' : 'Enregistrer'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 p-6 border-t border-slate-100 flex justify-between items-center px-10">
          <p className="text-xs text-slate-400 font-bold uppercase italic">Affiché sur la page de réservation client</p>
          <div className="flex gap-2">
             <span className="w-3 h-3 bg-sky-400 rounded-full"></span>
             <span className="w-3 h-3 bg-indigo-400 rounded-full"></span>
          </div>
        </div>
      </div>
    </div>
  );
}