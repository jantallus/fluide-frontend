"use client";
import React, { useState, useEffect, useMemo, useRef } from 'react';
import { apiFetch } from '../../../lib/api';

const extractVoucherCode = (status: string) => {
  if (!status) return null;
  const match = status.match(/(?:Code|Promo|Cadeau)\s*:\s*([a-zA-Z0-9_-]+)/i);
  return match ? match[1].toUpperCase() : null;
};

const MultiSelectDropdown = ({ label, icon, options, selected, onChange }: any) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    if (isOpen) document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative w-full" ref={dropdownRef}>
      <div 
        onClick={() => setIsOpen(!isOpen)} 
        className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs cursor-pointer flex justify-between items-center hover:border-sky-200 transition-colors"
      >
        <span className="truncate text-slate-700">
          {icon} {selected.length === 0 ? label : `${selected.length} sélectionné(s)`}
        </span>
        <span className="text-slate-400 text-[10px]">{isOpen ? '▲' : '▼'}</span>
      </div>
      
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-200 rounded-2xl shadow-xl z-50 max-h-64 overflow-y-auto p-2 flex flex-col gap-1 animate-in fade-in">
          {options.map((o: any, idx: number) => (
            <label key={idx} className="flex items-center gap-3 p-2 hover:bg-slate-50 cursor-pointer rounded-xl text-xs font-bold text-slate-700 transition-colors">
              <input 
                type="checkbox" 
                className="w-4 h-4 accent-sky-500 rounded cursor-pointer" 
                checked={selected.includes(o.value)} 
                onChange={(e) => {
                  if (e.target.checked) onChange([...selected, o.value]);
                  else onChange(selected.filter((x: string) => x !== o.value));
                }} 
              />
              {o.label}
            </label>
          ))}
          {options.length === 0 && <p className="text-xs text-center text-slate-400 p-2">Aucune option</p>}
        </div>
      )}
    </div>
  );
};

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  
  const [filterMonitors, setFilterMonitors] = useState<string[]>([]);
  const [filterFlights, setFilterFlights] = useState<string[]>([]);
  const [filterPayments, setFilterPayments] = useState<string[]>([]);
  
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [filtersLoaded, setFiltersLoaded] = useState(false);

  // 1. CHARGEMENT DE LA MÉMOIRE AU DÉMARRAGE
  useEffect(() => {
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = `fluide_filters_${user?.id || 'default'}`; 
      const saved = localStorage.getItem(key);
      
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.filterMonitors) setFilterMonitors(parsed.filterMonitors);
        if (parsed.filterFlights) setFilterFlights(parsed.filterFlights);
        if (parsed.filterPayments) setFilterPayments(parsed.filterPayments);
        if (parsed.filterStartDate) setFilterStartDate(parsed.filterStartDate);
        if (parsed.filterEndDate) setFilterEndDate(parsed.filterEndDate);
        if (parsed.search) setSearch(parsed.search);
      }
    } catch (e) { console.error("Erreur chargement filtres", e); }
    
    // 🎯 LA CORRECTION EST ICI : 
    // On bloque la sauvegarde pendant 500ms au démarrage.
    // Ça empêche l'app d'écraser la mémoire avec du "vide" quand on l'ouvre à froid !
    setTimeout(() => {
      setFiltersLoaded(true); 
    }, 500);
  }, []);

  // 2. SAUVEGARDE AUTOMATIQUE À CHAQUE CLIC
  useEffect(() => {
    if (!filtersLoaded) return; // Ne sauvegarde rien les premières 500 millisecondes
    try {
      const userStr = localStorage.getItem('user');
      const user = userStr ? JSON.parse(userStr) : null;
      const key = `fluide_filters_${user?.id || 'default'}`;
      
      const filtersToSave = { filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search };
      localStorage.setItem(key, JSON.stringify(filtersToSave));
    } catch (e) {}
  }, [filterMonitors, filterFlights, filterPayments, filterStartDate, filterEndDate, search, filtersLoaded]);

  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'monitor' | 'payment' | null>(null);
  const [tempMonitorId, setTempMonitorId] = useState<string>("");
  const [tempPayMethod, setTempPayMethod] = useState<string>("CB");
  const [tempPayAmount, setTempPayAmount] = useState<number>(0);
  const [tempPayCode, setTempPayCode] = useState<string>("");
  
  const [giftCards, setGiftCards] = useState<any[]>([]);

  const usedPromoCodes = useMemo(() => {
    const codes = new Set<string>();
    clients.forEach(c => {
      c.flights.forEach((f: any) => {
        if (f.payment_status && f.payment_status.includes('Promo')) {
          const code = extractVoucherCode(f.payment_status);
          if (code) codes.add(code);
        }
      });
    });
    return Array.from(codes).sort();
  }, [clients]);

  const monitorOptions = monitors.map(m => ({ label: m.first_name, value: m.first_name }));
  const flightOptions = flightTypes.map(f => ({ label: f.name, value: f.name }));
  const paymentOptions = [
    { label: "🏢 À régler sur place", value: "backoffice" },
    { label: "💳 Payés en CB", value: "cb" },
    { label: "🎁 Bons Cadeaux", value: "cadeau" },
    { label: "🏷️ Tous les Codes Promos", value: "promo" },
    ...usedPromoCodes.map(code => ({ label: `🤝 Partenaire : ${code}`, value: `partenaire_${code}` }))
  ];

  const saveQuickEdit = async (slotId: number, clientId: number) => {
    let payload: any = {};
    let newPaymentStatus = "";
    
    if (editType === 'monitor') {
      payload.monitor_id = tempMonitorId;
    } else if (editType === 'payment') {
      if (tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') {
        const codeText = tempPayCode ? ` - Code: ${tempPayCode.toUpperCase()}` : '';
        newPaymentStatus = `Payé sur place (${tempPayMethod}${codeText} - ${tempPayAmount}€)`;
      } else {
        newPaymentStatus = `Payé sur place (${tempPayMethod} - ${tempPayAmount}€)`;
      }
      payload.payment_status = newPaymentStatus;
    }
    
    try {
      const res = await apiFetch(`/api/slots/${slotId}/quick`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        setClients(prev => prev.map(c => {
          if (c.id === clientId) {
            const newFlights = c.flights.map((f: any) => {
              if (f.id === slotId) {
                if (editType === 'monitor') {
                  const m = monitors.find(x => x.id.toString() === tempMonitorId);
                  return { ...f, monitor_id: tempMonitorId, monitor_name: m ? m.first_name : 'Non assigné' };
                } else {
                  return { ...f, payment_status: newPaymentStatus };
                }
              }
              return f;
            });
            return { ...c, flights: newFlights };
          }
          return c;
        }));
        setEditingSlotId(null);
        setEditType(null);
      } else {
        const errorData = await res.json();
        alert("❌ Impossible : " + (errorData.error || "Erreur de modification"));
      }
    } catch (err) { console.error(err); }
  };

 useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resM, resF, resG] = await Promise.all([
          apiFetch('/api/clients'),
          apiFetch('/api/monitors'),
          apiFetch('/api/flight-types'),
          apiFetch('/api/gift-cards') 
        ]);
        if (resC.ok) setClients(await resC.json());
        if (resM.ok) setMonitors(await resM.json());
        if (resF.ok) setFlightTypes(await resF.json());
        if (resG.ok) setGiftCards(await resG.json()); 
      } catch (err) { console.error("Erreur chargement:", err); }
    };
    fetchData();
  }, []);

  const filtered = clients.map(c => {
    const matchingFlights = c.flights.filter((f: any) => {
      const matchMon = filterMonitors.length === 0 || filterMonitors.includes(f.monitor_name);
      const matchFli = filterFlights.length === 0 || filterFlights.includes(f.flight_name);
      
      let matchPay = filterPayments.length === 0;
      if (filterPayments.length > 0) {
        matchPay = filterPayments.some(fp => {
          if (fp === 'backoffice') return !f.payment_status;
          if (fp === 'cadeau') return !!f.payment_status && f.payment_status.includes('Bon Cadeau');
          if (fp === 'cb') return !!f.payment_status && f.payment_status.includes('CB');
          if (fp === 'promo') return !!f.payment_status && f.payment_status.includes('Promo');
          if (fp.startsWith('partenaire_')) {
            const codeToMatch = fp.replace('partenaire_', '');
            return !!f.payment_status && f.payment_status.includes('Promo') && f.payment_status.toUpperCase().includes(codeToMatch);
          }
          return false;
        });
      }

      let matchStart = true;
      if (filterStartDate) {
        const s = new Date(filterStartDate);
        s.setHours(0, 0, 0, 0);
        matchStart = new Date(f.start_time) >= s;
      }
      let matchEnd = true;
      if (filterEndDate) {
        const e = new Date(filterEndDate);
        e.setHours(23, 59, 59, 999);
        matchEnd = new Date(f.start_time) <= e;
      }
      return matchMon && matchFli && matchPay && matchStart && matchEnd;
    });
    return { ...c, flights: matchingFlights };
  }).filter(c => {
    const matchSearch = c.first_name.toLowerCase().includes(search.toLowerCase()) || c.last_name.toLowerCase().includes(search.toLowerCase());
    return c.flights.length > 0 && matchSearch;
  });

  const renderPaymentBadge = (status: string) => {
    if (!status) return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 block w-fit">🏢 Backoffice</span>;
    
    const extractedCode = extractVoucherCode(status);

    if (status.includes('Bon Cadeau')) {
      return <span className="bg-violet-100 text-violet-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-violet-200 block w-fit">🎁 Bon {extractedCode ? `(${extractedCode})` : ''}</span>;
    }
    
    if (status.includes('Promo')) {
      const code = extractedCode || 'PROMO';
      return <span className="bg-emerald-100 text-emerald-800 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-300 block w-fit shadow-sm">🏢 {code}</span>;
    }

    if (status.includes('CB')) return <span className="bg-sky-100 text-sky-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-sky-200 block w-fit">💳 CB</span>;
    if (status.includes('ANCV')) return <span className="bg-teal-100 text-teal-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-teal-200 block w-fit">🎫 ANCV</span>;
    return <span className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-amber-200 block w-fit">🤝 {status}</span>;
  };

  const now = new Date().getTime();
  const upcomingClients: any[] = [];
  const pastClients: any[] = [];

  filtered.forEach(c => {
    const futureFlights = c.flights.filter((f: any) => new Date(f.start_time).getTime() >= now);
    if (futureFlights.length > 0) {
      const closestFuture = Math.min(...futureFlights.map((f: any) => new Date(f.start_time).getTime()));
      upcomingClients.push({ ...c, sortKey: closestFuture });
    } else {
      const closestPast = Math.max(...c.flights.map((f: any) => new Date(f.start_time).getTime()));
      pastClients.push({ ...c, sortKey: closestPast });
    }
  });

  upcomingClients.sort((a, b) => a.sortKey - b.sortKey);
  pastClients.sort((a, b) => b.sortKey - a.sortKey);

  const deleteFlight = async (slotId: number, clientId: number) => {
    if (!confirm("Supprimer ce vol ?")) return;
    try {
      const res = await apiFetch(`/api/slots/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(prev => prev.map(c => {
          if (c.id === clientId) return { ...c, flights: c.flights.filter((f: any) => f.id !== slotId) };
          return c;
        }).filter(c => c.flights.length > 0)); 
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (!filterStartDate || !filterEndDate) return alert("Sélectionnez une période !");
    if (!confirm(`Supprimer ${selectedIds.length} dossiers ?`)) return;
    try {
      const res = await apiFetch('/api/clients/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setClients(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      }
    } catch (err) { console.error(err); }
  };

  // 🎯 NOUVEAU : EXPORT EXCEL AVEC COLONNE FACTURATION PARTENAIRE
  const handleExport = () => {
    if (filtered.length === 0) return alert("Rien à exporter !");
    
    // 🎯 La nouvelle colonne Facturation
    const headers = ["Date", "Client", "Email", "Telephone Passager", "Prestation", "Pilote", "Statut Paiement", "Code (Bon/Promo)", "Acheteur d'origine", "Téléphone Acheteur", "Facturation Partenaire"];
    
    const rows = filtered.flatMap(c => c.flights.map((f: any) => {
      const code = extractVoucherCode(f.payment_status);
      let buyerName = '';
      let buyerPhone = '';
      let partnerBilling = ''; // 👈 AJOUTÉ
      
      if (code) {
        const gc = giftCards.find(g => g.code.toUpperCase() === code.toUpperCase());
        if (gc) {
          if (gc.buyer_name) buyerName = gc.buyer_name;
          if (gc.buyer_phone) buyerPhone = `="${gc.buyer_phone}"`; 
          // 🎯 AJOUTÉ : On récupère le montant à facturer
          if (gc.is_partner && gc.partner_amount_cents) {
            partnerBilling = `${gc.partner_amount_cents / 100}€`;
          }
        }
      }

      return [
        new Date(f.start_time).toLocaleDateString('fr-FR'), 
        `${c.last_name} ${c.first_name}`, 
        c.email, 
        c.phone ? `="${c.phone}"` : '', 
        f.flight_name, 
        f.monitor_name, 
        f.payment_status || 'A régler',
        code || '',         
        buyerName,          
        buyerPhone,         
        partnerBilling // 👈 AJOUTÉ
      ];
    }));

    const csvContent = [headers, ...rows].map((e: any[]) => e.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Export_Fluide_${new Date().toLocaleDateString('fr-FR')}.csv`;
    link.click();
  };

  const renderClientTable = (title: string, clientsList: any[], icon: string, bgColor: string, textColor: string) => {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6 ml-4">
          <div className={`${bgColor} ${textColor} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm font-bold`}>{icon}</div>
          <h2 className="text-2xl font-black uppercase text-slate-800">{title}</h2>
          <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black">{clientsList.length}</span>
        </div>

        {/* 💻 DESKTOP */}
        <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                <th className="p-6 w-12 text-center rounded-tl-[40px]">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={clientsList.length > 0 && clientsList.every(c => selectedIds.includes(c.id))} onChange={(e) => {
                    const idsInList = clientsList.map(c => c.id);
                    setSelectedIds(e.target.checked ? Array.from(new Set([...selectedIds, ...idsInList])) : selectedIds.filter(id => !idsInList.includes(id)));
                  }} />
                </th>
                <th className="p-6 text-xs">Nom / Prénom</th>
                <th className="p-6 text-xs">Téléphone</th>
                <th className="p-6 text-xs text-center">Vols</th>
                <th className="p-6 text-xs text-right rounded-tr-[40px]">Détails</th>
              </tr>
            </thead>
            <tbody>
              {clientsList.map((c) => (
                <React.Fragment key={c.id}>
                  <tr onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)} className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors">
                    <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                      <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={() => setSelectedIds(selectedIds.includes(c.id) ? selectedIds.filter(id => id !== c.id) : [...selectedIds, c.id])} className="w-4 h-4 rounded" />
                    </td>
                    <td className="p-6 font-black text-slate-800 uppercase text-xs">{c.last_name} {c.first_name}</td>
                    <td className="p-6 font-bold text-slate-600 text-xs">{c.phone || '—'}</td>
                    <td className="p-6 text-center"><span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{c.flights?.length}</span></td>
                    <td className="p-6 text-right">{expandedClient === c.id ? '🔼' : '🔽'}</td>
                  </tr>
                  {expandedClient === c.id && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/50 p-6">
                        <div className="grid grid-cols-1 gap-4">
                          {c.flights.map((f: any) => (
                            <div key={f.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative">
                              <div className="flex items-center gap-6">
                                <div className="text-center min-w-[60px]">
                                  <p className="text-[9px] font-black uppercase text-slate-400">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                                  <p className="text-base font-black text-slate-800">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
                                  <p className="text-[11px] font-black bg-white rounded mt-0.5 py-0.5 text-slate-800 shadow-sm">
                                    {new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                                  </p>
                                </div>
                                <div>
                                  <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{f.flight_name}</p>
                                  <button onClick={(e) => { e.stopPropagation(); if(!f.payment_status){ setTempMonitorId(f.monitor_id?.toString() || ""); setEditingSlotId(f.id); setEditType('monitor'); } }} className={`text-[9px] font-bold px-2 py-1 rounded-md border ${!f.payment_status ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}>
                                    👨‍✈️ {f.monitor_name || "Assigner"}
                                  </button>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <div className={!f.payment_status ? "cursor-pointer" : "cursor-default"} onClick={(e) => { e.stopPropagation(); if (!f.payment_status) {
                                    setTempPayAmount(f.price_cents ? f.price_cents / 100 : 0);
                                    setTempPayMethod("CB");
                                    setTempPayCode(""); 
                                    setEditingSlotId(f.id);
                                    setEditType('payment');
                                  } }}>
                                  {renderPaymentBadge(f.payment_status)}
                                </div>
                                <button onClick={(e) => { e.stopPropagation(); deleteFlight(f.id, c.id); }} className="p-2 text-rose-400">🗑️</button>
                              </div>
                              {editingSlotId === f.id && (
                                <div className="absolute right-0 top-full mt-2 bg-white shadow-2xl border border-slate-200 p-4 rounded-2xl z-[100] flex items-center gap-3 animate-in fade-in" onClick={e => e.stopPropagation()}>
                                  {editType === 'monitor' ? (
                                    <>
                                      <select 
                                        className="bg-slate-50 border rounded-lg p-2 font-bold text-xs" 
                                        value={tempMonitorId} 
                                        onChange={e => setTempMonitorId(e.target.value)}
                                      >
                                        <option value="">Pilote...</option>
                                        {monitors.map(m => {
                                          const isBusy = clients.some(client => 
                                            client.flights.some((flight: any) => 
                                              flight.start_time === f.start_time && 
                                              flight.monitor_id?.toString() === m.id.toString() && 
                                              flight.id !== f.id 
                                            )
                                          );
                                          return (
                                            <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}>
                                              {m.first_name} {isBusy ? '(Occupé)' : ''}
                                            </option>
                                          );
                                        })}
                                      </select>
                                      <button onClick={() => saveQuickEdit(f.id, c.id)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs">OK</button>
                                    </>
                                  ) : (
                                    <>
                                      <div className="flex gap-1 flex-wrap">
                                        <select 
                                          value={tempPayMethod} 
                                          onChange={e => setTempPayMethod(e.target.value)} 
                                          className="bg-slate-50 border rounded-lg p-2 font-bold text-xs"
                                        >
                                          <option value="CB">💳 CB</option>
                                          <option value="Espèces">💶 Espèces</option>
                                          <option value="Chèque">📝 Chèque</option>
                                          <option value="ANCV">🎫 ANCV</option>
                                          <option value="Bon Cadeau">🎁 Bon Cadeau</option>
                                          <option value="Promo">🏷️ Code Promo</option>
                                        </select>

                                        {(tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') && (
                                          <select 
                                            value={tempPayCode} 
                                            onChange={e => setTempPayCode(e.target.value)} 
                                            className="w-32 bg-slate-50 border rounded-lg p-2 font-bold text-[10px] text-slate-700"
                                          >
                                            <option value="">Sélectionner...</option>
                                            {giftCards
                                              .filter(gc => gc.status === 'valid')
                                              .map(gc => (
                                                <option key={gc.id} value={gc.code}>
                                                  {gc.code} {gc.buyer_name ? `(Offert par ${gc.buyer_name})` : ''}
                                                </option>
                                              ))
                                            }
                                          </select>
                                        )}

                                        <input 
                                          type="number" 
                                          value={tempPayAmount} 
                                          onChange={e => setTempPayAmount(Number(e.target.value))} 
                                          className="w-16 bg-slate-50 border rounded-lg p-2 font-bold text-xs text-center" 
                                        />
                                      </div>
                                      <button onClick={() => saveQuickEdit(f.id, c.id)} className="w-full mt-2 bg-emerald-500 text-white py-2 rounded-lg font-black text-[10px] uppercase">
                                        ENCAISSER
                                      </button>
                                    </>
                                  )}
                                  <button onClick={() => setEditingSlotId(null)} className="ml-2 text-slate-400">✕</button>
                                </div>
                              )}
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
        </div>

        {/* 📱 MOBILE */}
        <div className="md:hidden space-y-4 px-2">
          {clientsList.map(c => (
            <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-center justify-between" onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}>
                <div className="flex items-center gap-3">
                  <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={(e) => { e.stopPropagation(); setSelectedIds(selectedIds.includes(c.id) ? selectedIds.filter(id => id !== c.id) : [...selectedIds, c.id]); }} className="w-5 h-5 rounded" />
                  <div>
                    <p className="font-black text-slate-800 uppercase text-xs">{c.last_name} {c.first_name}</p>
                    <p className="text-[9px] text-slate-500 font-bold uppercase">{c.phone || 'Pas de numéro'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-500 text-[10px]">{c.flights?.length}</span>
                  <span className={`text-sky-500 font-black transition-transform ${expandedClient === c.id ? 'rotate-180' : ''}`}>▼</span>
                </div>
              </div>
              {expandedClient === c.id && (
                <div className="bg-slate-50/50 p-3 space-y-3 border-t border-slate-100">
                  {c.flights.map((f: any) => (
                    <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-center min-w-[55px] border border-sky-100 flex flex-col justify-center">
                            <p className="text-[7px] font-black uppercase leading-none mb-0.5">
                              {new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </p>
                            <p className="text-xs font-black leading-none mb-0.5">
                              {new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </p>
                            <p className="text-[9px] font-black bg-white rounded mt-0.5 py-0.5 text-sky-700 shadow-sm">
                              {new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                          <div>
                            <p className="font-black text-slate-800 uppercase text-[10px] leading-tight mb-1">{f.flight_name}</p>
                            <button onClick={(e) => { e.stopPropagation(); if(!f.payment_status){ setTempMonitorId(f.monitor_id?.toString() || ""); setEditingSlotId(f.id); setEditType('monitor'); } }} className={`text-[8px] font-bold px-2 py-1 rounded-md border ${!f.payment_status ? 'bg-slate-50 text-slate-600' : 'text-slate-400'}`}>👨‍✈️ {f.monitor_name || "Assigner"}</button>
                          </div>
                        </div>
                        <button onClick={(e) => { e.stopPropagation(); deleteFlight(f.id, c.id); }} className="text-rose-300">🗑️</button>
                      </div>
                      <div className={!f.payment_status ? "cursor-pointer" : "cursor-default"} onClick={(e) => { e.stopPropagation(); if (!f.payment_status) {
                          setTempPayAmount(f.price_cents ? f.price_cents / 100 : 0);
                          setTempPayMethod("CB");
                          setTempPayCode("");
                          setEditingSlotId(f.id);
                          setEditType('payment');
                        } }}>
                        {renderPaymentBadge(f.payment_status)}
                      </div>
                      {editingSlotId === f.id && (
                        <div className="absolute inset-0 bg-white/95 z-10 flex flex-col justify-center p-4 rounded-2xl" onClick={e => e.stopPropagation()}>
                          <div className="flex justify-between mb-2"><p className="text-[8px] font-black uppercase text-slate-400">Modifier</p><button onClick={() => setEditingSlotId(null)}>✕</button></div>
                          {editType === 'monitor' ? (
                            <div className="flex gap-1">
                              <select 
                                className="flex-1 border rounded-lg p-2 font-bold text-xs" 
                                value={tempMonitorId} 
                                onChange={e => setTempMonitorId(e.target.value)}
                              >
                                <option value="">Pilote...</option>
                                {monitors.map(m => {
                                  const isBusy = clients.some(client => 
                                    client.flights.some((flight: any) => 
                                      flight.start_time === f.start_time && 
                                      flight.monitor_id?.toString() === m.id.toString() && 
                                      flight.id !== f.id 
                                    )
                                  );
                                  return (
                                    <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}>
                                      {m.first_name} {isBusy ? '(Occupé)' : ''}
                                    </option>
                                  );
                                })}
                              </select>
                              <button onClick={() => saveQuickEdit(f.id, c.id)} className="bg-emerald-500 text-white px-4 rounded-lg font-black text-xs uppercase">OK</button>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <div className="flex flex-wrap gap-2">
                                <select 
                                  value={tempPayMethod} 
                                  onChange={e => setTempPayMethod(e.target.value)} 
                                  className="flex-1 border rounded-lg p-2 font-bold text-xs"
                                >
                                  <option value="CB">💳 CB</option>
                                  <option value="Espèces">💶 Espèces</option>
                                  <option value="Chèque">📝 Chèque</option>
                                  <option value="ANCV">🎫 ANCV</option>
                                  <option value="Bon Cadeau">🎁 Bon Cadeau</option>
                                  <option value="Promo">🏷️ Code Promo</option>
                                </select>

                                <input 
                                  type="number" 
                                  value={tempPayAmount} 
                                  onChange={e => setTempPayAmount(Number(e.target.value))} 
                                  className="w-16 border rounded-lg p-2 font-bold text-xs text-center" 
                                />

                                {(tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') && (
                                  <select 
                                    value={tempPayCode} 
                                    onChange={e => setTempPayCode(e.target.value)} 
                                    className="w-full bg-slate-50 border rounded-lg p-2 font-bold text-[10px] text-slate-700"
                                  >
                                    <option value="">Sélectionner le code...</option>
                                    {giftCards
                                      .filter(gc => gc.status === 'valid')
                                      .map(gc => (
                                        <option key={gc.id} value={gc.code}>
                                          {gc.code} {gc.buyer_name ? `(Offert par ${gc.buyer_name})` : ''}
                                        </option>
                                      ))
                                    }
                                  </select>
                                )}
                              </div>
                              <button onClick={() => saveQuickEdit(f.id, c.id)} className="w-full bg-emerald-500 text-white py-2 rounded-lg font-black text-[9px] uppercase">
                                Confirmer
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-[10px] tracking-widest mb-1">Annuaire & Gestion</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">Tes <span className="text-sky-500">Clients</span></h1>
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 space-y-4">
            <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-bold outline-none focus:border-sky-500 transition-all text-sm" placeholder="Rechercher un passager..." value={search} onChange={(e) => setSearch(e.target.value)} />
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MultiSelectDropdown 
                label="Tous les pilotes" 
                icon="👨‍✈️" 
                options={monitorOptions} 
                selected={filterMonitors} 
                onChange={setFilterMonitors} 
              />
              <MultiSelectDropdown 
                label="Toutes les prestations" 
                icon="🪂" 
                options={flightOptions} 
                selected={filterFlights} 
                onChange={setFilterFlights} 
              />
              <MultiSelectDropdown 
                label="Tous les paiements" 
                icon="💰" 
                options={paymentOptions} 
                selected={filterPayments} 
                onChange={setFilterPayments} 
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Du</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /></div>
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Au</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /></div>
            </div>
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <div className="flex gap-4 items-center">
                {(filterMonitors.length > 0 || filterFlights.length > 0 || filterPayments.length > 0 || search || filterStartDate || filterEndDate) && (
                  <button onClick={() => { setFilterMonitors([]); setFilterFlights([]); setFilterPayments([]); setSearch(""); setFilterStartDate(""); setFilterEndDate(""); }} className="text-[10px] font-black uppercase text-rose-500 hover:underline">✕ Reset</button>
                )}
                {selectedIds.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={handleBulkDelete} disabled={!filterStartDate || !filterEndDate} className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${(!filterStartDate || !filterEndDate) ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed" : "bg-rose-100 text-rose-600 border-rose-200"}`}>🔥 Supprimer ({selectedIds.length})</button>
                    {(!filterStartDate || !filterEndDate) && <span className="text-[8px] font-bold text-rose-400 italic">⚠️ Filtre date requis</span>}
                  </div>
                )}
              </div>
              <button onClick={handleExport} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">📥 Export</button>
            </div>
          </div>
        </header>

        {renderClientTable("Vols à venir", upcomingClients, "⏳", "bg-amber-100", "text-amber-500")}
        {renderClientTable("Vols terminés", pastClients, "✅", "bg-slate-200", "text-slate-500")}

        {upcomingClients.length === 0 && pastClients.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[40px] shadow-sm border border-slate-100">
            <span className="text-5xl block mb-4">🕵️‍♂️</span>
            <h3 className="text-xl font-black uppercase text-slate-800">Aucun dossier trouvé</h3>
          </div>
        )}
      </div>
    </div>
  );
}