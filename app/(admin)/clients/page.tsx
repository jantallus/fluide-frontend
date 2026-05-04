'use client';
import React, { useState, useMemo, useEffect } from 'react';
import type { Client } from '@/lib/types';
import { apiFetch } from '../../../lib/api';
import { useClientsData } from '@/hooks/useClientsData';
import { useClientFilters } from '@/hooks/useClientFilters';
import { useQuickEdit } from '@/hooks/useQuickEdit';
import { MultiSelectDropdown } from '@/components/clients/MultiSelectDropdown';
import { ClientTable } from '@/components/clients/ClientTable';
import { useToast } from '@/components/ui/ToastProvider';
import { X, Trash2, Download, ChevronLeft, ChevronRight } from 'lucide-react';

export default function ClientsPage() {
  const { toast, confirm } = useToast();
  const filters = useClientFilters();
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [page, setPage] = useState(1);

  const {
    search, setSearch,
    filterMonitors, setFilterMonitors,
    filterFlights, setFilterFlights,
    filterPayments, setFilterPayments,
    filterStartDate, setFilterStartDate,
    filterEndDate, setFilterEndDate,
    resetFilters,
    hasActiveFilters,
  } = filters;

  useEffect(() => { setPage(1); }, [search]);

  const { clients, setClients, total, totalPages, monitors, flightTypes, giftCards, setGiftCards, complements, isLoading } = useClientsData({ q: search, page });

  const edit = useQuickEdit({ clients, monitors, giftCards, setClients, setGiftCards });

  const usedPromoCodes = useMemo(() => {
    const codes = new Set<string>();
    clients.forEach(c => {
      c.flights?.forEach(f => {
        if (f.payment_data?.code_type === 'promo' && f.payment_data?.code) {
          codes.add(f.payment_data.code);
        }
      });
    });
    return Array.from(codes).sort();
  }, [clients]);

  const monitorOptions = monitors.map(m => ({ label: m.first_name, value: m.first_name }));
  const flightOptions = flightTypes.map(f => ({ label: f.name, value: f.name }));
  const paymentOptions = [
    { label: '🏢 À régler sur place', value: 'backoffice' },
    { label: '💳 Payés en CB', value: 'cb' },
    { label: '🎁 Bons Cadeaux', value: 'cadeau' },
    { label: '🏷️ Tous les Codes Promos', value: 'promo' },
    ...usedPromoCodes.map(code => ({ label: `🤝 Partenaire : ${code}`, value: `partenaire_${code}` })),
  ];

  const filtered = clients.map(c => {
    const matchingFlights = (c.flights || []).filter(f => {
      const matchMon = filterMonitors.length === 0 || filterMonitors.includes(f.monitor_name || '');
      const matchFli = filterFlights.length === 0 || filterFlights.includes(f.flight_name || '');
      let matchPay = filterPayments.length === 0;
      if (filterPayments.length > 0) {
        const pd = f.payment_data;
        matchPay = filterPayments.some(fp => {
          if (fp === 'backoffice') return !pd;
          if (fp === 'cadeau') return pd?.code_type === 'gift_card';
          if (fp === 'cb') return !!(pd?.cb || pd?.online);
          if (fp === 'promo') return pd?.code_type === 'promo';
          if (fp.startsWith('partenaire_')) {
            const codeToMatch = fp.replace('partenaire_', '');
            return pd?.code_type === 'promo' && pd?.code?.toUpperCase() === codeToMatch;
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
  }).filter(c => c.flights.length > 0);

  const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });
  const todayClients:    (Client & { sortKey: number })[] = [];
  const upcomingClients: (Client & { sortKey: number })[] = [];
  const pastClients:     (Client & { sortKey: number })[] = [];

  filtered.forEach(c => {
    const flightDate = (f: { start_time: string }) =>
      new Date(f.start_time).toLocaleDateString('en-CA', { timeZone: 'Europe/Paris' });

    const todayFlts    = (c.flights || []).filter(f => flightDate(f) === todayStr);
    const futureFlts   = (c.flights || []).filter(f => flightDate(f) >  todayStr);
    const pastFlts     = (c.flights || []).filter(f => flightDate(f) <  todayStr);

    if (todayFlts.length > 0) {
      todayClients.push({ ...c, sortKey: Math.min(...todayFlts.map(f => new Date(f.start_time).getTime())) });
    } else if (futureFlts.length > 0) {
      upcomingClients.push({ ...c, sortKey: Math.min(...futureFlts.map(f => new Date(f.start_time).getTime())) });
    } else {
      pastClients.push({ ...c, sortKey: Math.max(...pastFlts.map(f => new Date(f.start_time).getTime())) });
    }
  });

  todayClients.sort((a, b)    => a.sortKey - b.sortKey);
  upcomingClients.sort((a, b) => a.sortKey - b.sortKey);
  pastClients.sort((a, b)     => b.sortKey - a.sortKey);

  const deleteFlight = async (slotId: number, clientId: number) => {
    if (!await confirm('Supprimer ce vol ?')) return;
    try {
      const res = await apiFetch(`/api/slots/${slotId}`, { method: 'DELETE' });
      if (res.ok) {
        setClients(prev =>
          prev
            .map(c => c.id === clientId ? { ...c, flights: c.flights?.filter(f => f.id !== slotId) } : c)
            .filter(c => c.flights && c.flights.length > 0)
        );
      }
    } catch (err) { console.error(err); }
  };

  const handleBulkDelete = async () => {
    if (!filterStartDate || !filterEndDate) return toast.warning('Sélectionnez une période de dates avant de supprimer.');
    if (!await confirm(`Supprimer ${selectedIds.length} dossiers sélectionnés ?`)) return;
    try {
      const res = await apiFetch('/api/clients/bulk-delete', {
        method: 'POST',
        body: JSON.stringify({ ids: selectedIds }),
      });
      if (res.ok) {
        setClients(prev => prev.filter(c => !selectedIds.includes(c.id)));
        setSelectedIds([]);
      }
    } catch (err) { console.error(err); }
  };

  const handleExport = () => {
    if (filtered.length === 0) return toast.info('Aucun dossier à exporter avec les filtres actuels.');
    const headers = [
      'Date', 'Nom Facturation', 'Passager', 'Email', 'Telephone', 'Prestation', 'Pilote',
      'Statut Brut', 'CB (€)', 'Espèces (€)', 'Chèque (€)', 'ANCV (€)', 'Bons & Promos (€)',
      'Code (Bon/Promo)', "Acheteur d'origine", 'Téléphone Acheteur', 'Net à facturer Partenaire',
    ];
    const rows = filtered.flatMap(c =>
      (c.flights || []).map(f => {
        const pd = f.payment_data;
        const code = pd?.code || '';
        let buyerName = '', buyerPhone = '', partnerBilling = '';
        if (code) {
          const gc = giftCards.find(g => g.code.toUpperCase() === code.toUpperCase());
          if (gc) {
            if (gc.buyer_name) buyerName = gc.buyer_name;
            if (gc.buyer_phone) buyerPhone = `="${gc.buyer_phone}"`;
            if (gc.is_partner && gc.partner_amount_cents) {
              const flightPriceEuro = (f.price_cents || 0) / 100;
              if (gc.partner_billing_type === 'percentage') {
                const commPct = gc.partner_amount_cents / 100;
                const netToBill = flightPriceEuro - (flightPriceEuro * commPct) / 100;
                partnerBilling = `${netToBill.toFixed(2)}€ (Déduit de ${commPct}% comm)`;
              } else {
                partnerBilling = `${gc.partner_amount_cents / 100}€`;
              }
            }
          }
        }
        const cb = (pd?.cb ?? 0) / 100;
        const especes = (pd?.especes ?? 0) / 100;
        const cheque = (pd?.cheque ?? 0) / 100;
        const ancv = (pd?.ancv ?? 0) / 100;
        const bons = (pd?.voucher ?? 0) / 100;
        const statut = !pd ? 'A régler' : pd.online ? 'CB en ligne' : [
          pd.cb ? `CB ${pd.cb / 100}€` : '',
          pd.especes ? `Espèces ${pd.especes / 100}€` : '',
          pd.cheque ? `Chèque ${pd.cheque / 100}€` : '',
          pd.ancv ? `ANCV ${pd.ancv / 100}€` : '',
          pd.voucher && pd.code ? `${pd.code_type === 'gift_card' ? 'Bon Cadeau' : 'Promo'} ${pd.code} ${pd.voucher / 100}€` : '',
        ].filter(Boolean).join(' + ');
        const billingDisplay = f.billing_name || c.billing_name || `${c.last_name} ${c.first_name}`.trim();
        return [
          new Date(f.start_time).toLocaleDateString('fr-FR'),
          billingDisplay,
          `${c.last_name} ${c.first_name}`.trim(),
          c.email,
          c.phone ? `="${c.phone}"` : '',
          f.flight_name,
          f.monitor_name,
          statut,
          cb > 0 ? cb : '',
          especes > 0 ? especes : '',
          cheque > 0 ? cheque : '',
          ancv > 0 ? ancv : '',
          bons > 0 ? bons : '',
          code,
          buyerName,
          buyerPhone,
          partnerBilling,
        ];
      })
    );
    const csvContent = [headers, ...rows]
      .map(row => row.map(String).map(v => `"${v.replace(/"/g, '""')}"`).join(';'))
      .join('\n');
    const bom = new Uint8Array([0xef, 0xbb, 0xbf]);
    const blob = new Blob([bom, csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Export_Fluide_${new Date().toLocaleDateString('fr-FR')}.csv`;
    link.click();
  };

  return (
    <div className="p-8 bg-slate-50 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <header className="mb-12">
          <p className="text-sky-500 font-black uppercase text-[10px] tracking-widest mb-1">Annuaire & Gestion</p>
          <h1 className="text-4xl font-black uppercase italic tracking-tighter text-slate-900 mb-8">
            Tes <span className="text-sky-500">Clients</span>
          </h1>
          <div className="bg-white p-4 rounded-[25px] shadow-sm border border-slate-100 space-y-4">
            <input
              className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl p-4 font-bold outline-none focus:border-sky-500 transition-all text-sm"
              placeholder="Rechercher un passager..."
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <MultiSelectDropdown label="Tous les pilotes" icon="👨‍✈️" options={monitorOptions} selected={filterMonitors} onChange={setFilterMonitors} />
              <MultiSelectDropdown label="Toutes les prestations" icon="🪂" options={flightOptions} selected={filterFlights} onChange={setFilterFlights} />
              <MultiSelectDropdown label="Tous les paiements" icon="💰" options={paymentOptions} selected={filterPayments} onChange={setFilterPayments} />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Du</span>
                <input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterStartDate} onChange={e => setFilterStartDate(e.target.value)} />
              </div>
              <div className="flex items-center gap-3 bg-slate-50 border-2 border-slate-100 rounded-xl p-3">
                <span className="text-[10px] font-black uppercase text-slate-400">Au</span>
                <input type="date" className="bg-transparent border-none outline-none font-bold text-xs w-full" value={filterEndDate} onChange={e => setFilterEndDate(e.target.value)} />
              </div>
            </div>
            <div className="flex justify-between items-center mt-4 border-t border-slate-50 pt-4">
              <div className="flex gap-4 items-center">
                {hasActiveFilters && (
                  <button onClick={resetFilters} className="flex items-center gap-1 text-[10px] font-black uppercase text-rose-500 hover:underline"><X size={10} /> Reset</button>
                )}
                {selectedIds.length > 0 && (
                  <div className="flex flex-col items-end gap-1">
                    <button
                      onClick={handleBulkDelete}
                      disabled={!filterStartDate || !filterEndDate}
                      className={`px-4 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest border transition-all ${(!filterStartDate || !filterEndDate) ? 'bg-slate-100 text-slate-400 border-slate-200 cursor-not-allowed' : 'bg-rose-100 text-rose-600 border-rose-200'}`}
                    >
                      <Trash2 size={10} className="inline mr-1" />Supprimer ({selectedIds.length})
                    </button>
                    {(!filterStartDate || !filterEndDate) && <span className="text-[8px] font-bold text-rose-400 italic">⚠️ Filtre date requis</span>}
                  </div>
                )}
              </div>
              <button onClick={handleExport} className="bg-emerald-500 text-white px-6 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2">
                <Download size={12} className="inline mr-1" />Export
              </button>
            </div>
          </div>
        </header>

        {isLoading && (
          <div className="space-y-3 mb-12">
            {[1, 2, 3, 4, 5].map(i => (
              <div key={i} className="h-16 bg-white rounded-2xl animate-pulse border border-slate-100" />
            ))}
          </div>
        )}

        <ClientTable
          title="Clients du jour" icon="📅" bgColor="bg-sky-100" textColor="text-sky-600" highlight
          clientsList={todayClients} allClients={clients} monitors={monitors}
          complements={complements} giftCards={giftCards}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          expandedClient={expandedClient} setExpandedClient={setExpandedClient}
          onDeleteFlight={deleteFlight} edit={edit}
        />
        <ClientTable
          title="Vols à venir" icon="⏳" bgColor="bg-amber-100" textColor="text-amber-500"
          clientsList={upcomingClients} allClients={clients} monitors={monitors}
          complements={complements} giftCards={giftCards}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          expandedClient={expandedClient} setExpandedClient={setExpandedClient}
          onDeleteFlight={deleteFlight} edit={edit}
        />
        <ClientTable
          title="Vols terminés" icon="✅" bgColor="bg-slate-200" textColor="text-slate-500"
          clientsList={pastClients} allClients={clients} monitors={monitors}
          complements={complements} giftCards={giftCards}
          selectedIds={selectedIds} setSelectedIds={setSelectedIds}
          expandedClient={expandedClient} setExpandedClient={setExpandedClient}
          onDeleteFlight={deleteFlight} edit={edit}
        />

        {todayClients.length === 0 && upcomingClients.length === 0 && pastClients.length === 0 && !isLoading && (
          <div className="text-center py-16 bg-white rounded-[40px] shadow-sm border border-slate-100">
            <span className="text-5xl block mb-4">🕵️‍♂️</span>
            <h3 className="text-xl font-black uppercase text-slate-800">Aucun dossier trouvé</h3>
          </div>
        )}

        {totalPages > 1 && (
          <div className="flex justify-center items-center gap-6 mt-8 pb-4">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white border-2 border-slate-100 text-slate-700 hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={14} className="inline" /> Précédent
            </button>
            <span className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {page} / {totalPages}
              <span className="ml-2 text-slate-300 normal-case font-bold">({total} clients)</span>
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="px-5 py-2 rounded-xl font-black uppercase text-[10px] tracking-widest bg-white border-2 border-slate-100 text-slate-700 hover:border-sky-400 hover:text-sky-500 disabled:opacity-30 disabled:cursor-not-allowed transition-all"
            >
              Suivant <ChevronRight size={14} className="inline" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
