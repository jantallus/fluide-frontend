"use client";
import React from 'react';
import type { GiftCard } from '@/lib/types';

interface Props {
  card: GiftCard;
  onToggleStatus: (id: number, status: string | undefined) => void;
  onEdit: (card: GiftCard) => void;
  onDelete: (id: number) => void;
}

function formatDate(dateString: string) {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString('fr-FR');
}

export function VoucherCard({ card: c, onToggleStatus, onEdit, onDelete }: Props) {
  const isPromo = c.type === 'promo';
  const isPartner = isPromo && c.is_partner;
  const isClassicPromo = isPromo && !c.is_partner;

  return (
    <div className={`bg-white p-5 md:p-6 rounded-[30px] shadow-sm border flex flex-col md:flex-row justify-between items-start md:items-center gap-4 md:gap-6 group transition-all ${c.status !== 'valid' ? 'opacity-60 border-slate-100 grayscale-[0.5]' : 'border-slate-100 hover:border-indigo-200'}`}>

      <div className="flex flex-col sm:flex-row gap-4 md:gap-6 items-start sm:items-center w-full">
        <div className={`p-4 rounded-2xl text-center w-full sm:w-auto min-w-[120px] ${isPartner ? 'bg-amber-50' : isClassicPromo ? 'bg-emerald-50' : 'bg-indigo-50'}`}>
          <p className={`text-[10px] font-black uppercase ${isPartner ? 'text-amber-400' : isClassicPromo ? 'text-emerald-500' : 'text-indigo-400'}`}>
            {isPartner ? 'Partenaire' : isClassicPromo ? 'Promo' : 'Bon Cadeau'}
          </p>
          <p className={`font-black break-all ${isPartner ? 'text-amber-600' : isClassicPromo ? 'text-emerald-600' : 'text-indigo-600'}`}>{c.code}</p>
        </div>

        <div className="w-full">
          {isPromo ? (
            <>
              <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-tight">
                Réduction de {c.discount_value}{c.discount_type === 'percentage' ? '%' : '€'}
              </h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">
                {c.flight_name ? `Uniquement sur : ${c.flight_name}` : '✅ Valable sur toutes les prestations'}
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {c.max_uses ? (
                  <span className="bg-slate-100 text-slate-500 px-2 py-1 rounded-md text-[10px] font-bold">🎯 {c.used_count || 0} / {c.max_uses} utilisations</span>
                ) : (
                  <span className="bg-emerald-50 text-emerald-600 px-2 py-1 rounded-md text-[10px] font-bold">♾️ Illimité</span>
                )}
                {(c.valid_from || c.valid_until) && (
                  <span className="bg-sky-50 text-sky-600 px-2 py-1 rounded-md text-[10px] font-bold">
                    📅 {c.valid_from ? `Du ${formatDate(c.valid_from)}` : ''} {c.valid_until ? `Au ${formatDate(c.valid_until)}` : ''}
                  </span>
                )}
                {c.is_partner && (c.partner_amount_cents ?? 0) > 0 && (
                  <span className="bg-amber-50 text-amber-600 border border-amber-200 px-2 py-1 rounded-md text-[10px] font-bold">
                    💰 Commission : {c.partner_billing_type === 'percentage' ? `${(c.partner_amount_cents ?? 0) / 100}%` : `${(c.partner_amount_cents ?? 0) / 100}€`} / vol
                  </span>
                )}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-lg md:text-xl font-black uppercase italic text-slate-800 leading-tight">
                De la part de : {c.buyer_name}
              </h3>
              <p className="text-xs md:text-sm text-slate-400 font-bold uppercase tracking-tight mt-1">
                {c.flight_name ? `Vol : ${c.flight_name}` : 'Avoir Libre'} • <span className="text-indigo-500">Montant : {(c.price_paid_cents ?? 0) / 100}€</span>
              </p>
              <div className="flex flex-wrap gap-2 mt-3">
                {c.buyer_phone && (
                  <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-md text-[10px] font-bold">📞 {c.buyer_phone}</span>
                )}
                {c.valid_until && (
                  <span className="bg-rose-50 text-rose-600 px-2 py-1 rounded-md text-[10px] font-bold">⏳ Expire le {formatDate(c.valid_until)}</span>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      <div className="flex flex-row md:flex-col gap-2 items-center md:items-end w-full md:w-auto justify-between md:justify-end border-t md:border-t-0 border-slate-100 pt-4 md:pt-0 mt-2 md:mt-0 flex-wrap">
        <button
          onClick={() => onToggleStatus(c.id, c.status)}
          className={`px-4 md:px-6 py-2 rounded-full font-black uppercase text-[10px] md:text-xs transition-all shadow-sm flex-1 md:flex-none text-center ${c.status === 'valid' ? 'bg-emerald-100 text-emerald-600 hover:bg-emerald-200 hover:scale-105' : 'bg-slate-100 text-slate-400 hover:bg-slate-200'}`}
        >
          {c.status === 'valid' ? '● Actif' : '✕ Inactif'}
        </button>

        {isPromo && (
          <button
            onClick={() => onEdit(c)}
            className="px-4 md:px-6 py-2 rounded-full font-black uppercase text-[10px] md:text-xs bg-sky-100 text-sky-600 hover:bg-sky-200 transition-all shadow-sm flex-1 md:flex-none text-center"
          >
            ✏️ Modifier
          </button>
        )}

        <button
          onClick={() => onDelete(c.id)}
          className="px-2 py-2 text-[10px] font-black uppercase tracking-widest text-rose-400 hover:text-rose-600 transition-colors w-full md:w-auto text-center"
        >
          🗑️ Supprimer
        </button>
      </div>
    </div>
  );
}
