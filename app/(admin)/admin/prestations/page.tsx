"use client";
import { useEffect, useState } from 'react';
import { apiFetch } from '@/lib/api';

export default function PrestationsPage() {
  const [vols, setVols] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadVols = async () => {
    try {
      const res = await apiFetch('/api/vols');
      if (res.ok) {
        const data = await res.json();
        setVols(data);
      }
    } catch (err) {
      console.error("Erreur chargement prestations:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVols();
  }, []);

  const handleUpdatePrestation = async (id: number, updatedData: any) => {
    try {
      const res = await apiFetch(`/api/admin/vols/${id}`, {
        method: 'PUT',
        body: JSON.stringify(updatedData),
      });

      if (res.ok) {
        alert("✅ Prestation mise à jour !");
        loadVols();
      } else {
        alert("❌ Erreur lors de la sauvegarde.");
      }
    } catch (err) {
      alert("Erreur réseau.");
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center min-h-[400px]">
      <p className="font-black animate-pulse text-slate-400 uppercase italic tracking-widest">
        Accès sécurisé... Gestion technique
      </p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-10 p-6">
      {/* HEADER */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-4xl font-black text-slate-900 tracking-tighter italic uppercase">Prestations</h1>
          <p className="text-slate-500 font-medium text-lg">Paramétrez la durée et les créneaux par type de vol.</p>
        </div>
        <button className="bg-slate-900 text-white px-8 py-4 rounded-[24px] font-black uppercase text-xs tracking-widest hover:bg-sky-600 transition-all shadow-xl active:scale-95">
          + Nouveau Vol
        </button>
      </div>

      {/* LISTE DES VOLS */}
      <div className="grid gap-8">
        {vols.length > 0 ? vols.map((vol: any) => (
          <div key={vol.id} className="bg-white p-8 rounded-[40px] border border-slate-200 group hover:border-sky-400 transition-all shadow-sm hover:shadow-xl">
            
            <div className="flex flex-col lg:flex-row justify-between gap-8">
              <div className="flex items-start gap-6">
                <div className="w-20 h-20 bg-slate-50 rounded-[28px] flex items-center justify-center text-4xl group-hover:bg-sky-50 transition-colors shrink-0">
                  🪂
                </div>
                <div>
                  <h3 className="font-black text-slate-900 uppercase italic tracking-tight text-2xl mb-4">{vol.name}</h3>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Tarif (€)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                        defaultValue={vol.price_cents / 100}
                        id={`price-${vol.id}`}
                      />
                    </div>

                    <div>
                      <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Durée (min)</label>
                      <input 
                        type="number"
                        className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                        defaultValue={vol.duration_minutes || 45}
                        id={`duration-${vol.id}`}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex-1 lg:max-w-xs">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest block mb-1">Horaires autorisés</label>
                <textarea 
                  className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 text-xs focus:ring-2 focus:ring-sky-500 outline-none h-[88px] resize-none"
                  placeholder="ex: 09:00, 10:30, 14:00..."
                  defaultValue={vol.allowed_slots || "09:00, 10:00, 11:00, 14:00, 15:00, 16:00"}
                  id={`slots-${vol.id}`}
                />
              </div>

              <div className="flex flex-col justify-end">
                <button 
                  onClick={() => {
                    const p = (document.getElementById(`price-${vol.id}`) as HTMLInputElement).value;
                    const d = (document.getElementById(`duration-${vol.id}`) as HTMLInputElement).value;
                    const s = (document.getElementById(`slots-${vol.id}`) as HTMLInputElement).value;
                    
                    handleUpdatePrestation(vol.id, {
                      price_cents: Math.round(parseFloat(p) * 100),
                      duration_minutes: parseInt(d),
                      allowed_slots: s
                    });
                  }}
                  className="bg-sky-500 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] hover:bg-slate-900 transition-all shadow-lg active:scale-90"
                >
                  Enregistrer
                </button>
              </div>
            </div>
          </div>
        )) : (
          <div className="p-20 bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] text-center italic font-bold text-slate-400">
            Aucune prestation trouvée.
          </div>
        )}
      </div>

      {/* BANDEAU COMPLÉMENTS */}
      <div className="mt-16 bg-gradient-to-br from-sky-500 to-indigo-600 rounded-[50px] p-12 text-white shadow-2xl shadow-sky-200 relative overflow-hidden group">
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="max-w-md">
            <h2 className="text-3xl font-black italic uppercase tracking-tighter mb-4">Compléments & Options</h2>
            <p className="font-bold text-sky-100 leading-relaxed">
              Configurez ici les suppléments Photos & Vidéos que les clients peuvent ajouter à leur vol.
            </p>
          </div>
          <button 
            onClick={() => window.location.href = '/admin/prestations/complements'}
            className="bg-white text-sky-600 px-10 py-5 rounded-[24px] font-black uppercase text-xs tracking-[0.2em] shadow-xl hover:bg-slate-900 hover:text-white transition-all whitespace-nowrap"
          >
            Gérer les photos/vidéos
          </button>
        </div>
      </div>
    </div>
  );
}