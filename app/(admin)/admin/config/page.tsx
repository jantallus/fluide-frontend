"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [assignMode, setAssignMode] = useState('fair');
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(65); 
  const [isPause, setIsPause] = useState(false);

  const [openHour, setOpenHour] = useState("09:25");
  const [closeHour, setCloseHour] = useState("16:35");

  // Transforme "HH:mm" en minutes totales pour les calculs
  const toMin = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const getEndTime = (start: string, duration: number) => {
    if (!start) return "";
    const totalMin = toMin(start) + duration;
    const h = Math.floor(totalMin / 60);
    const m = totalMin % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
  };

  const loadSlotDefs = async () => {
    try {
      const res = await apiFetch('/api/admin/config/slots-definitions');
      if (res.ok) {
        const data = await res.json();
        // Tri important pour la détection de collision
        setSlotDefs(data.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)));
      }
    } catch (err) {
      console.error("Erreur chargement slot definitions:", err);
    }
  };

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const resVols = await apiFetch('/api/vols');
        if (resVols.ok) setFlightTypes(await resVols.json());

        const resConfig = await apiFetch('/api/admin/config');
        if (resConfig.ok) {
          const data = await resConfig.json();
          if (data.open_hour) setOpenHour(data.open_hour);
          if (data.close_hour) setCloseHour(data.close_hour);
        }

        await loadSlotDefs();
        const savedMode = localStorage.getItem('fluide_assign_mode');
        if (savedMode) setAssignMode(savedMode);
      } catch (err) {
        console.error("Erreur config:", err);
      } finally {
        setLoading(false);
      }
    };
    loadConfig();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    try {
      await apiFetch('/api/admin/config/options', {
        method: 'PUT',
        body: JSON.stringify({ option_name: key, value: value }),
      });
    } catch (err) {
      console.error("Erreur sauvegarde setting:", err);
    }
  };

  const addSlotDef = async () => {
    if (!newStartTime) return alert("Choisis une heure de début");

    const startMin = toMin(newStartTime);
    const endMin = startMin + newDuration;

    // Vérification des bornes
    if (startMin < toMin(openHour) || startMin > toMin(closeHour)) {
      alert(`⚠️ Hors bornes : Le début doit être entre ${openHour} et ${closeHour}.`);
      return;
    }

    // Vérification collision (Espace libre réel)
    const hasOverlap = slotDefs.some((def: any) => {
      const defStart = toMin(def.start_time);
      const defEnd = defStart + def.duration_minutes;
      return (startMin < defEnd && endMin > defStart);
    });

    if (hasOverlap) {
      alert("⚠️ Collision : Cet espace est déjà occupé par un autre créneau.");
      return;
    }

    try {
      const res = await apiFetch('/api/admin/config/slots-definitions', {
        method: 'POST',
        body: JSON.stringify({ 
          start_time: newStartTime, 
          duration_minutes: newDuration,
          label: isPause ? "PAUSE" : "LOGISTIQUE + VOL" 
        }),
      });
      if (res.ok) {
        setNewStartTime("");
        await loadSlotDefs();
      }
    } catch (err) {
      console.error("Erreur ajout créneau:", err);
    }
  };

  const deleteSlotDef = async (id: number) => {
    if (!confirm("Supprimer ce maillon ?")) return;
    try {
      const res = await apiFetch(`/api/admin/config/slots-definitions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        // Mise à jour immédiate de l'état local pour libérer l'espace visuel
        setSlotDefs(prev => prev.filter(s => s.id !== id));
        await loadSlotDefs(); 
      }
    } catch (err) {
      console.error("Erreur suppression créneau:", err);
    }
  };

  const updatePrice = async (id: number, newPriceCents: number) => {
    try {
      const res = await apiFetch(`/api/admin/vols/${id}`, {
        method: 'PUT',
        body: JSON.stringify({ price_cents: newPriceCents }),
      });
      if (res.ok) {
        setFlightTypes(flightTypes.map((f: any) => f.id === id ? { ...f, price_cents: newPriceCents } : f));
      }
    } catch (err) {
      alert("Erreur mise à jour prix");
    }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 p-4 text-slate-800">
      
      {/* HEADER CONFIG */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6 transition-all hover:shadow-md">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Configuration</h1>
          <p className="text-slate-400 font-bold uppercase text-xs mt-2 tracking-widest">Chaîne Logistique & Paramètres</p>
        </div>
        <div className="px-6 py-3 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="text-[10px] font-black uppercase text-slate-400 block text-center mb-1">Status</span>
             <span className="text-green-500 font-black uppercase text-xs">● Serveur Actif</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* STRUCTURE DE LA JOURNÉE - LA LOGIQUE D'AFFICHAGE */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col h-[650px]">
          <h2 className="text-sm font-black italic uppercase mb-6 text-slate-400 tracking-widest">Structure Logistique</h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
            {slotDefs.length > 0 ? (
              slotDefs.map((def: any) => {
                const isPauseItem = def.label === "PAUSE";
                const endTime = getEndTime(def.start_time, def.duration_minutes);
                const currentStart = def.start_time.slice(0, 5);
                const isOutOfRange = currentStart < openHour.slice(0, 5) || currentStart > closeHour.slice(0, 5);

                return (
                  <div key={def.id} className={`flex items-center gap-4 p-5 rounded-3xl font-black text-sm group border transition-all hover:scale-[1.02] ${
                    isPauseItem ? 'bg-rose-50 border-rose-100' : 
                    isOutOfRange ? 'bg-amber-50 border-amber-200 opacity-70' : 'bg-slate-50 border-slate-100'
                  }`}>
                    <div className="flex flex-col">
                      <span className={isPauseItem ? 'text-rose-500' : isOutOfRange ? 'text-amber-600' : 'text-slate-900'}>
                        {currentStart} — {endTime}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400 mt-1">
                        {isPauseItem ? '☕ Pause / Relais' : `${def.duration_minutes} MIN (Préparatif + Vol)`}
                        {isOutOfRange && <span className="text-amber-600 ml-2 font-black">⚠️ HORS BORNES</span>}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteSlotDef(def.id)} 
                      className="ml-auto opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] uppercase transition-all shadow-lg shadow-rose-200"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center p-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                <span className="text-4xl mb-4">📭</span>
                <p className="text-xs text-slate-400 italic font-bold uppercase tracking-widest">Aucune structure définie</p>
              </div>
            )}
          </div>

          {/* AJOUT RAPIDE */}
          <div className="bg-slate-900 p-8 rounded-[35px] space-y-5 shadow-2xl">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-widest italic">Nouveau maillon</p>
              <button 
                onClick={() => setIsPause(!isPause)}
                className={`text-[9px] font-black px-4 py-2 rounded-xl transition-all border ${
                  isPause ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 border-white/20 text-white/60 hover:text-white'
                }`}
              >
                {isPause ? 'MODE PAUSE ☕' : 'MODE VOL 🪂'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase ml-1 tracking-widest">Heure Début</label>
                <input 
                  type="time" 
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
              <div className="space-y-2">
                <label className="text-[9px] font-black text-white/40 uppercase ml-1 tracking-widest">Durée (Min)</label>
                <input 
                  type="number" 
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black text-sm outline-none focus:ring-2 focus:ring-sky-500 transition-all"
                />
              </div>
            </div>
            
            <button 
              onClick={addSlotDef}
              className={`w-full font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${
                isPause ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-sky-500 hover:bg-white hover:text-sky-600 text-white'
              }`}
            >
              Ajouter à la structure
            </button>
          </div>
        </div>

        {/* BORNES ET ATTRIBUTION */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm transition-all hover:shadow-md">
            <h3 className="font-black uppercase italic text-sm mb-4 text-slate-900 tracking-widest flex items-center gap-2">
               <span className="text-sky-500">⏱</span> Bornes d'exploitation
            </h3>
            <p className="text-[10px] text-slate-400 font-bold mb-8 leading-tight uppercase tracking-tight">
               Définit la plage horaire durant laquelle un décollage peut avoir lieu.
            </p>
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase text-slate-400 ml-1">Premier décollage</label>
                <input 
                  type="time" 
                  value={openHour}
                  onChange={(e) => { setOpenHour(e.target.value); saveSetting('open_hour', e.target.value); }}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-700 focus:border-sky-500 focus:bg-white transition-all outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-[9px] font-black uppercase text-slate-400 ml-1">Dernier décollage</label>
                <input 
                  type="time" 
                  value={closeHour}
                  onChange={(e) => { setCloseHour(e.target.value); saveSetting('close_hour', e.target.value); }}
                  className="w-full bg-slate-50 border-2 border-slate-50 rounded-2xl p-4 font-black text-slate-700 focus:border-sky-500 focus:bg-white transition-all outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h3 className="font-black uppercase italic text-sm mb-6 text-slate-900 tracking-widest flex items-center gap-2">
               <span className="text-sky-500">⚖️</span> Attribution auto
            </h3>
            <div className="flex bg-slate-100 p-2 rounded-2xl gap-2">
              <button 
                onClick={() => { setAssignMode('fair'); localStorage.setItem('fluide_assign_mode', 'fair'); }}
                className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${assignMode === 'fair' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Équitable
              </button>
              <button 
                onClick={() => { setAssignMode('random'); localStorage.setItem('fluide_assign_mode', 'random'); }}
                className={`flex-1 py-4 rounded-xl font-black text-[10px] uppercase transition-all ${assignMode === 'random' ? 'bg-white text-slate-900 shadow-md scale-[1.02]' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Aléatoire
              </button>
            </div>
            <p className="text-[9px] text-slate-400 font-bold mt-4 px-2 uppercase tracking-tight leading-relaxed">
               Détermine comment les vols sont répartis entre les moniteurs lors de la génération.
            </p>
          </div>
        </div>
      </div>

      {/* TARIFS DE VOL */}
      <div className="bg-slate-900 p-12 rounded-[55px] shadow-3xl shadow-slate-900/40 border border-white/5">
        <div className="flex items-center justify-between mb-10">
            <h2 className="text-white font-black uppercase italic text-2xl tracking-tighter">Grille des Tarifs</h2>
            <span className="bg-sky-500 text-white text-[9px] font-black px-4 py-2 rounded-full uppercase tracking-widest shadow-xl shadow-sky-500/20">Mise à jour en direct</span>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {flightTypes.map((flight: any) => (
            <div key={flight.id} className="bg-white/5 border border-white/10 p-8 rounded-[35px] flex items-center justify-between group hover:bg-white/10 transition-all hover:border-sky-500/30">
              <div className="flex flex-col gap-1">
                <span className="text-white font-black uppercase text-sm tracking-widest group-hover:text-sky-400 transition-colors">{flight.name}</span>
                <span className="text-white/20 text-[9px] font-black uppercase tracking-widest">Base de calcul TTC</span>
              </div>
              <div className="relative">
                <input 
                  type="number"
                  defaultValue={flight.price_cents / 100}
                  onBlur={(e) => updatePrice(flight.id, parseInt(e.target.value) * 100)}
                  className="bg-slate-800 border-2 border-transparent rounded-2xl p-4 w-32 font-black text-right text-white focus:border-sky-500 transition-all outline-none"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-white/20 font-black pointer-events-none">€</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}