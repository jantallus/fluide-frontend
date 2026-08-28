"use client";
import React, { useState, useCallback } from 'react';
import { apiFetch } from '@/lib/api';

interface Flight {
  id: number;
  date: string;
  title: string;
  flight_name: string | null;
  price_euros: number;
  payment_type: string | null;
  encaisseur_id: string | number | null;
}

interface MonitorData {
  id: string;
  first_name: string;
  flights: Flight[];
}

const PAYMENT_LABELS: Record<string, string> = {
  esp: 'ESP', cb: 'CB', ancv: 'ANCV', ancv_connect: 'ANCV+',
  chq: 'CHQ', bon_cadeau: 'Bon', online: 'Stripe', np: 'NP',
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
    setLoading(true); setError('');
    try {
      const res = await apiFetch(`/api/regularisation?from=${from}&to=${to}`);
      if (!res.ok) throw new Error();
      setData((await res.json()).monitors);
    } catch { setError('Impossible de charger les données.'); }
    finally { setLoading(false); }
  }, [from, to]);

  // ── Calcul Tricount inter-pilotes ─────────────────────────────────────────
  const tricount = data ? (() => {
    const flew: Record<string, number> = {};
    const collected: Record<string, number> = {};
    data.forEach(m => { flew[m.id] = 0; collected[m.id] = 0; });

    data.forEach(m => m.flights.forEach(f => {
      if (!f.encaisseur_id) return;
      flew[m.id] += f.price_euros;
      const eid = String(f.encaisseur_id);
      if (collected[eid] !== undefined) collected[eid] += f.price_euros;
    }));

    const balances = data
      .map(m => ({ id: m.id, name: m.first_name, flew: flew[m.id] || 0, collected: collected[m.id] || 0, diff: (collected[m.id] || 0) - (flew[m.id] || 0) }))
      .filter(b => Math.abs(b.diff) > 0.005);

    const debtors   = balances.filter(b => b.diff > 0).map(b => ({ ...b, rem: b.diff }));
    const creditors = balances.filter(b => b.diff < 0).map(b => ({ ...b, rem: -b.diff }));
    const transactions: { from: string; to: string; amount: number }[] = [];
    let di = 0, ci = 0;
    while (di < debtors.length && ci < creditors.length) {
      const amount = Math.min(debtors[di].rem, creditors[ci].rem);
      if (amount > 0.005) transactions.push({ from: debtors[di].name, to: creditors[ci].name, amount });
      debtors[di].rem  -= amount; creditors[ci].rem -= amount;
      if (debtors[di].rem  < 0.005) di++;
      if (creditors[ci].rem < 0.005) ci++;
    }
    return { balances, transactions };
  })() : null;

  // Lookup encaisseur name from pilot list
  const pilotName = (eid: string | number | null) => {
    if (!eid || !data) return null;
    return data.find(m => m.id === String(eid))?.first_name ?? null;
  };

  const totalFlights = data?.reduce((s, m) => s + m.flights.length, 0) ?? 0;
  const totalCA = data?.reduce((s, m) => s + m.flights.reduce((ss, f) => ss + f.price_euros, 0), 0) ?? 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter text-slate-900">
          Régularisation <span className="text-amber-500">Pilotes</span>
        </h1>
        <p className="text-xs text-slate-400 mt-1">Vols effectués vs encaissements réels — règlement entre pilotes.</p>
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
        <button onClick={load} disabled={loading} className="bg-slate-900 text-white px-6 py-2.5 rounded-xl font-black uppercase text-xs shadow hover:bg-slate-700 transition-colors disabled:opacity-50">
          {loading ? 'Chargement…' : 'Calculer'}
        </button>
      </div>

      {error && <p className="text-rose-500 font-bold text-sm">{error}</p>}

      {data && (
        <>
          {/* Résumé global */}
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">Vols</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{totalFlights}</p>
            </div>
            <div className="bg-white rounded-2xl border border-slate-200 p-4">
              <p className="text-[10px] font-black uppercase text-slate-400">CA total</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{fmt(totalCA)}</p>
            </div>
          </div>

          {/* Tricount */}
          {tricount && tricount.balances.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
              <div className="p-4 border-b border-slate-100">
                <h2 className="font-black uppercase tracking-tight text-slate-900 text-sm">⚖️ Règlement entre pilotes</h2>
                <p className="text-[10px] text-slate-400 mt-0.5">Différence entre vols effectués et encaissements réalisés</p>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
                      <th className="px-4 py-2 text-left">Pilote</th>
                      <th className="px-4 py-2 text-right">Vols effectués</th>
                      <th className="px-4 py-2 text-right">Encaissé</th>
                      <th className="px-4 py-2 text-right">Différence</th>
                    </tr>
                  </thead>
                  <tbody>
                    {tricount.balances.map(b => (
                      <tr key={b.id} className="border-t border-slate-50">
                        <td className="px-4 py-2 font-black text-slate-800 uppercase">{b.name}</td>
                        <td className="px-4 py-2 text-right text-slate-600 font-bold">{fmt(b.flew)}</td>
                        <td className="px-4 py-2 text-right text-slate-600 font-bold">{fmt(b.collected)}</td>
                        <td className={`px-4 py-2 text-right font-black ${b.diff > 0 ? 'text-rose-600' : 'text-emerald-600'}`}>
                          {b.diff > 0 ? `+${fmt(b.diff)} à reverser` : `${fmt(Math.abs(b.diff))} à recevoir`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {tricount.transactions.length > 0 ? (
                <div className="border-t border-slate-100 p-4 space-y-2">
                  <p className="text-[10px] font-black uppercase text-slate-400 mb-3">Virements à effectuer</p>
                  {tricount.transactions.map((t, i) => (
                    <div key={i} className="flex items-center gap-3 bg-amber-50 border border-amber-100 rounded-xl px-4 py-3">
                      <span className="font-black text-rose-700 uppercase">{t.from}</span>
                      <span className="text-slate-400">→</span>
                      <span className="font-black text-emerald-700 uppercase">{t.to}</span>
                      <span className="ml-auto font-black text-slate-900 text-base">{fmt(t.amount)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-4 text-center text-emerald-600 font-bold text-sm">✅ Tout est équilibré — aucun virement nécessaire</div>
              )}
            </div>
          )}

          {/* Détail par pilote */}
          <div className="space-y-3">
            {data.length === 0 && (
              <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center text-slate-400 font-bold">
                Aucun vol trouvé sur cette période.
              </div>
            )}
            {data.map(mon => {
              const isOpen = expanded === mon.id;
              const totalMon = mon.flights.reduce((s, f) => s + f.price_euros, 0);
              const balance = tricount?.balances.find(b => b.id === mon.id);

              return (
                <div key={mon.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden">
                  <button className="w-full text-left p-4 hover:bg-slate-50 transition-colors" onClick={() => setExpanded(isOpen ? null : mon.id)}>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex-1 min-w-[120px]">
                        <p className="font-black text-slate-900 uppercase tracking-tight">{mon.first_name}</p>
                        <p className="text-[10px] text-slate-400 mt-0.5">{mon.flights.length} vol{mon.flights.length > 1 ? 's' : ''} · CA {fmt(totalMon)}</p>
                      </div>
                      {balance && (
                        <div className={`px-4 py-2 rounded-xl font-black text-sm text-center ${balance.diff > 0 ? 'bg-rose-100 text-rose-800' : 'bg-emerald-100 text-emerald-800'}`}>
                          <p className="text-[10px] uppercase font-bold opacity-70">{balance.diff > 0 ? 'À reverser' : 'À recevoir'}</p>
                          <p>{fmt(Math.abs(balance.diff))}</p>
                        </div>
                      )}
                      <span className="text-slate-300 text-xs">{isOpen ? '▲' : '▼'}</span>
                    </div>
                  </button>

                  {isOpen && (
                    <div className="border-t border-slate-100 overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="bg-slate-50 text-[10px] uppercase text-slate-400 font-black">
                            <th className="px-4 py-2 text-left">Date</th>
                            <th className="px-4 py-2 text-left">Client</th>
                            <th className="px-4 py-2 text-left">Vol</th>
                            <th className="px-4 py-2 text-right">Prix</th>
                            <th className="px-4 py-2 text-center">Mode</th>
                            <th className="px-4 py-2 text-left">Encaissé par</th>
                          </tr>
                        </thead>
                        <tbody>
                          {mon.flights.map(f => {
                            const lbl = f.payment_type ? (PAYMENT_LABELS[f.payment_type] ?? f.payment_type) : '—';
                            const clr = f.payment_type ? (PAYMENT_COLORS[f.payment_type] ?? 'bg-slate-100 text-slate-500') : 'bg-slate-50 text-slate-400';
                            const encaisseur = pilotName(f.encaisseur_id);
                            const isSelf = encaisseur === mon.first_name;
                            return (
                              <tr key={f.id} className="border-t border-slate-50 hover:bg-slate-50/50">
                                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{fmtDate(f.date)}</td>
                                <td className="px-4 py-2 font-bold text-slate-700 whitespace-nowrap">{f.title}</td>
                                <td className="px-4 py-2 text-slate-500 whitespace-nowrap">{f.flight_name || '—'}</td>
                                <td className="px-4 py-2 text-right font-bold text-slate-800 whitespace-nowrap">{fmt(f.price_euros)}</td>
                                <td className="px-4 py-2 text-center">
                                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-black ${clr}`}>{lbl}</span>
                                </td>
                                <td className={`px-4 py-2 whitespace-nowrap font-bold ${isSelf ? 'text-slate-400' : 'text-amber-600'}`}>
                                  {encaisseur ?? <span className="text-slate-300">—</span>}
                                  {!isSelf && encaisseur && <span className="ml-1 text-[9px] bg-amber-100 text-amber-700 rounded-full px-1.5 py-0.5 font-black uppercase">autre pilote</span>}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-slate-200 font-black text-xs bg-slate-50">
                            <td colSpan={3} className="px-4 py-3 text-slate-500">Total</td>
                            <td className="px-4 py-3 text-right text-slate-900">{fmt(totalMon)}</td>
                            <td colSpan={2} />
                          </tr>
                        </tfoot>
                      </table>
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
