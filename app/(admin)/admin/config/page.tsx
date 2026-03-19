"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]); // Ajouté pour les tarifs
  const [loading, setLoading] = useState(true);
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(65); 
  const [isPause, setIsPause] = useState(false);

  // Conversion en minutes pour comparer les collisions
  const toMin = (time: string) => {
    const [h, m] = time.split(':').map(Number);
    return h * 60 + m;
  };

  const loadSlotDefs = async () => {
    try {
      const res = await apiFetch('/api/admin/config/slots-definitions');
      if (res.ok) {
        const data = await res.json();
        setSlotDefs(data.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)));
      }
    } catch (err) { console.error(err); }
  };

  // Chargement initial
  useEffect(() => {
    const init = async () => {
      await loadSlotDefs();
      const resVols = await apiFetch('/api/vols'); // On appelle la nouvelle route
      if (resVols.ok) setFlightTypes(await resVols.json());
      setLoading(false);
    };
    init();
  }, []);

  const addSlotDef = async () => {
    if (!newStartTime) return alert("Choisis une heure");
    
    const startMin = toMin(newStartTime);
    const endMin = startMin + newDuration;

    // --- SÉCURITÉ ANTI-COLLISION ---
    const hasOverlap = slotDefs.some((def: any) => {
      const defStart = toMin(def.start_time);
      const defEnd = defStart + def.duration_minutes;
      // Autorise si l'heure de début est ÉGALE à l'heure de fin du précédent (14:25)
      return (startMin < defEnd && endMin > defStart);
    });

    if (hasOverlap) return alert("⚠️ Collision : Ce créneau chevauche une structure existante.");

    const label = isPause ? "PAUSE" : "LOGISTIQUE + VOL";
    const res = await apiFetch('/api/admin/config/slots-definitions', {
      method: 'POST',
      body: JSON.stringify({ start_time: newStartTime, duration_minutes: newDuration, label }),
    });
    if (res.ok) { setNewStartTime(""); await loadSlotDefs(); }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300 uppercase italic">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 p-8 font-sans">
      <h1 className="text-4xl font-black text-slate-900 italic uppercase tracking-tighter">Structure Logistique</h1>

      <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200">
        <div className="space-y-3 mb-8">
          {slotDefs.length > 0 ? slotDefs.map((def: any) => (
            <div key={def.id} className={`flex items-center gap-4 p-5 rounded-3xl border ${def.label === 'PAUSE' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'} group`}>
              <div className="flex flex-col">
                <span className="text-slate-900 font-bold">{def.start_time.slice(0,5)} — {getEndTime(def.start_time, def.duration_minutes)}</span>
                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">{def.label}</span>
              </div>
              <button onClick={() => deleteSlotDef(def.id)} className="ml-auto opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] uppercase font-black">Supprimer</button>
            </div>
          )) : <p className="text-slate-400 font-bold italic text-center py-10 uppercase tracking-widest text-xs">Aucune structure définie</p>}
        </div>

        <div className="bg-slate-900 p-8 rounded-[35px] space-y-5 shadow-2xl">
          <div className="flex justify-between items-center">
            <button onClick={() => setIsPause(!isPause)} className={`text-[9px] font-black px-4 py-2 rounded-xl border transition-all ${isPause ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 border-white/20 text-white/60'}`}>
              {isPause ? 'MODE PAUSE ☕' : 'MODE VOL 🪂'}
            </button>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-sky-500" />
            <input type="number" value={newDuration} onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-sky-500" />
          </div>
          <button onClick={addSlotDef} className="w-full font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest bg-sky-500 text-white shadow-xl hover:bg-white hover:text-sky-600 transition-all">Ajouter à la structure</button>
        </div>
      </div>
    </div>
  );
}