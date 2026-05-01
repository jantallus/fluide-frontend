"use client";
import React, { useState } from 'react';

interface Props {
  appliedVoucher: any;
  discountAmount: number;
  onApply: (code: string) => Promise<void>;
  onRemove: () => void;
}

export default function VoucherSection({ appliedVoucher, discountAmount, onApply, onRemove }: Props) {
  const [input, setInput] = useState('');
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState('');

  const handleApply = async () => {
    if (!input.trim()) return;
    setIsApplying(true);
    setError('');
    try {
      await onApply(input.trim());
      setInput('');
    } catch (msg: any) {
      setError(msg || 'Code invalide ou expiré');
    } finally {
      setIsApplying(false);
    }
  };

  return (
    <div className="mb-12 bg-sky-50 border-2 border-sky-200 rounded-3xl p-6 md:p-8 relative overflow-hidden shadow-sm">
      <div className="absolute -right-6 -top-6 text-9xl opacity-10 pointer-events-none">🎁</div>

      <h3 className="font-black text-xl text-violet-900 mb-2 uppercase tracking-widest flex items-center gap-3 relative z-10">
        Vous avez un Bon Cadeau ou un Code Promo ?
      </h3>
      <p className="text-violet-700 font-bold mb-6 text-sm relative z-10">
        Saisissez-le ici. La réduction s'appliquera immédiatement sur votre total avant le paiement.
      </p>

      {appliedVoucher ? (
        <div className="bg-white border-2 border-emerald-500 rounded-2xl p-4 md:p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10 shadow-sm">
          <div>
            <p className="font-black text-emerald-900 uppercase tracking-widest text-sm">
              ✅ {appliedVoucher.type === 'promo' ? 'Code Promo appliqué' : 'Bon cadeau activé !'}
            </p>
            <p className="text-emerald-700 font-bold mt-1">
              Code : <span className="uppercase">{appliedVoucher.code}</span>
            </p>
          </div>
          <div className="text-left md:text-right w-full md:w-auto">
            <p className="text-3xl font-black text-emerald-600">- {discountAmount.toFixed(2)} €</p>
            <button onClick={onRemove} className="text-[10px] font-black uppercase text-rose-500 mt-2 hover:underline">
              Retirer le code
            </button>
          </div>
        </div>
      ) : (
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder="Ex: FLUIDE-1234 ou NOEL2024"
              className="flex-1 bg-white border-2 border-sky-100 rounded-2xl p-4 font-black uppercase text-slate-800 focus:border-violet-500 outline-none transition-colors shadow-sm"
              value={input}
              onChange={e => setInput(e.target.value.toUpperCase())}
            />
            <button
              onClick={handleApply}
              disabled={isApplying || !input.trim()}
              className={`px-8 py-4 md:py-0 rounded-2xl font-black uppercase tracking-widest text-sm transition-all ${!input.trim() || isApplying ? 'bg-sky-200/50 text-sky-500' : 'bg-violet-500 text-white hover:bg-violet-600 shadow-md hover:-translate-y-0.5'}`}
            >
              {isApplying ? '...' : 'Appliquer'}
            </button>
          </div>
          {error && (
            <p className="text-violet-600 font-bold text-sm mt-3 flex items-center gap-2">
              <span>ℹ️</span> {error}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
