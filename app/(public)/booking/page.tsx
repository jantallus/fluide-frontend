"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';

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
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const [flights, setFlights] = useState<any[]>([]);
  const [complementsList, setComplementsList] = useState<any[]>([]);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [isLoading, setIsLoading] = useState(true);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [activeSeason, setActiveSeason] = useState<'Standard' | 'Hiver'>('Standard');

  const [startDate, setStartDate] = useState<string>(getLocalYYYYMMDD(new Date()));
  const [rawSlots, setRawSlots] = useState<any[]>([]);
  const [isSearchingTimes, setIsSearchingTimes] = useState(false);
  const [cart, setCart] = useState<Record<string, number>>({});
// --- GESTION DES CODES PROMO / BONS CADEAUX ---
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [contact, setContact] = useState({ firstName: '', lastName: '', phone: '', email: '', isPassenger: false, notes: '' });
  const [passengers, setPassengers] = useState<any[]>([]);

  useEffect(() => {
    // 🚨 SÉLECTION AUTOMATIQUE DU PLAN SELON LA SAISON (Plan du jour ou saison à venir)
    const currentMonth = new Date().getMonth(); 
    // De Octobre (9) à Avril (3), on affiche l'Hiver par défaut. Sinon, l'Été.
    let defaultSeason: 'Standard' | 'Hiver' = (currentMonth >= 9 || currentMonth <= 3) ? 'Hiver' : 'Standard';

    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('saison')?.toLowerCase() === 'hiver') defaultSeason = 'Hiver';
      if (params.get('saison')?.toLowerCase() === 'ete') defaultSeason = 'Standard';
    }
    setActiveSeason(defaultSeason);

    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        
        const [resFlights, resComplements] = await Promise.all([
          fetch(`${apiUrl}/api/flight-types?t=${Date.now()}`, { cache: 'no-store' }),
          fetch(`${apiUrl}/api/complements?t=${Date.now()}`, { cache: 'no-store' })
        ]);

        if (resFlights.ok) setFlights(await resFlights.json());
        if (resComplements.ok) setComplementsList(await resComplements.json());

      } catch (err) { 
        console.error("Erreur chargement données", err); 
      } finally { 
        setIsLoading(false); 
      }
    };
    fetchData();
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
        
        const promises = daysToFetch.map(d => 
          fetch(`${apiUrl}/api/public/availabilities?date=${d}&t=${Date.now()}`, { cache: 'no-store' }).then(r => r.json())
        );
        const results = await Promise.all(promises);
        setRawSlots(results.flat());
      } catch (err) { console.error("Erreur dispos", err); } 
      finally { setIsSearchingTimes(false); }
    };
    fetchWeekData();
  }, [startDate, selectedFlight]);

  useEffect(() => {
    if (step === 3) {
      const newPassengers: any[] = [];
      Object.entries(cart).forEach(([key, qty]) => {
        const [fId, dStr, tStr] = key.split('|');
        const flight = flights.find(f => f.id.toString() === fId);
        
        for (let i = 0; i < qty; i++) {
          newPassengers.push({
            id: `${key}-${i}`,
            flightKey: key, 
            flightId: fId,
            flightName: flight?.name || 'Vol',
            date: dStr,
            time: tStr,
            firstName: '',
            weightChecked: false,
            selectedComplements: [], 
            weight_min: flight?.weight_min !== undefined ? flight.weight_min : 20,
            weight_max: flight?.weight_max !== undefined ? flight.weight_max : 110,
          });
        }
      });
      setPassengers(prev => newPassengers.map((nP) => {
        const existing = prev.find(p => p.id === nP.id);
        if (existing) return { 
          ...nP, 
          firstName: existing.firstName, 
          weightChecked: existing.weightChecked, 
          selectedComplements: existing.selectedComplements || []
        };
        return nP;
      }));
    }
  }, [step, cart, flights]);

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

    const delayHours = selectedFlight.booking_delay_hours || 0;
    const now = new Date();
    const cutoffMs = now.getTime() + (delayHours * 60 * 60 * 1000);

    const flightDur = selectedFlight.duration_minutes || 0;
    const allowedSlots = Array.isArray(selectedFlight.allowed_time_slots) ? selectedFlight.allowed_time_slots : [];
    
    let baseDur = 15;
    const sample = rawSlots[0];
    if (sample) baseDur = Math.round((new Date(sample.end_time).getTime() - new Date(sample.start_time).getTime()) / 60000) || 15;
    
    const isMulti = selectedFlight.allow_multi_slots === true;
    const slotsNeeded = (isMulti && flightDur > baseDur) ? Math.ceil(flightDur / baseDur) : 1;

    const monSchedules: Record<string, Record<number, any>> = {};
    const timeToMs: Record<string, number> = {};
    const uniqueTimesByDate: Record<string, Set<string>> = {};

    rawSlots.forEach(s => {
      const dObj = new Date(s.start_time);
      const ms = dObj.getTime(); 
      
      if (!monSchedules[s.monitor_id]) monSchedules[s.monitor_id] = {};
      monSchedules[s.monitor_id][ms] = { ...s }; 

      const dStr = dObj.toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
      const tStr = dObj.toLocaleTimeString('en-GB', { timeZone: 'Europe/Paris', hour: '2-digit', minute: '2-digit', hour12: false }); 
      
      if (!uniqueTimesByDate[dStr]) uniqueTimesByDate[dStr] = new Set();
      uniqueTimesByDate[dStr].add(tStr);

      timeToMs[`${dStr}|${tStr}`] = ms; 
    });

    Object.entries(cart).forEach(([key, qty]) => {
      if (qty === 0) return;
      const [fId, dStr, tStr] = key.split('|');
      const flightInCart = flights.find(f => f.id.toString() === fId);
      if (!flightInCart) return;

      const fDurCart = flightInCart.duration_minutes || 0;
      const isMultiCart = flightInCart.allow_multi_slots === true;
      const sNeededCart = (isMultiCart && fDurCart > baseDur) ? Math.ceil(fDurCart / baseDur) : 1;
      
      const targetMs = timeToMs[`${dStr}|${tStr}`];
      if (!targetMs) return;

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

    weekDays.forEach(dateStr => {
      if (!uniqueTimesByDate[dateStr]) return;
      Array.from(uniqueTimesByDate[dateStr]).forEach(timeStr => {
        // La versatilité à l'œuvre : le calendrier vérifie que l'heure générée est compatible avec le vol !
        if (allowedSlots.length > 0 && !allowedSlots.includes(timeStr)) return;
        
        const targetMs = timeToMs[`${dateStr}|${timeStr}`];
        if (!targetMs) return;

        if (targetMs <= cutoffMs) return;

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

  const handleDecrementCart = (key: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      if (newCart[key] > 1) newCart[key]--;
      else delete newCart[key];
      return newCart;
    });
  };

  const handleDeleteCartItem = (key: string) => {
    setCart(prev => {
      const newCart = { ...prev };
      delete newCart[key];
      return newCart;
    });
  };

  const handleRemovePassenger = (indexToRemove: number, flightKey: string) => {
    setPassengers(prev => prev.filter((_, i) => i !== indexToRemove));
    handleDecrementCart(flightKey);
  };

  let totalItems = 0;
  
  // 1. Calcul du prix normal (En séparant vol et options)
  let flightTotal = 0;
  let complementsTotal = 0;

  Object.entries(cart).forEach(([key, qty]) => {
    totalItems += qty;
    const [fId] = key.split('|');
    const f = flights.find(fl => fl.id.toString() === fId);
    if (f && f.price_cents) flightTotal += (f.price_cents / 100) * qty;
  });

  passengers.forEach(p => {
    if (p.selectedComplements && p.selectedComplements.length > 0) {
      p.selectedComplements.forEach((compId: number) => {
        const comp = complementsList.find(c => c.id === compId);
        if (comp && comp.price_cents) complementsTotal += (comp.price_cents / 100);
      });
    }
  });

  // On crée la variable originalPrice une seule fois, ici !
  let originalPrice = flightTotal + complementsTotal;

  // 2. Application de la réduction intelligente
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'gift_card') {
      discountAmount = Number(appliedVoucher.price_paid_cents) / 100;
    } else if (appliedVoucher.type === 'promo') {
      const discountVal = Number(appliedVoucher.discount_value);
      const scope = appliedVoucher.discount_scope || 'both';
      
      let targetAmount = originalPrice;
      if (scope === 'flight') targetAmount = flightTotal;
      if (scope === 'complements') targetAmount = complementsTotal;

      if (appliedVoucher.discount_type === 'fixed') {
        discountAmount = Math.min(discountVal, targetAmount); 
      }
      if (appliedVoucher.discount_type === 'percentage') {
        discountAmount = targetAmount * (discountVal / 100);
      }
    }
  }

  const finalPrice = Math.max(0, originalPrice - discountAmount);

  useEffect(() => {
    if (step === 3 && totalItems === 0) setStep(1);
  }, [totalItems, step]);

  const weekDays = Array.from({ length: 7 }).map((_, i) => {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    return getLocalYYYYMMDD(d);
  });

  // --- FILTRE DU CATALOGUE PAR LE SÉLECTEUR ---
  const filteredFlights = flights.filter(f => {
    const flightSeason = String(f.season || 'ALL').toUpperCase().trim(); 

    // Les anciens vols (Standard) sont rangés dans Été par sécurité
    const isLegacy = flightSeason === 'STANDARD' || flightSeason === 'ALL';

    if (activeSeason === 'Hiver') {
      return flightSeason === 'WINTER' || flightSeason === 'HIVER' || isLegacy;
    } else {
      return flightSeason === 'SUMMER' || flightSeason === 'ETE' || flightSeason === 'ÉTÉ' || isLegacy;
    }
  });

  const isFormValid = contact.firstName && contact.lastName && contact.phone && contact.email && 
                      passengers.length > 0 && passengers.every(p => p.firstName && p.weightChecked);

const handleApplyVoucher = async () => {
    if (!voucherInput.trim()) return;
    setIsApplyingVoucher(true);
    setVoucherError('');
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/gift-cards/check/${voucherInput.trim()}`);
      
      if (!res.ok) {
        const errData = await res.json();
        setVoucherError(errData.message || "Code invalide ou expiré");
        setAppliedVoucher(null);
      } else {
        const data = await res.json();
        
        // SÉCURITÉ : Si le code est lié à un vol spécifique, on vérifie que ce vol est dans le panier
        if (data.type === 'promo' && data.flight_type_id) {
          const hasRequiredFlight = Object.keys(cart).some(key => key.startsWith(`${data.flight_type_id}|`));
          if (!hasRequiredFlight) {
            setVoucherError(`Ce code n'est valable que pour le vol : ${data.flight_name}`);
            setAppliedVoucher(null);
            setIsApplyingVoucher(false);
            return;
          }
        }
        setAppliedVoucher(data);
        setVoucherInput(''); // On vide le champ
      }
    } catch (err) {
      setVoucherError("Erreur de connexion.");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsCheckingOut(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/public/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact, 
          passengers,
          voucher_code: appliedVoucher ? appliedVoucher.code : null // 👈 On envoie le code au serveur
        })
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Erreur lors de la création du paiement : " + (data.error || "Inconnue"));
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error(err);
      alert("Erreur de connexion au serveur de paiement.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 pb-48">
      
      <div className="h-20 bg-gradient-to-r from-violet-600 to-blue-800 w-full shadow-md sticky top-0 z-40"></div>

      <main className="max-w-7xl mx-auto px-4 py-12 relative z-10">
        
        {/* ÉTAPE 1 : CHOIX DU VOL */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
             <div className="text-center mb-10">
              <h1 className="text-4xl md:text-6xl font-black uppercase italic tracking-tight text-slate-900 mb-4">
                Réservez votre <span className="text-sky-500">Vol</span>
              </h1>
            </div>

            {/* LE SÉLECTEUR DE PLANS */}
            <div className="flex justify-center mb-12">
              <div className="bg-slate-200/50 p-1.5 rounded-2xl inline-flex shadow-inner">
                <button onClick={() => setActiveSeason('Standard')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Standard' ? 'bg-white text-amber-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>☀️ Vols Été</button>
                <button onClick={() => setActiveSeason('Hiver')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Hiver' ? 'bg-white text-sky-500 shadow-md scale-105' : 'text-slate-400 hover:text-slate-600'}`}>❄️ Vols Hiver</button>
              </div>
            </div>

            {isLoading ? (
               <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div></div>
            ) : filteredFlights.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[35px] shadow-xl"><span className="text-5xl block mb-4">🌬️</span><h3 className="text-xl font-black uppercase">Aucun vol configuré pour ce plan</h3></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFlights.map((flight) => {
                  
                  // BADGE INTELLIGENT DU PLAN
                  let displayedSeason = "🌍 Inclus dans tous les Plans";
                  const s = String(flight.season || 'ALL').toUpperCase().trim();
                  if (s === 'SUMMER' || s === 'ETE' || s === 'ÉTÉ' || s === 'STANDARD') displayedSeason = "☀️ Uniquement sur le Plan Été";
                  if (s === 'WINTER' || s === 'HIVER') displayedSeason = "❄️ Uniquement sur le Plan Hiver";

                  return (
                  <div key={flight.id} className="bg-white rounded-[35px] p-8 shadow-xl border-2 border-transparent hover:border-sky-300 transition-all cursor-pointer flex flex-col justify-between group" onClick={() => { setSelectedFlight(flight); setStep(2); }}>
                    <div>
                      <h3 className="text-2xl font-black uppercase italic mb-3">{flight.name}</h3>
                      <div className="flex gap-3 text-sm font-bold text-slate-400 mb-6">
                        <span className="bg-slate-50 px-3 py-1 rounded-lg">{getMarketingInfo(flight.name)}</span>
                        <span className="bg-slate-50 px-3 py-1 rounded-lg">⚖️ {flight.weight_min !== undefined ? flight.weight_min : 20} - {flight.weight_max !== undefined ? flight.weight_max : 110} kg</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-4 bg-slate-50 inline-block px-3 py-1 rounded-lg">
                        {displayedSeason}
                      </div>
                    </div>
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="text-4xl font-black text-slate-900">{flight.price_cents ? flight.price_cents / 100 : 0}€</div>
                      <button className="bg-slate-900 text-white px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-sky-500 transition-colors">Choisir ce vol</button>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : LA GRILLE DES JOURS */}
        {step === 2 && selectedFlight && (
          <div className="animate-in fade-in slide-in-from-right-8 duration-500">
            <button onClick={() => setStep(1)} className="mb-8 text-slate-400 hover:text-sky-500 font-black text-xs uppercase tracking-widest flex items-center gap-2">
              ← Retour au catalogue
            </button>
            
            <div className="bg-white rounded-[40px] shadow-2xl p-6 md:p-10 border border-slate-100">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-tight">Réservation :</h2>
                    <div className="relative">
                      <select 
                        className="text-2xl md:text-3xl font-black uppercase italic text-sky-600 bg-sky-50 border-2 border-sky-100 rounded-2xl py-1 pl-4 pr-10 outline-none cursor-pointer focus:border-sky-300 hover:bg-sky-100 transition-all appearance-none shadow-sm"
                        value={selectedFlight.id}
                        onChange={(e) => {
                          const newFlight = flights.find(f => f.id.toString() === e.target.value);
                          if (newFlight) setSelectedFlight(newFlight);
                        }}
                      >
                        {filteredFlights.map(f => (
                          <option key={f.id} value={f.id}>{f.name}</option>
                        ))}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sky-500 text-sm">▼</div>
                    </div>
                  </div>
                  <p className="text-sky-500 font-bold uppercase tracking-widest text-sm mt-3">{getMarketingInfo(selectedFlight.name)}</p>
                </div>
                <div className="flex items-center gap-4 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
                  <span className="text-xs font-black uppercase text-slate-400 ml-4 hidden md:inline">Semaine du</span>
                  <input type="date" className="font-bold bg-white border-none rounded-xl p-3 outline-none cursor-pointer shadow-sm" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </div>
              </div>

              {isSearchingTimes ? (
                <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-12 w-12 border-b-4 border-sky-500"></div></div>
              ) : (
                <div className="relative">
                  
                  {/* 👇 1. LE BANDEAU DES JOURS */}
                  <div 
                    ref={headerScrollRef}
                    className="flex overflow-x-hidden gap-4 sticky top-20 z-30 bg-white pt-2 pb-4 border-b border-slate-100"
                  >
                    {weekDays.map(dateStr => (
                      <div key={`header-${dateStr}`} className="min-w-[220px] flex-1 bg-slate-100 border border-slate-200 rounded-2xl p-4 text-center shadow-sm">
                        <p className="font-black text-slate-900 capitalize text-lg leading-tight">{getDayName(dateStr)}</p>
                      </div>
                    ))}
                  </div>

                  {/* 👇 2. LA ZONE DES CRÉNEAUX */}
                  <div 
                    className="flex overflow-x-auto gap-4 pb-4 snap-x pt-4"
                    onScroll={(e) => {
                      if (headerScrollRef.current) {
                        headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                      }
                    }}
                  >
                    {weekDays.map(dateStr => {
                      const times = Object.keys(gridData[dateStr] || {}).sort();
                      
                      return (
                        <div key={dateStr} className="min-w-[220px] flex-1 bg-slate-50 border border-slate-100 rounded-3xl p-4 snap-start h-fit">
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
                                        {capacity} place{capacity > 1 ? 's' : ''}
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
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
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

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Message / Remarque (Facultatif)</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 h-24"
                    placeholder="Une information à transmettre au pilote ? (ex: cadeau surprise, problème auditif...)"
                    value={contact.notes}
                    onChange={e => setContact({...contact, notes: e.target.value})}
                  />
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

                      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors mb-4 ${p.weightChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
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
                            Je certifie peser entre {p.weight_min} et {p.weight_max} kg *
                          </span>
                          <span className={`text-xs ${p.weightChecked ? 'text-emerald-600' : 'text-rose-500'}`}>
                            Information obligatoire pour des raisons de sécurité.
                          </span>
                        </div>
                      </label>

                      {complementsList.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                          <p className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-3">Options disponibles (paiement sur place possible)</p>
                          <div className="grid gap-3">
                            {complementsList.map((comp: any) => {
                              const isSelected = p.selectedComplements?.includes(comp.id) || false;
                              return (
                                <label 
                                  key={comp.id} 
                                  className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors ${isSelected ? 'bg-sky-50 border-sky-300' : 'bg-slate-50 border-slate-100 hover:border-sky-200'}`}
                                >
                                  <input 
                                    type="checkbox" 
                                    className="w-6 h-6 mt-0.5 accent-sky-500" 
                                    checked={isSelected}
                                    onChange={(e) => {
                                      const newP = [...passengers];
                                      newP[index] = { ...newP[index] };
                                      const selected = newP[index].selectedComplements || [];
                                      
                                      if (e.target.checked) {
                                        newP[index].selectedComplements = [...selected, comp.id];
                                      } else {
                                        newP[index].selectedComplements = selected.filter((id: number) => id !== comp.id);
                                      }
                                      setPassengers(newP);
                                    }}
                                  />
                                  <div className="flex-1">
                                    <span className={`font-bold block ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                                      {comp.name} (+{comp.price_cents / 100}€)
                                    </span>
                                    {comp.description && (
                                      <span className="text-xs text-slate-500 mt-1 block leading-tight">
                                        {comp.description}
                                      </span>
                                    )}
                                  </div>
                                </label>
                              );
                            })}
                          </div>
                        </div>
                      )}

                    </div>
                  ))}
                </div>
              </div>

            </div>
            {/* SECTION 3 : CODE PROMO / BON CADEAU */}
              <div className="mt-12 pt-8 border-t border-slate-100">
                <h3 className="font-black text-xl text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-amber-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">3</span>
                  Code Promo ou Bon Cadeau
                </h3>

                {appliedVoucher ? (
                  <div className="bg-emerald-50 border-2 border-emerald-500 rounded-2xl p-6 flex justify-between items-center">
                    <div>
                      <p className="font-black text-emerald-900 uppercase tracking-widest text-sm">
                        ✅ {appliedVoucher.type === 'promo' ? 'Code Promo appliqué' : 'Bon cadeau appliqué'}
                      </p>
                      <p className="text-emerald-700 font-bold mt-1">
                        Code : <span className="uppercase">{appliedVoucher.code}</span>
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-black text-emerald-600">
                        - {discountAmount.toFixed(2)} €
                      </p>
                      <button onClick={() => setAppliedVoucher(null)} className="text-[10px] font-black uppercase text-rose-500 mt-2 hover:underline">
                        Retirer le code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <div className="flex gap-3">
                      <input 
                        type="text" 
                        placeholder="Ex: FLUIDE-1234 ou NOEL2024" 
                        className="flex-1 bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold uppercase focus:border-amber-500 outline-none transition-colors"
                        value={voucherInput}
                        onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        disabled={isApplyingVoucher || !voucherInput.trim()}
                        className={`px-8 rounded-2xl font-black uppercase tracking-widest text-xs transition-all ${!voucherInput.trim() || isApplyingVoucher ? 'bg-slate-200 text-slate-400' : 'bg-slate-900 text-white hover:bg-amber-500 shadow-md'}`}
                      >
                        {isApplyingVoucher ? '...' : 'Appliquer'}
                      </button>
                    </div>
                    {voucherError && <p className="text-rose-500 font-bold text-xs mt-3 ml-2">❌ {voucherError}</p>}
                  </div>
                )}
              </div>
          </div>
        )}

      </main>

      {/* --- LE PANIER FLOTTANT --- */}
      {totalItems > 0 && (step === 1 || step === 2 || step === 3) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.1)] z-50 animate-in slide-in-from-bottom-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex-1 w-full">
              <span className="font-black text-slate-900 uppercase italic text-lg block mb-2">
                {totalItems} vol{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
              </span>
              
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2">
                {Object.entries(cart).map(([key, qty]) => {
                  if (qty === 0) return null;
                  const [fId, dStr, tStr] = key.split('|');
                  const f = flights.find(fl => fl.id.toString() === fId);
                  return (
                    <div key={key} className="bg-slate-50 rounded-xl pl-3 pr-1 py-1 flex items-center gap-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                      <span>{f?.name} <span className="text-slate-400">({tStr})</span> : <span className="text-sky-500 text-sm">{qty}</span></span>
                      <div className="flex items-center gap-1 ml-2">
                        <button onClick={() => handleDecrementCart(key)} className="w-6 h-6 bg-white border border-slate-100 rounded-lg flex items-center justify-center hover:text-rose-500 transition-colors" title="Enlever 1 place">-</button>
                        <button onClick={() => handleDeleteCartItem(key)} className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Supprimer ce vol">❌</button>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
            
            <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
              <div className="text-right">
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
                <p className="text-2xl font-black text-sky-500">{finalPrice.toFixed(2)} €</p>
              </div>
              
              {step === 3 ? (
                 <button 
                  onClick={handleSubmit}
                  disabled={!isFormValid || isCheckingOut}
                  className={`flex-1 md:flex-none px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all shadow-lg ${isFormValid && !isCheckingOut ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-1 shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  {isCheckingOut ? 'Redirection Stripe...' : 'Confirmer la réservation'}
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