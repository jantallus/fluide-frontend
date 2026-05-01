"use client";
import React from 'react';
import { getDayName } from '@/lib/booking-utils';

interface Props {
  passenger: any;
  index: number;
  complementsList: any[];
  appliedVoucher: any;
  flights: any[];
  onChange: (index: number, updated: any) => void;
}

export default function PassengerCard({ passenger: p, index, complementsList, appliedVoucher, flights, onChange }: Props) {
  const update = (patch: Partial<typeof p>) => onChange(index, { ...p, ...patch });

  return (
    <div className="bg-white border-2 border-slate-100 rounded-3xl p-6 relative overflow-hidden group">
      <div className="absolute top-0 left-0 w-2 h-full bg-sky-500" />

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <h4 className="font-black text-lg text-slate-900">Passager {index + 1}</h4>
        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-xs font-bold uppercase tracking-widest">
          {p.flightName} • {getDayName(p.date)} à {p.time}
        </span>
      </div>

      <div className="mb-4">
        <label className="text-[10px] font-black uppercase text-slate-400 ml-2">Prénom de la personne qui vole</label>
        <input
          type="text"
          className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl p-4 font-bold focus:border-sky-500 outline-none text-slate-800"
          placeholder="Prénom du passager"
          value={p.firstName}
          onChange={e => update({ firstName: e.target.value })}
        />
      </div>

      <label className={`flex items-start gap-3 cursor-pointer p-4 rounded-2xl border transition-colors mb-4 ${p.weightChecked ? 'bg-emerald-50 border-emerald-200' : 'bg-rose-50 border-rose-200'}`}>
        <input
          type="checkbox"
          className={`w-6 h-6 mt-0.5 ${p.weightChecked ? 'accent-emerald-500' : 'accent-rose-500'}`}
          checked={p.weightChecked}
          onChange={e => update({ weightChecked: e.target.checked })}
        />
        <div>
          <span className={`font-bold block ${p.weightChecked ? 'text-emerald-900' : 'text-rose-900'}`}>
            Je certifie peser entre {p.weight_min} et {p.weight_max} kg *
          </span>
          <span className={`text-xs ${p.weightChecked ? 'text-emerald-600' : 'text-rose-500'}`}>
            Information obligatoire pour des raisons de sécurité.
          </span>
        </div>
      </label>

      {complementsList.length > 0 && (
        <div className="mt-4 pt-4 border-t border-slate-100">
          <p className="text-[10px] font-black uppercase text-slate-400 ml-2 mb-3">Options disponibles (paiement sur place possible)</p>
          <div className="grid gap-3">
            {complementsList.map((comp: any) => {
              const isSelected = p.selectedComplements?.includes(comp.id) || false;

              let isLockedByVoucher = false;
              const currentFlight = flights.find((f: any) => f.id.toString() === p.flightId);
              if (appliedVoucher && appliedVoucher.type === 'gift_card' && currentFlight) {
                const isSameFlight = !appliedVoucher.flight_type_id || appliedVoucher.flight_type_id.toString() === p.flightId;
                if (isSameFlight) {
                  const vVal = Number(appliedVoucher.price_paid_cents) / 100;
                  if (vVal >= currentFlight.price_cents / 100 + comp.price_cents / 100) isLockedByVoucher = true;
                }
              }

              return (
                <label
                  key={comp.id}
                  className={`flex items-start gap-3 p-4 rounded-2xl border transition-colors ${isLockedByVoucher ? 'opacity-80 cursor-not-allowed bg-sky-50/50 border-sky-200' : 'cursor-pointer'} ${isSelected && !isLockedByVoucher ? 'bg-sky-50 border-sky-300' : (!isLockedByVoucher ? 'bg-slate-50 border-slate-100 hover:border-sky-200' : '')}`}
                >
                  <input
                    type="checkbox"
                    className={`w-6 h-6 mt-0.5 accent-sky-500 ${isLockedByVoucher ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                    checked={isSelected}
                    disabled={isLockedByVoucher}
                    onChange={e => {
                      if (isLockedByVoucher) return;
                      const selected = p.selectedComplements || [];
                      update({
                        selectedComplements: e.target.checked
                          ? [...selected, comp.id]
                          : selected.filter((id: number) => id !== comp.id),
                      });
                    }}
                  />
                  <div className="flex-1 flex items-center gap-4">
                    {comp.image_url && (
                      <div className={`w-10 h-10 shrink-0 bg-white rounded-lg p-1 border flex items-center justify-center shadow-sm ${isLockedByVoucher ? 'border-sky-200' : 'border-slate-200'}`}>
                        <img src={comp.image_url} alt={comp.name} className="w-full h-full object-contain" />
                      </div>
                    )}
                    <div>
                      <span className={`font-bold block ${isSelected ? 'text-sky-900' : 'text-slate-700'}`}>
                        {comp.name}{' '}
                        <span className={isLockedByVoucher ? 'text-emerald-600' : ''}>
                          {isLockedByVoucher ? '(Inclus dans le Bon)' : `(+${comp.price_cents / 100}€)`}
                        </span>
                      </span>
                      {comp.description && (
                        <span className="text-xs text-slate-500 mt-1 block leading-tight">{comp.description}</span>
                      )}
                    </div>
                  </div>
                </label>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
