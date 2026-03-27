"use client";
import React, { useState, useEffect, useMemo } from 'react';

// --- UTILITAIRES ---
const getLocalYYYYMMDD = (d: Date) => {
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
};

const getDayName = (dateStr: string) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
};

// --- FONCTION TEXTE COMMERCIAL ---
const getMarketingInfo = (flightName: string) => {
  if (!flightName) return '🪂 Vol sensationnel';
  const name = flightName.toLowerCase();
  if (name.includes('loupiot')) return '⏱️ 8 min de vol';
  if (name.includes('découverte') || name.includes('decouverte')) return '⏱️ 15 min de vol';
  if (name.includes('ascendance')) return '⏱️ 30 min de vol';
  if (name.includes('prestige')) return '⏱️ 1h de vol';
  if (name.includes('beauregard')) return '⛰️ 500m de dénivelé';
  if (name.includes('loup')) return '⛰️ 800m de dénivelé';
  if (name.includes('aiguille')) return '⛰️ 1200m de dénivelé';
  return '🪂 Vol inoubliable';
};

export default function ReserverPage() {
  const [flights, setFlights] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [activeSeason, setActiveSeason] = useState<'Standard' | 'Hiver'>('Standard');

  // --- ÉTATS GRILLE ET PANIER ---
  const [startDate, setStartDate] = useState<string>(getLocalYYYYMMDD(new Date()));
  const [rawSlots, setRawSlots] = useState<any[]>([]);
  const [isSearchingTimes, setIsSearchingTimes] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});

  // --- ÉTATS FORMULAIRE ---
  const [contact, setContact] = useState({ firstName: '', lastName: '', phone: '', email: '', isPassenger: false });
  const [passengers, setPassengers] = useState<any[]>([]);

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

  useEffect(() => {
    if (!startDate || !selectedFlight) return;
    const fetchWeekData = async () => {
      setIsSearchingTimes(true);
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const daysToFetch = Array.from({ length: 7 }).map((_, i) => {
          const d = new Date(startDate);
          d.setDate(d.getDate() + i);
          return getLocalYYYYMMDD(d);
        });
        const promises = daysToFetch.map(d => fetch(`${apiUrl}/api/public/availabilities?date=${d}`).then(r => r.json()));
        const results = await Promise.all(promises);
        setRawSlots(results.flat());
      } catch (err) { console.error("Erreur dispos", err); } 
      finally { setIsSearchingTimes(false); }
    };
    fetchWeekData();
  }, [startDate, selectedFlight]);

  // Synchronisation du panier vers les fiches passagers
  useEffect(() => {
    if (step === 3) {
      const newPassengers: any[] = [];
      Object.entries(cart).forEach(([key, qty]) => {
        const [fId, dStr, tStr] = key.split('|');
        const flight = flights.find(f => f.id.toString() === fId);
        const isLoupiot = flight?.name?.toLowerCase().includes('loupiot');
        for (let i = 0; i < qty; i++) {
          newPassengers.push({
            id: `${key}-${i}`,
            flightKey: key, // Clé secrète pour retrouver le vol dans le panier
            flightId: fId,
            flightName: flight?.name || 'Vol',
            date: dStr,
            time: tStr,
            firstName: '',
            weightChecked: false,
            isLoupiot: isLoupiot
          });
        }
      });
      setPassengers(prev => newPassengers.map((nP, index) => {
        const existing = prev[index];
        if (existing && existing.flightId === nP.flightId) return { ...nP, firstName: existing.firstName, weightChecked: existing.weightChecked };
        return nP;
      }));
    }
  }, [step, cart, flights]);

  // Si on coche "Je suis l'un des passagers"
  useEffect(() => {
    if (contact.isPassenger && passengers.length > 0 && contact.firstName) {
      setPassengers(prev => {
        const newP = [...prev];
        if (!newP[0].firstName) newP[0].firstName = contact.firstName;
        return newP;
      });
    }
  }, [contact.isPassenger, contact.firstName]);

  const gridData = useMemo(() => {
    if (!selectedFlight || rawSlots.length === 0) return {};

    const flightDur = selectedFlight.duration_minutes || 0;
    const allowedSlots = Array.isArray(selectedFlight.allowed_time_slots) ? selectedFlight.allowed_time_slots : [];
    
    let baseDur = 15;
    const sample = rawSlots[0];
    if (sample) baseDur = Math.round((new Date(sample.end_time).getTime() - new Date(sample.start_time).getTime()) / 60000) || 15;
    
    const isMulti = selectedFlight.allow_multi_slots === true;
    const slotsNeeded = (isMulti && flightDur > baseDur) ? Math.ceil(flightDur / baseDur) : 1;

    const monSchedules: Record<string, Record<number, any>> = {};
    rawSlots.forEach(s => {
      if (!monSchedules[s.monitor_id]) monSchedules[s.monitor_id] = {};
      const ms = new Date(s.start_time).getTime();
      monSchedules[s.monitor_id][ms] = { ...s }; 
    });

    Object.entries(cart).forEach(([key, qty]) => {
      if (qty === 0) return;
      const [fId, dStr, tStr] = key.split('|');
      const flightInCart = flights.find(f => f.id.toString() === fId);
      if (!flightInCart) return;

      const fDurCart = flightInCart.duration_minutes || 0;
      const isMultiCart = flightInCart.allow_multi_slots === true;
      const sNeededCart = (isMultiCart && fDurCart > baseDur) ? Math.ceil(fDurCart / baseDur) : 1;
      const targetMs = new Date(`${dStr}T${tStr}:00`).getTime();

      let consumed = 0;
      for (const monId of Object.keys(monSchedules)) {
        if (consumed >= qty) break;
        let canBook = true;
        for (let i = 0; i < sNeededCart; i++) {
          const ms = targetMs + (i * baseDur * 60000);
          const slot = monSchedules[monId][ms];
          if (!slot || slot.status !== 'available') { canBook = false; break; }
        }
        if (canBook) {
          for (let i = 0; i < sNeededCart; i++) {
            const ms = targetMs + (i * baseDur * 60000);
            monSchedules[monId][ms].status = 'booked_by_cart';
          }
          consumed++;
        }
      }
    });

    const grid: Record<string, Record<string, number>> = {};
    const weekDays = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date(startDate);
      d.setDate(d.getDate() + i);
      return getLocalYYYYMMDD(d);
    });
    weekDays.forEach(d => grid[d] = {});

    const uniqueTimesByDate: Record<string, Set<string>> = {};
    rawSlots.forEach(s => {
      const dStr = s.start_time.split('T')[0];
      const dObj = new Date(s.start_time);
      const tStr = `${String(dObj.getHours()).padStart(2,'0')}:${String(dObj.getMinutes()).padStart(2,'0')}`;
      if (!uniqueTimesByDate[dStr]) uniqueTimesByDate[dStr] = new Set();
      uniqueTimesByDate[dStr].add(tStr);
    });

    weekDays.forEach(dateStr => {
      if (!uniqueTimesByDate[dateStr]) return;
      Array.from(uniqueTimesByDate[dateStr]).forEach(timeStr => {
        if (allowedSlots.length > 0 && !allowedSlots.includes(timeStr)) return;
        const targetMs = new Date(`${dateStr}T${timeStr}:00`).getTime();
        let capacity = 0;
        for (const monId of Object.keys(monSchedules)) {
          let isFree = true;
          for (let i = 0; i < slotsNeeded; i++) {
            const ms = targetMs + (i * baseDur * 60000);
            const slot = monSchedules[monId][ms];
            if (!slot || slot.status !== 'available') { isFree = false; break; }
          }
          if (isFree) capacity++;
        }
        const currentFlightKey = `${selectedFlight.id}|${dateStr}|${timeStr}`;
        if (capacity > 0 || (cart[currentFlightKey] || 0) > 0) {
           grid[dateStr][timeStr] = capacity;
        }
      });
    });

    return grid;
  }, [rawSlots, selectedFlight, cart, startDate, flights]);

  // --- ACTIONS DU PANIER ---
  const handleAdd = (date: string, time: string) => {
    const key = `${selectedFlight.id}|${date}|${time}`;
    setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };
  const handleRemove = (date: string, time: string) => {
    const key = `${selectedFlight.id}|${date}|${time}`;
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[key] > 1) newCart[key]--; else delete newCart[key];
      return newCart;
    });
  };

  // --- NOUVEAU : RETIRER UN PASSAGER DEPUIS LE FORMULAIRE ---
  const handleRemovePassenger = (indexToRemove: number, flightKey: string) => {
    // 1. On l'enlève de la liste visuelle pour éviter que le prénom de la personne suivante ne glisse
    setPassengers(prev => prev.filter((_, i) => i !== indexToRemove));
    
    // 2. On retire une place du panier
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[flightKey] > 1) newCart[flightKey]--; 
      else delete newCart[flightKey];
      return newCart;
    });
  };

  let totalItems = 0;
  let totalPrice = 0;
  Object.entries(cart).forEach(([key, qty]) => {
    totalItems += qty;
    const [fId] = key.split('|');
    const f = flights.find(fl => fl.id.toString() === fId);
    if (f && f.price_cents) totalPrice += (f.price_cents / 100) * qty;
  });

  // Sécurité anti-panier vide
  useEffect(() => {
    if (step === 3 && totalItems === 0) {
      setStep(1); // Retour au catalogue si on supprime tout le monde
    }
  }, [totalItems, step]);

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

  const isFormValid = contact.firstName && contact.lastName && contact.phone && contact.email && 
                      passengers.length > 0 && passengers.every(p => p.firstName && p.weightChecked);

  const handleSubmit = () => {
    if (!isFormValid) return;
    alert("🚀 Bientôt : Envoi au serveur avec Stripe et enregistrement sur votre planning !");
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-32">
      
      {/* BANDEAU UNI POUR PROTÉGER LE CONTENU DU MENU DU SITE PRINCIPAL */}
      <div className="h-20 bg-slate-900 w-full shadow-md sticky top-0 z-40"></div>

      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
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
                      <div className="flex gap-3 text-sm font-bold text-slate-400 mb-6">
                        <span className="bg-slate-50 px-3 py-1 rounded-lg">
                          {getMarketingInfo(flight.name)}
                        </span>
                      </div>
                    </div>
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-4xl font-black text-slate-900">{flight.price_cents ? flight.price_cents / 100 : 0}€</div>
                      <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-sky-500 transition-colors">Choisir ce vol</button>
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
            <button onClick={() => setStep(1)} className="mb-8 text-slate-400 hover:text-sky-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              ← Ajouter un autre type de vol
            </button>
            
            <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100">
              
              <div className="flex flex-col md:flex-row justify-between items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-tight">Réservation : {selectedFlight.name}</h2>
                  <p className="text-sky-500 font-bold uppercase tracking-widest text-sm mt-1">{getMarketingInfo(selectedFlight.name)}</p>
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
                              const currentFlightKey = `${selectedFlight.id}|${dateStr}|${timeStr}`;
                              const qtyInCart = cart[currentFlightKey] || 0;
                              const isSelected = qtyInCart > 0;

                              return (
                                <div key={timeStr} className={`p-3 rounded-2xl border-2 transition-all ${isSelected ? 'bg-sky-50 border-sky-500 shadow-md' : 'bg-white border-slate-200 hover:border-sky-300'}`}>
                                  <div className="flex justify-between items-center mb-2">
                                    <span className="font-black text-lg text-slate-900">{timeStr}</span>
                                    <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md ${capacity > 0 ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-500'}`}>
                                      {capacity} biplace{capacity > 1 ? 's' : ''}
                                    </span>
                                  </div>
                                  
                                  <div className="flex items-center justify-between bg-slate-100 rounded-xl p-1">
                                    <button onClick={() => handleRemove(dateStr, timeStr)} disabled={qtyInCart === 0} className={`w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center transition-all ${qtyInCart === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-slate-700 shadow-sm hover:text-rose-500'}`}>-</button>
                                    <span className="font-black text-slate-900 text-lg w-8 text-center">{qtyInCart}</span>
                                    <button onClick={() => handleAdd(dateStr, timeStr)} disabled={capacity === 0} className={`w-8 h-8 rounded-lg font-black text-lg flex items-center justify-center transition-all ${capacity === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white text-sky-500 shadow-sm hover:bg-sky-500 hover:text-white'}`}>+</button>
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

        {/* ÉTAPE 3 : FORMULAIRE PASSAGER */}
        {step === 3 && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto">
            <button onClick={() => setStep(2)} className="mb-8 text-slate-400 hover:text-sky-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              ← Modifier le panier
            </button>

            <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-100">
              
              <div className="text-center mb-10 pb-10 border-b border-slate-100">
                <span className="text-6xl mb-6 block animate-bounce">📝</span>
                <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-tight">Détails des passagers</h2>
                <p className="text-slate-500 font-medium mt-2">Dernière étape avant de voler !</p>
              </div>

              {/* SECTION 1 : CONTACT */}
              <div className="mb-12">
                <h3 className="font-black text-xl text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Personne à contacter
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none" placeholder="Jean" value={contact.firstName} onChange={e => setContact({...contact, firstName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none" placeholder="Dupont" value={contact.lastName} onChange={e => setContact({...contact, lastName: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Téléphone (le jour du vol)</label>
                    <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none" placeholder="06 12 34 56 78" value={contact.phone} onChange={e => setContact({...contact, phone: e.target.value})} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none" placeholder="jean@email.com" value={contact.email} onChange={e => setContact({...contact, email: e.target.value})} />
                  </div>
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-sky-50 p-4 rounded-2xl border border-sky-100 hover:border-sky-300 transition-colors">
                  <input type="checkbox" className="w-5 h-5 accent-sky-500" checked={contact.isPassenger} onChange={e => setContact({...contact, isPassenger: e.target.checked})} />
                  <span className="font-bold text-sky-900 text-sm">Je suis aussi l'un des passagers (m'ajouter au vol)</span>
                </label>
              </div>

              {/* SECTION 2 : PASSAGERS */}
              <div>
                <h3 className="font-black text-xl text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Les Passagers
                </h3>

                <div className="space-y-6">
                  {passengers.map((p, index) => (
                    <div key={p.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full bg-sky-500"></div>
                      
                      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4">
                        <div className="flex items-center gap-3">
                          <h4 className="font-black text-lg text-slate-900">Passager {index + 1}</h4>
                          <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                            {p.flightName} • {getDayName(p.date)} à {p.time}
                          </span>
                        </div>
                        
                        {/* LA PETITE CROIX POUR SUPPRIMER LE PASSAGER */}
                        <button 
                          onClick={() => handleRemovePassenger(index, p.flightKey)}
                          className="flex items-center gap-2 bg-rose-50 text-rose-500 hover:bg-rose-500 hover:text-white px-3 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-colors"
                          title="Annuler cette place"
                        >
                          ❌ <span className="hidden md:inline">Retirer</span>
                        </button>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom de la personne qui vole</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none" 
                          placeholder="Prénom du passager" 
                          value={p.firstName}
                          onChange={e => {
                            const newP = [...passengers];
                            newP[index].firstName = e.target.value;
                            setPassengers(newP);
                          }}
                        />
                      </div>

                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors ${p.weightChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
                        <input 
                          type="checkbox" 
                          className={`w-6 h-6 mt-0.5 ${p.weightChecked ? 'accent-emerald-500' : 'accent-rose-500'}`} 
                          checked={p.weightChecked}
                          onChange={e => {
                            const newP = [...passengers];
                            newP[index].weightChecked = e.target.checked;
                            setPassengers(newP);
                          }}
                        />
                        <div>
                          <span className={`font-bold block ${p.weightChecked ? 'text-emerald-900' : 'text-rose-900'}`}>
                            {p.isLoupiot ? 'Je certifie peser entre 20 et 60 kg' : 'Je certifie peser entre 20 et 110 kg'} *
                          </span>
                          <span className={`text-xs ${p.weightChecked ? 'text-emerald-600' : 'text-rose-500'}`}>
                            Information obligatoire pour des raisons de sécurité.
                          </span>
                        </div>
                      </label>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>
        )}

      </main>

      {/* --- LE PANIER FLOTTANT --- */}
      {totalItems > 0 && (step === 1 || step === 2 || step === 3) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="hidden md:block">
              <span className="font-black text-slate-900 uppercase italic text-lg">
                {totalItems} vol{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
              </span>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-sky-500">{totalPrice} €</p>
              </div>
              
              {step === 3 ? (
                 <button 
                  onClick={handleSubmit}
                  disabled={!isFormValid}
                  className={`flex-1 md:flex-none px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all shadow-lg ${isFormValid ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-1 shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  Confirmer la réservation
                </button>
              ) : (
                <button 
                  onClick={() => setStep(3)}
                  className="flex-1 md:flex-none bg-sky-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-sky-500/30"
                >
                  Passer à l'inscription →
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}