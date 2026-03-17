"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [assignMode, setAssignMode] = useState('fair');
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(65); 
  const [isPause, setIsPause] = useState(false);

  const [openHour, setOpenHour] = useState("09:25");
  const [closeHour, setCloseHour] = useState("16:35");

  const getEndTime = (start: string, duration: number) => {
    if (!start) return "";
    const [hours, minutes] = start.split(':').map(Number);
    const date = new Date();
    date.setHours(hours, minutes + duration);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const loadSlotDefs = async () => {
    try {
      const res = await apiFetch('/api/admin/config/slots-definitions');
      if (res.ok) {
        const data = await res.json();
        setSlotDefs(data);
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

    // Comparaison stricte sur HH:mm
    const startHHmm = newStartTime.slice(0, 5);
    const openHHmm = openHour.slice(0, 5);
    const closeHHmm = closeHour.slice(0, 5);

    if (startHHmm < openHHmm || startHHmm > closeHHmm) {
      alert(`⚠️ Action impossible : Le début du créneau doit être compris entre ${openHHmm} et ${closeHHmm} inclus.`);
      return;
    }

    const newStartTotalMin = parseInt(newStartTime.split(':')[0]) * 60 + parseInt(newStartTime.split(':')[1]);
    const newEndTotalMin = newStartTotalMin + newDuration;

    const hasOverlap = slotDefs.some((def: any) => {
      const defStartTotalMin = parseInt(def.start_time.split(':')[0]) * 60 + parseInt(def.start_time.split(':')[1]);
      const defEndTotalMin = defStartTotalMin + def.duration_minutes;
      return (newStartTotalMin < defEndTotalMin && newEndTotalMin > defStartTotalMin);
    });

    if (hasOverlap) {
      alert("⚠️ Collision logistique : Ce créneau chevauche une période déjà définie.");
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
        setIsPause(false);
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
      if (res.ok) await loadSlotDefs();
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

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300">CHARGEMENT...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 p-4 text-slate-800">
      {/* HEADER */}
      <div className="bg-white p-10 rounded-[40px] border border-slate-100 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter leading-none">Configuration</h1>
          <p className="text-slate-400 font-bold uppercase text-xs mt-2 tracking-widest">Chaîne Logistique & Paramètres</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* STRUCTURE DE LA JOURNÉE */}
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col h-full">
          <h2 className="text-sm font-black italic uppercase mb-6 text-slate-400 tracking-widest">Structure Logistique (Vols + Temps annexes)</h2>
          
          <div className="space-y-3 flex-1 overflow-y-auto max-h-[400px] mb-6 pr-2">
            {slotDefs.length > 0 ? (
              slotDefs.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)).map((def: any) => {
                const isPauseItem = def.label === "PAUSE";
                const endTime = getEndTime(def.start_time, def.duration_minutes);
                
                // Normalisation HH:mm pour affichage et comparaison
                const currentStart = def.start_time.slice(0, 5);
                const limitOpen = openHour.slice(0, 5);
                const limitClose = closeHour.slice(0, 5);
                
                const isOutOfRange = currentStart < limitOpen || currentStart > limitClose;

                return (
                  <div key={def.id} className={`flex items-center gap-4 p-4 rounded-2xl font-black text-sm group border transition-all ${
                    isPauseItem ? 'bg-rose-50 border-rose-100' : 
                    isOutOfRange ? 'bg-amber-50 border-amber-200 opacity-70' : 'bg-slate-50 border-transparent'
                  }`}>
                    <div className="flex flex-col">
                      <span className={isPauseItem ? 'text-rose-500' : isOutOfRange ? 'text-amber-600' : 'text-sky-600'}>
                        {currentStart} — {endTime}
                      </span>
                      <span className="text-[9px] uppercase tracking-widest text-slate-400">
                        {isPauseItem ? '☕ Pause / Préparation' : `${def.duration_minutes} MIN (Vol + Logistique)`}
                        {isOutOfRange && <span className="text-amber-600 ml-1 font-black">⚠️ HORS BORNES</span>}
                      </span>
                    </div>
                    <button 
                      onClick={() => deleteSlotDef(def.id)} 
                      className="ml-auto opacity-0 group-hover:opacity-100 text-rose-500 text-[10px] uppercase transition-all hover:scale-110"
                    >
                      Supprimer
                    </button>
                  </div>
                );
              })
            ) : (
              <p className="text-[10px] text-slate-400 italic font-bold p-4 text-center">Aucun maillon défini dans la chaîne.</p>
            )}
          </div>

          {/* Formulaire d'ajout rapide */}
          <div className="bg-slate-900 p-6 rounded-3xl space-y-4 shadow-2xl">
            <div className="flex justify-between items-center">
              <p className="text-[10px] font-black text-sky-400 uppercase tracking-[0.2em]">Nouveau Créneau Type</p>
              <button 
                onClick={() => setIsPause(!isPause)}
                className={`text-[9px] font-black px-3 py-1 rounded-full transition-all border ${
                  isPause ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/5 border-white/10 text-white/40 hover:text-white'
                }`}
              >
                {isPause ? 'MODE PAUSE' : 'MODE LOGISTIQUE'}
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/30 uppercase ml-1">Début du Créneau</label>
                <input 
                  type="time" 
                  value={newStartTime}
                  onChange={(e) => setNewStartTime(e.target.value)}
                  className="w-full bg-white/10 border-none rounded-xl p-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-black text-white/30 uppercase ml-1">Amplitude (Min)</label>
                <input 
                  type="number" 
                  value={newDuration}
                  onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)}
                  className="w-full bg-white/10 border-none rounded-xl p-3 text-white font-bold text-sm outline-none focus:ring-2 focus:ring-sky-500"
                />
              </div>
            </div>
            
            <button 
              onClick={addSlotDef}
              className={`w-full font-black py-3 rounded-xl text-[10px] uppercase tracking-widest transition-all shadow-lg active:scale-95 ${
                isPause ? 'bg-rose-500 hover:bg-rose-600 text-white' : 'bg-sky-500 hover:bg-white hover:text-sky-600 text-white'
              }`}
            >
              Enregistrer dans la structure
            </button>
          </div>
        </div>

        {/* HORAIRES D'EXPLOITATION */}
        <div className="space-y-8">
          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm text-slate-800">
            <h3 className="font-black uppercase italic text-sm mb-4 text-slate-400 tracking-widest">Bornes de lancement</h3>
            <p className="text-[10px] text-slate-400 font-bold mb-6 leading-tight uppercase tracking-tight">
               Les créneaux ne peuvent débuter qu'entre ces deux horaires. Un vol peut se terminer après la fermeture.
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Premier début autorisé</label>
                <input 
                  type="time" 
                  value={openHour}
                  onChange={(e) => { setOpenHour(e.target.value); saveSetting('open_hour', e.target.value); }}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase text-slate-400 mb-2">Dernier début autorisé</label>
                <input 
                  type="time" 
                  value={closeHour}
                  onChange={(e) => { setCloseHour(e.target.value); saveSetting('close_hour', e.target.value); }}
                  className="w-full bg-slate-50 border-none rounded-xl p-3 font-bold text-slate-700 focus:ring-2 focus:ring-sky-500 outline-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-[40px] border border-slate-200 shadow-sm">
            <h3 className="font-black uppercase italic text-sm mb-6 text-slate-400 tracking-widest">Attribution des vols</h3>
            <div className="flex bg-slate-100 p-1.5 rounded-2xl gap-1">
              <button 
                onClick={() => { setAssignMode('fair'); localStorage.setItem('fluide_assign_mode', 'fair'); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${assignMode === 'fair' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Équitable
              </button>
              <button 
                onClick={() => { setAssignMode('random'); localStorage.setItem('fluide_assign_mode', 'random'); }}
                className={`flex-1 py-3 rounded-xl font-black text-xs uppercase transition-all ${assignMode === 'random' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400'}`}
              >
                Aléatoire
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* TARIFS */}
      <div className="bg-slate-900 p-10 rounded-[50px] shadow-2xl shadow-sky-900/20">
        <h2 className="text-white font-black uppercase italic text-xl mb-8 tracking-tighter">Gestion des Tarifs</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {flightTypes.map((flight: any) => (
            <div key={flight.id} className="bg-white/5 border border-white/10 p-6 rounded-[30px] flex items-center justify-between group">
              <span className="text-white font-black uppercase text-sm tracking-wide">{flight.name}</span>
              <div className="relative">
                <input 
                  type="number"
                  defaultValue={flight.price_cents / 100}
                  onBlur={(e) => updatePrice(flight.id, parseInt(e.target.value) * 100)}
                  className="bg-white/10 border-none rounded-xl p-3 w-24 font-black text-right text-white focus:ring-2 focus:ring-sky-500 outline-none"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 font-bold pointer-events-none">€</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}