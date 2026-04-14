"use client";
import React, { useState, useEffect } from 'react';
import { apiFetch } from '../../../lib/api';

export default function ClientsPage() {
  const [clients, setClients] = useState<any[]>([]);
  const [search, setSearch] = useState("");
  const [expandedClient, setExpandedClient] = useState<number | null>(null);

  // 🎯 CORRECTION : On déclare TOUS les états (y compris monitors) EN PREMIER !
  const [monitors, setMonitors] = useState<any[]>([]);
  const [flightTypes, setFlightTypes] = useState<any[]>([]);
  const [filterMonitor, setFilterMonitor] = useState("");
  const [filterFlight, setFilterFlight] = useState("");
  const [filterPayment, setFilterPayment] = useState("");
  const [filterStartDate, setFilterStartDate] = useState("");
  const [filterEndDate, setFilterEndDate] = useState("");
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // Variables pour l'édition rapide "au clic"
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'monitor' | 'payment' | null>(null);
  const [tempMonitorId, setTempMonitorId] = useState<string>("");
  const [tempPayMethod, setTempPayMethod] = useState<string>("CB");
  const [tempPayAmount, setTempPayAmount] = useState<number>(0);

  const saveQuickEdit = async (slotId: number, clientId: number) => {
    let payload: any = {};
    let newPaymentStatus = "";
    
    if (editType === 'monitor') {
      payload.monitor_id = tempMonitorId;
    } else if (editType === 'payment') {
      newPaymentStatus = `Payé sur place (${tempPayMethod} : ${tempPayAmount}€)`;
      payload.payment_status = newPaymentStatus;
    }
    // ... (la suite de la fonction reste identique)
    
    try {
      const res = await apiFetch(`/api/slots/${slotId}/quick`, {
        method: 'PATCH',
        body: JSON.stringify(payload)
      });
      
      if (res.ok) {
        // 🚀 Magie : Mise à jour instantanée de l'écran sans recharger la page
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
        // 🎯 NOUVEAU : On prévient si le pilote est déjà occupé !
        const errorData = await res.json();
        alert("❌ Impossible : " + (errorData.error || "Erreur de modification"));
      }
    } catch (err) { console.error(err); }
  };

  
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [resC, resM, resF] = await Promise.all([
          apiFetch('/api/clients'),
          apiFetch('/api/monitors'),
          apiFetch('/api/flight-types')
        ]);
        if (resC.ok) setClients(await resC.json());
        if (resM.ok) setMonitors(await resM.json());
        if (resF.ok) setFlightTypes(await resF.json());
      } catch (err) { console.error("Erreur chargement:", err); }
    };
    fetchData();
  }, []);

  // 🎯 NOUVEAU : Logique de filtrage avancée (Dossiers ET Vols)
  const filtered = clients.map(c => {
    // 1. On filtre les vols à l'intérieur du dossier client
    const matchingFlights = c.flights.filter((f: any) => {
      const matchMon = !filterMonitor || f.monitor_name === filterMonitor;
      const matchFli = !filterFlight || f.flight_name === filterFlight;
      
      let matchPay = true;
      if (filterPayment === 'backoffice') matchPay = !f.payment_status;
      if (filterPayment === 'promo') matchPay = f.payment_status?.includes('Promo');
      if (filterPayment === 'cadeau') matchPay = f.payment_status?.includes('Bon Cadeau');
      if (filterPayment === 'cb') matchPay = f.payment_status?.includes('CB');

      // Filtres par Date
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

    // On renvoie le client avec son dossier "nettoyé"
    return { ...c, flights: matchingFlights };
  }).filter(c => {
    // 2. On garde le client SEULEMENT s'il lui reste des vols après le filtre, ET s'il correspond à la recherche texte
    const matchSearch = c.first_name.toLowerCase().includes(search.toLowerCase()) || c.last_name.toLowerCase().includes(search.toLowerCase());
    return c.flights.length > 0 && matchSearch;
  });

  // 🎯 Fonction pour générer le badge de paiement
  const renderPaymentBadge = (status: string) => {
    if (!status) return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 shadow-sm block w-fit">🏢 Backoffice (À régler)</span>;
    if (status.includes('Bon Cadeau')) return <span className="bg-violet-100 text-violet-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-violet-200 shadow-sm block w-fit">🎁 {status}</span>;
    if (status.includes('Promo')) return <span className="bg-emerald-100 text-emerald-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-emerald-200 shadow-sm block w-fit">🏷️ {status}</span>;
    if (status.includes('CB')) return <span className="bg-sky-100 text-sky-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-sky-200 shadow-sm block w-fit">💳 {status}</span>;
    if (status.includes('sur place')) return <span className="bg-amber-100 text-amber-700 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-amber-200 shadow-sm block w-fit">🤝 {status}</span>;
    return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 shadow-sm block w-fit">{status}</span>;
  };

  // 🎯 NOUVEAU : Le moteur de Tri Intelligent
  const now = new Date().getTime();
  const upcomingClients: any[] = [];
  const pastClients: any[] = [];

  filtered.forEach(c => {
    if (!c.flights || c.flights.length === 0) return;

    const futureFlights = c.flights.filter((f: any) => new Date(f.start_time).getTime() >= now);
    
    if (futureFlights.length > 0) {
      // Pour les vols à venir : Le plus proche de l'instant présent gagne (Tri croissant)
      const closestFuture = Math.min(...futureFlights.map((f: any) => new Date(f.start_time).getTime()));
      upcomingClients.push({ ...c, sortKey: closestFuture });
    } else {
      // Pour les vols passés : Le plus proche de l'instant présent gagne (Tri décroissant)
      const closestPast = Math.max(...c.flights.map((f: any) => new Date(f.start_time).getTime()));
      pastClients.push({ ...c, sortKey: closestPast });
    }
  });

  upcomingClients.sort((a, b) => a.sortKey - b.sortKey); // Du plus proche au plus lointain
  pastClients.sort((a, b) => b.sortKey - a.sortKey); // Du plus récent au plus ancien


  const renderClientTable = (title: string, clientsList: any[], icon: string, bgColor: string, textColor: string) => {
    return (
      <div className="mb-12">
        {/* EN-TÊTE DE SECTION */}
        <div className="flex items-center gap-4 mb-6 ml-4">
          <div className={`${bgColor} ${textColor} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm font-bold`}>
            {icon}
          </div>
          <h2 className="text-2xl font-black uppercase tracking-tight text-slate-800">{title}</h2>
          <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black">
            {clientsList.length}
          </span>
        </div>

        {/* 💻 VERSION DESKTOP : Visible sur écran large (md:block), masqué sur petit (hidden) */}
        <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-6 w-12 text-center">
                   <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer"
                    checked={clientsList.length > 0 && clientsList.every(c => selectedIds.includes(c.id))}
                    onChange={(e) => {
                      if (e.target.checked) {
                        const idsToAdd = clientsList.map(c => c.id);
                        setSelectedIds(prev => Array.from(new Set([...prev, ...idsToAdd])));
                      } else {
                        const idsToRemove = clientsList.map(c => c.id);
                        setSelectedIds(prev => prev.filter(id => !idsToRemove.includes(id)));
                      }
                    }}
                  />
                </th>
                <th className="p-6">Nom / Prénom</th>
                <th className="p-6">Téléphone</th>
                <th className="p-6 text-center">Historique</th>
                <th className="p-6 text-right">Détails</th>
              </tr>
            </thead>
            <tbody>
              {clientsList.map((c) => (
                <React.Fragment key={c.id}>
                  <tr 
                    onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
                    className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-colors cursor-pointer ${expandedClient === c.id ? 'bg-sky-50/30' : ''}`}
                  >
                    <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                      <input 
                        type="checkbox" 
                        checked={selectedIds.includes(c.id)}
                        onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
                        className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer"
                      />
                    </td>
                    <td className="p-6">
                      <p className="font-black text-slate-800 uppercase tracking-tight">{c.last_name} {c.first_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold uppercase">{c.email || 'Pas d\'email'}</p>
                    </td>
                    <td className="p-6">
                      <span className="font-bold text-slate-600 text-sm">{c.phone || '—'}</span>
                    </td>
                    <td className="p-6 text-center">
                      <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">
                        {c.flights?.length || 0} Vol(s)
                      </span>
                    </td>
                    <td className="p-6 text-right">
                      <span className={`text-xl transition-transform duration-300 inline-block ${expandedClient === c.id ? 'rotate-180' : ''}`}>
                        {expandedClient === c.id ? '🔼' : '🔽'}
                      </span>
                    </td>
                  </tr>

                  {/* DÉTAILS ÉTENDUS (Vols du client) */}
                  {expandedClient === c.id && (
                    <tr>
                      <td colSpan={5} className="bg-slate-50/50 p-6">
                        <div className="grid grid-cols-1 gap-4">
                          {c.flights.map((f: any, idx: number) => (
                            <div key={idx} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative"> {/* 🎯 AJOUT DE "relative" ICI */}
                            <div className="flex items-center gap-6">
                              <div className="text-center min-w-[80px]">
                                <p className="text-[10px] font-black uppercase text-slate-400 mb-1">
                                  {new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}
                                </p>
                                <p className="text-lg font-black text-slate-800 leading-none">
                                  {new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                                </p>
                              </div>
                              <div>
                                <p className="font-black text-slate-800 uppercase text-xs mb-1">{f.flight_name}</p>
                                <div className="flex items-center gap-2">
                                  {/* BOUTON PILOTE */}
                                  <button 
                                    onClick={(e) => { 
                                      e.stopPropagation(); 
                                      setTempMonitorId(f.monitor_id?.toString() || ""); 
                                      setEditingSlotId(f.id); 
                                      setEditType('monitor'); 
                                    }}
                                    className="text-[10px] font-bold bg-sky-50 text-sky-600 px-2 py-1 rounded-md border border-sky-100 hover:bg-sky-100"
                                  >
                                    👨‍✈️ {f.monitor_name || "Assigner pilote"}
                                  </button>
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-4">
                              {/* BADGE PAIEMENT */}
                              <div className="cursor-pointer" onClick={(e) => {
                                e.stopPropagation();
                                setTempPayAmount(f.price_cents ? f.price_cents / 100 : 0);
                                setTempPayMethod("CB"); // 🎯 On remet une valeur par défaut
                                setEditingSlotId(f.id);
                                setEditType('payment');
                              }}>
                                {renderPaymentBadge(f.payment_status)}
                              </div>
                              
                              <button 
                                onClick={(e) => { e.stopPropagation(); deleteFlight(f.id, c.id); }}
                                className="p-2 text-rose-400 hover:text-rose-600"
                              >
                                🗑️
                              </button>
                            </div>

                            {/* 🎯 INTERFACE D'ÉDITION RAPIDE (VÉRIFIEZ BIEN CE BLOC) */}
                            {editingSlotId === f.id && (
                              <div 
                                className="absolute right-0 top-full mt-2 bg-white shadow-2xl border border-slate-200 p-4 rounded-2xl z-[100] flex items-center gap-3 animate-in fade-in zoom-in-95" 
                                onClick={e => e.stopPropagation()}
                              >
                                {editType === 'monitor' ? (
                                  <>
                                    <select 
                                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs outline-none focus:border-sky-400" 
                                      value={tempMonitorId} 
                                      onChange={e => setTempMonitorId(e.target.value)}
                                    >
                                      <option value="">Choisir un pilote...</option>
                                      {monitors.map(m => (
                                        <option key={m.id} value={m.id}>{m.first_name}</option>
                                      ))}
                                    </select>
                                    <button 
                                      onClick={() => saveQuickEdit(f.id, c.id)} 
                                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs hover:bg-emerald-600 transition-colors"
                                    >
                                      OK
                                    </button>
                                  </>
                                ) : (
                                  <>
                                    <select 
                                      value={tempPayMethod} 
                                      onChange={e => setTempPayMethod(e.target.value)} 
                                      className="bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs"
                                    >
                                      <option value="CB">💳 CB</option>
                                      <option value="Espèces">💶 Espèces</option>
                                      <option value="Chèque">📝 Chèque</option>
                                      <option value="Bon Cadeau">🎁 Bon Cadeau</option>
                                    </select>
                                    <input 
                                      type="number" 
                                      value={tempPayAmount} 
                                      onChange={e => setTempPayAmount(Number(e.target.value))} 
                                      className="w-20 bg-slate-50 border border-slate-200 rounded-lg p-2 font-bold text-xs" 
                                    />
                                    <button 
                                      onClick={() => saveQuickEdit(f.id, c.id)} 
                                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs hover:bg-emerald-600"
                                    >
                                      ENCAISSER
                                    </button>
                                  </>
                                )}
                                <button 
                                  onClick={() => { setEditingSlotId(null); setEditType(null); }} 
                                  className="ml-2 text-slate-400 hover:text-slate-600 p-1"
                                >
                                  ✕
                                </button>
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

        {/* 📱 VERSION MOBILE : Visible uniquement sur petit écran (md:hidden) */}
        <div className="md:hidden space-y-4 px-2">
  {clientsList.map(c => (
    <div key={c.id} className={`bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden transition-all ${expandedClient === c.id ? 'ring-2 ring-sky-500/10' : ''}`}>
      {/* EN-TÊTE DE LA CARTE */}
      <div 
        className="p-4 flex items-center justify-between active:bg-slate-50"
        onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
      >
        <div className="flex items-center gap-3">
          <input 
            type="checkbox" 
            checked={selectedIds.includes(c.id)}
            onChange={() => setSelectedIds(prev => prev.includes(c.id) ? prev.filter(id => id !== c.id) : [...prev, c.id])}
            onClick={e => e.stopPropagation()}
            className="w-5 h-5 rounded border-slate-300 text-emerald-500"
          />
          <div>
            <p className="font-black text-slate-800 uppercase text-sm leading-tight">{c.last_name} {c.first_name}</p>
            <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wide">{c.phone || 'Pas de numéro'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-500 text-[10px]">
            {c.flights?.length || 0}
          </span>
          <span className={`text-sky-500 font-black transition-transform ${expandedClient === c.id ? 'rotate-180' : ''}`}>▼</span>
        </div>
      </div>

      {/* DÉTAILS DU DOSSIER (ACCORDÉON) */}
      {expandedClient === c.id && (
        <div className="bg-slate-50/50 p-3 space-y-3 border-t border-slate-100">
          {c.flights.map((f: any, idx: number) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-4 relative">
              <div className="flex justify-between items-start">
                <div className="flex gap-3">
                  <div className="bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-center min-w-[45px] h-fit border border-sky-100">
                    <p className="text-[8px] font-black uppercase leading-none mb-1">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                    <p className="text-sm font-black leading-none">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit' })}</p>
                  </div>
                  <div>
                    <p className="font-black text-slate-800 uppercase text-[11px] leading-tight mb-1">{f.flight_name}</p>
                    {/* Bouton Pilote Mobile */}
                    <button 
                      onClick={(e) => { e.stopPropagation(); setTempMonitorId(f.monitor_id?.toString() || ""); setEditingSlotId(f.id); setEditType('monitor'); }}
                      className="text-[9px] font-bold bg-slate-50 text-slate-600 px-2 py-1 rounded-md border border-slate-100"
                    >
                      👨‍✈️ {f.monitor_name || "Assigner"}
                    </button>
                  </div>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteFlight(f.id, c.id); }} className="text-rose-300 p-1">🗑️</button>
              </div>

              <div className="flex items-center justify-between border-t border-slate-50 pt-3">
                <div onClick={(e) => {
                  e.stopPropagation();
                  setTempPayAmount(f.price_cents ? f.price_cents / 100 : 0);
                  setTempPayMethod("CB");
                  setEditingSlotId(f.id);
                  setEditType('payment');
                }}>
                  {renderPaymentBadge(f.payment_status)}
                </div>
              </div>

              {/* ÉDITION RAPIDE MOBILE */}
              {editingSlotId === f.id && (
                <div className="absolute inset-0 bg-white/95 backdrop-blur-sm z-10 flex flex-col justify-center p-4 rounded-2xl animate-in fade-in slide-in-from-bottom-2" onClick={e => e.stopPropagation()}>
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-[10px] font-black uppercase text-slate-400">{editType === 'monitor' ? 'Changer de pilote' : 'Encaisser le vol'}</p>
                    <button onClick={() => setEditingSlotId(null)} className="text-slate-400 text-lg">✕</button>
                  </div>
                  
                  {editType === 'monitor' ? (
                    <div className="flex gap-2">
                      <select className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm outline-none" value={tempMonitorId} onChange={e => setTempMonitorId(e.target.value)}>
                        <option value="">Choisir...</option>
                        {monitors.map(m => <option key={m.id} value={m.id}>{m.first_name}</option>)}
                      </select>
                      <button onClick={() => saveQuickEdit(f.id, c.id)} className="bg-emerald-500 text-white px-6 rounded-xl font-black text-sm uppercase">OK</button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <div className="flex gap-2">
                        <select value={tempPayMethod} onChange={e => setTempPayMethod(e.target.value)} className="flex-1 bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm">
                          <option value="CB">💳 CB</option>
                          <option value="Espèces">💶 Esp.</option>
                          <option value="Chèque">📝 Chq.</option>
                          <option value="Bon Cadeau">🎁 Bon</option>
                        </select>
                        <input type="number" value={tempPayAmount} onChange={e => setTempPayAmount(Number(e.target.value))} className="w-24 bg-slate-50 border border-slate-200 rounded-xl p-3 font-bold text-sm text-center" />
                      </div>
                      <button onClick={() => saveQuickEdit(f.id, c.id)} className="w-full bg-emerald-500 text-white py-3 rounded-xl font-black text-xs uppercase tracking-widest">Confirmer le paiement</button>
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
  
  const deleteFlight = async (slotId: number, clientId: number) => {
    if (!confirm("Supprimer ce vol ? Le créneau redeviendra disponible sur le calendrier.")) return;
    try {
      const res = await apiFetch(`/api/slots/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(prev => prev.map(c => {
          if (c.id === clientId) {
            return { ...c, flights: c.flights.filter((f: any) => f.id !== slotId) };
          }
          return c;
        }).filter(c => c.flights.length > 0)); 
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
  if (!filterStartDate || !filterEndDate) {
    return alert("Veuillez sélectionner une période (Date de début et Date de fin) avant de supprimer.");
  }
  if (!confirm(`🚨 ATTENTION : Vous allez supprimer définitivement ${selectedIds.length} dossiers clients. Continuer ?`)) return;
    try {
      const res = await apiFetch('/api/clients/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds })
      });
      if (res.ok) {
        setClients(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
        alert("Nettoyage effectué avec succès !");
      }
    } catch (err) { console.error(err); }
  };

  const handleExport = () => {
    if (filtered.length === 0) return alert("Rien à exporter !");

    // 1. On prépare les colonnes (En-tête)
    const headers = ["Date", "Client", "Email", "Telephone", "Prestation", "Pilote", "Statut Paiement"];
    
    // 2. On transforme chaque vol de chaque client en une ligne de tableau
    const rows = filtered.flatMap(c => 
      c.flights.map((f: any) => [
        new Date(f.start_time).toLocaleDateString('fr-FR'),
        `${c.last_name} ${c.first_name}`,
        c.email,
        // 🎯 ASTUCE : On entoure le téléphone pour forcer le format texte dans Excel/Sheets
        c.phone ? `="${c.phone}"` : '', 
        f.flight_name,
        f.monitor_name,
        f.payment_status || 'A regler (Backoffice)'
      ])
    );

    // 3. On crée le contenu CSV (séparateur point-virgule pour Excel FR)
    const csvContent = [headers, ...rows]
      .map((e: any[]) => e.map(String).map((v: string) => `"${v.replace(/"/g, '""')}"`).join(";"))
      .join("\n");

    // 4. On crée le fichier et on lance le téléchargement (Format Standard Propre)
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `Export_Clients_Fluide_${new Date().toLocaleDateString('fr-FR')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-xs tracking-widest mb-2">Annuaire & Gestion</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">
            Tes <span className="text-sky-500">Clients</span>
          </h1>

          <div className="bg-white p-4 md:p-6 rounded-[25px] md:rounded-[30px] shadow-sm border border-slate-100 space-y-3 md:space-y-4">
            <input 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl md:rounded-2xl p-3 md:p-4 font-bold outline-none focus:border-sky-500 transition-all text-sm md:text-base"
              placeholder="Rechercher un passager..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            {/* On réduit la taille des selects sur mobile */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-4">
              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-2.5 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterMonitor} onChange={e => setFilterMonitor(e.target.value)}>
                <option value="">👨‍✈️ Tous les pilotes</option>
                {monitors.map(m => <option key={m.id} value={m.first_name}>{m.first_name}</option>)}
              </select>

              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-2.5 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterFlight} onChange={e => setFilterFlight(e.target.value)}>
                <option value="">🪂 Toutes les prestations</option>
                {flightTypes.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>

              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-2.5 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
                <option value="">💰 Tous les paiements</option>
                <option value="backoffice">🏢 À régler (Backoffice)</option>
                <option value="cb">💳 Payés en CB</option>
                <option value="cadeau">🎁 Bons Cadeaux</option>
                <option value="promo">🏷️ Codes Promos</option>
              </select>
            </div>

            {/* 🎯 NOUVEAU : FILTRE PAR PÉRIODE (DATES) */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus-within:border-sky-300 transition-colors">
                <span className="text-[10px] font-black uppercase text-slate-400">Du</span>
                <input type="date" className="bg-transparent border-none outline-none font-bold text-xs text-slate-700 w-full cursor-pointer" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3 focus-within:border-sky-300 transition-colors">
                <span className="text-[10px] font-black uppercase text-slate-400">Au</span>
                <input type="date" className="bg-transparent border-none outline-none font-bold text-xs text-slate-700 w-full cursor-pointer" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
            </div>
            
            {/* ZONE DES BOUTONS (RÉINITIALISER + EXPORT + SUPPRESSION) */}
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <div className="flex gap-4 items-center">
                {(filterMonitor || filterFlight || filterPayment || search || filterStartDate || filterEndDate) && (
                  <button onClick={() => { setFilterMonitor(""); setFilterFlight(""); setFilterPayment(""); setSearch(""); setFilterStartDate(""); setFilterEndDate(""); }} className="text-[10px] font-black uppercase text-rose-500 hover:underline">
                    ✕ Réinitialiser les filtres
                  </button>
                )}
                
                {selectedIds.length > 0 && (
              <div className="flex flex-col items-end gap-1">
                <button 
                  onClick={handleBulkDelete}
                  // 🎯 SÉCURITÉ : Le bouton est grisé et inutilisable si les dates sont vides
                  disabled={!filterStartDate || !filterEndDate}
                  className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${
                    (!filterStartDate || !filterEndDate)
                      ? "bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed opacity-50"
                      : "bg-rose-100 text-rose-600 border-rose-200 hover:bg-rose-200"
                  }`}
                >
                  🔥 Supprimer la sélection ({selectedIds.length})
                </button>
                
                {/* Petit message d'explication si les dates manquent */}
                {(!filterStartDate || !filterEndDate) && (
                  <span className="text-[9px] font-bold text-rose-400 italic">
                    ⚠️ Sélectionnez une période "Du... Au..." pour activer le nettoyage
                  </span>
                )}
              </div>
            )}
              </div>
              
              {(filterMonitor || filterFlight || filterPayment || search || filterStartDate || filterEndDate) && (
                <button onClick={handleExport} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-500/20 hover:bg-emerald-600 transition-all flex items-center gap-2">
                  📥 Exporter la sélection
                </button>
              )}
            </div>
          </div>
        </header>

        {/* 🎯 AFFICHAGE DES DEUX TABLEAUX */}
        {renderClientTable("Vols à venir", upcomingClients, "⏳", "bg-amber-100", "text-amber-500")}
        
        {renderClientTable("Vols terminés", pastClients, "✅", "bg-slate-200", "text-slate-500")}

        {upcomingClients.length === 0 && pastClients.length === 0 && (
          <div className="text-center py-16 bg-white rounded-[40px] shadow-sm border border-slate-100">
            <span className="text-5xl block mb-4">🕵️‍♂️</span>
            <h3 className="text-xl font-black uppercase text-slate-800 mb-2">Aucun dossier trouvé</h3>
            <p className="text-slate-500 font-medium text-sm">Essayez de modifier vos filtres ou votre recherche.</p>
          </div>
        )}

      </div>
    </div>
  );
}