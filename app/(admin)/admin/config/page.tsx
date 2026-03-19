"use client";
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ConfigPage() {
  const [slotDefs, setSlotDefs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newStartTime, setNewStartTime] = useState("");
  const [newDuration, setNewDuration] = useState(65); 
  const [isPause, setIsPause] = useState(false);

  // --- FONCTION MANQUANTE : Calcule l'heure de fin ---
  const getEndTime = (start: string, duration: number) => {
    if (!start) return "";
    const [h, m] = start.split(':').map(Number);
    const totalMin = h * 60 + m + duration;
    const endH = Math.floor(totalMin / 60).toString().padStart(2, '0');
    const endM = (totalMin % 60).toString().padStart(2, '0');
    return `${endH}:${endM}`;
  };

  // Conversion en minutes pour les calculs de collision
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

  useEffect(() => {
    loadSlotDefs().then(() => setLoading(false));
  }, []);

  const addSlotDef = async () => {
    if (!newStartTime) return alert("Choisis une heure de début");

    const startMin = toMin(newStartTime);
    const endMin = startMin + newDuration;

    // --- SÉCURITÉ COLLISION (14:25 autorisé) ---
    const hasOverlap = slotDefs.some((def: any) => {
      const defStart = toMin(def.start_time);
      const defEnd = defStart + def.duration_minutes;
      // On utilise < au lieu de <= pour permettre au créneau suivant de démarrer pile à la fin du précédent
      return (startMin < defEnd && endMin > defStart);
    });

    if (hasOverlap) {
      alert("⚠️ Collision : Cet espace est déjà occupé.");
      return;
    }

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
  };

  const deleteSlotDef = async (id: number) => {
    if (!confirm("Supprimer cette structure ?")) return;
    const res = await apiFetch(`/api/admin/config/slots-definitions/${id}`, { method: 'DELETE' });
    if (res.ok) await loadSlotDefs();
  };

  if (loading) return <div className="p-10 text-center font-black animate-pulse text-slate-300 uppercase tracking-widest">Chargement...</div>;

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20 p-8">
      {/* Header */}
      <div className="flex justify-between items-end border-b-4 border-slate-900 pb-6">
        <div>
          <h1 className="text-4xl font-black text-slate-900 italic uppercase leading-none">Configuration</h1>
          <p className="text-slate-400 font-bold uppercase text-[10px] tracking-[0.2em] mt-2">Logistique & Créneaux</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-12">
        {/* Liste des créneaux */}
        <div className="space-y-4">
          <h2 className="text-xl font-black uppercase italic text-slate-900">Structures actives</h2>
          {slotDefs.length > 0 ? slotDefs.map((def) => (
            <div key={def.id} className={`flex items-center gap-4 p-5 rounded-3xl border transition-all group ${def.label === 'PAUSE' ? 'bg-rose-50 border-rose-100' : 'bg-slate-50 border-slate-100'}`}>
              <div className="flex flex-col">
                <span className="text-slate-900 font-bold text-lg">
                  {def.start_time.slice(0,5)} — {getEndTime(def.start_time, def.duration_minutes)}
                </span>
                <span className="text-[10px] uppercase text-slate-400 font-black tracking-widest">{def.label}</span>
              </div>
              <button 
                onClick={() => deleteSlotDef(def.id)} 
                className="ml-auto opacity-0 group-hover:opacity-100 bg-rose-500 text-white px-4 py-2 rounded-2xl text-[10px] uppercase font-black transition-all hover:scale-110"
              >
                Supprimer
              </button>
            </div>
          )) : <p className="text-slate-400 font-bold italic py-10 text-center border-2 border-dashed border-slate-100 rounded-[35px]">Aucune structure définie</p>}
        </div>

        {/* Formulaire d'ajout */}
        <div className="bg-slate-900 p-8 rounded-[40px] space-y-6 shadow-2xl sticky top-8">
          <div className="flex justify-between items-center">
            <h3 className="text-white font-black uppercase italic text-sm">Ajouter un bloc</h3>
            <button 
              onClick={() => setIsPause(!isPause)} 
              className={`text-[10px] font-black px-4 py-2 rounded-xl border transition-all ${isPause ? 'bg-rose-500 border-rose-400 text-white' : 'bg-white/10 border-white/20 text-white/60'}`}
            >
              {isPause ? 'MODE PAUSE ☕' : 'MODE VOL 🪂'}
            </button>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase ml-2">Début</label>
              <input type="time" value={newStartTime} onChange={(e) => setNewStartTime(e.target.value)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
            <div className="space-y-2">
              <label className="text-[9px] font-black text-white/40 uppercase ml-2">Durée (min)</label>
              <input type="number" value={newDuration} onChange={(e) => setNewDuration(parseInt(e.target.value) || 0)} className="w-full bg-white/10 border-none rounded-2xl p-4 text-white font-black outline-none focus:ring-2 focus:ring-sky-500" />
            </div>
          </div>

          <button onClick={addSlotDef} className="w-full bg-sky-500 hover:bg-sky-400 text-white py-5 rounded-3xl font-black uppercase italic transition-all shadow-xl active:scale-95">
            Enregistrer la structure
          </button>
        </div>
      </div>
    </div>
  );
}