"use client";
import React, { useState, useMemo } from 'react';
import { useClientsData } from '@/hooks/useClientsData';
import { useClientFilters } from '@/hooks/useClientFilters';
import MultiSelectDropdown from '@/components/clients/MultiSelectDropdown';
import ClientTable from '@/components/clients/ClientTable';
import { extractVoucherCode, exportClientsToCSV } from '@/lib/clients-export';

export default function ClientsPage() {
  const { clients, monitors, flightTypes, giftCards, complements, updateMonitor, applyPayment, deleteFlight, bulkDelete } = useClientsData();
  const { search, setSearch, filterMonitors, setFilterMonitors, filterFlights, setFilterFlights, filterPayments, setFilterPayments, filterStartDate, setFilterStartDate, filterEndDate, setFilterEndDate, resetFilters } = useClientFilters();
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const usedPromoCodes = useMemo(() => {
    const codes = new Set<string>();
    clients.forEach(c => c.flights.forEach((f: any) => {
      if (f.payment_status?.includes('Promo')) { const code = extractVoucherCode(f.payment_status); if (code) codes.add(code); }
    }));
    return Array.from(codes).sort();
  }, [clients]);

  const monitorOptions = monitors.map((m: any) => ({ label: m.first_name, value: m.first_name }));
  const flightOptions = flightTypes.map((f: any) => ({ label: f.name, value: f.name }));
  const paymentOptions = [
    { label: '🏢 À régler sur place', value: 'backoffice' },
    { label: '💳 Payés en CB', value: 'cb' },
    { label: '🎁 Bons Cadeaux', value: 'cadeau' },
    { label: '🏷️ Tous les Codes Promos', value: 'promo' },
    ...usedPromoCodes.map(code => ({ label: `🤝 Partenaire : ${code}`, value: `partenaire_${code}` })),
  ];

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
          if (fp.startsWith('partenaire_')) { const code = fp.replace('partenaire_', ''); return !!f.payment_status && f.payment_status.includes('Promo') && f.payment_status.toUpperCase().includes(code); }
          return false;
        });
      }
      const s = filterStartDate ? new Date(filterStartDate) : null; if (s) s.setHours(0, 0, 0, 0);
      const e = filterEndDate ? new Date(filterEndDate) : null; if (e) e.setHours(23, 59, 59, 999);
      return matchMon && matchFli && matchPay && (!s || new Date(f.start_time) >= s) && (!e || new Date(f.start_time) <= e);
    });
    return { ...c, flights: matchingFlights };
  }).filter(c => c.flights.length > 0 && (c.first_name.toLowerCase().includes(search.toLowerCase()) || c.last_name.toLowerCase().includes(search.toLowerCase())));

  const now = Date.now();
  const upcomingClients = filtered.filter(c => c.flights.some((f: any) => new Date(f.start_time).getTime() >= now))
    .map(c => ({ ...c, sortKey: Math.min(...c.flights.filter((f: any) => new Date(f.start_time).getTime() >= now).map((f: any) => new Date(f.start_time).getTime())) }))
    .sort((a, b) => a.sortKey - b.sortKey);
  const pastClients = filtered.filter(c => c.flights.every((f: any) => new Date(f.start_time).getTime() < now))
    .map(c => ({ ...c, sortKey: Math.max(...c.flights.map((f: any) => new Date(f.start_time).getTime())) }))
    .sort((a, b) => b.sortKey - a.sortKey);

  const hasActiveFilters = filterMonitors.length > 0 || filterFlights.length > 0 || filterPayments.length > 0 || !!search || !!filterStartDate || !!filterEndDate;

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-[10px] tracking-widest mb-1">Annuaire & Gestion</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">Tes <span className="text-sky-500">Clients</span></h1>
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 space-y-4">
            <input className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-bold outline-none focus:border-sky-500 transition-all text-sm" placeholder="Rechercher un passager..." value={search} onChange={e => setSearch(e.target.value)} />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MultiSelectDropdown label="Tous les pilotes" icon="👨‍✈️" options={monitorOptions} selected={filterMonitors} onChange={setFilterMonitors} />
              <MultiSelectDropdown label="Toutes les prestations" icon="🪂" options={flightOptions} selected={filterFlights} onChange={setFilterFlights} />
              <MultiSelectDropdown label="Tous les paiements" icon="💰" options={paymentOptions} selected={filterPayments} onChange={setFilterPayments} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Du</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} /></div>
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3"><span className="text-[10px] font-black uppercase text-slate-400">Au</span><input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} /></div>
            </div>
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <div className="flex gap-4 items-center">
                {hasActiveFilters && <button onClick={resetFilters} className="text-[10px] font-black uppercase text-rose-500 hover:underline">✕ Reset</button>}
                {selectedIds.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <button onClick={async () => { if (await bulkDelete(selectedIds)) setSelectedIds([]); }} disabled={!filterStartDate || !filterEndDate}
                      className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${(!filterStartDate || !filterEndDate) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-rose-100 text-rose-600 border-rose-200'}`}>
                      🔥 Supprimer ({selectedIds.length})
                    </button>
                    {(!filterStartDate || !filterEndDate) && <span className="text-[8px] font-bold text-rose-400 italic">⚠️ Filtre date requis</span>}
                  </div>
                )}
              </div>
              <button onClick={() => exportClientsToCSV(filtered, giftCards)} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">📥 Export</button>
            </div>
          </div>
        </header>

        <ClientTable title="Vols à venir" icon="⏳" bgColor="bg-amber-100" textColor="text-amber-500" clientsList={upcomingClients} allClients={clients} monitors={monitors} giftCards={giftCards} complements={complements} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onApplyPayment={applyPayment} onUpdateMonitor={updateMonitor} onDeleteFlight={deleteFlight} />
        <ClientTable title="Vols terminés" icon="✅" bgColor="bg-slate-200" textColor="text-slate-500" clientsList={pastClients} allClients={clients} monitors={monitors} giftCards={giftCards} complements={complements} selectedIds={selectedIds} setSelectedIds={setSelectedIds} onApplyPayment={applyPayment} onUpdateMonitor={updateMonitor} onDeleteFlight={deleteFlight} />

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
