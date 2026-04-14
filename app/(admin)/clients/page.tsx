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


  // 🎯 NOUVEAU : Fonction "usine" pour dessiner les tableaux de façon modulaire
  const renderClientTable = (title: string, clientsList: any[], icon: string, bgIcon: string, textIcon: string) => {
    if (clientsList.length === 0) return null;

    return (
      <div className="mb-12 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex items-center gap-4 mb-6 px-4">
          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-2xl ${bgIcon} ${textIcon} shadow-sm border border-white`}>
            {icon}
          </div>
          <div>
            <h2 className="text-2xl font-black uppercase italic text-slate-800 leading-tight">
              {title}
            </h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">
              {clientsList.length} dossier{clientsList.length > 1 ? 's' : ''}
            </p>
          </div>
        </div>

        <div className="bg-white rounded-[40px] shadow-sm border border-slate-100 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                <th className="p-6 w-12 text-center">
                  <input 
                    type="checkbox" 
                    className="w-4 h-4 rounded border-slate-300 text-emerald-500 cursor-pointer"
                    // 🎯 ON UTILISE clientsList ICI (le nom de l'argument de la fonction)
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
            <tbody className="divide-y divide-slate-50">
              {clientsList.map(c => (
                <React.Fragment key={c.id}>
                  {/* LIGNE PRINCIPALE (Cliquable) */}
                  <tr 
                    onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
                    className={`cursor-pointer transition-colors ${expandedClient === c.id ? 'bg-sky-50/50' : 'hover:bg-slate-50'}`}
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
                      <p className="font-black text-slate-800 uppercase">{c.last_name} {c.first_name}</p>
                      <p className="text-[10px] text-slate-400 font-bold">{c.email}</p>
                    </td>
                    <td className="p-6 font-bold text-slate-600 text-sm">{c.phone || '--'}</td>
                    <td className="p-6 text-center">
                      <span className="bg-slate-100 px-3 py-1 rounded-lg font-black text-slate-500 text-xs">
                        {c.flights?.length || 0} vol(s)
                      </span>
                    </td>
                    <td className="p-6 text-right font-black text-sky-500 text-xl select-none">
                      {expandedClient === c.id ? '▴' : '▾'}
                    </td>
                  </tr>

                  {/* SOUS-LIGNE : DÉTAIL DES VOLS DU CLIENT */}
                  {expandedClient === c.id && c.flights && (
                    <tr>
                      <td colSpan={4} className="p-0 border-b-2 border-slate-100">
                        <div className="bg-sky-50/30 p-4 md:p-8 space-y-3 shadow-inner">
                          <p className="text-[10px] font-black uppercase text-sky-600 tracking-widest mb-4">Dossier de vol(s)</p>
                          
                          {c.flights.map((f: any, idx: number) => {
                            const isFuture = new Date(f.start_time) >= new Date();
                            return (
                              <div key={idx} className="flex flex-col md:flex-row items-start md:items-center justify-between bg-white p-4 rounded-2xl border border-sky-100 shadow-sm gap-4 relative">
                                <div className="flex items-center gap-4">
                                  <div className={`w-10 h-10 shrink-0 flex items-center justify-center rounded-xl font-black text-lg ${isFuture ? 'bg-amber-100 text-amber-500' : 'bg-slate-100 text-slate-400'}`}>
                                    {isFuture ? '⏳' : '✅'}
                                  </div>
                                  <div>
                                    {/* 🎯 CORRECTION : On remplace le <p> par un <div> */}
                                    <div className="font-black text-slate-800 text-sm flex flex-wrap items-center gap-1">
                                      {f.flight_name} <span className="text-slate-400 font-normal">avec</span> 
                                      
                                      {/* 🎯 ÉDITION RAPIDE DU PILOTE */}
                                      {editingSlotId === f.id && editType === 'monitor' ? (
                                        <div className="inline-flex items-center gap-1 ml-1" onClick={e => e.stopPropagation()}>
                                          <select className="bg-sky-50 border border-sky-200 rounded text-xs font-bold p-1 text-sky-700 outline-none" value={tempMonitorId} onChange={e => setTempMonitorId(e.target.value)}>
                                            <option value="">Pilote...</option>
                                            {monitors.map(m => <option key={m.id} value={m.id}>{m.first_name}</option>)}
                                          </select>
                                          <button onClick={(e) => { e.stopPropagation(); saveQuickEdit(f.id, c.id); }} className="bg-emerald-500 text-white w-6 h-6 rounded flex items-center justify-center hover:bg-emerald-600 transition-colors">✓</button>
                                          <button onClick={(e) => { e.stopPropagation(); setEditingSlotId(null); setEditType(null); }} className="bg-slate-200 text-slate-600 w-6 h-6 rounded flex items-center justify-center hover:bg-slate-300 transition-colors">✕</button>
                                        </div>
                                      ) : (
                                        <span 
                                          className="text-sky-600 cursor-pointer hover:bg-sky-50 border-b border-dashed border-sky-300 ml-1 transition-colors px-1 rounded"
                                          title="Changer le pilote"
                                          onClick={(e) => { e.stopPropagation(); setTempMonitorId(f.monitor_id?.toString() || ""); setEditingSlotId(f.id); setEditType('monitor'); }}
                                        >
                                          {f.monitor_name}
                                        </span>
                                      )}
                                    </div> {/* 🎯 CORRECTION : On ferme bien avec </div> au lieu de </p> */}
                                    
                                    <p className="text-xs font-bold text-slate-500 capitalize mt-0.5">
                                      {new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' }).replace(':', 'h')}
                                    </p>
                                  </div>
                                </div>
                                
                                <div className="w-full md:w-auto flex justify-end" onClick={e => e.stopPropagation()}>
                                  {/* 🎯 ÉDITION RAPIDE DE LA CAISSE (PAIEMENT) */}
                                  {editingSlotId === f.id && editType === 'payment' ? (
                                    <div className="flex flex-col gap-2 bg-slate-50 p-3 rounded-xl border border-slate-200 shadow-sm animate-in zoom-in-95 origin-right">
                                      <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest">Règlement sur place</p>
                                      <div className="flex items-center gap-2">
                                        <select value={tempPayMethod} onChange={e => setTempPayMethod(e.target.value)} className="bg-white border border-slate-200 rounded text-xs font-bold p-1.5 outline-none text-slate-700">
                                          <option value="CB">💳 CB</option>
                                          <option value="Espèces">💶 Espèces</option>
                                          <option value="Chèque">📝 Chèque</option>
                                          <option value="ANCV">🏖️ Chèques Vacances</option>
                                        </select>
                                        <div className="flex items-center bg-white border border-slate-200 rounded px-2">
                                          <input type="number" value={tempPayAmount} onChange={e => setTempPayAmount(Number(e.target.value))} className="w-12 text-xs font-bold p-1.5 outline-none text-center text-slate-700" />
                                          <span className="text-xs font-bold text-slate-400">€</span>
                                        </div>
                                      </div>
                                      <div className="flex gap-2 mt-1">
                                        <button onClick={(e) => { e.stopPropagation(); saveQuickEdit(f.id, c.id); }} className="flex-1 bg-emerald-500 text-white rounded text-[10px] font-black py-1.5 uppercase hover:bg-emerald-600 transition-colors">Valider</button>
                                        <button onClick={(e) => { e.stopPropagation(); setEditingSlotId(null); setEditType(null); }} className="flex-1 bg-slate-200 text-slate-600 rounded text-[10px] font-black py-1.5 uppercase hover:bg-slate-300 transition-colors">Annuler</button>
                                      </div>
                                    </div>
                                  ) : (
                                    <div 
                                      className={!f.payment_status ? "cursor-pointer hover:scale-105 transition-transform group" : ""} 
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        if (!f.payment_status) {
                                          setTempPayAmount(f.price_cents ? f.price_cents / 100 : 0);
                                          setTempPayMethod("CB");
                                          setEditingSlotId(f.id);
                                          setEditType('payment');
                                        }
                                      }}
                                      title={!f.payment_status ? "Cliquer pour encaisser ce client" : ""}
                                    >
                                      {renderPaymentBadge(f.payment_status)}
                                      <button 
                                        onClick={(e) => { e.stopPropagation(); deleteFlight(f.id, c.id); }}
                                        className="p-2 ml-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                                        title="Supprimer ce vol"
                                      >
                                        🗑️
                                      </button>
                                      {!f.payment_status && (
                                         <div className="absolute -top-2 -right-2 bg-emerald-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs opacity-0 group-hover:opacity-100 transition-opacity shadow-md">💰</div>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
            </tbody>
          </table>
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

          <div className="bg-white p-6 rounded-[30px] shadow-sm border border-slate-100 space-y-4">
            <input 
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold outline-none focus:border-sky-500 transition-all"
              placeholder="Rechercher un passager par son nom..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterMonitor} onChange={e => setFilterMonitor(e.target.value)}>
                <option value="">👨‍✈️ Tous les pilotes</option>
                {monitors.map(m => <option key={m.id} value={m.first_name}>{m.first_name}</option>)}
              </select>

              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterFlight} onChange={e => setFilterFlight(e.target.value)}>
                <option value="">🪂 Toutes les prestations</option>
                {flightTypes.map(f => <option key={f.id} value={f.name}>{f.name}</option>)}
              </select>

              <select className="bg-slate-50 border-2 border-slate-100 rounded-xl p-3 font-bold text-xs text-slate-600 outline-none focus:border-sky-300" value={filterPayment} onChange={e => setFilterPayment(e.target.value)}>
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