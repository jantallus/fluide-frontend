"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- UTILITAIRES DE DATES ---
const getLocalYYYYMMDD = (d: Date) => {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'short' });
};

export default function ReserverPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<'Standard' | 'Hiver'>('Standard');

  // --- ÉTATS POUR LA GRILLE HEBDOMADAIRE ---
  const [startDate, setStartDate] = useState<string>(getLocalYYYYMMDD(new Date()));
  const [rawSlots, setRawSlots] = useState<any[]>([]);
  const [isSearchingTimes, setIsSearchingTimes] = useState(false);
  
  // Le Panier : { "2023-10-12|10:00": 2 } (2 places réservées à cette date/heure)
  const [cart, setCart] = useState<Record<string, number>>({});

  // 1. Détection saison et chargement des vols
  useEffect(() => {
    const currentMonth = new Date().getMonth(); 
    let defaultSeason: 'Standard' | 'Hiver' = (currentMonth >= 10 || currentMonth <= 3) ? 'Hiver' : 'Standard';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('saison')?.toLowerCase() === 'hiver') defaultSeason = 'Hiver';
      if (params.get('saison')?.toLowerCase() === 'ete') defaultSeason = 'Standard';
    }
    setActiveSeason(defaultSeason);

    const fetchFlights = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/flight-types`);
        if (res.ok) setFlights(await res.json());
      } catch (err) { console.error("Erreur vols", err); } 
      finally { setIsLoading(false); }
    };
    fetchFlights();
  }, []);

  // 2. Chargement de 7 jours de créneaux
  useEffect(() => {
    if (!startDate || !selectedFlight) return;

    const fetchWeekData = async () => {
      setIsSearchingTimes(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        // On prépare les 7 jours à chercher
        const daysToFetch = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return getLocalYYYYMMDD(d);
        });

        // On fait 7 appels simultanés au guichet public
        const promises = daysToFetch.map(d => fetch(`${apiUrl}/api/public/availabilities?date=${d}`).then(r => r.json()));
        const results = await Promise.all(promises);
        
        setRawSlots(results.flat());
      } catch (err) {
        console.error("Erreur dispos", err);
      } finally {
        setIsSearchingTimes(false);
      }
    };

    fetchWeekData();
  }, [startDate, selectedFlight]);

  // --- L'ALGORITHME MAGIQUE (Calcul dynamique des capacités) ---
  const gridData = useMemo(() => {
    if (!selectedFlight || rawSlots.length === 0) return {};

    const flightDur = selectedFlight.duration_minutes || 0;
    const allowedSlots = Array.isArray(selectedFlight.allowed_time_slots) ? selectedFlight.allowed_time_slots : [];
    
    // On devine la durée de base d'un petit créneau (ex: 15 min)
    let baseDur = 15;
    const sample = rawSlots[0];
    if (sample) {
      baseDur = Math.round((new Date(sample.end_time).getTime() - new Date(sample.start_time).getTime()) / 60000) || 15;
    }
    
    // De combien de cases de 15min a-t-on besoin pour ce vol ?
    const isMulti = selectedFlight.allow_multi_slots === true;
    const slotsNeeded = (isMulti && flightDur > baseDur) ? Math.ceil(flightDur / baseDur) : 1;

    // 1. Organiser le planning de chaque moniteur (Copie profonde pour simuler le panier)
    const monSchedules: Record<string, Record<number, any>> = {};
    rawSlots.forEach(s => {
      if (!monSchedules[s.monitor_id]) monSchedules[s.monitor_id] = {};
      const ms = new Date(s.start_time).getTime();
      monSchedules[s.monitor_id][ms] = { ...s }; // Copie du créneau
    });

    // 2. Appliquer les réservations du panier (Réduire la disponibilité)
    Object.entries(cart).forEach(([key, qty]) => {
      if (qty === 0) return;
      const [dStr, tStr] = key.split('|');
      const targetMs = new Date(`${dStr}T${tStr}:00`).getTime();

      let consumed = 0;
      for (const monId of Object.keys(monSchedules)) {
        if (consumed >= qty) break;

        // Ce moniteur a-t-il la place ?
        let canBook = true;
        for (let i = 0; i < slotsNeeded; i++) {
          const ms = targetMs + (i * baseDur * 60000);
          const slot = monSchedules[monId][ms];
          if (!slot || slot.status !== 'available') {
            canBook = false; break;
          }
        }

        // Si oui, on verrouille ses créneaux pour cette simulation
        if (canBook) {
          for (let i = 0; i < slotsNeeded; i++) {
            const ms = targetMs + (i * baseDur * 60000);
            monSchedules[monId][ms].status = 'booked_by_cart';
          }
          consumed++;
        }
      }
    });

    // 3. Compter les places restantes pour chaque heure
    const grid: Record<string, Record<string, number>> = {};
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return getLocalYYYYMMDD(d);
    });

    // Initialiser la grille
    weekDays.forEach(d => grid[d] = {});

    // Trouver toutes les heures uniques de la semaine
    const uniqueTimesByDate: Record<string, Set<string>> = {};
    rawSlots.forEach(s => {
      const dStr = s.start_time.split('T')[0];
      const dObj = new Date(s.start_time);
      const tStr = `${String(dObj.getHours()).padStart(2,'0')}:${String(dObj.getMinutes()).padStart(2,'0')}`;
      if (!uniqueTimesByDate[dStr]) uniqueTimesByDate[dStr] = new Set();
      uniqueTimesByDate[dStr].add(tStr);
    });

    // Calcul final
    weekDays.forEach(dateStr => {
      if (!uniqueTimesByDate[dateStr]) return;
      Array.from(uniqueTimesByDate[dateStr]).forEach(timeStr => {
        // Filtrage des heures interdites pour ce vol
        if (allowedSlots.length > 0 && !allowedSlots.includes(timeStr)) return;

        const targetMs = new Date(`${dateStr}T${timeStr}:00`).getTime();
        let capacity = 0;

        for (const monId of Object.keys(monSchedules)) {
          let isFree = true;
          for (let i = 0; i < slotsNeeded; i++) {
            const ms = targetMs + (i * baseDur * 60000);
            const slot = monSchedules[monId][ms];
            if (!slot || slot.status !== 'available') {
              isFree = false; break;
            }
          }
          if (isFree) capacity++;
        }
        
        // On n'enregistre que les heures où il y a (ou y avait) de la place
        if (capacity > 0 || cart[`${dateStr}|${timeStr}`] > 0) {
           grid[dateStr][timeStr] = capacity;
        }
      });
    });

    return grid;
  }, [rawSlots, selectedFlight, cart, startDate]);

  // --- ACTIONS DU PANIER ---
  const handleAdd = (date: string, time: string) => {
    const key = `${date}|${time}`;
    setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleRemove = (date: string, time: string) => {
    const key = `${date}|${time}`;
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[key] > 1) newCart[key]--;
      else delete newCart[key];
      return newCart;
    });
  };

  const totalItems = Object.values(cart).reduce((a, b) => a + b, 0);
  const totalPrice = totalItems * (selectedFlight?.price_cents ? selectedFlight.price_cents / 100 : 0);
  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return getLocalYYYYMMDD(d);
  });

  const filteredFlights = flights.filter(f => {
    const flightSeason = f.season || 'Standard';
    if (activeSeason === 'Hiver') return flightSeason.toLowerCase() === 'hiver';
    return flightSeason.toLowerCase() !== 'hiver'; 
  });

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      <header className="bg-white shadow-sm py-6 px-4 md:px-8 flex justify-between items-center sticky top-0 z-50">
        <div className="text-2xl font-black uppercase italic tracking-tighter text-slate-900 cursor-pointer">
          Fluide <span className="text-sky-500">Parapente</span>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-12">
        
        {/* ÉTAPE 1 : CHOIX DU VOL */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-10">
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight text-slate-900 mb-4">
                Réservez votre <span className="text-sky-500">Vol</span>
              </h1>
            </div>

            <div className="flex justify-center mb-12">
              <div className="bg-slate-200/50 p-1.5 rounded-2xl inline-flex shadow-inner">
                <button onClick={() => setActiveSeason('Standard')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Standard' ? 'bg-white text-amber-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>☀️ Vols d'Été</button>
                <button onClick={() => setActiveSeason('Hiver')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Hiver' ? 'bg-white text-sky-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>❄️ Vols d'Hiver</button>
              </div>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div></div>
            ) : filteredFlights.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[35px] shadow-xl"><span className="text-5xl block mb-4">🌬️</span><h3 className="text-xl font-black uppercase">Aucun vol disponible</h3></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFlights.map((flight) => (
                  <div key={flight.id} className="bg-white rounded-[35px] p-8 shadow-xl border-2 border-transparent hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group" onClick={() => { setSelectedFlight(flight); setStep(2); }}>
                    <div>
                      <h3 className="text-2xl font-black uppercase italic mb-3">{flight.name}</h3>
                      <div className="flex gap-3 text-sm font-bold text-slate-400 mb-6"><span className="bg-slate-50 px-3 py-1 rounded-lg">⏱️ {flight.duration_minutes} min</span></div>
                    </div>
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-4xl font-black text-slate-900">{flight.price_cents ? flight.price_cents / 100 : 0}€</div>
                      <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-sky-500 transition-colors">Choisir</button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : LA GRILLE DES JOURS */}
        {step === 2 && selectedFlight && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={() => { setStep(1); setCart({}); }} className="mb-8 text-slate-400 hover:text-sky-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              ← Retour aux vols
            </button>
            
            <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100">
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-tight">{selectedFlight.name}</h2>
                  <p className="text-sky-500 font-bold uppercase tracking-widest text-sm mt-1">Saisissez le nombre de places par créneau</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200">
                  <span className="text-xs font-black uppercase text-slate-400 ml-4">Semaine du</span>
                  <input 
                    type="date" 
                    className="font-bold bg-white border-none rounded-xl p-3 outline-none cursor-pointer shadow-sm"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>
              </div>

              {isSearchingTimes ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div></div>
              ) : (
                <div className="flex overflow-x-auto gap-4 pb-4 snap-x">
                  {weekDays.map(dateStr => {
                    const times = Object.keys(gridData[dateStr] || {}).sort();
                    
                    return (
                      <div key={dateStr} className="min-w-[220px] flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-4 snap-start">
                        <div className="text-center mb-6 pb-4 border-b border-slate-200">
                          <p className="font-black text-slate-900 capitalize text-lg leading-tight">{getDayName(dateStr)}</p>
                        </div>

                        <div className="flex flex-col gap-3">
                          {times.length === 0 ? (
                            <p className="text-center text-slate-400 text-xs font-bold uppercase py-10">Complet</p>
                          ) : (
                            times.map(timeStr => {
                              const capacity = gridData[dateStr][timeStr];
                              const qtyInCart = cart[`${dateStr}|${timeStr}`] || 0;
                              const isSelected = qtyInCart > 0;

                              return (
                                <div key={timeStr} className={`p-3 rounded-2xl border-2 transition-all ${isSelected ? 'bg-sky-50 border-sky-500 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-lg text-slate-900">{timeStr}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${capacity > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                                      {capacity} dispo
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                                    <button 
                                      onClick={() => handleRemove(dateStr, timeStr)}
                                      disabled={qtyInCart === 0}
                                      className={`w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center transition-all ${qtyInCart === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 shadow-sm hover:text-rose-500'}`}
                                    >-</button>
                                    
                                    <span className="font-black text-slate-900 text-lg w-8 text-center">{qtyInCart}</span>
                                    
                                    <button 
                                      onClick={() => handleAdd(dateStr, timeStr)}
                                      disabled={capacity === 0}
                                      className={`w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center transition-all ${capacity === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-sky-500 shadow-sm hover:bg-sky-500 hover:text-white'}`}
                                    >+</button>
                                  </div>
                                </div>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* --- LE PANIER FLOTTANT --- */}
      {totalItems > 0 && step === 2 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div>
              <span className="font-black text-slate-900 uppercase italic text-lg">
                {totalItems} place{totalItems > 1 ? 's' : ''} dans le panier
              </span>
            </div>
            
            <div className="flex items-center gap-6 w-full md:w-auto">
              <div className="text-right hidden md:block">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-sky-500">{totalPrice} €</p>
              </div>
              <button 
                onClick={() => setStep(3)}
                className="flex-1 md:flex-none bg-sky-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-slate-900 transition-colors shadow-lg shadow-sky-500/30"
              >
                Passer à l'inscription →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ÉTAPE 3 : FORMULAIRE PASSAGER */}
      {step === 3 && (
         <div className="animate-in fade-in slide-in-from-right-8 duration-500 text-center py-20">
           <span className="text-7xl mb-6 block">📝</span>
           <h2 className="text-3xl font-black uppercase italic mb-6">Détails des <span className="text-sky-500">Passagers</span></h2>
           <p className="text-slate-500 font-medium">Formulaire pour vos {totalItems} places réservées.</p>
           <button onClick={() => setStep(2)} className="mt-8 text-sky-500 font-bold uppercase text-xs tracking-widest">← Retour à l'agenda</button>
         </div>
      )}

    </div>
  );
}