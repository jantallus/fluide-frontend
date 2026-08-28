"use client";
import React, { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

type PaymentType = 'esp' | 'cb' | 'ancv' | 'ancv_connect' | 'chq' | 'bon_cadeau' | 'online' | 'np' | null;

interface Flight {
  id: number;
  date: string;
  title: string;
  flight_name: string | null;
  price_euros: number;
  payment_type: PaymentType;
  encaisseur_id: number | null;
  commission: number;
}

interface MonitorTotals {
  flights: number;
  total_revenue: number;
  esp_revenue: number;
  online_revenue: number;
  np_revenue: number;
  unpaid_revenue: number;
  commission_on_esp: number;
  commission_on_online: number;
  total_commission: number;
  balance: number;
}

interface MonitorData {
  id: string;
  first_name: string;
  commission_type: 'none' | 'percentage' | 'fixed';
  commission_value: number;
  flights: Flight[];
  totals: MonitorTotals;
}

const PAYMENT_LABELS: Record<string, string> = {
  esp: 'ESP', cb: 'CB', ancv: 'ANCV', ancv_connect: 'ANCV Connect',
  chq: 'CHQ', bon_cadeau: 'Bon cadeau', online: 'En ligne', np: 'NP',
};
const PAYMENT_COLORS: Record<string, string> = {
  esp: 'bg-emerald-100 text-emerald-800',
  cb: 'bg-blue-100 text-blue-800',
  ancv: 'bg-sky-100 text-sky-800',
  ancv_connect: 'bg-sky-100 text-sky-800',
  chq: 'bg-violet-100 text-violet-800',
  bon_cadeau: 'bg-pink-100 text-pink-800',
  online: 'bg-indigo-100 text-indigo-800',
  np: 'bg-slate-100 text-slate-500',
};

function fmt(euros: number) {
  return euros.toFixed(2).replace('.', ',') + ' €';
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: '2-digit', timeZone: 'Europe/Paris' });
}

export default function RegularisationPage() {
  const today = new Date().toISOString().split('T')[0];
  const firstOfMonth = today.slice(0, 8) + '01';
  const [from, setFrom] = useState(firstOfMonth);
  const [to, setTo] = useState(today);
  const [data, setData] = useState<MonitorData[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await apiFetch(`/api/regularisation?from=${from}&to=${to}`);
      if (!res.ok) throw new Error('Erreur serveur');
      const json = await res.json();
      setData(json.monitors);
    } catch {
      setError('Impossible de charger les données.');
    } finally {
      setLoading(false);
    }
  }, [from, to]);

  // ── Calcul Tricount inter-pilotes ─────────────────────────────────────────
  const tricountSettlement = data ? (() => {
    // Pour chaque pilote : volé = CA de leurs vols (avec encaisseur renseigné)
    //                      encaissé = CA des vols dont ils sont encaisseur
    const flew: Record<string, number> = {};
    const collected: Record<string, number> = {};
    data.forEach(mon => { flew[mon.id] = 0; collected[mon.id] = 0; });

    data.forEach(mon => {
      mon.flights.forEach(f => {
        if (!f.encaisseur_id) return; // vol sans encaisseur : hors calcul
        flew[mon.id] = (flew[mon.id] || 0) + f.price_euros;
        const eid = String(f.encaisseur_id);
        if (collected[eid] !== undefined) collected[eid] += f.price_euros;
      });
    });

    // diff > 0 : pilote a encaissé plus que ses vols → doit de l'argent
    // diff < 0 : pilote a encaissé moins → lui doit de l'argent
    const balances = data.map(mon => ({
      id: mon.id, name: mon.first_name,
      flew: flew[mon.id] || 0,
      collected: collected[mon.id] || 0,
      diff: (collected[mon.id] || 0) - (flew[mon.id] || 0),
    })).filter(b => Math.abs(b.diff) > 0.005);

    // Algorithme Tricount : minimise le nombre de virements
    const debtors  = balances.filter(b => b.diff > 0).map(b => ({ ...b, rem: b.diff }));
    const creditors = balances.filter(b => b.diff < 0).map(b => ({ ...b, rem: -b.diff }));
    const transactions: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].rem, creditors[ci].rem);
      if (amount > 0.005) transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount });
      debtors[di].rem  -= amount;
      creditors[ci].rem -= amount;
      if (debtors[di].rem  < 0.005) di++;
      if (creditors[ci].rem < 0.005) ci++;
    }

    return { balances, transactions };
  })() : null;

  const grandTotal = data ? data.reduce((acc, m) => {
    acc.flights += m.totals.flights;
    acc.revenue += m.totals.total_revenue;
    acc.esp += m.totals.esp_revenue;
    acc.online += m.totals.online_revenue;
    acc.commission += m.totals.total_commission;
    acc.balance += m.totals.balance;
    return acc;
  }, { flights: 0, revenue: 0, esp: 0, online: 0, commission: 0, balance: 0 }) : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900">
          Régularisation <span className="text-amber-500">Paiements</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Soldes par moniteur selon le mode d'encaissement et les commissions.</p>
      </div>

      {/* Filtres */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-wrap gap-4 items-end">
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Du</label>
          <input type="date" value={from} onChange={e => setFrom(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <div>
          <label className="text-[10px] font-black uppercase text-slate-400 block mb-1">Au</label>
          <input type="date" value={to} onChange={e => setTo(e.target.value)} className="border border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" />
        </div>
        <button
          onClick={load}
          disabled={loading}
          className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow hover:bg-slate-700 transition-colors disabled:opacity-50"
        >
          {loading ? 'Chargement…' : 'Calculer'}
        </button>
      </div>

      {error && <p className="text-rose-500 font-bold text-sm">{error}</p>}

      {data && (
        <>
          {/* Résumé global */}
          {grandTotal && (
            <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
              {[
                { label: 'Vols', value: `${grandTotal.flights}`, sub: '' },
                { label: 'CA total', value: fmt(grandTotal.revenue), sub: '' },
                { label: 'Espèces collectées', value: fmt(grandTotal.esp), sub: 'par les moniteurs' },
                { label: 'Caisse collective', value: fmt(grandTotal.online), sub: 'CB / ANCV / En ligne' },
                { label: 'Commissions', value: fmt(grandTotal.commission), sub: 'total dû à la structure' },
              ].map(c => (
                <div key={c.label} className="bg-white rounded-2xl border border-slate-200 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400">{c.label}</p>
                  <p className="text-xl font-black text-slate-900 mt-1">{c.value}</p>
                  {c.sub && <p className="text-[10px] text-slate-400 mt-0.5">{c.sub}</p>}
                </div>
              ))}
            </div>
          )}

          {/* ── Section Tricount ── */}
          {tricountSettlement && tricountSettlement.balances.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-black uppercase tracking-tight text-slate-900 text-sm">⚖️ Régularisation entre pilotes</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Différence entre les vols effectués et les encaissements réalisés par chaque pilote</p>
              </div>

              {/* Tableau des soldes */}
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
                      <th className="px-4 py-2 text-left">Pilote</th>
                      <th className="px-4 py-2 text-right">Vols effectués</th>
                      <th className="px-4 py-2 text-right">Encaissements</th>
                      <th className="px-4 py-2 text-right">Différence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tricountSettlement.balances.map(b => (
                      <tr key={b.id} className="border-t border-slate-50">
                        <td className="px-4 py-2 font-black text-slate-800 uppercase">{b.name}</td>
                        <td className="px-4 py-2 text-right text-slate-600 font-bold">{fmt(b.flew)}</td>
                        <td className="px-4 py-2 text-right text-slate-600 font-bold">{fmt(b.collected)}</td>
                        <td className={`px-4 py-2 text-right font-black ${b.diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.diff > 0 ? `+${fmt(b.diff)} encaissé en trop` : `${fmt(b.diff)} encaissé en moins`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Virements à effectuer */}
              {tricountSettlement.transactions.length > 0 && (
                <div className="border-t border-slate-100 p-4">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Virements à effectuer</p>
                  <div className="space-y-2">
                    {tricountSettlement.transactions.map((t, i) => (
                      <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                        <span className="font-black text-rose-700 uppercase text-sm">{t.from}</span>
                        <span className="text-slate-400 text-lg">→</span>
                        <span className="font-black text-emerald-700 uppercase text-sm">{t.to}</span>
                        <span className="ml-auto font-black text-slate-900 text-base">{fmt(t.amount)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {tricountSettlement.transactions.length === 0 && (
                <div className="p-4 text-center text-emerald-600 font-bold text-sm">✅ Tout est équilibré — aucun virement nécessaire</div>
              )}
            </div>
          )}

          {/* Tableau par moniteur */}
          <div className="space-y-3">
            {data.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-bold">
                Aucun vol trouvé sur cette période.
              </div>
            )}
            {data.map(mon => {
              const t = mon.totals;
              const isOpen = expanded === mon.id;
              const balancePositive = t.balance >= 0;

              return (
                <div key={mon.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  {/* Header moniteur */}
                  <button
                    className="w-full text-left p-4 hover:bg-slate-50 transition-colors"
                    onClick={() => setExpanded(isOpen ? null : mon.id)}
                  >
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[120px]">
                        <p className="font-black text-slate-900 uppercase tracking-tight">{mon.first_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">
                          {t.flights} vol{t.flights > 1 ? 's' : ''}
                          {mon.commission_type !== 'none' && (
                            <> · Commission : {mon.commission_type === 'percentage' ? `${mon.commission_value}%` : `${mon.commission_value} €/vol`}</>
                          )}
                        </p>
                      </div>

                      {/* Mini stats */}
                      <div className="flex flex-wrap gap-3 text-xs">
                        {t.esp_revenue > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">ESP collectés</p>
                            <p className="font-black text-emerald-700">{fmt(t.esp_revenue)}</p>
                          </div>
                        )}
                        {t.online_revenue > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Caisse → eux</p>
                            <p className="font-black text-blue-700">{fmt(t.online_revenue)}</p>
                          </div>
                        )}
                        {t.total_commission > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Commission</p>
                            <p className="font-black text-amber-700">{fmt(t.total_commission)}</p>
                          </div>
                        )}
                        {t.unpaid_revenue > 0 && (
                          <div className="text-center">
                            <p className="text-[10px] text-slate-400 uppercase font-bold">Non renseigné</p>
                            <p className="font-black text-slate-500">{fmt(t.unpaid_revenue)}</p>
                          </div>
                        )}
                      </div>

                      {/* Solde */}
                      <div className={`px-4 py-2 rounded-xl font-black text-sm min-w-[120px] text-center ${balancePositive ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'}`}>
                        <p className="text-[10px] uppercase font-bold opacity-70">{balancePositive ? 'Caisse leur doit' : 'Ils doivent'}</p>
                        <p>{fmt(Math.abs(t.balance))}</p>
                      </div>

                      <span className="text-slate-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {/* Détail vols */}
                  {isOpen && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Client</th>
                            <th className="px-4 py-2 text-left">Vol</th>
                            <th className="px-4 py-2 text-right">Prix</th>
                            <th className="px-4 py-2 text-center">Encaissement</th>
                            <th className="px-4 py-2 text-right">Commission</th>
                            <th className="px-4 py-2 text-right">Solde vol</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mon.flights.map(f => {
                            const isEsp = f.payment_type === 'esp';
                            const isOnline = f.payment_type && PAYMENT_LABELS[f.payment_type] && f.payment_type !== 'esp' && f.payment_type !== 'np';
                            // positive balance on this flight = collective owes monitor
                            const flightBalance = isEsp ? -f.commission : (isOnline ? f.price_euros - f.commission : 0);
                            const lbl = f.payment_type ? PAYMENT_LABELS[f.payment_type] : '—';
                            const clr = f.payment_type ? PAYMENT_COLORS[f.payment_type] : 'bg-slate-50 text-slate-400';
                            return (
                              <tr key={f.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{fmtDate(f.date)}</td>
                                <td className="px-4 py-2 font-bold text-slate-700 whitespace-nowrap">{f.title}</td>
                                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{f.flight_name || '—'}</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-800 whitespace-nowrap">{fmt(f.price_euros)}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${clr}`}>{lbl}</span>
                                </td>
                                <td className="px-4 py-2 text-right text-amber-700 font-bold whitespace-nowrap">
                                  {f.commission > 0 ? fmt(f.commission) : '—'}
                                </td>
                                <td className={`px-4 py-2 text-right font-black whitespace-nowrap ${flightBalance > 0 ? 'text-emerald-700' : flightBalance < 0 ? 'text-rose-700' : 'text-slate-400'}`}>
                                  {flightBalance !== 0 ? (flightBalance > 0 ? '+' : '') + fmt(flightBalance) : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 font-black text-xs bg-slate-50">
                            <td colSpan={3} className="px-4 py-3 text-slate-500">Total</td>
                            <td className="px-4 py-3 text-right text-slate-900">{fmt(t.total_revenue)}</td>
                            <td />
                            <td className="px-4 py-3 text-right text-amber-700">{fmt(t.total_commission)}</td>
                            <td className={`px-4 py-3 text-right ${t.balance >= 0 ? 'text-emerald-700' : 'text-rose-700'}`}>
                              {(t.balance >= 0 ? '+' : '') + fmt(t.balance)}
                            </td>
                          </tr>
                        </tfoot>
                      </table>

                      {/* Légende solde */}
                      <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 text-[10px] text-slate-400 space-y-0.5">
                        {t.esp_revenue > 0 && t.commission_on_esp > 0 && (
                          <p>ESP : {fmt(t.esp_revenue)} encaissés par le moniteur → il doit {fmt(t.commission_on_esp)} de commission à la structure</p>
                        )}
                        {t.online_revenue > 0 && (
                          <p>Caisse : {fmt(t.online_revenue)} reçus → la structure lui doit {fmt(t.online_revenue - t.commission_on_online)} (après {fmt(t.commission_on_online)} de commission)</p>
                        )}
                        {t.unpaid_revenue > 0 && (
                          <p className="text-amber-500">{fmt(t.unpaid_revenue)} sur {t.flights} vol(s) sans mode de paiement renseigné</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
