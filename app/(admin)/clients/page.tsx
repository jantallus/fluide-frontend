"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [filterMonitor, setFilterMonitor] = useState("");
  const [filterFlight, setFilterFlight] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'monitor' | 'payment' | null>(null);
  const [tempMonitorId, setTempMonitorId] = useState<string>("");
  const [tempPayMethod, setTempPayMethod] = useState<string>("CB");
  const [tempPayAmount, setTempPayAmount] = useState<number>(0);
  const [tempPayCode, setTempPayCode] = useState<string>("");
  // 🎯 NOUVEAU : On prépare la mémoire pour les codes existants
  const [giftCards, setGiftCards] = useState<any[]>([]);

  const saveQuickEdit = async (slotId: number, clientId: number) => {
    let payload: any = {};
    let newPaymentStatus = "";
    
    if (editType === 'monitor') {
      payload.monitor_id = tempMonitorId;
    } else if (editType === 'payment') {
      // 🎯 NOUVEAU : Si c'est un bon ou une promo, on inclut le code dans le texte
      if (tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') {
        const codeText = tempPayCode ? ` - Code: ${tempPayCode.toUpperCase()}` : '';
        newPaymentStatus = `Payé sur place (${tempPayMethod}${codeText} : ${tempPayAmount}€)`;
      } else {
        newPaymentStatus = `Payé sur place (${tempPayMethod} : ${tempPayAmount}€)`;
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
          apiFetch('/api/gift-cards') // 🎯 NOUVEAU : On récupère les codes
        ]);
        if (resC.ok) setClients(await resC.json());
        if (resM.ok) setMonitors(await resM.json());
        if (resF.ok) setFlightTypes(await resF.json());
        if (resG.ok) setGiftCards(await resG.json()); // 🎯 NOUVEAU : On stocke les codes
      } catch (err) { console.error("Erreur chargement:", err); }
    };
    fetchData();
  }, []);

  const filtered = clients.map(c => {
    const matchingFlights = c.flights.filter((f: any) => {
      const matchMon = !filterMonitor || f.monitor_name === filterMonitor;
      const matchFli = !filterFlight || f.flight_name === filterFlight;
      let matchPay = true;
      if (filterPayment === 'backoffice') matchPay = !f.payment_status;
      if (filterPayment === 'promo') matchPay = f.payment_status?.includes('Promo');
      if (filterPayment === 'cadeau') matchPay = f.payment_status?.includes('Bon Cadeau');
      if (filterPayment === 'cb') matchPay = f.payment_status?.includes('CB');

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
    if (status.includes('Bon Cadeau')) return <span className="bg-violet-100 text-violet-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-violet-200 block w-fit">🎁 Bon</span>;
    if (status.includes('Promo')) return <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-200 block w-fit">🏷️ Promo</span>;
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

  const renderClientTable = (title: string, clientsList: any[], icon: string, bgColor: string, textColor: string) => {
    return (
      <div className="mb-12">
        <div className="flex items-center gap-4 mb-6 ml-4">
          <div className={`${bgColor} ${textColor} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm font-bold`}>{icon}</div>
          <h2 className="text-2xl font-black uppercase text-slate-800">{title}</h2>
          <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black">{clientsList.length}</span>
        </div>

        {/* 💻 DESKTOP */}
        {/* 🎯 CORRECTION 1 : On retire "overflow-hidden" de cette ligne pour laisser sortir la fenêtre */}
        <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
                {/* 🎯 CORRECTION 2 : On met les coins arrondis (rounded-tl) directement sur la 1ère case pour garder le design */}
                <th className="p-6 w-12 text-center rounded-tl-[40px]">
                  <input type="checkbox" className="w-4 h-4 rounded" checked={clientsList.length > 0 && clientsList.every(c => selectedIds.includes(c.id))} onChange={(e) => {
                    const idsInList = clientsList.map(c => c.id);
                    setSelectedIds(e.target.checked ? Array.from(new Set([...selectedIds, ...idsInList])) : selectedIds.filter(id => !idsInList.includes(id)));
                  }} />
                </th>
                <th className="p-6 text-xs">Nom / Prénom</th>
                <th className="p-6 text-xs">Téléphone</th>
                <th className="p-6 text-xs text-center">Vols</th>
                {/* 🎯 CORRECTION 3 : Et on met l'autre coin arrondi (rounded-tr) sur la dernière case */}
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
                                  {/* Heure de début (ex: 10:30) */}
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
                                    setTempPayCode(""); // 🎯 NOUVEAU : On vide la case du code
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
                                      // 🎯 VÉRIFICATION : Le pilote a-t-il un autre vol à cette heure exacte ?
                                      const isBusy = clients.some(client => 
                                        client.flights.some((flight: any) => 
                                          flight.start_time === f.start_time && 
                                          flight.monitor_id?.toString() === m.id.toString() && 
                                          flight.id !== f.id // On exclut le vol actuel
                                        )
                                      );
                                      return (
                                        <option 
                                          key={m.id} 
                                          value={m.id} 
                                          disabled={isBusy} 
                                          className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}
                                        >
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

                                        {/* 🎯 NOUVEAU : La case devient un menu déroulant listant les codes existants */}
                                      {(tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') && (
                                        <select 
                                          value={tempPayCode} 
                                          onChange={e => setTempPayCode(e.target.value)} 
                                          className="w-32 bg-slate-50 border rounded-lg p-2 font-bold text-[10px] text-slate-700"
                                        >
                                          <option value="">Sélectionner...</option>
                                          {giftCards
                                            .filter(gc => gc.status === 'valid') // 🛡️ SÉCURITÉ : Ne montre que les codes non utilisés
                                            .map(gc => (
                                              <option key={gc.id} value={gc.code}>
                                                {gc.code} {gc.beneficiary_name ? `(${gc.beneficiary_name})` : ''}
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
                            {/* Jour de la semaine (ex: lun.) */}
                            <p className="text-[7px] font-black uppercase leading-none mb-0.5">
                              {new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}
                            </p>
                            {/* Jour et Mois (ex: 14/04) */}
                            <p className="text-xs font-black leading-none mb-0.5">
                              {new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                            </p>
                            {/* Heure de début (ex: 10:30) */}
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
                          setTempPayCode(""); // 🎯 NOUVEAU : On vide la case du code
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
                            // 🎯 VÉRIFICATION MOBILE
                            const isBusy = clients.some(client => 
                              client.flights.some((flight: any) => 
                                flight.start_time === f.start_time && 
                                flight.monitor_id?.toString() === m.id.toString() && 
                                flight.id !== f.id 
                              )
                            );
                            return (
                              <option 
                                key={m.id} 
                                value={m.id} 
                                disabled={isBusy} 
                                className={isBusy ? "text-slate-300 bg-slate-100" : "text-slate-900"}
                              >
                                {m.first_name} {isBusy ? '(Occupé)' : ''}
                              </option>
                            );
                          })}
                        </select>
                        <button onClick={() => saveQuickEdit(f.id, c.id)} className="bg-emerald-500 text-white px-4 rounded-lg font-black text-xs uppercase">OK</button></div>
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

                                {/* 🎯 NOUVEAU : La case devient un menu déroulant listant les codes existants pour mobile */}
                                {(tempPayMethod === 'Bon Cadeau' || tempPayMethod === 'Promo') && (
                                  <select 
                                    value={tempPayCode} 
                                    onChange={e => setTempPayCode(e.target.value)} 
                                    className="w-full bg-slate-50 border rounded-lg p-2 font-bold text-[10px] text-slate-700"
                                  >
                                    <option value="">Sélectionner le code...</option>
                                    {giftCards
                                      .filter(gc => gc.status === 'valid') // 🛡️ SÉCURITÉ : Ne montre que les codes non utilisés
                                      .map(gc => (
                                        <option key={gc.id} value={gc.code}>
                                          {gc.code} {gc.beneficiary_name ? `(${gc.beneficiary_name})` : ''}
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

  const handleExport = () => {
    if (filtered.length === 0) return alert("Rien à exporter !");
    const headers = ["Date", "Client", "Email", "Telephone", "Prestation", "Pilote", "Statut Paiement"];
    const rows = filtered.flatMap(c => c.flights.map((f: any) => [new Date(f.start_time).toLocaleDateString('fr-FR'), `${c.last_name} ${c.first_name}`, c.email, c.phone ? `="${c.phone}"` : '', f.flight_name, f.monitor_name, f.payment_status || 'A régler']));
    const csvContent = [headers, ...rows].map((e: any[]) => e.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(";")).join("\n");
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Export_Fluide_${new Date().toLocaleDateString('fr-FR')}.csv`;
    link.click();
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
              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs" value={filterMonitor} onChange={e => setFilterMonitor(e.target.value)}><option value="">👨‍✈️ Tous les pilotes</option>{monitors.map(m => <option key={m.id} value={m.first_name}>{m.first_name}</option>)}</select>
              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs" value={filterFlight} onChange={e => setFilterFlight(e.target.value)}><option value="">🪂 Toutes les prestations</option>{flightTypes.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}</select>
              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}><option value="">💰 Tous les paiements</option><option value="backoffice">🏢 À régler</option><option value="cb">💳 Payés en CB</option><option value="cadeau">🎁 Bons Cadeaux</option><option value="promo">🏷️ Codes Promos</option></select>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Du</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /></div>
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Au</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /></div>
            </div>
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <div className="flex gap-4 items-center">
                {(filterMonitor || filterFlight || filterPayment || search || filterStartDate || filterEndDate) && (
                  <button onClick={() => { setFilterMonitor(""); setFilterFlight(""); setFilterPayment(""); setSearch(""); setFilterStartDate(""); setFilterEndDate(""); }} className="text-[10px] font-black uppercase text-rose-500 hover:underline">✕ Reset</button>
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