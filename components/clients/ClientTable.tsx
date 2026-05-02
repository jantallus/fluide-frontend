'use client';
import React from 'react';
import { ChevronUp, ChevronDown, Trash2, X, UserCheck } from 'lucide-react';
import type { Client, User, Complement, GiftCard, ClientFlight } from '@/lib/types';
import type { QuickEditState } from '@/hooks/useQuickEdit';
import { PaymentBadge } from './PaymentBadge';
import { PaymentEditor } from './PaymentEditor';

interface ClientWithSort extends Client {
  sortKey: number;
}

interface ClientTableProps {
  title: string;
  icon: string;
  bgColor: string;
  textColor: string;
  clientsList: ClientWithSort[];
  allClients: Client[];
  monitors: User[];
  complements: Complement[];
  giftCards: GiftCard[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  expandedClient: number | null;
  setExpandedClient: React.Dispatch<React.SetStateAction<number | null>>;
  onDeleteFlight: (slotId: number, clientId: number) => void;
  edit: QuickEditState;
}

export function ClientTable({
  title, icon, bgColor, textColor,
  clientsList, allClients, monitors,
  complements, giftCards,
  selectedIds, setSelectedIds,
  expandedClient, setExpandedClient,
  onDeleteFlight,
  edit,
}: ClientTableProps) {
  const { editingSlotId, editType, tempMonitorId, setTempMonitorId, openPaymentEdit, openMonitorEdit, closeEdit, saveQuickEdit } = edit;

  const renderMonitorSelector = (f: ClientFlight, clientId: number) => (
    <>
      <select
        className="bg-slate-50 border rounded-lg p-2 font-bold text-xs"
        value={tempMonitorId}
        onChange={e => setTempMonitorId(e.target.value)}
      >
        <option value="">Pilote...</option>
        {monitors.map(m => {
          const isBusy = allClients.some(client =>
            client.flights?.some(flight =>
              flight.start_time === f.start_time &&
              flight.monitor_id?.toString() === m.id.toString() &&
              flight.id !== f.id
            )
          );
          return (
            <option key={m.id} value={m.id} disabled={isBusy} className={isBusy ? 'text-slate-300 bg-slate-100' : 'text-slate-900'}>
              {m.first_name} {isBusy ? '(Occupé)' : ''}
            </option>
          );
        })}
      </select>
      <button onClick={() => saveQuickEdit(f.id, clientId)} className="bg-emerald-500 text-white px-4 py-2 rounded-lg font-black text-xs">OK</button>
    </>
  );

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
                <input
                  type="checkbox"
                  className="w-4 h-4 rounded"
                  checked={clientsList.length > 0 && clientsList.every(c => selectedIds.includes(c.id))}
                  onChange={e => {
                    const idsInList = clientsList.map(c => c.id);
                    setSelectedIds(
                      e.target.checked
                        ? Array.from(new Set([...selectedIds, ...idsInList]))
                        : selectedIds.filter(id => !idsInList.includes(id))
                    );
                  }}
                />
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
                <tr
                  onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
                  className="border-b border-slate-50 hover:bg-slate-50 cursor-pointer transition-colors"
                >
                  <td className="p-6 text-center" onClick={e => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedIds.includes(c.id)}
                      onChange={() =>
                        setSelectedIds(
                          selectedIds.includes(c.id)
                            ? selectedIds.filter(id => id !== c.id)
                            : [...selectedIds, c.id]
                        )
                      }
                      className="w-4 h-4 rounded"
                    />
                  </td>
                  <td className="p-6 font-black text-slate-800 uppercase text-xs">{c.last_name} {c.first_name}</td>
                  <td className="p-6 font-bold text-slate-600 text-xs">{c.phone || '—'}</td>
                  <td className="p-6 text-center">
                    <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-full text-[10px] font-black uppercase">{c.flights?.length}</span>
                  </td>
                  <td className="p-6 text-right text-slate-400">{expandedClient === c.id ? <ChevronUp size={16} className="inline" /> : <ChevronDown size={16} className="inline" />}</td>
                </tr>
                {expandedClient === c.id && (
                  <tr>
                    <td colSpan={5} className="bg-slate-50/50 p-6">
                      <div className="grid grid-cols-1 gap-4">
                        {c.flights?.map(f => (
                          <div key={f.id} className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm flex items-center justify-between relative">
                            <div className="flex items-center gap-6">
                              <div className="text-center min-w-[60px]">
                                <p className="text-[9px] font-black uppercase text-slate-400">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                                <p className="text-base font-black text-slate-800">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
                                <p className="text-[11px] font-black bg-white rounded mt-0.5 py-0.5 text-slate-800 shadow-sm">{new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                              <div>
                                <p className="font-black text-slate-800 uppercase text-[11px] mb-1">{f.flight_name}</p>
                                <button
                                  onClick={e => { e.stopPropagation(); if (!f.payment_data) openMonitorEdit(f); }}
                                  className={`text-[9px] font-bold px-2 py-1 rounded-md border ${!f.payment_data ? 'bg-sky-50 text-sky-600 border-sky-100' : 'bg-slate-50 text-slate-400 border-transparent cursor-not-allowed'}`}
                                >
                                  <UserCheck size={10} className="inline mr-1" />{f.monitor_name || 'Assigner'}
                                </button>
                              </div>
                            </div>
                            <div className="flex items-center gap-4">
                              <div
                                className="cursor-pointer hover:opacity-80 transition-opacity"
                                onClick={e => { e.stopPropagation(); openPaymentEdit(f); }}
                              >
                                <PaymentBadge data={f.payment_data} />
                              </div>
                              <button onClick={e => { e.stopPropagation(); onDeleteFlight(f.id, c.id); }} className="p-2 text-rose-400"><Trash2 size={16} /></button>
                            </div>
                            {editingSlotId === f.id && (
                              <div
                                className="absolute right-0 top-full mt-2 bg-white shadow-2xl border border-slate-200 p-4 rounded-2xl z-[100] flex items-center gap-3 animate-in fade-in"
                                onClick={e => e.stopPropagation()}
                              >
                                {editType === 'monitor'
                                  ? renderMonitorSelector(f, c.id)
                                  : <PaymentEditor flight={f} clientId={c.id} complements={complements} giftCards={giftCards} edit={edit} />
                                }
                                <button onClick={closeEdit} className="ml-2 text-slate-400"><X size={14} /></button>
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
            <div
              className="p-4 flex items-center justify-between"
              onClick={() => setExpandedClient(expandedClient === c.id ? null : c.id)}
            >
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(c.id)}
                  onChange={e => {
                    e.stopPropagation();
                    setSelectedIds(
                      selectedIds.includes(c.id)
                        ? selectedIds.filter(id => id !== c.id)
                        : [...selectedIds, c.id]
                    );
                  }}
                  className="w-5 h-5 rounded"
                />
                <div>
                  <p className="font-black text-slate-800 uppercase text-xs">{c.last_name} {c.first_name}</p>
                  <p className="text-[9px] text-slate-500 font-bold uppercase">{c.phone || 'Pas de numéro'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="bg-slate-100 px-2 py-1 rounded-lg font-black text-slate-500 text-[10px]">{c.flights?.length}</span>
                <ChevronDown size={16} className={`text-sky-500 transition-transform ${expandedClient === c.id ? 'rotate-180' : ''}`} />
              </div>
            </div>
            {expandedClient === c.id && (
              <div className="bg-slate-50/50 p-3 space-y-3 border-t border-slate-100">
                {c.flights?.map(f => (
                  <div key={f.id} className="bg-white p-4 rounded-2xl border border-slate-100 shadow-sm space-y-3 relative">
                    <div className="flex justify-between items-start">
                      <div className="flex gap-3">
                        <div className="bg-sky-50 text-sky-600 px-2 py-1 rounded-lg text-center min-w-[55px] border border-sky-100 flex flex-col justify-center">
                          <p className="text-[7px] font-black uppercase leading-none mb-0.5">{new Date(f.start_time).toLocaleDateString('fr-FR', { weekday: 'short' })}</p>
                          <p className="text-xs font-black leading-none mb-0.5">{new Date(f.start_time).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}</p>
                          <p className="text-[9px] font-black bg-white rounded mt-0.5 py-0.5 text-sky-700 shadow-sm">{new Date(f.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                        <div>
                          <p className="font-black text-slate-800 uppercase text-[10px] leading-tight mb-1">{f.flight_name}</p>
                          <button
                            onClick={e => { e.stopPropagation(); if (!f.payment_data) openMonitorEdit(f); }}
                            className={`text-[8px] font-bold px-2 py-1 rounded-md border ${!f.payment_data ? 'bg-slate-50 text-slate-600' : 'text-slate-400'}`}
                          >
                            <UserCheck size={10} className="inline mr-1" />{f.monitor_name || 'Assigner'}
                          </button>
                        </div>
                      </div>
                      <button onClick={e => { e.stopPropagation(); onDeleteFlight(f.id, c.id); }} className="text-rose-300"><Trash2 size={16} /></button>
                    </div>
                    <div
                      className="cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={e => { e.stopPropagation(); openPaymentEdit(f); }}
                    >
                      <PaymentBadge data={f.payment_data} />
                    </div>
                    {editingSlotId === f.id && (
                      <div
                        className="relative mt-3 bg-white border border-slate-200 z-10 flex flex-col p-3 rounded-2xl shadow-xl animate-in fade-in slide-in-from-top-2"
                        onClick={e => e.stopPropagation()}
                      >
                        <div className="flex justify-between items-center mb-3 border-b border-slate-100 pb-2">
                          <p className="text-[10px] font-black uppercase text-sky-500">
                            {editType === 'monitor' ? '👨‍✈️ Assigner un pilote' : '💳 Encaissement'}
                          </p>
                          <button onClick={closeEdit} className="w-6 h-6 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center font-bold text-xs hover:bg-rose-100 hover:text-rose-500 transition-colors"><X size={14} /></button>
                        </div>
                        {editType === 'monitor' ? (
                          <div className="flex gap-1">
                            {renderMonitorSelector(f, c.id)}
                          </div>
                        ) : (
                          <PaymentEditor flight={f} clientId={c.id} complements={complements} giftCards={giftCards} edit={edit} />
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
}
