"use client";
import React, { useState, useEffect, useRef } from 'react';
import { getLocalYYYYMMDD, getDayName, calculateGridStart, getMarketingInfo } from '@/lib/booking-utils';
import { useBookingData } from '@/hooks/useBookingData';
import { useAvailabilities } from '@/hooks/useAvailabilities';
import { useGridData } from '@/hooks/useGridData';
import FlightCard from '@/components/booking/FlightCard';
import InfoFlightModal from '@/components/booking/InfoFlightModal';
import VoucherSection from '@/components/booking/VoucherSection';
import PassengerCard from '@/components/booking/PassengerCard';
import CartBar from '@/components/booking/CartBar';

export default function ReserverPage() {
  // ── Refs scroll/animation ──────────────────────────────────────────────────
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const hasAnimatedIntro = useRef(false);
  const scrollTimeout = useRef<any>(null);
  const isSwipingRef = useRef(false);

  // ── State ──────────────────────────────────────────────────────────────────
  const [isEmbed, setIsEmbed] = useState(false);
  const [selectedFlight, setSelectedFlight] = useState<any>(null);
  const [step, setStep] = useState<number>(1);
  const [infoFlight, setInfoFlight] = useState<any>(null);
  const [isGridExpanded, setIsGridExpanded] = useState(false);

  const [pickedDate, setPickedDate] = useState<string>(() => {
    const d = new Date();
    if (d.getHours() >= 12) d.setDate(d.getDate() + 1);
    return getLocalYYYYMMDD(d);
  });
  const [gridStartDate, setGridStartDate] = useState<string>('');

  const [cart, setCart] = useState<Record<string, number>>({});
  const [appliedVoucher, setAppliedVoucher] = useState<any>(null);
  const [contact, setContact] = useState({ firstName: '', lastName: '', phone: '', email: '', isPassenger: false, notes: '' });
  const [passengers, setPassengers] = useState<any[]>([]);
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // ── Refs sécurisés anti double-clic ───────────────────────────────────────
  const selectedFlightRef = useRef(selectedFlight);
  useEffect(() => { selectedFlightRef.current = selectedFlight; }, [selectedFlight]);
  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // ── Hooks de données ───────────────────────────────────────────────────────
  const { flights, giftTemplates, complementsList, displayDaysCount, isLoading, activeSeason, setActiveSeason } =
    useBookingData((dateStr, count) => {
      setPickedDate(dateStr);
      setGridStartDate(calculateGridStart(dateStr, count));
    });

  const { rawSlots, isSearchingTimes } = useAvailabilities(gridStartDate, selectedFlight, displayDaysCount);
  const gridData = useGridData(rawSlots, selectedFlight, cart, gridStartDate, flights);

  // ── Détection embed ────────────────────────────────────────────────────────
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('embed=true')) setIsEmbed(true);
  }, []);

  // ── Gestion du bouton retour navigateur ────────────────────────────────────
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      const itemsInCart = Object.values(cartRef.current).reduce((s: any, q: any) => s + q, 0);
      const needsReset = (hash === '#etape-2' && !selectedFlightRef.current) || (hash === '#etape-3' && itemsInCart === 0);
      if (needsReset) {
        setStep(1);
        window.history.replaceState(null, '', window.location.pathname + window.location.search);
      } else {
        if (hash === '#etape-3') setStep(3);
        else if (hash === '#etape-2') setStep(2);
        else setStep(1);
      }
    };
    window.addEventListener('popstate', handlePopState);
    handlePopState();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Mise à jour URL sans rechargement ─────────────────────────────────────
  useEffect(() => {
    const expectedHash = step === 1 ? '' : `#etape-${step}`;
    if (window.location.hash !== expectedHash) {
      const newUrl = step === 1
        ? window.location.pathname + window.location.search
        : window.location.pathname + window.location.search + expectedHash;
      window.history.pushState({ step }, '', newUrl);
    }
  }, [step]);

  // ── Scroll vers la bonne étape ─────────────────────────────────────────────
  useEffect(() => {
    if (step !== 2) {
      hasAnimatedIntro.current = false;
      setIsGridExpanded(false);
    }
    if (step === 2) {
      setTimeout(() => {
        const el = document.getElementById('etape-2-container');
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      }, 50);
    } else if (step === 3) {
      setTimeout(() => {
        const el = document.getElementById('etape-3-container');
        if (el) window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - 100, behavior: 'smooth' });
      }, 50);
    }
  }, [step]);

  // ── Animation cinématique de la grille ────────────────────────────────────
  useEffect(() => {
    if (step !== 2) return;
    if (!isSearchingTimes && rawSlots.length > 0 && bodyScrollRef.current) {
      if (isSwipingRef.current) {
        isSwipingRef.current = false;
        setIsGridExpanded(true);
        return;
      }
      const container = bodyScrollRef.current;
      const headerContainer = headerScrollRef.current;

      const centerHorizontally = (el: HTMLElement, behavior: 'auto' | 'smooth') => {
        const pos = el.offsetLeft - container.clientWidth / 2 + el.clientWidth / 2;
        container.scrollTo({ left: pos, behavior });
      };

      container.classList.remove('opacity-0');
      if (headerContainer) headerContainer.classList.remove('opacity-0');

      if (window.innerWidth >= 768) {
        setTimeout(() => {
          const targetEl = document.getElementById(`mobile-col-${pickedDate}`);
          if (targetEl) centerHorizontally(targetEl, 'auto');
          setIsGridExpanded(true);
        }, 10);
        return;
      }

      if (!hasAnimatedIntro.current) {
        hasAnimatedIntro.current = true;
        const startAnimDate = new Date(pickedDate);
        startAnimDate.setDate(startAnimDate.getDate() - 1);
        const startAnimDateStr = getLocalYYYYMMDD(startAnimDate);

        setTimeout(() => {
          const startEl = document.getElementById(`mobile-col-${startAnimDateStr}`);
          const targetEl = document.getElementById(`mobile-col-${pickedDate}`);
          if (startEl && targetEl) {
            container.style.scrollSnapType = 'none';
            centerHorizontally(startEl, 'auto');
            requestAnimationFrame(() => {
              setTimeout(() => {
                centerHorizontally(targetEl, 'smooth');
                setTimeout(() => { container.style.scrollSnapType = ''; setIsGridExpanded(true); }, 300);
              }, 50);
            });
          } else if (targetEl) {
            centerHorizontally(targetEl, 'auto');
            setIsGridExpanded(true);
          }
        }, 20);
      } else {
        setTimeout(() => {
          const targetEl = document.getElementById(`mobile-col-${pickedDate}`);
          if (targetEl) centerHorizontally(targetEl, 'smooth');
          setTimeout(() => setIsGridExpanded(true), 100);
        }, 20);
      }
    }
  }, [pickedDate, isSearchingTimes, rawSlots.length, step]);

  // ── Initialisation des passagers depuis le panier ──────────────────────────
  useEffect(() => {
    if (step !== 3) return;

    const photoOption = complementsList.find((c: any) =>
      c.name.toLowerCase().includes('photo') ||
      c.name.toLowerCase().includes('vidéo') ||
      c.name.toLowerCase().includes('video') ||
      c.name.toLowerCase().includes('gopro')
    );

    const newPassengers: any[] = [];
    Object.entries(cart).forEach(([key, qty]) => {
      const [fId, dStr, tStr] = key.split('|');
      const flight = flights.find((f: any) => f.id.toString() === fId);
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
          weight_min: flight?.weight_min ?? 20,
          weight_max: flight?.weight_max ?? 110,
        });
      }
    });

    setPassengers(prev => newPassengers.map(nP => {
      const existing = prev.find(p => p.id === nP.id);
      const flight = flights.find((f: any) => f.id.toString() === nP.flightId);
      let currentComplements = existing ? [...(existing.selectedComplements || [])] : [];

      if (appliedVoucher && appliedVoucher.type === 'gift_card' && photoOption && flight) {
        const isSameFlight = !appliedVoucher.flight_type_id || appliedVoucher.flight_type_id.toString() === nP.flightId;
        if (isSameFlight) {
          const vVal = Number(appliedVoucher.price_paid_cents) / 100;
          const fPri = flight.price_cents / 100;
          const pPri = photoOption.price_cents / 100;
          if (vVal >= fPri + pPri && !currentComplements.includes(photoOption.id)) {
            currentComplements.push(photoOption.id);
          }
        }
      }

      return { ...nP, firstName: existing?.firstName || '', weightChecked: existing?.weightChecked || false, selectedComplements: currentComplements };
    }));
  }, [step, cart, flights, appliedVoucher, complementsList]);

  // ── Copie du contact vers le premier passager ──────────────────────────────
  useEffect(() => {
    if (contact.isPassenger && passengers.length > 0 && contact.firstName) {
      setPassengers(prev => {
        const newP = [...prev];
        if (!newP[0].firstName) newP[0].firstName = contact.firstName;
        return newP;
      });
    }
  }, [contact.isPassenger, contact.firstName]);

  // ── Calcul des totaux (doit précéder les useEffects qui en dépendent) ────────
  let totalItems = 0;
  let flightTotal = 0;
  let complementsTotal = 0;

  Object.entries(cart).forEach(([key, qty]) => {
    totalItems += qty;
    const [fId] = key.split('|');
    const f = flights.find((fl: any) => fl.id.toString() === fId);
    if (f?.price_cents) flightTotal += (f.price_cents / 100) * qty;
  });

  passengers.forEach(p => {
    (p.selectedComplements || []).forEach((compId: number) => {
      const comp = complementsList.find((c: any) => c.id === compId);
      if (comp?.price_cents) complementsTotal += comp.price_cents / 100;
    });
  });

  const originalPrice = flightTotal + complementsTotal;
  let discountAmount = 0;
  if (appliedVoucher) {
    if (appliedVoucher.type === 'gift_card') {
      discountAmount = Number(appliedVoucher.price_paid_cents) / 100;
    } else if (appliedVoucher.type === 'promo') {
      const discountVal = Number(appliedVoucher.discount_value);
      const scope = appliedVoucher.discount_scope || 'both';
      let targetAmount = scope === 'flight' ? flightTotal : scope === 'complements' ? complementsTotal : originalPrice;
      discountAmount = appliedVoucher.discount_type === 'fixed'
        ? Math.min(discountVal, targetAmount)
        : targetAmount * (discountVal / 100);
    }
  }
  const finalPrice = Math.max(0, originalPrice - discountAmount);

  // ── Vide le panier → retour étape 1 ───────────────────────────────────────
  useEffect(() => {
    if (step === 3 && totalItems === 0) setStep(1);
  }, [totalItems, step]);

  // ── Données dérivées ───────────────────────────────────────────────────────
  const weekDays = Array.from({ length: 21 }).map((_, i) => {
    const d = new Date(gridStartDate);
    d.setDate(d.getDate() - 10 + i);
    return getLocalYYYYMMDD(d);
  });

  const filteredFlights = flights.filter((f: any) => {
    const s = String(f.season || 'ALL').toUpperCase().trim();
    const isLegacy = s === 'STANDARD' || s === 'ALL';
    if (activeSeason === 'Hiver') return s === 'WINTER' || s === 'HIVER' || isLegacy;
    return s === 'SUMMER' || s === 'ETE' || s === 'ÉTÉ' || isLegacy;
  });

  const isFormValid = !!(contact.firstName && contact.lastName && contact.phone && contact.email &&
    passengers.length > 0 && passengers.every(p => p.firstName && p.weightChecked));

  // ── Handlers ───────────────────────────────────────────────────────────────
  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPickedDate(e.target.value);
    setGridStartDate(calculateGridStart(e.target.value, displayDaysCount));
  };

  const shiftDays = (offset: number) => {
    const d = new Date(gridStartDate);
    d.setDate(d.getDate() + offset);
    setGridStartDate(getLocalYYYYMMDD(d));
    const p = new Date(pickedDate);
    p.setDate(p.getDate() + offset);
    setPickedDate(getLocalYYYYMMDD(p));
  };

  const handleAdd = (date: string, time: string) => {
    const key = `${selectedFlight.id}|${date}|${time}`;
    setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };

  const handleRemove = (date: string, time: string) => {
    const key = `${selectedFlight.id}|${date}|${time}`;
    setCart(prev => {
      const c = { ...prev };
      if (c[key] > 1) c[key]--; else delete c[key];
      return c;
    });
  };

  const handleDecrementCart = (key: string) => {
    setCart(prev => {
      const c = { ...prev };
      if (c[key] > 1) c[key]--; else delete c[key];
      return c;
    });
  };

  const handleDeleteCartItem = (key: string) => {
    setCart(prev => { const c = { ...prev }; delete c[key]; return c; });
  };

  const handleApplyVoucher = async (code: string) => {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    const res = await fetch(`${apiUrl}/api/gift-cards/check/${code}`);
    if (!res.ok) {
      const errData = await res.json();
      throw errData.message || 'Code invalide ou expiré';
    }
    const data = await res.json();
    if (data.flight_type_id) {
      const hasRequiredFlight = Object.keys(cart).some(k => k.startsWith(`${data.flight_type_id}|`));
      if (!hasRequiredFlight) throw `Ce code n'est valable que pour la prestation : ${data.flight_name}`;
    }
    setAppliedVoucher(data);
  };

  const handlePassengerChange = (index: number, updated: any) => {
    setPassengers(prev => { const arr = [...prev]; arr[index] = updated; return arr; });
  };

  const handleSubmit = async () => {
    if (!isFormValid) return;
    setIsCheckingOut(true);
    try {
      const passengersToSubmit = passengers.map((p, index) => {
        let finalName = p.firstName.trim();
        if (passengers.length > 1) {
          const isContact = contact.isPassenger && (index === 0 || finalName.toLowerCase() === contact.firstName.trim().toLowerCase());
          if (!isContact) finalName = `${finalName} (${contact.firstName.trim()})`;
        }
        return { ...p, firstName: finalName };
      });

      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/public/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contact, passengers: passengersToSubmit, voucher_code: appliedVoucher?.code ?? null }),
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url;
      } else {
        alert('Erreur lors de la création du paiement : ' + (data.error || 'Inconnue'));
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error(err);
      alert('Erreur de connexion au serveur de paiement.');
      setIsCheckingOut(false);
    }
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-900 overflow-clip">

      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }
        .hero-animation-block {
          will-change: transform, opacity;
          animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
          position: relative; z-index: 10;
        }
        .hero-gradient-infos {
          background: radial-gradient(circle at center, #3b82f6 0%, #1e3a8a 50%, #4c1d95 100%);
          position: relative; width: 100%; height: 70vh;
          display: flex; align-items: center; color: white;
          text-align: left; padding-left: 15vw; overflow: hidden;
        }
        .mountains-container { position: absolute; bottom: -5px; left: 0; width: 100%; z-index: 5; line-height: 0; }
        .mountains-container img { width: 100%; height: auto; display: block; }
        @media (max-width: 1024px) { .hero-gradient-infos { height: 60vh; padding-left: 8vw; } }
      `}} />

      <section className="hero-gradient-infos">
        <div className="hero-animation-block">
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 4rem)', fontWeight: 900, marginBottom: '15px', textShadow: '0 4px 10px rgba(0,0,0,0.2)' }}>
            Réservez votre <span style={{ color: '#0ea5e9' }}>Vol</span>
          </h1>
          <p style={{ fontSize: 'clamp(1rem, 2vw, 1.5rem)', opacity: 0.95, fontWeight: 500, maxWidth: '700px' }}>
            Choisissez votre expérience et préparez-vous au décollage.
          </p>
        </div>
        <div className="mountains-container">
          <img src="/montagnes.svg" alt="Montagnes Fluide Parapente" />
        </div>
      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-4 -mt-16 md:-mt-32 pb-48">

        {/* ── ÉTAPE 1 : CHOIX DU VOL ── */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className={`flex justify-center mb-12 sticky z-40 transition-all duration-300 ${isEmbed ? 'top-4' : 'top-20'}`}>
              <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl inline-flex shadow-xl border border-slate-200">
                <button onClick={() => setActiveSeason('Standard')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Standard' ? 'bg-amber-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>☀️ Vols Été</button>
                <button onClick={() => setActiveSeason('Hiver')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Hiver' ? 'bg-sky-500 text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`}>❄️ Vols Hiver</button>
              </div>
            </div>

            <div className="max-w-7xl mx-auto mb-10 bg-sky-50/50 border border-sky-100 rounded-[24px] p-6 shadow-sm backdrop-blur-sm">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                <div className="flex items-start gap-4">
                  <div className="text-3xl bg-white p-3 rounded-2xl shadow-sm border border-sky-50">🎁</div>
                  <div>
                    <h4 className="font-black text-sky-900 text-sm uppercase tracking-wider mb-1">Bon Cadeau</h4>
                    <p className="text-xs text-sky-700 font-medium leading-relaxed">Vous avez un code cadeau, un code promo ? Inutile de le chercher maintenant, vous pourrez le saisir à la dernière étape, juste avant le paiement.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl bg-white p-3 rounded-2xl shadow-sm border border-sky-50">📸</div>
                  <div>
                    <h4 className="font-black text-sky-900 text-sm uppercase tracking-wider mb-1">Photos & Vidéos</h4>
                    <p className="text-xs text-sky-700 font-medium leading-relaxed">Option accessible plus tard dans le processus de réservation ! Pas complètement decidez ! Vous pourrez demander l'option directement à votre moniteur le jour J.</p>
                  </div>
                </div>
                <div className="flex items-start gap-4">
                  <div className="text-3xl bg-white p-3 rounded-2xl shadow-sm border border-sky-50">🎢</div>
                  <div>
                    <h4 className="font-black text-sky-900 text-sm uppercase tracking-wider mb-1">Sensations Fortes</h4>
                    <p className="text-xs text-sky-700 font-medium leading-relaxed">Envie d'acrobaties et de piloter un peu ? C'est inclus et 100% gratuit. Il suffira de le demander une fois en l'air !</p>
                  </div>
                </div>
              </div>
            </div>

            {isLoading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white rounded-[35px] p-8 shadow-xl border border-slate-100 flex flex-col justify-between animate-pulse">
                    <div className="w-full h-40 md:h-52 bg-slate-200/60 rounded-2xl md:rounded-[20px] mb-6" />
                    <div>
                      <div className="h-8 bg-slate-200/80 rounded-xl w-3/4 mb-4" />
                      <div className="flex gap-3 mb-6"><div className="h-6 bg-slate-100 rounded-lg w-28" /><div className="h-6 bg-slate-100 rounded-lg w-24" /></div>
                      <div className="h-5 bg-slate-100 rounded-lg w-40 mb-4" />
                    </div>
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="h-10 bg-slate-200/80 rounded-xl w-20" />
                      <div className="h-12 bg-slate-200/50 rounded-2xl w-32" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFlights.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-[35px] shadow-xl border border-slate-100">
                <span className="text-5xl block mb-4">🌬️</span>
                <h3 className="text-xl font-black uppercase text-slate-800">Aucun vol configuré pour cette saison</h3>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFlights.map((flight: any) => (
                  <FlightCard
                    key={flight.id}
                    flight={flight}
                    giftTemplates={giftTemplates}
                    onSelect={() => { setSelectedFlight(flight); setStep(2); }}
                    onInfo={() => setInfoFlight(flight)}
                    onGift={(templateId, flightName) => {
                      window.location.href = `/bons-cadeaux?templateId=${templateId}&flightName=${encodeURIComponent(flightName)}`;
                    }}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── ÉTAPE 2 : GRILLE DES CRÉNEAUX ── */}
        {step === 2 && selectedFlight && (
          <div id="etape-2-container" className="animate-in fade-in slide-in-from-right-8 duration-500 mt-16 md:mt-24">
            <button onClick={() => setStep(1)} className="mb-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-600 hover:text-sky-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100 w-fit">
              ← Retour au catalogue
            </button>

            <div className="bg-white rounded-[40px] shadow-sm p-6 md:p-10 border border-slate-200">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-black text-slate-900 leading-tight">Réservation :</h2>
                    <div className="relative">
                      <select
                        className="text-2xl md:text-3xl font-black text-sky-600 bg-sky-50 border-2 border-sky-100 rounded-2xl py-1 pl-4 pr-10 outline-none cursor-pointer focus:border-sky-300 hover:bg-sky-100 transition-all appearance-none shadow-sm"
                        value={selectedFlight.id}
                        onChange={e => {
                          const newFlight = flights.find((f: any) => f.id.toString() === e.target.value);
                          if (newFlight) setSelectedFlight(newFlight);
                        }}
                      >
                        {filteredFlights.map((f: any) => <option key={f.id} value={f.id}>{f.name}</option>)}
                      </select>
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sky-500 text-sm">▼</div>
                    </div>
                  </div>
                  <p className="text-sky-500 font-bold uppercase tracking-widest text-sm mt-3">{getMarketingInfo(selectedFlight.name)}</p>
                </div>

                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
                  {displayDaysCount < 5 && (
                    <button onClick={() => shiftDays(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm font-black text-slate-500 transition-colors">←</button>
                  )}
                  <span className="text-xs font-black uppercase text-slate-400 ml-2 hidden md:inline">
                    {displayDaysCount === 7 ? 'Semaine du' : 'À partir du'}
                  </span>
                  <input type="date" className="font-bold bg-transparent border-none p-2 outline-none cursor-pointer text-slate-700" value={pickedDate} onChange={handleDatePick} />
                  {displayDaysCount < 5 && (
                    <button onClick={() => shiftDays(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm font-black text-slate-500 transition-colors">→</button>
                  )}
                </div>
              </div>

              <div className={`transition-opacity duration-75 ${isSearchingTimes && rawSlots.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                {isSearchingTimes && rawSlots.length === 0 ? (
                  <div className="flex overflow-hidden gap-4 px-[12.5vw] md:px-0 pt-6">
                    {Array.from({ length: displayDaysCount === 7 ? 7 : 5 }).map((_, i) => (
                      <div key={i} className="min-w-[75vw] md:min-w-[220px] flex-1 flex flex-col gap-3 animate-pulse">
                        <div className="h-14 bg-slate-200/60 rounded-xl mb-4" />
                        <div className="h-20 bg-slate-100 rounded-xl" />
                        <div className="h-20 bg-slate-100 rounded-xl" />
                        <div className="h-20 bg-slate-100/50 rounded-xl" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    <div className={`sticky ${isEmbed ? 'top-0' : 'top-20'} z-40 bg-white/95 backdrop-blur-md pt-4 pb-4 border-b border-slate-200`}>
                      <div ref={headerScrollRef} className="flex overflow-hidden gap-4 px-[12.5vw] md:px-0 opacity-0 md:opacity-100 transition-opacity duration-300">
                        {weekDays.map((dateStr, i) => {
                          const isFirstDesktop = i === 10;
                          const isLastDesktop = i === 10 + displayDaysCount - 1;
                          const isHiddenOnDesktop = i < 10 || i >= 10 + displayDaysCount;
                          return (
                            <div key={`header-${dateStr}`} className={`min-w-[75vw] max-w-[75vw] md:min-w-[220px] md:max-w-none flex-1 flex gap-2 ${isHiddenOnDesktop ? 'md:hidden' : ''}`}>
                              {isFirstDesktop && (
                                <button onClick={() => shiftDays(-1)} className="hidden md:flex shrink-0 w-12 bg-sky-700 shadow-md rounded-lg items-center justify-center text-white hover:bg-sky-500 transition-colors cursor-pointer outline-none border-none"><span className="text-2xl font-black">←</span></button>
                              )}
                              <div className="flex-1 bg-gradient-to-br from-violet-600 to-violet-700 shadow-md rounded-lg p-4 flex flex-col items-center justify-center text-center">
                                <p className="font-black text-white capitalize text-md leading-tight">{getDayName(dateStr)}</p>
                              </div>
                              {isLastDesktop && (
                                <button onClick={() => shiftDays(1)} className="hidden md:flex shrink-0 w-12 bg-sky-700 shadow-md rounded-lg items-center justify-center text-white hover:bg-sky-500 transition-colors cursor-pointer outline-none border-none"><span className="text-2xl font-black">→</span></button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    <div
                      ref={bodyScrollRef}
                      onScroll={e => {
                        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft;
                        if (window.innerWidth < 768) {
                          clearTimeout(scrollTimeout.current);
                          scrollTimeout.current = setTimeout(() => {
                            if (!bodyScrollRef.current) return;
                            const container = bodyScrollRef.current;
                            const scrollCenter = container.scrollLeft + container.clientWidth / 2;
                            let closestDate = pickedDate;
                            let minDistance = Infinity;
                            weekDays.forEach(dateStr => {
                              const el = document.getElementById(`mobile-col-${dateStr}`);
                              if (el) {
                                const dist = Math.abs(el.offsetLeft + el.clientWidth / 2 - scrollCenter);
                                if (dist < minDistance) { minDistance = dist; closestDate = dateStr; }
                              }
                            });
                            if (closestDate !== pickedDate) {
                              isSwipingRef.current = true;
                              setPickedDate(closestDate);
                            }
                          }, 150);
                        }
                      }}
                      className="relative flex overflow-x-auto gap-4 px-[12.5vw] md:px-0 pb-4 snap-x snap-mandatory md:snap-proximity pt-6 custom-scrollbar opacity-0 md:opacity-100 transition-opacity duration-300"
                    >
                      {weekDays.map((dateStr, i) => {
                        const isHiddenOnDesktop = i < 10 || i >= 10 + displayDaysCount;
                        const times = Object.keys(gridData[dateStr] || {}).sort();
                        const pickedIndex = weekDays.indexOf(pickedDate);
                        const showRealSlots = isGridExpanded || Math.abs(i - pickedIndex) <= 1;

                        return (
                          <div
                            id={`mobile-col-${dateStr}`}
                            key={dateStr}
                            className={`min-w-[75vw] max-w-[75vw] md:min-w-[220px] md:max-w-none flex-1 snap-center md:snap-start h-fit scroll-mt-32 md:scroll-mt-48 ${isHiddenOnDesktop ? 'md:hidden' : ''}`}
                          >
                            {showRealSlots ? (
                              <div className="flex flex-col gap-2 animate-in fade-in duration-500">
                                {times.length === 0 ? (
                                  <div className="bg-slate-50 rounded-lg py-8 border border-dashed border-slate-200 flex items-center justify-center">
                                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Complet</p>
                                  </div>
                                ) : (
                                  times.map(timeStr => {
                                    const capacity = gridData[dateStr][timeStr];
                                    const currentFlightKey = `${selectedFlight.id}|${dateStr}|${timeStr}`;
                                    const qtyInCart = cart[currentFlightKey] || 0;
                                    const isSelected = qtyInCart > 0;
                                    return (
                                      <div key={timeStr} className={`p-4 rounded-lg border transition-colors ${isSelected ? 'bg-sky-100 border-sky-400 shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                          <span className={`font-bold text-lg ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>{timeStr}</span>
                                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm border ${capacity > 0 ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                            {capacity} place{capacity > 1 ? 's' : ''}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                                          <button onClick={() => handleRemove(dateStr, timeStr)} disabled={qtyInCart === 0} className={`w-8 h-8 rounded font-bold text-lg flex items-center justify-center transition-colors ${qtyInCart === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'}`}>-</button>
                                          <span className={`font-bold text-lg w-8 text-center ${isSelected ? 'text-sky-700' : 'text-slate-700'}`}>{qtyInCart}</span>
                                          <button onClick={() => handleAdd(dateStr, timeStr)} disabled={capacity === 0} className={`w-8 h-8 rounded font-bold text-lg flex items-center justify-center transition-colors ${capacity === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-sky-500 text-white hover:bg-sky-600 shadow-sm'}`}>+</button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 opacity-0 pointer-events-none">
                                <div className="h-[90px] bg-slate-50 rounded-lg w-full" />
                                <div className="h-[90px] bg-slate-50 rounded-lg w-full" />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : FORMULAIRE PASSAGER ── */}
        {step === 3 && (
          <div id="etape-3-container" className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto mt-16 md:mt-24">
            <button onClick={() => setStep(2)} className="mb-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-600 hover:text-sky-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100 w-fit">
              ← Modifier le panier
            </button>

            <div className="bg-white rounded-[40px] shadow-2xl p-8 md:p-12 border border-slate-100">
              <div className="text-center mb-10 pb-10 border-b border-slate-100">
                <span className="text-6xl mb-6 block animate-bounce">📝</span>
                <h2 className="text-3xl font-black uppercase italic text-slate-900 leading-tight">Détails des passagers</h2>
                <p className="text-slate-500 font-medium mt-2">Dernière étape avant de voler !</p>
              </div>

              <VoucherSection
                appliedVoucher={appliedVoucher}
                discountAmount={discountAmount}
                onApply={handleApplyVoucher}
                onRemove={() => setAppliedVoucher(null)}
              />

              {/* Contact */}
              <div className="mb-12">
                <h3 className="font-black text-xl text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-slate-900 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">1</span>
                  Personne à contacter
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none text-slate-800" placeholder="Jean" value={contact.firstName} onChange={e => setContact({ ...contact, firstName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom</label>
                    <input type="text" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none text-slate-800" placeholder="Dupont" value={contact.lastName} onChange={e => setContact({ ...contact, lastName: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Téléphone (le jour du vol)</label>
                    <input type="tel" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none text-slate-800" placeholder="06 12 34 56 78" value={contact.phone} onChange={e => setContact({ ...contact, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
                    <input type="email" className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none text-slate-800" placeholder="jean@email.com" value={contact.email} onChange={e => setContact({ ...contact, email: e.target.value })} />
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Message / Remarque (Facultatif)</label>
                  <textarea
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 h-24 text-slate-800"
                    placeholder="Une information à transmettre au pilote ? (ex: cadeau surprise, problème auditif...)"
                    value={contact.notes}
                    onChange={e => setContact({ ...contact, notes: e.target.value })}
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer bg-sky-50 p-4 rounded-2xl border border-sky-100 hover:border-sky-300 transition-colors">
                  <input type="checkbox" className="w-5 h-5 accent-sky-500" checked={contact.isPassenger} onChange={e => setContact({ ...contact, isPassenger: e.target.checked })} />
                  <span className="font-bold text-sky-900 text-sm">Je suis aussi l'un des passagers (m'ajouter au vol)</span>
                </label>
              </div>

              {/* Passagers */}
              <div>
                <h3 className="font-black text-xl text-slate-900 mb-6 uppercase tracking-widest flex items-center gap-3">
                  <span className="bg-sky-500 text-white w-8 h-8 rounded-full flex items-center justify-center text-sm">2</span>
                  Les Passagers
                </h3>
                <div className="space-y-6">
                  {passengers.map((p, index) => (
                    <PassengerCard
                      key={p.id}
                      passenger={p}
                      index={index}
                      complementsList={complementsList}
                      appliedVoucher={appliedVoucher}
                      flights={flights}
                      onChange={handlePassengerChange}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── PANIER FLOTTANT ── */}
      {totalItems > 0 && (
        <CartBar
          cart={cart}
          flights={flights}
          totalItems={totalItems}
          originalPrice={originalPrice}
          discountAmount={discountAmount}
          finalPrice={finalPrice}
          step={step}
          isFormValid={isFormValid}
          isCheckingOut={isCheckingOut}
          onDecrement={handleDecrementCart}
          onDelete={handleDeleteCartItem}
          onNext={() => setStep(3)}
          onSubmit={handleSubmit}
        />
      )}

      {/* ── POPUP INFOS VOL ── */}
      {infoFlight && <InfoFlightModal flight={infoFlight} onClose={() => setInfoFlight(null)} />}
    </div>
  );
}
