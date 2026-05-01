"use client";
import React from 'react';

interface Props {
  cart: Record<string, number>;
  flights: any[];
  totalItems: number;
  originalPrice: number;
  discountAmount: number;
  finalPrice: number;
  step: number;
  isFormValid: boolean;
  isCheckingOut: boolean;
  onDecrement: (key: string) => void;
  onDelete: (key: string) => void;
  onNext: () => void;
  onSubmit: () => void;
}

export default function CartBar({
  cart, flights, totalItems, originalPrice, discountAmount, finalPrice,
  step, isFormValid, isCheckingOut,
  onDecrement, onDelete, onNext, onSubmit,
}: Props) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md border-t border-slate-200 p-4 shadow-[0_-10px_40px_-15px_rgba(0,0,0,0.15)] z-[100] animate-in slide-in-from-bottom-full">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">

        <div className="flex-1 w-full">
          <span className="font-black text-slate-900 uppercase italic text-lg block mb-2">
            {totalItems} vol{totalItems > 1 ? 's' : ''} sélectionné{totalItems > 1 ? 's' : ''}
          </span>

          <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(cart).map(([key, qty]) => {
              if (qty === 0) return null;
              const [fId, , tStr] = key.split('|');
              const f = flights.find(fl => fl.id.toString() === fId);
              return (
                <div key={key} className="bg-slate-50 rounded-xl pl-3 pr-1 py-1 flex items-center gap-2 text-xs font-bold text-slate-700 border border-slate-200 shadow-sm">
                  <span>{f?.name} <span className="text-slate-400">({tStr})</span> : <span className="text-sky-500 text-sm">{qty}</span></span>
                  <div className="flex items-center gap-1 ml-2">
                    <button onClick={() => onDecrement(key)} className="w-6 h-6 bg-white border border-slate-100 rounded-lg flex items-center justify-center hover:text-rose-500 transition-colors" title="Enlever 1 place">-</button>
                    <button onClick={() => onDelete(key)} className="w-6 h-6 bg-rose-50 rounded-lg flex items-center justify-center text-rose-500 hover:bg-rose-500 hover:text-white transition-colors" title="Supprimer ce vol">❌</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-between md:justify-end gap-6 w-full md:w-auto mt-2 md:mt-0 pt-4 md:pt-0 border-t border-slate-100 md:border-0">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total</p>
            {discountAmount > 0 && (
              <p className="text-sm font-bold text-rose-400 line-through mb-[-4px]">{originalPrice.toFixed(2)} €</p>
            )}
            <p className="text-2xl font-black text-sky-500">{finalPrice.toFixed(2)} €</p>
          </div>

          {step === 3 ? (
            <button
              onClick={onSubmit}
              disabled={!isFormValid || isCheckingOut}
              className={`flex-1 md:flex-none px-8 md:px-10 py-4 rounded-2xl font-black uppercase text-[11px] md:text-[12px] tracking-widest transition-all shadow-lg ${isFormValid && !isCheckingOut ? 'bg-emerald-500 text-white hover:bg-emerald-600 hover:-translate-y-1 shadow-emerald-500/30' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
            >
              {isCheckingOut ? 'Validation...' : finalPrice === 0 ? '✨ Valider (Gratuit)' : '🔒 Payer la réservation'}
            </button>
          ) : (
            <button
              onClick={onNext}
              className="flex-1 md:flex-none bg-sky-500 text-white px-10 py-4 rounded-2xl font-black uppercase text-[12px] tracking-widest hover:bg-slate-900 transition-all shadow-lg shadow-sky-500/30"
            >
              Passer à l'inscription →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
