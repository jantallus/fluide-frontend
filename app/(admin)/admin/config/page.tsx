"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(65); 
  const [isPause, setIsPause] = useState(false);

  const [openHour, setOpenHour] = useState("09:25");
  const [closeHour, setCloseHour] = useState("16:35");

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
        setSlotDefs(data.sort((a: any, b: any) => a.start_time.localeCompare(b.start_time)));
      }
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
  const init = async () => {
    setLoading(true);
    await loadSlotDefs(); // Charge la structure logistique 
    await loadConfig();   // Charge les bornes et tarifs
    setLoading(false);
  };
  init();
}, []);

  const loadConfig = async () => {
    try {
      const resVols = await apiFetch('/api/admin/flight-types');
      if (resVols.ok) setFlightTypes(await resVols.json());
      // On peut aussi charger openHour/closeHour depuis une table de config si nécessaire
    } catch (err) { console.error(err); }
  };

  const addSlotDef = async () => {
    if (!newStartTime) return alert("Choisis une heure");
    const label = isPause ? "PAUSE" : "LOGISTIQUE + VOL";
    
    try {
      const res = await apiFetch('/api/admin/config/slots-definitions', {
        method: 'POST',
        body: JSON.stringify({ start_time: newStartTime, duration_minutes: newDuration, label }),
      });
      if (res.ok) {
        setNewStartTime("");
        await loadSlotDefs();
      }
    } catch (err) { console.error(err); }
  };

  const deleteSlotDef = async (id: number) => {
    if (!confirm("Supprimer ?")) return;
    try {
      const res = await apiFetch(`/api/admin/config/slots-definitions/${id}`, { method: 'DELETE' });
      if (res.ok) await loadSlotDefs();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 p-4 text-slate-800">
      <h1 className="text-4xl font-black text-slate-900 italic uppercase">Configuration Logistique</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-8 rounded-[40px] shadow-sm border border-slate-200 flex flex-col h-[650px]">
          <h2 className="text-sm font-black italic uppercase mb-6 text-slate-400">Structure de la Journée</h2>
          <div className="space-y-3 flex-1 overflow-y-auto mb-6 pr-2 scrollbar-hide">
            {slotDefs.length > 0 ? slotDefs.map((def: any) => (
              <div key={def.id} className="flex items-center gap-4 p-5 rounded-3xl bg-slate-50 border border-slate-100 group">
                <div className="flex flex-col">
                  <span className="text-slate-900 font-bold">{def.start_time.slice(0,5)} — {getEndTime(def.start_time, def.duration_minutes)}</span>
                  <span className="text-[10px] uppercase text-slate-400 font-black">{def.label} ({def.duration_minutes} min)</span>
                </div>
                <button onClick={() => deleteSlotDef(def.id)} className="ml-auto opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-3 py-1 rounded-full text-[9px] uppercase font-black transition-all">Supprimer</button>
              </div>
            )) : <p className="text-center py-10 text-slate-400 font-bold italic">Aucune structure définie</p>}
          </div>

          <div className="bg-slate-900 p-8 rounded-[35px] space-y-5">
            <div className="flex justify-between items-center">
              <button onClick={() => setIsPause(!isPause)} className={`text-[9px] font-black px-4 py-2 rounded-xl transition-all border ${isPause ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 border-white/20 text-white/60 hover:text-white'}`}>
                {isPause ? 'MODE PAUSE ☕' : 'MODE VOL 🪂'}
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black text-sm outline-none" />
              <input type="number" value={newDuration} onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black text-sm outline-none" />
            </div>
            <button onClick={addSlotDef} className="w-full font-black py-4 rounded-2xl text-[11px] uppercase tracking-widest bg-sky-500 text-white hover:bg-white hover:text-sky-600 transition-all">Ajouter à la structure</button>
          </div>
        </div>
      </div>
    </div>
  );
}