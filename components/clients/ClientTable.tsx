"use client";
import React, { useState } from 'react';
import PaymentEditor from './PaymentEditor';

const renderPaymentBadge = (status: string) => {
  if (!status) return <span className="bg-slate-100 text-slate-600 px-3 py-2 rounded-xl font-black text-[9px] uppercase tracking-widest border border-slate-200 block w-fit hover:bg-sky-50 hover:text-sky-600 transition-colors">🏢 À ENCAISSER</span>;
  let bgColor = 'bg-emerald-50 border-emerald-200 text-emerald-800'; let icon = '✅';
  if (status.includes('Bon Cadeau')) { bgColor = 'bg-violet-50 border-violet-200 text-violet-800'; icon = '🎁'; }
  else if (status.includes('Promo')) { bgColor = 'bg-fuchsia-50 border-fuchsia-200 text-fuchsia-800'; icon = '🏷️'; }
  else if (status.includes('Partenaire')) { bgColor = 'bg-amber-50 border-amber-200 text-amber-800'; icon = '🤝'; }
  else if (status.includes('À régler')) { bgColor = 'bg-rose-50 border-rose-200 text-rose-800'; icon = '⏳'; }
  return <span className={`px-3 py-2 rounded-xl font-bold text-[9px] uppercase tracking-wider border block w-fit max-w-[280px] whitespace-pre-wrap leading-relaxed shadow-sm ${bgColor}`}>{icon} {status}</span>;
};

interface Props {
  title: string; icon: string; bgColor: string; textColor: string;
  clientsList: any[]; allClients: any[]; monitors: any[];
  giftCards: any[]; complements: any[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  onApplyPayment: (slotId: number, clientId: number, paymentStatus: string, gcId: number | null) => Promise<boolean>;
  onUpdateMonitor: (slotId: number, clientId: number, monitorId: string) => Promise<boolean>;
  onDeleteFlight: (slotId: number, clientId: number) => void;
}

export default function ClientTable({ title, icon, bgColor, textColor, clientsList, allClients, monitors, giftCards, complements, selectedIds, setSelectedIds, onApplyPayment, onUpdateMonitor, onDeleteFlight }: Props) {
  const [expandedClient, setExpandedClient] = useState<number | null>(null);
  const [editingSlotId, setEditingSlotId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'monitor' | 'payment' | null>(null);
  const [tempMonitorId, setTempMonitorId] = useState('');

  const openPayment = (f: any, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingSlotId(f.id);
    setEditType('payment');
  };

  const openMonitor = (f: any, e: React.MouseEvent) => {
    e.stopPropagation();
    if (f.payment_status) return;
    setTempMonitorId(f.monitor_id?.toString() || '');
    setEditingSlotId(f.id);
    setEditType('monitor');
  };

  const closeEdit = () => { setEditingSlotId(null); setEditType(null); };

  const renderMonitorSelect = (f: any, c: any) => (
    <>
      <select className="bg-slate-50 border rounded-lg p-2 font-bold text-xs" value={tempMonitorId} onChange={e => setTempMonitorId(e.target.value)}>
        <option value="">Pilote...</option>
        {monitors.map((m: any) => {
          const isBusy = allClients.some(client => client.flights.some((fl: any) => fl.start_time === f.start_time && fl.monitor_id?.toString() === m.id.toString() && fl.id !== f.id));
          return <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? 'text-slate-300 bg-slate-100' : 'text-slate-900'}>{m.first_name} {isBusy ? '(Occupé)' : ''}</option>;
        })}
      </select>
      <button onClick={async () => { if (await onUpdateMonitor(f.id, c.id, tempMonitorId)) closeEdit(); }} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs">OK</button>
    </>
  );

  const flightCard = (f: any, c: any, isMobile = false) => (
    <div key={f.id} className={`bg-white p-4 rounded-${isMobile ? '2' : '3'}xl border border-slate-100 shadow-sm ${isMobile ? 'space-y-3' : 'flex items-center justify-between'} relative`}>
      {isMobile ? (
        <>
          <div className="flex justify-between items-start">
            <div className="flex gap-3">
              <div className="bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-center min-w-[55px] border border-sky-100 flex flex-col justify-center">
                <p className="text-[7px] font-black uppercase leading-none mb-0.5">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                <p className="text-xs font-black leading-none mb-0.5">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
                <p className="text-[9px] font-black bg-white rounded mt-0.5 py-0.5 text-sky-700 shadow-sm">{new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
              </div>
              <div>
                <p className="font-black text-slate-800 uppercase text-[10px] leading-tight mb-1">{f.flight_name}</p>
                <button onClick={e => openMonitor(f, e)} className={`text-[8px] font-bold px-2 py-1 rounded-md border ${!f.payment_status ? 'bg-slate-50 text-slate-600' : 'text-slate-400'}`}>👨‍✈️ {f.monitor_name || 'Assigner'}</button>
              </div>
            </div>
            <button onClick={e => { e.stopPropagation(); onDeleteFlight(f.id, c.id); }} className="text-rose-300">🗑️</button>
          </div>
          <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={e => openPayment(f, e)}>{renderPaymentBadge(f.payment_status)}</div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-6">
            <div className="text-center min-w-[60px]">
              <p className="text-[9px] font-black uppercase text-slate-400">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
              <p className="text-base font-black text-slate-800">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
              <p className="text-[11px] font-black bg-white rounded mt-0.5 py-0.5 text-slate-800 shadow-sm">{new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
            </div>
            <div>
              <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{f.flight_name}</p>
              <button onClick={e => openMonitor(f, e)} className={`text-[9px] font-bold px-2 py-1 rounded-md border ${!f.payment_status ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}>👨‍✈️ {f.monitor_name || 'Assigner'}</button>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="cursor-pointer hover:opacity-80 transition-opacity" onClick={e => openPayment(f, e)}>{renderPaymentBadge(f.payment_status)}</div>
            <button onClick={e => { e.stopPropagation(); onDeleteFlight(f.id, c.id); }} className="p-2 text-rose-400">🗑️</button>
          </div>
        </>
      )}

      {editingSlotId === f.id && (
        <div className={`${isMobile ? 'relative mt-3' : 'absolute right-0 top-full mt-2'} bg-white shadow-2xl border border-slate-200 p-4 rounded-2xl z-[100] flex ${isMobile ? 'flex-col' : 'items-center gap-3'} animate-in fade-in`} onClick={e => e.stopPropagation()}>
          {isMobile && (
            <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
              <p className="text-[10px] font-black uppercase text-sky-500">{editType === 'monitor' ? '👨‍✈️ Assigner un pilote' : '💳 Encaissement'}</p>
              <button onClick={closeEdit} className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs hover:bg-rose-100 hover:text-rose-500 transition-colors">✕</button>
            </div>
          )}
          {editType === 'monitor' ? (
            <div className={`flex gap-${isMobile ? '1' : '2'}`}>{renderMonitorSelect(f, c)}</div>
          ) : (
            <PaymentEditor flight={f} complements={complements} giftCards={giftCards}
              onSave={async (paymentStatus, gcId) => { if (await onApplyPayment(f.id, c.id, paymentStatus, gcId)) closeEdit(); }}
              onClose={closeEdit}
            />
          )}
          {!isMobile && <button onClick={closeEdit} className="ml-2 text-slate-400">✕</button>}
        </div>
      )}
    </div>
  );

  return (
    <div className="mb-12">
      <div className="flex items-center gap-4 mb-6 ml-4">
        <div className={`${bgColor} ${textColor} w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-sm font-bold`}>{icon}</div>
        <h2 className="text-2xl font-black uppercase text-slate-800">{title}</h2>
        <span className="bg-slate-100 text-slate-400 px-3 py-1 rounded-full text-xs font-black">{clientsList.length}</span>
      </div>

      {/* Desktop */}
      <div className="hidden md:block bg-white rounded-[40px] shadow-sm border border-slate-100">
        <table className="w-full text-left">
          <thead>
            <tr className="bg-slate-50 text-[10px] font-black text-slate-400 uppercase border-b border-slate-100">
              <th className="p-6 w-12 text-center rounded-tl-[40px]">
                <input type="checkbox" className="w-4 h-4 rounded" checked={clientsList.length > 0 && clientsList.every(c => selectedIds.includes(c.id))}
                  onChange={e => { const ids = clientsList.map(c => c.id); setSelectedIds(e.target.checked ? Array.from(new Set([...selectedIds, ...ids])) : selectedIds.filter(id => !ids.includes(id))); }} />
              </th>
              <th className="p-6 text-xs">Nom / Prénom</th>
              <th className="p-6 text-xs">Téléphone</th>
              <th className="p-6 text-xs text-center">Vols</th>
              <th className="p-6 text-xs text-right rounded-tr-[40px]">Détails</th>
            </tr>
          </thead>
          <tbody>
            {clientsList.map(c => (
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
                  <tr><td colSpan={5} className="bg-slate-50/50 p-6">
                    <div className="grid grid-cols-1 gap-4">{c.flights.map((f: any) => flightCard(f, c, false))}</div>
                  </td></tr>
                )}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile */}
      <div className="md:hidden space-y-4 px-2">
        {clientsList.map(c => (
          <div key={c.id} className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
            <div className="p-4 flex items-center justify-between" onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}>
              <div className="flex items-center gap-3">
                <input type="checkbox" checked={selectedIds.includes(c.id)} onChange={e => { e.stopPropagation(); setSelectedIds(selectedIds.includes(c.id) ? selectedIds.filter(id => id !== c.id) : [...selectedIds, c.id]); }} className="w-5 h-5 rounded" />
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
                {c.flights.map((f: any) => flightCard(f, c, true))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
