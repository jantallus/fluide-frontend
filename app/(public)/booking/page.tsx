"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import type { FlightType, GiftCard, PublicSlot } from '@/lib/types';
import { useBookingData } from '@/hooks/useBookingData';
import { useAvailabilities } from '@/hooks/useAvailabilities';

// Passager avec les champs étendus propres au tunnel de réservation
interface BookingPassenger {
  id: string;
  flightKey: string;
  flightId: string;
  flightName: string;
  date: string;
  time: string;
  firstName: string;
  weightChecked: boolean;
  selectedComplements: number[];
  weight_min: number;
  weight_max: number;
}
import { useToast } from '@/components/ui/ToastProvider';
import { contactSchema } from '@/lib/schemas';
import { getLocalYYYYMMDD, getDayName, calculateGridStart, getMarketingInfo } from '@/lib/booking-utils';
import { useScrollLock } from '@/hooks/useScrollLock';
import { calculateBookingPrice } from '@/lib/price-utils';

export default function ReserverPage() {
  const { toast } = useToast();
  const headerScrollRef = useRef<HTMLDivElement>(null);
  const bodyScrollRef = useRef<HTMLDivElement>(null);
  const hasAnimatedIntro = useRef(false); // 🎯 NOUVEAU : Mémoire pour l'intro
  // 🎯 NOUVEAU : On mémorise si on est sur un autre site
  const [isEmbed, setIsEmbed] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.search.includes('embed=true')) {
      setIsEmbed(true);
    }
  }, []);

  const [selectedFlight, setSelectedFlight] = useState<FlightType | null>(null);
  const [step, setStep] = useState<number>(1);
  const [infoFlight, setInfoFlight] = useState<FlightType | null>(null);
  const scrollTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSwipingRef = useRef(false);
  const [isGridExpanded, setIsGridExpanded] = useState(false); // 🚀 LE TURBO : Mémoire d'expansion

  // 🎯 CORRECTION : On réinitialise les mémoires et on gère la hauteur de page (Sans remonter en haut !)
  useEffect(() => {
    if (step !== 2) {
      hasAnimatedIntro.current = false;
      setIsGridExpanded(false); 
    }
    
    // 🎯 On glisse PILE sur la zone de l'étape correspondante
    if (step === 2) {
      setTimeout(() => {
        const el = document.getElementById('etape-2-container');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100; // -100px pour éviter le bandeau
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
    } else if (step === 3) {
      setTimeout(() => {
        const el = document.getElementById('etape-3-container');
        if (el) {
          const y = el.getBoundingClientRect().top + window.scrollY - 100;
          window.scrollTo({ top: y, behavior: 'smooth' });
        }
      }, 50);
    }
  }, [step]);

  useScrollLock(!!infoFlight);

  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // pickedDate et gridStartDate déclarés avant les hooks pour que le callback onReady puisse les setter
  const [pickedDate, setPickedDate] = useState<string>(() => {
    const defaultDate = new Date();
    if (defaultDate.getHours() >= 12) defaultDate.setDate(defaultDate.getDate() + 1);
    return getLocalYYYYMMDD(defaultDate);
  });
  const [gridStartDate, setGridStartDate] = useState<string>('');

  // Données de base : vols, compléments, templates, saison, displayDaysCount
  const { flights, giftTemplates, complementsList, displayDaysCount, isLoading, activeSeason, setActiveSeason } = useBookingData(
    (dateStr, count) => {
      setPickedDate(dateStr);
      setGridStartDate(calculateGridStart(dateStr, count));
    }
  );

  // Disponibilités : se recharge automatiquement quand gridStartDate ou selectedFlight change
  const { rawSlots, isSearchingTimes } = useAvailabilities(gridStartDate, selectedFlight, displayDaysCount);

  const [cart, setCart] = useState<Record<string, number>>({});
  
  const [voucherInput, setVoucherInput] = useState('');
  const [appliedVoucher, setAppliedVoucher] = useState<GiftCard | null>(null);
  const [voucherError, setVoucherError] = useState('');
  const [isApplyingVoucher, setIsApplyingVoucher] = useState(false);
  const [contact, setContact] = useState({ firstName: '', lastName: '', phone: '', email: '', isPassenger: false, notes: '' });
  const [contactErrors, setContactErrors] = useState<Record<string, string>>({});
  const [passengers, setPassengers] = useState<BookingPassenger[]>([]);
  
  // 🎯 RÉFÉRENCES SÉCURISÉES POUR ÉVITER L'EFFET DOMINO (Double-clic)
  const selectedFlightRef = useRef(selectedFlight);
  useEffect(() => { selectedFlightRef.current = selectedFlight; }, [selectedFlight]);

  const cartRef = useRef(cart);
  useEffect(() => { cartRef.current = cart; }, [cart]);

  // 🎯 GESTION SÉCURISÉE DU BOUTON RETOUR
  useEffect(() => {
    const handlePopState = () => {
      const hash = window.location.hash;
      
      // On lit les références "secrètes" pour ne pas déclencher de rechargement en boucle
      const itemsInCart = Object.values(cartRef.current).reduce((sum: number, qty: number) => sum + qty, 0);
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
  }, []); // 🛑 AUCUNE DÉPENDANCE ICI : C'est le secret pour éviter le double clic !

  // 2. On met à jour l'URL (sans recharger) quand on change d'étape via vos boutons
  useEffect(() => {
    const expectedHash = step === 1 ? '' : `#etape-${step}`;
    const currentHash = window.location.hash;
    
    if (currentHash !== expectedHash) {
      const newUrl = step === 1 
        ? window.location.pathname + window.location.search 
        : window.location.pathname + window.location.search + expectedHash;
        
      window.history.pushState({ step }, '', newUrl);
    }
  }, [step]);
  

  useEffect(() => {
    if (step === 3) {
      const newPassengers: BookingPassenger[] = [];
      
      // 🎯 1. RECHERCHE ROBUSTE : On cherche l'option peu importe son nom (photo, vidéo, gopro...)
      const photoOption = complementsList.find(c => 
        c.name.toLowerCase().includes('photo') || 
        c.name.toLowerCase().includes('vidéo') || 
        c.name.toLowerCase().includes('video') || 
        c.name.toLowerCase().includes('gopro')
      );

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
            weight_min: flight?.weight_min ?? 20,
            weight_max: flight?.weight_max ?? 110,
          });
        }
      });
      
      setPassengers(prev => newPassengers.map((nP) => {
        const existing = prev.find(p => p.id === nP.id);
        const flight = flights.find(f => f.id.toString() === nP.flightId);
        
        // On récupère ce qui est déjà coché par l'utilisateur
        let currentComplements = existing ? [...(existing.selectedComplements || [])] : [];
        
        // 🎯 2. LA SOURCE UNIQUE DE VÉRITÉ : C'est ici que la magie opère !
        if (appliedVoucher && appliedVoucher.type === 'gift_card' && photoOption && flight) {
           // On vérifie que le bon est soit générique, soit lié à ce vol précis
           const isSameFlight = !appliedVoucher.flight_type_id || appliedVoucher.flight_type_id.toString() === nP.flightId;
           
           if (isSameFlight) {
             const vVal = Number(appliedVoucher.price_paid_cents) / 100;
             const fPri = flight.price_cents / 100;
             const pPri = photoOption.price_cents / 100;

             // Si la valeur du bon couvre [Vol + Photo] et que la photo n'est pas encore cochée
             if (vVal >= (fPri + pPri) && !currentComplements.includes(photoOption.id)) {
               currentComplements.push(photoOption.id);
             }
           }
        }

        return { 
          ...nP, 
          firstName: existing?.firstName || '', 
          weightChecked: existing?.weightChecked || false, 
          selectedComplements: currentComplements
        };
      }));
    }
  }, [step, cart, flights, appliedVoucher, complementsList]);

  useEffect(() => {
    if (contact.isPassenger && passengers.length > 0 && contact.firstName) {
      setPassengers(prev => {
        const newP = [...prev];
        if (!newP[0].firstName) newP[0].firstName = contact.firstName;
        return newP;
      });
    }
  }, [contact.isPassenger, contact.firstName]);

  // 🎯 L'ANIMATION CINÉMATIQUE (100% Horizontale, Ultra-Rapide, Sans Voile)
  useEffect(() => {
    // 🛑 SÉCURITÉ ABSOLUE : On refuse de jouer l'animation si on n'est pas sur l'étape 2
    if (step !== 2) return;

    if (!isSearchingTimes && rawSlots.length > 0 && bodyScrollRef.current) {
      
      // 🛑 SÉCURITÉ SWIPE : Si le client a glissé au doigt, on ne force pas le recentrage !
      if (isSwipingRef.current) {
        isSwipingRef.current = false; // On désarme le verrou
        setIsGridExpanded(true);
        return; 
      }

      const container = bodyScrollRef.current;
      const headerContainer = headerScrollRef.current;

      // 🛠️ Fonction de centrage 100% horizontale (AUCUN saut vertical !)
      const centerHorizontally = (el: HTMLElement, behavior: 'auto' | 'smooth') => {
        const pos = el.offsetLeft - (container.clientWidth / 2) + (el.clientWidth / 2);
        container.scrollTo({ left: pos, behavior });
      };

      // 🪄 On enlève le "voile blanc" (opacity-0) instantanément pour un ressenti immédiat
      container.classList.remove('opacity-0');
      if (headerContainer) headerContainer.classList.remove('opacity-0');

      if (window.innerWidth >= 768) {
        setTimeout(() => {
          const targetEl = document.getElementById(`mobile-col-${pickedDate}`);
          if (targetEl) centerHorizontally(targetEl, 'auto');
          setIsGridExpanded(true); 
        }, 10); // Instantané sur PC
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
            // Téléportation sur la veille
            centerHorizontally(startEl, 'auto');

            requestAnimationFrame(() => {
              setTimeout(() => {
                // Swipe pur et fluide vers le jour J
                centerHorizontally(targetEl, 'smooth');
                
                setTimeout(() => { 
                  container.style.scrollSnapType = ''; 
                  setIsGridExpanded(true); 
                }, 300); // On divise le temps d'attente par deux !
              }, 50); 
            });
          } else if (targetEl) {
             centerHorizontally(targetEl, 'auto');
             setIsGridExpanded(true);
          }
        }, 20);

      } else {
        // 🧭 NAVIGATION CLASSIQUE (Flèches ou calendrier)
        setTimeout(() => {
          const targetEl = document.getElementById(`mobile-col-${pickedDate}`);
          if (targetEl) centerHorizontally(targetEl, 'smooth');
          setTimeout(() => { setIsGridExpanded(true); }, 100);
        }, 20);
      }
    }
  }, [pickedDate, isSearchingTimes, rawSlots.length, step]); // 🎯 NOUVEAU : On a ajouté "step" ici pour forcer le réveil !

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

    // GridSlot étend PublicSlot avec 'booked_by_cart' — valeur interne utilisée
    // pour marquer les créneaux réservés dans le panier sans toucher au backend.
    type GridSlot = Omit<PublicSlot, 'status'> & { status: 'available' | 'booked' | 'booked_by_cart' | 'unavailable' };
    const monSchedules: Record<string, Record<number, GridSlot>> = {};
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
    
    // 🎯 2. LE MOTEUR CONSTRUIT 21 JOURS (-10 à +10)
    const weekDays = Array.from({ length: 21 }).map((_, i) => {
      const d = new Date(gridStartDate);
      d.setDate(d.getDate() - 10 + i);
      return getLocalYYYYMMDD(d);
    });
    weekDays.forEach(d => grid[d] = {});

    weekDays.forEach(dateStr => {
      if (!uniqueTimesByDate[dateStr]) return;
      Array.from(uniqueTimesByDate[dateStr]).forEach(timeStr => {
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
  }, [rawSlots, selectedFlight, cart, gridStartDate, flights, displayDaysCount]);

  const handleDatePick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setPickedDate(val);
    setGridStartDate(calculateGridStart(val, displayDaysCount));
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
    if (!selectedFlight) return;
    const key = `${selectedFlight.id}|${date}|${time}`;
    setCart(prev => ({ ...prev, [key]: (prev[key] || 0) + 1 }));
  };
  const handleRemove = (date: string, time: string) => {
    if (!selectedFlight) return;
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
  Object.values(cart).forEach(qty => { totalItems += qty; });

  const { originalPrice, discountAmount, finalPrice } = calculateBookingPrice(
    cart, flights, passengers, complementsList, appliedVoucher
  );

  useEffect(() => {
    if (step === 3 && totalItems === 0) setStep(1);
  }, [totalItems, step]);

  // 🎯 3. LA VARIABLE POUR DESSINER L'ÉCRAN (21 JOURS)
  const weekDays = Array.from({ length: 21 }).map((_, i) => {
    const d = new Date(gridStartDate);
    d.setDate(d.getDate() - 10 + i);
    return getLocalYYYYMMDD(d);
  });

  const filteredFlights = flights.filter(f => {
    const flightSeason = String(f.season || 'ALL').toUpperCase().trim(); 
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
      const res = await fetch(`/api/proxy/gift-cards/check/${voucherInput.trim()}`);
      
      if (!res.ok) {
        const errData = await res.json();
        setVoucherError(errData.message || "Code invalide ou expiré");
        setAppliedVoucher(null);
      } else {
        const data = await res.json();
        if (data.flight_type_id) {
          const hasRequiredFlight = Object.keys(cart).some(key => key.startsWith(`${data.flight_type_id}|`));
          if (!hasRequiredFlight) {
            setVoucherError(`Ce code n'est valable que pour la prestation : ${data.flight_name}`);
            setAppliedVoucher(null);
            setIsApplyingVoucher(false);
            return;
          }
        }

        // 🎯 ON S'ARRÊTE LÀ ! Le fait de changer cet état va "réveiller" le useEffect plus haut
        // qui se chargera de cocher la case tout seul comme un grand !
        setAppliedVoucher(data);
        setVoucherInput(''); 
      }
    } catch (err) {
      setVoucherError("Erreur de connexion.");
    } finally {
      setIsApplyingVoucher(false);
    }
  };

  const validateField = (field: string, value: string) => {
    const result = contactSchema.safeParse({ ...contact, [field]: value });
    if (!result.success) {
      const issue = result.error.issues.find(i => i.path[0] === field);
      setContactErrors(prev => ({ ...prev, [field]: issue?.message ?? '' }));
    } else {
      setContactErrors(prev => { const next = { ...prev }; delete next[field]; return next; });
    }
  };

  const handleSubmit = async () => {
    if (!isFormValid || isCheckingOut) return;

    const result = contactSchema.safeParse(contact);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.issues.forEach(issue => {
        const field = issue.path[0] as string;
        if (!fieldErrors[field]) fieldErrors[field] = issue.message;
      });
      setContactErrors(fieldErrors);
      return;
    }
    setContactErrors({});
    setIsCheckingOut(true);

    try {
      // 🎯 NOUVEAU : Formatage intelligent des prénoms pour les groupes
      const passengersToSubmit = passengers.map((p, index) => {
        let finalName = p.firstName.trim();
        
        // Si c'est un groupe (plus d'un passager)
        if (passengers.length > 1) {
          // On vérifie si ce passager est le contact principal (soit c'est le passager 1 coché, soit ils ont exactement le même prénom)
          const isContact = contact.isPassenger && (index === 0 || finalName.toLowerCase() === contact.firstName.trim().toLowerCase());
          
          if (!isContact) {
            // Si ce n'est pas le contact, on ajoute le nom du "chef de groupe" entre parenthèses !
            finalName = `${finalName} (${contact.firstName.trim()})`;
          }
        }
        
        // On retourne le passager avec son nouveau nom formaté
        return { ...p, firstName: finalName };
      });

      const res = await fetch(`/api/proxy/public/checkout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          contact, 
          passengers: passengersToSubmit, // 🚀 On envoie les noms formatés !
          voucher_code: appliedVoucher ? appliedVoucher.code : null
        })
      });

      const data = await res.json();
      
      if (data.url) {
        window.location.href = data.url;
      } else {
        toast.error("Erreur lors de la création du paiement : " + (data.error || "Inconnue"));
        setIsCheckingOut(false);
      }
    } catch (err) {
      console.error(err);
      toast.error("Erreur de connexion au serveur de paiement.");
      setIsCheckingOut(false);
    }
  };

  return (
    <div className="min-h-screen font-sans text-slate-900 overflow-clip" style={{ backgroundColor: '#F3F3F3' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @font-face { font-family: 'Aeonik'; src: url('/fonts/Aeonik-Light.woff2') format('woff2'); font-weight: 300; font-style: normal; font-display: swap; }
        @font-face { font-family: 'Aeonik'; src: url('/fonts/Aeonik-Regular.woff2') format('woff2'); font-weight: 400; font-style: normal; font-display: swap; }
        @font-face { font-family: 'Aeonik'; src: url('/fonts/Aeonik-Bold.woff2') format('woff2'); font-weight: 700; font-style: normal; font-display: swap; }
        body, * { font-family: 'Aeonik', sans-serif !important; }
        @keyframes ultraSmoothReveal { 0% { opacity: 0; transform: translateY(40px); } 100% { opacity: 1; transform: translateY(0); } }
        .hero-animation-block { will-change: transform, opacity; animation: ultraSmoothReveal 1s cubic-bezier(0.16, 1, 0.3, 1) forwards; animation-fill-mode: forwards; }
        .hero-booking { background: transparent !important; }
        .btn-reserver { background-color: #E6007E !important; color: white !important; border: none; transition: background-color 0.3s ease !important; }
        .btn-reserver:hover { background-color: #312783 !important; }
        @media (max-width: 1024px) {
          .hero-booking { height: 60vh !important; padding-left: 8vw !important; }
        }
      `}} />

      <section className="hero-booking" style={{
          position: 'relative', width: '100%', height: '64.75vh',
          display: 'flex', alignItems: 'center', paddingLeft: '10.6vw', paddingTop: '10.2vh',
          overflow: 'hidden',
        }}>
        {/* Couche 1 : photo en fond */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundImage: 'url(/hiver-hero.jpg)', backgroundSize: 'cover', backgroundPosition: 'center 25%', zIndex: 1 }} />
        {/* Couche 2 : dégradé radial — clair en bas à droite, bleu se diffusant vers la gauche */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'radial-gradient(ellipse at 85% 85%, rgba(20, 22, 140, 0.22) 0%, rgba(20, 22, 140, 0.78) 62%)', zIndex: 2 }} />
        {/* Couche 3 : renfort bleu à gauche pour la lisibilité du texte */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to right, rgba(15, 15, 110, 0.18) 0%, transparent 45%)', zIndex: 3 }} />
        {/* Couche 4 : assombrissement bas */}
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, background: 'linear-gradient(to top, rgba(0, 0, 0, 0.2) 0%, transparent 40%)', zIndex: 4 }} />
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ color: 'white', fontSize: 'clamp(2.72rem, 6.72vw, 4.35rem)', fontWeight: 700, margin: 0, lineHeight: 1.0, textTransform: 'none' }}>
            Réserver votre vol et<br />baptême de parapente<br />à La Clusaz
          </h1>
        </div>
      </section>

      <div className="relative z-20 max-w-7xl mx-auto px-4 pt-12 pb-48">
        
        {/* ÉTAPE 1 : CHOIX DU VOL */}
        {step === 1 && (
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* 🎯 SÉLECTEUR DE SAISON "COLLANT" (STICKY) */}
            <div className={`flex justify-center mb-12 sticky z-40 transition-all duration-300 ${isEmbed ? 'top-4' : 'top-20'}`}>
              <div className="bg-white/90 backdrop-blur-md p-1.5 rounded-2xl inline-flex shadow-xl border border-slate-200">
                <button aria-pressed={activeSeason === 'Standard'} onClick={() => setActiveSeason('Standard')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Standard' ? 'text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`} style={activeSeason === 'Standard' ? { backgroundColor: '#E6007E' } : {}}>☀️ Vols Été</button>
                <button aria-pressed={activeSeason === 'Hiver'} onClick={() => setActiveSeason('Hiver')} className={`px-6 py-3 rounded-xl font-black uppercase tracking-widest text-xs transition-all duration-300 ${activeSeason === 'Hiver' ? 'text-white shadow-md scale-105' : 'text-slate-500 hover:text-slate-800'}`} style={activeSeason === 'Hiver' ? { backgroundColor: '#312783' } : {}}>❄️ Vols Hiver</button>
              </div>
            </div>

            {/* 💡 BANDEAU DE RÉASSURANCE (ASTUCES FLUIDES) */}
          <div className="max-w-7xl mx-auto mb-12 rounded-[12px] p-6 shadow-sm backdrop-blur-sm" style={{ backgroundColor: 'rgba(49,39,131,0.04)', border: '1px solid rgba(49,39,131,0.1)' }}>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">

              <div className="flex items-start gap-4">
                <div className="text-3xl bg-white p-3 rounded-lg shadow-sm" style={{ border: '1px solid rgba(49,39,131,0.08)' }}>🎁</div>
                <div>
                  <h4 className="font-bold text-base mb-1" style={{ color: '#312783' }}>Bon Cadeau</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#1D1D1B' }}>
                    Vous avez un code cadeau, un code promo ? Inutile de le chercher maintenant, vous pourrez le saisir à la dernière étape, juste avant le paiement.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-3xl bg-white p-3 rounded-lg shadow-sm" style={{ border: '1px solid rgba(49,39,131,0.08)' }}>📸</div>
                <div>
                  <h4 className="font-bold text-base mb-1" style={{ color: '#312783' }}>Photos & Vidéos</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#1D1D1B' }}>
                    Option accessible plus tard dans le processus de réservation ! Pas complètement décidé ? Vous pourrez demander l'option directement à votre moniteur le jour J.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="text-3xl bg-white p-3 rounded-lg shadow-sm" style={{ border: '1px solid rgba(49,39,131,0.08)' }}>🎢</div>
                <div>
                  <h4 className="font-bold text-base mb-1" style={{ color: '#312783' }}>Sensations Fortes</h4>
                  <p className="text-sm leading-relaxed" style={{ color: '#1D1D1B' }}>
                    Envie d'acrobaties et de piloter un peu ? C'est inclus et 100% gratuit. Il suffira de le demander une fois en l'air !
                  </p>
                </div>
              </div>

            </div>
          </div>

            {isLoading ? (
              /* ☠️ EFFET "SKELETON" POUR LES CARTES DE VOLS */
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-12">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="bg-white rounded-[14px] p-8 border border-slate-100 flex flex-col justify-between animate-pulse">
                    {/* Fausse image */}
                    <div className="w-full h-40 md:h-52 bg-slate-200/60 rounded-2xl md:rounded-[20px] mb-6"></div>
                    
                    <div>
                      {/* Faux titre */}
                      <div className="h-8 bg-slate-200/80 rounded-xl w-3/4 mb-4"></div>
                      {/* Faux tags */}
                      <div className="flex gap-3 mb-6">
                        <div className="h-6 bg-slate-100 rounded-lg w-28"></div>
                        <div className="h-6 bg-slate-100 rounded-lg w-24"></div>
                      </div>
                      {/* Fausse saison */}
                      <div className="h-5 bg-slate-100 rounded-lg w-40 mb-4"></div>
                    </div>
                    
                    {/* Faux prix et bouton */}
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="h-10 bg-slate-200/80 rounded-xl w-20"></div>
                      <div className="h-12 bg-slate-200/50 rounded-2xl w-32"></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredFlights.length === 0 ? (
               <div className="text-center py-20 bg-white rounded-[14px] border border-slate-100"><span className="text-5xl block mb-4">🌬️</span><h3 className="text-xl font-bold" style={{ color: '#312783' }}>Aucun vol configuré pour cette saison</h3></div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredFlights.map((flight) => {
                  let displayedSeason = "🌍 Inclus dans toutes les saisons";
                  const s = String(flight.season || 'ALL').toUpperCase().trim();
                  if (s === 'SUMMER' || s === 'ETE' || s === 'ÉTÉ' || s === 'STANDARD') displayedSeason = "☀️ Uniquement sur la saison Été";
                  if (s === 'WINTER' || s === 'HIVER') displayedSeason = "❄️ Uniquement sur la saison Hiver";

                  return (
                  <div key={flight.id} className="bg-white rounded-[14px] p-8 border border-slate-100 cursor-pointer flex flex-col justify-between" style={{ '--hover-border': '#009FE3' } as React.CSSProperties} onMouseEnter={e => (e.currentTarget.style.borderColor = '#009FE3')} onMouseLeave={e => (e.currentTarget.style.borderColor = '')} onClick={() => { setSelectedFlight(flight); setStep(2); }}>
                    
                    {/* 🎯 NOUVEAU : LA SUPERBE PHOTO DU VOL */}
                    {flight.image_url && (
                      <div 
                        className="w-full h-40 md:h-52 bg-cover bg-center rounded-[10px] mb-6 border border-slate-100"
                        style={{ backgroundImage: `url(${flight.image_url})` }}
                      />
                    )}

                    <div>
                      <div className="flex justify-between items-start mb-3 gap-2">
                        <h3 className="text-2xl font-black" style={{ color: '#312783' }}>{flight.name}</h3>
                        
                        {/* On n'affiche le bouton 'i' que si vous l'avez activé et rempli dans le backoffice ! */}
                        {flight.show_popup && flight.popup_content && (
                          <button
                            onClick={(e) => { 
                              e.stopPropagation(); 
                              setInfoFlight(flight); 
                            }}
                            // 🎯 Bouton rendu transparent (bg-transparent) avec un contour subtil qui s'allume au survol
                            className="w-8 h-8 shrink-0 rounded-full bg-transparent text-slate-400 flex items-center justify-center transition-all border border-slate-200" onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(49,39,131,0.06)'; e.currentTarget.style.color = '#312783'; }} onMouseLeave={e => { e.currentTarget.style.backgroundColor = ''; e.currentTarget.style.color = ''; }}
                            title="Plus d'informations sur ce vol"
                          >
                            <span className="font-serif italic font-bold text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>i</span>
                          </button>
                        )}
                      </div>
                      <div className="flex gap-3 text-sm font-bold text-slate-500 mb-6">
                        <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{getMarketingInfo(flight.name)}</span>
                        <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">⚖️ {flight.weight_min !== undefined ? flight.weight_min : 20} - {flight.weight_max !== undefined ? flight.weight_max : 110} kg</span>
                      </div>
                      <div className="text-[10px] font-bold uppercase text-slate-400 mb-4 bg-slate-50 border border-slate-100 inline-block px-3 py-1 rounded-lg">
                        {displayedSeason}
                      </div>
                    </div>
                    <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between gap-2">
                      <div className="text-3xl md:text-4xl font-black shrink-0" style={{ color: '#E6007E' }}>{flight.price_cents ? flight.price_cents / 100 : 0}€</div>
                      <div className="flex gap-2 flex-wrap justify-end">
                        {(() => {
                          const matchedTpl = giftTemplates.find(t => t.price_cents === flight.price_cents);
                          if (!matchedTpl) return null;
                          return (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              window.location.href = `/bons-cadeaux?templateId=${matchedTpl.id}&flightName=${encodeURIComponent(flight.name)}`;
                            }}
                            className="cursor-pointer px-4 py-3 md:py-4 md:px-5 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all"
                            style={{ backgroundColor: 'rgba(230,0,126,0.1)', color: '#E6007E' }}
                            onMouseEnter={e => { e.currentTarget.style.backgroundColor = '#E6007E'; e.currentTarget.style.color = 'white'; }}
                            onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'rgba(230,0,126,0.1)'; e.currentTarget.style.color = '#E6007E'; }}
                          >
                            🎁 Offrir
                          </button>
                          );
                        })()}
                        <button className="btn-reserver cursor-pointer text-white px-4 py-3 md:px-6 md:py-4 rounded-[10px] font-bold text-sm" onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#312783')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#E6007E')}>
                          Réserver <span className="hidden md:inline">ce vol</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            )}
          </div>
        )}

        {/* ÉTAPE 2 : LA GRILLE DES JOURS */}
        {step === 2 && selectedFlight && (
          <div id="etape-2-container" className="animate-in fade-in slide-in-from-right-8 duration-500 mt-16 md:mt-24">
            <button onClick={() => setStep(1)} className="mb-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100 w-fit transition-colors" onMouseEnter={e => (e.currentTarget.style.color = '#312783')} onMouseLeave={e => (e.currentTarget.style.color = '')}>
              ← Retour au catalogue
            </button>
            
            <div className="bg-white rounded-[14px] p-6 md:p-10 border border-slate-200">
              
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10 pb-10 border-b border-slate-100">
                <div>
                  <div className="flex flex-wrap items-center gap-3">
                    <h2 className="text-3xl font-bold leading-tight" style={{ color: '#312783' }}>Réservation :</h2>
                    <div className="relative">
                      <select 
                        className="text-2xl md:text-3xl font-black bg-opacity-5 border-2 rounded-2xl py-1 pl-4 pr-10 outline-none cursor-pointer transition-all appearance-none shadow-sm" style={{ color: '#312783', backgroundColor: 'rgba(49,39,131,0.05)', borderColor: 'rgba(49,39,131,0.15)' }}
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
                      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-sm" style={{ color: '#312783' }}>▼</div>
                    </div>
                  </div>
                  <p className="font-bold uppercase tracking-widest text-sm mt-3" style={{ color: '#009FE3' }}>{getMarketingInfo(selectedFlight.name)}</p>
                </div>
                
                <div className="flex items-center gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-200 shrink-0">
                  {displayDaysCount < 5 && (
                    <button onClick={() => shiftDays(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm font-black text-slate-500 transition-colors">←</button>
                  )}
                  <span className="text-xs font-black uppercase text-slate-400 ml-2 hidden md:inline">
                    {displayDaysCount === 7 ? "Semaine du" : "À partir du"}
                  </span>
                  <input 
                    type="date" 
                    className="font-bold bg-transparent border-none p-2 outline-none cursor-pointer text-slate-700" 
                    value={pickedDate} 
                    onChange={handleDatePick} 
                  />
                  {displayDaysCount < 5 && (
                    <button onClick={() => shiftDays(1)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white shadow-sm font-black text-slate-500 transition-colors">→</button>
                  )}
                </div>
              </div>

              <div className={`transition-opacity duration-75 ${isSearchingTimes && rawSlots.length > 0 ? 'opacity-50 pointer-events-none' : ''}`}>
                
                {isSearchingTimes && rawSlots.length === 0 ? (
                  /* ☠️ EFFET "SKELETON" : Chargement initial ultra-pro */
                  <div className="flex overflow-hidden gap-4 px-[12.5vw] md:px-0 pt-6">
                    {Array.from({ length: displayDaysCount === 7 ? 7 : 5 }).map((_, i) => (
                      <div key={i} className="min-w-[75vw] md:min-w-[220px] flex-1 flex flex-col gap-3 animate-pulse">
                         {/* Faux header de jour */}
                         <div className="h-14 bg-slate-200/60 rounded-xl mb-4"></div>
                         {/* Fausses cases horaires */}
                         <div className="h-20 bg-slate-100 rounded-xl"></div>
                         <div className="h-20 bg-slate-100 rounded-xl"></div>
                         <div className="h-20 bg-slate-100/50 rounded-xl"></div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="relative">
                    {/* 🎯 LE BANDEAU DES JOURS (Esclave) */}
                    <div className={`sticky ${isEmbed ? 'top-0' : 'top-20'} z-40 bg-white/95 backdrop-blur-md pt-4 pb-4 border-b border-slate-200`}>
                      <div ref={headerScrollRef} className="flex overflow-hidden gap-4 px-[12.5vw] md:px-0 opacity-0 md:opacity-100 transition-opacity duration-300">
                        {weekDays.map((dateStr, i) => {
                          const isFirstDesktop = i === 10;
                          const isLastDesktop = i === 10 + displayDaysCount - 1;
                          const isHiddenOnDesktop = i < 10 || i >= 10 + displayDaysCount;
                          return (
                            <div key={`header-${dateStr}`} className={`min-w-[75vw] max-w-[75vw] md:min-w-[220px] md:max-w-none flex-1 flex gap-2 ${isHiddenOnDesktop ? 'md:hidden' : ''}`}>
                              {isFirstDesktop && (
                                <button onClick={() => shiftDays(-1)} className="hidden md:flex shrink-0 w-12 shadow-md rounded-lg items-center justify-center text-white transition-colors cursor-pointer outline-none border-none" style={{ backgroundColor: '#009FE3' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#312783')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#009FE3')}><span className="text-2xl font-black">←</span></button>
                              )}
                              <div className="flex-1 shadow-md rounded-lg p-4 flex flex-col items-center justify-center text-center" style={{ background: 'linear-gradient(135deg, #312783 0%, #1D1D1B 100%)' }}>
                                <p className="font-black text-white capitalize text-md leading-tight">{getDayName(dateStr)}</p>
                              </div>
                              {isLastDesktop && (
                                <button onClick={() => shiftDays(1)} className="hidden md:flex shrink-0 w-12 shadow-md rounded-lg items-center justify-center text-white transition-colors cursor-pointer outline-none border-none" style={{ backgroundColor: '#009FE3' }} onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#312783')} onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#009FE3')}><span className="text-2xl font-black">→</span></button>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* 🎯 LA ZONE DES CRÉNEAUX (Unique et Corrigée) */}
                    <div 
                      ref={bodyScrollRef}
                      onScroll={(e) => { 
                        if (headerScrollRef.current) headerScrollRef.current.scrollLeft = e.currentTarget.scrollLeft; 
                        
                        // 🎯 NOUVEAU : Synchronisation magique du Swipe (Uniquement sur mobile)
                        if (window.innerWidth < 768) {
                          clearTimeout(scrollTimeout.current ?? undefined);
                          scrollTimeout.current = setTimeout(() => {
                            if (!bodyScrollRef.current) return;
                            const container = bodyScrollRef.current;
                            const scrollCenter = container.scrollLeft + (container.clientWidth / 2);
                            
                            let closestDate = pickedDate;
                            let minDistance = Infinity;
                            
                            // On cherche quelle carte de jour est la plus proche du centre de l'écran
                            weekDays.forEach(dateStr => {
                              const el = document.getElementById(`mobile-col-${dateStr}`);
                              if (el) {
                                const elCenter = el.offsetLeft + (el.clientWidth / 2);
                                const distance = Math.abs(elCenter - scrollCenter);
                                if (distance < minDistance) {
                                  minDistance = distance;
                                  closestDate = dateStr;
                                }
                              }
                            });
                            
                            // Si le jour au centre a changé, on met à jour le calendrier silencieusement
                            if (closestDate !== pickedDate) {
                              isSwipingRef.current = true; // On active le verrou anti-rebond
                              setPickedDate(closestDate);
                            }
                          }, 150); // Un délai de 150ms pour laisser le doigt finir son mouvement
                        }
                      }}
                      className="relative flex overflow-x-auto gap-4 px-[12.5vw] md:px-0 pb-4 snap-x snap-mandatory md:snap-proximity pt-6 custom-scrollbar opacity-0 md:opacity-100 transition-opacity duration-300"
                    >
                      {weekDays.map((dateStr, i) => {
                        const isHiddenOnDesktop = i < 10 || i >= 10 + displayDaysCount;
                        const times = Object.keys(gridData[dateStr] || {}).sort();
                        const pickedIndex = weekDays.indexOf(pickedDate);
                        const diffIndex = Math.abs(i - pickedIndex);
                        const showRealSlots = isGridExpanded || diffIndex <= 1;

                        return (
                          <div 
                            id={`mobile-col-${dateStr}`} 
                            key={dateStr} 
                            // 🚀 LA MARGE MAGIQUE : scroll-mt-32 (128px) ou scroll-mt-48 (192px)
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
                                      <div key={timeStr} className={`p-4 rounded-lg border transition-colors ${isSelected ? 'shadow-sm' : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'}`} style={isSelected ? { backgroundColor: 'rgba(49,39,131,0.08)', borderColor: '#312783' } : {}}>
                                        <div className="flex justify-between items-center mb-4">
                                          <span className={`font-bold text-lg ${isSelected ? '' : 'text-slate-700'}`} style={isSelected ? { color: '#312783' } : {}}>{timeStr}</span>
                                          <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded shadow-sm border ${capacity > 0 ? 'bg-fuchsia-50 text-fuchsia-600 border-fuchsia-200' : 'bg-rose-50 text-rose-500 border-rose-100'}`}>
                                            {capacity} place{capacity > 1 ? 's' : ''}
                                          </span>
                                        </div>
                                        <div className="flex items-center justify-between border-t border-slate-200/60 pt-3">
                                          <button
                                            aria-label={`Retirer un passager – ${getDayName(dateStr)} à ${timeStr}`}
                                            onClick={() => handleRemove(dateStr, timeStr)}
                                            disabled={qtyInCart === 0}
                                            className={`w-8 h-8 rounded font-bold text-lg flex items-center justify-center transition-colors ${qtyInCart === 0 ? 'text-slate-300 cursor-not-allowed' : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 shadow-sm'}`}
                                          >-</button>
                                          <span aria-live="polite" aria-label={`${qtyInCart} passager${qtyInCart > 1 ? 's' : ''} sélectionné${qtyInCart > 1 ? 's' : ''}`} className="font-bold text-lg w-8 text-center" style={isSelected ? { color: '#312783' } : { color: '#334155' }}>{qtyInCart}</span>
                                          <button
                                            aria-label={`Ajouter un passager – ${getDayName(dateStr)} à ${timeStr}`}
                                            onClick={() => handleAdd(dateStr, timeStr)}
                                            disabled={capacity === 0}
                                            className={`w-8 h-8 rounded font-bold text-lg flex items-center justify-center transition-colors ${capacity === 0 ? 'text-slate-300 cursor-not-allowed' : 'text-white shadow-sm'}`}
                                            style={capacity > 0 ? { backgroundColor: '#009FE3' } : {}}
                                            onMouseEnter={e => { if (capacity > 0) e.currentTarget.style.backgroundColor = '#312783'; }}
                                            onMouseLeave={e => { if (capacity > 0) e.currentTarget.style.backgroundColor = '#009FE3'; }}
                                          >+</button>
                                        </div>
                                      </div>
                                    );
                                  })
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col gap-2 opacity-0 pointer-events-none">
                                <div className="h-[90px] bg-slate-50 rounded-lg w-full"></div>
                                <div className="h-[90px] bg-slate-50 rounded-lg w-full"></div>
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

        {/* ÉTAPE 3 : FORMULAIRE PASSAGER */}
        {step === 3 && (
          <div id="etape-3-container" className="animate-in fade-in slide-in-from-right-8 duration-500 max-w-3xl mx-auto mt-16 md:mt-24">
            <button onClick={() => setStep(2)} className="mb-6 bg-white/80 backdrop-blur-sm px-4 py-2 rounded-xl text-slate-600 font-black text-xs uppercase tracking-widest flex items-center gap-2 shadow-sm border border-slate-100 w-fit transition-colors" onMouseEnter={e => (e.currentTarget.style.color = '#312783')} onMouseLeave={e => (e.currentTarget.style.color = '')}>
              ← Modifier le panier
            </button>

            <div className="bg-white rounded-[14px] p-8 md:p-12 border border-slate-100">
              
              <div className="text-center mb-10 pb-10 border-b border-slate-100">
                <span className="text-6xl mb-6 block animate-bounce">📝</span>
                <h2 className="text-3xl font-bold leading-tight" style={{ color: '#312783' }}>Détails des passagers</h2>
                <p className="text-slate-500 font-medium mt-2">Dernière étape avant de voler !</p>
              </div>

              {/* 🎯 NOUVEAU : LA SECTION BON CADEAU EST MAINTENANT TOUT EN HAUT ! */}
              {/* 🎯 SECTION BON CADEAU (Douce et Rassurante) */}
              <div className="mb-12 border-2 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm" style={{ backgroundColor: 'rgba(49,39,131,0.04)', borderColor: 'rgba(49,39,131,0.2)' }}>
                <div className="absolute -right-6 -top-6 text-9xl opacity-10 pointer-events-none">🎁</div>
                
                <h3 className="font-bold text-xl mb-2 flex items-center gap-3 relative z-10" style={{ color: '#312783' }}>
                  Vous avez un bon cadeau ou un code promo ?
                </h3>
                <p className="font-bold mb-6 text-sm relative z-10" style={{ color: '#312783', opacity: 0.8 }}>
                  Saisissez-le ici. La réduction s'appliquera immédiatement sur votre total avant le paiement.
                </p>

                {appliedVoucher ? (
                  <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shadow-sm">
                    <div>
                      <p className="font-black text-emerald-900 uppercase tracking-widest text-sm">
                        ✅ {appliedVoucher.type === 'promo' ? 'Code Promo appliqué' : 'Bon cadeau activé !'}
                      </p>
                      <p className="text-emerald-700 font-bold mt-1">
                        Code : <span className="uppercase">{appliedVoucher.code}</span>
                      </p>
                    </div>
                    <div className="text-left md:text-right w-full md:w-auto">
                      <p className="text-3xl font-black text-emerald-600">
                        - {discountAmount.toFixed(2)} €
                      </p>
                      <button onClick={() => setAppliedVoucher(null)} className="text-[10px] font-black uppercase text-rose-500 mt-2 hover:underline">
                        Retirer le code
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="relative z-10">
                    <div className="flex flex-col md:flex-row gap-3">
                      <input
                        type="text"
                        placeholder="Ex: FLUIDE-1234 ou NOEL2024"
                        className="flex-1 bg-white border-2 rounded-2xl p-4 font-black uppercase text-slate-800 outline-none transition-colors shadow-sm" style={{ borderColor: 'rgba(49,39,131,0.15)' }}
                        value={voucherInput}
                        onChange={e => setVoucherInput(e.target.value.toUpperCase())}
                      />
                      <button 
                        onClick={handleApplyVoucher}
                        disabled={isApplyingVoucher || !voucherInput.trim()}
                        className={`px-8 py-4 md:py-0 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${!voucherInput.trim() || isApplyingVoucher ? 'text-slate-400' : 'text-white shadow-md hover:-translate-y-0.5'}`} style={!voucherInput.trim() || isApplyingVoucher ? { backgroundColor: 'rgba(49,39,131,0.1)' } : { backgroundColor: '#312783' }}
                      >
                        {isApplyingVoucher ? '...' : 'Appliquer'}
                      </button>
                    </div>
                    {/* 🎯 On remplace le rouge par du violet et la croix par un "i" */}
                    {voucherError && <p className="text-violet-600 font-bold text-sm mt-3 flex items-center gap-2"><span>ℹ️</span> {voucherError}</p>}
                  </div>
                )}
              </div>

              {/* SECTION 1 : CONTACT */}
              <div className="mb-12">
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3" style={{ color: '#312783' }}>
                  <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#312783' }}>1</span>
                  Personne à contacter
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom</label>
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border-2 rounded-2xl p-4 font-bold focus:border-[#312783] outline-none text-slate-800 ${contactErrors.firstName ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}
                      placeholder="Jean"
                      value={contact.firstName}
                      onChange={e => { setContact({...contact, firstName: e.target.value}); if (contactErrors.firstName) validateField('firstName', e.target.value); }}
                    />
                    {contactErrors.firstName && <p className="text-rose-500 text-[11px] font-bold mt-1 ml-2">{contactErrors.firstName}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Nom</label>
                    <input
                      type="text"
                      className={`w-full bg-slate-50 border-2 rounded-2xl p-4 font-bold focus:border-[#312783] outline-none text-slate-800 ${contactErrors.lastName ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}
                      placeholder="Dupont"
                      value={contact.lastName}
                      onChange={e => { setContact({...contact, lastName: e.target.value}); if (contactErrors.lastName) validateField('lastName', e.target.value); }}
                    />
                    {contactErrors.lastName && <p className="text-rose-500 text-[11px] font-bold mt-1 ml-2">{contactErrors.lastName}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Téléphone (le jour du vol)</label>
                    <input
                      type="tel"
                      className={`w-full bg-slate-50 border-2 rounded-2xl p-4 font-bold focus:border-[#312783] outline-none text-slate-800 ${contactErrors.phone ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}
                      placeholder="06 12 34 56 78"
                      value={contact.phone}
                      onChange={e => { setContact({...contact, phone: e.target.value}); if (contactErrors.phone) validateField('phone', e.target.value); }}
                      onBlur={e => { if (e.target.value) validateField('phone', e.target.value); }}
                    />
                    {contactErrors.phone && <p className="text-rose-500 text-[11px] font-bold mt-1 ml-2">{contactErrors.phone}</p>}
                  </div>
                  <div>
                    <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Email</label>
                    <input
                      type="email"
                      className={`w-full bg-slate-50 border-2 rounded-2xl p-4 font-bold focus:border-[#312783] outline-none text-slate-800 ${contactErrors.email ? 'border-rose-400 bg-rose-50' : 'border-slate-100'}`}
                      placeholder="jean@email.com"
                      value={contact.email}
                      onChange={e => { setContact({...contact, email: e.target.value}); if (contactErrors.email) validateField('email', e.target.value); }}
                      onBlur={e => { if (e.target.value) validateField('email', e.target.value); }}
                    />
                    {contactErrors.email && <p className="text-rose-500 text-[11px] font-bold mt-1 ml-2">{contactErrors.email}</p>}
                  </div>
                </div>

                <div className="mb-6">
                  <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Message / Remarque (Facultatif)</label>
                  <textarea 
                    className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-[#312783] h-24 text-slate-800"
                    placeholder="Une information à transmettre au pilote ? (ex: cadeau surprise, problème auditif...)"
                    value={contact.notes}
                    onChange={e => setContact({...contact, notes: e.target.value})}
                  />
                </div>

                <label className="flex items-center gap-3 cursor-pointer p-4 rounded-2xl border transition-colors" style={{ backgroundColor: 'rgba(0,159,227,0.06)', borderColor: 'rgba(0,159,227,0.2)' }}>
                  <input type="checkbox" className="w-5 h-5" style={{ accentColor: '#009FE3' }} checked={contact.isPassenger} onChange={e => setContact({...contact, isPassenger: e.target.checked})} />
                  <span className="font-bold text-sm" style={{ color: '#312783' }}>Je suis aussi l'un des passagers (m'ajouter au vol)</span>
                </label>
              </div>

              {/* SECTION 2 : PASSAGERS */}
              <div>
                <h3 className="font-bold text-xl mb-6 flex items-center gap-3" style={{ color: '#312783' }}>
                  <span className="text-white w-8 h-8 rounded-full flex items-center justify-center text-sm" style={{ backgroundColor: '#009FE3' }}>2</span>
                  Les passagers
                </h3>

                <div className="space-y-6">
                  {passengers.map((p, index) => (
                    <div key={p.id} className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative overflow-hidden group">
                      <div className="absolute top-0 left-0 w-2 h-full" style={{ backgroundColor: '#009FE3' }}></div>
                      
                      <div className="flex flex-wrap items-center gap-3 mb-5">
                        <h4 className="font-black text-lg text-slate-900">Passager {index + 1}</h4>
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
                          {p.flightName} • {getDayName(p.date)} à {p.time}
                        </span>
                      </div>

                      <div className="mb-4">
                        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom de la personne qui vole</label>
                        <input 
                          type="text" 
                          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-[#312783] outline-none text-slate-800" 
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
                            {complementsList.map((comp) => {
                              const isSelected = p.selectedComplements?.includes(comp.id) || false;
                              
                              // 🎯 NOUVEAU : On vérifie si cette option est couverte par le bon cadeau
                              let isLockedByVoucher = false;
                              const currentFlight = flights.find(f => f.id.toString() === p.flightId);
                              
                              if (appliedVoucher && appliedVoucher.type === 'gift_card' && currentFlight) {
                                const isSameFlight = !appliedVoucher.flight_type_id || appliedVoucher.flight_type_id.toString() === p.flightId;
                                if (isSameFlight) {
                                  const vVal = Number(appliedVoucher.price_paid_cents) / 100;
                                  const fPri = currentFlight.price_cents / 100;
                                  const pPri = comp.price_cents / 100;
                                  // Si le bon paie le vol + cette option, on verrouille !
                                  if (vVal >= (fPri + pPri)) {
                                    isLockedByVoucher = true;
                                  }
                                }
                              }

                              return (
                                <label 
                                  key={comp.id} 
                                  // On grise légèrement et on met un curseur "interdit" si c'est verrouillé
                                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${isLockedByVoucher ? 'opacity-80 cursor-not-allowed' : 'cursor-pointer'} ${isSelected && !isLockedByVoucher ? 'bg-slate-50' : (!isLockedByVoucher ? 'bg-slate-50 border-slate-100' : '')}`}
                                  style={
                                    isLockedByVoucher ? { backgroundColor: 'rgba(49,39,131,0.04)', borderColor: 'rgba(49,39,131,0.2)' } :
                                    isSelected ? { borderColor: '#312783', backgroundColor: 'rgba(49,39,131,0.05)' } : {}
                                  }
                                >
                                  <input 
                                    type="checkbox" 
                                    className={`w-6 h-6 mt-0.5 accent-sky-500 ${isLockedByVoucher ? 'cursor-not-allowed' : 'cursor-pointer'}`} 
                                    checked={isSelected}
                                    disabled={isLockedByVoucher} // 🔒 Blocage physique du clic
                                    onChange={(e) => {
                                      if (isLockedByVoucher) return; // 🔒 Double sécurité
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
                                  <div className="flex-1 flex items-center gap-4">
                                    {comp.image_url && (
                                      <div className={`w-10 h-10 shrink-0 bg-white rounded-lg p-1 border flex items-center justify-center shadow-sm ${isLockedByVoucher ? 'border-sky-200' : 'border-slate-200'}`}>
                                        <img src={comp.image_url} alt={comp.name} className="w-full h-full object-contain" />
                                      </div>
                                    )}
                                    
                                    <div>
                                      <span className={`font-bold block ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                                        {/* 🎯 NOUVEAU : On remplace le prix par un texte rassurant ! */}
                                        {comp.name} <span className={isLockedByVoucher ? 'text-emerald-600' : ''}>
                                          {isLockedByVoucher ? '(Inclus dans le Bon)' : `(+${comp.price_cents / 100}€)`}
                                        </span>
                                      </span>
                                      {comp.description && (
                                        <span className="text-xs text-slate-500 mt-1 block leading-tight">
                                          {comp.description}
                                        </span>
                                      )}
                                    </div>
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
          </div>
        )}
      </div>

      {/* --- LE PANIER FLOTTANT --- */}
      {totalItems > 0 && (step === 1 || step === 2 || step === 3) && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] z-[100] animate-in slide-in-from-bottom-full">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
            
            <div className="flex-1 w-full">
              <span className="font-bold text-lg block mb-2" style={{ color: '#312783' }}>
                {totalItems} vol{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
              </span>
              
              <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
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
                {/* 🎯 NOUVEAU : Si un bon est appliqué, on affiche l'ancien prix barré ! */}
                {discountAmount > 0 && (
                  <p className="text-sm font-bold text-rose-400 line-through mb-[-4px]">{originalPrice.toFixed(2)} €</p>
                )}
                <p className="text-2xl font-black" style={{ color: '#009FE3' }}>{finalPrice.toFixed(2)} €</p>
              </div>
              
              {step === 3 ? (
                 <button 
                  onClick={handleSubmit}
                  disabled={!isFormValid || isCheckingOut}
                  className={`flex-1 md:flex-none px-8 md:px-10 py-4 rounded-2xl font-black uppercase text-[11px] md:text-[12px] tracking-widest transition-all shadow-lg ${isFormValid && !isCheckingOut ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-1 shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
                >
                  {isCheckingOut 
                    ? 'Validation...' 
                    : (finalPrice === 0 ? '✨ Valider (Gratuit)' : '🔒 Payer la réservation')}
                </button>
              ) : (
                <button
                  onClick={() => setStep(3)}
                  className="flex-1 md:flex-none text-white px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest transition-all shadow-lg"
                  style={{ backgroundColor: '#312783' }}
                  onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#E6007E')}
                  onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#312783')}
                >
                  Passer à l'inscription →
                </button>
              )}
            </div>

          </div>
        </div>
      )}
      {/* 🎯 POPUP D'INFORMATION SUR LE VOL */}
      {infoFlight && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in" onClick={() => setInfoFlight(null)}>

          {/* role="dialog" + aria-modal indique aux lecteurs d'écran que c'est une fenêtre modale */}
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby="info-flight-dialog-title"
            className="bg-white rounded-[30px] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95"
            onClick={e => e.stopPropagation()}
          >
            
            {/* 🎯 2. L'en-tête (Fixe en haut) */}
            <div className="p-6 md:p-8 pb-4 shrink-0 flex justify-between items-start border-b border-slate-100">
              {/* Le pr-4 (padding-right) empêche le titre de déborder sur la croix */}
              <h3 id="info-flight-dialog-title" className="text-2xl font-bold pr-4" style={{ color: '#312783' }}>À propos de ce vol</h3>
              
              <button 
                onClick={() => setInfoFlight(null)} 
                className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors shrink-0 cursor-pointer active:scale-95"
                aria-label="Fermer"
              >
                {/* 🎯 Une vraie icône vectorielle au lieu d'un caractère texte */}
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* 🎯 3. Le contenu (Avec défilement interne activé via overflow-y-auto) */}
            <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
              
              <div className="relative prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap font-medium leading-relaxed bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 overflow-hidden shadow-inner">
                
                {/* 🎯 4. Le filigrane ultra-léger (10% d'opacité) placé en arrière-plan du texte */}
                {infoFlight.image_url && (
                  <div 
                    className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none" 
                    style={{ backgroundImage: `url(${infoFlight.image_url})` }} 
                  />
                )}
                
                {/* Le texte formaté par-dessus le filigrane */}
                <div className="relative z-10 text-base">
                  {infoFlight.popup_content && infoFlight.popup_content.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) => 
                    part.startsWith('**') && part.endsWith('**') 
                      ? <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong> 
                      : part
                  )}
                </div>
              </div>
              
              <button
                onClick={(e) => { e.stopPropagation(); setInfoFlight(null); }}
                className="mt-8 w-full text-white py-4 rounded-xl font-black uppercase tracking-widest transition-colors shadow-md shrink-0 active:scale-[0.98]"
                style={{ backgroundColor: '#312783' }}
                onMouseEnter={e => (e.currentTarget.style.backgroundColor = '#009FE3')}
                onMouseLeave={e => (e.currentTarget.style.backgroundColor = '#312783')}
              >
                J'ai compris
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}