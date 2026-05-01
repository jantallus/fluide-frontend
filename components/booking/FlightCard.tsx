"use client";
import React from 'react';
import { getMarketingInfo } from '@/lib/booking-utils';

interface Props {
  flight: any;
  giftTemplates: any[];
  onSelect: () => void;
  onInfo: () => void;
  onGift: (templateId: number, flightName: string) => void;
}

export default function FlightCard({ flight, giftTemplates, onSelect, onInfo, onGift }: Props) {
  const s = String(flight.season || 'ALL').toUpperCase().trim();
  let displayedSeason = '🌍 Inclus dans toutes les saisons';
  if (s === 'SUMMER' || s === 'ETE' || s === 'ÉTÉ' || s === 'STANDARD') displayedSeason = '☀️ Uniquement sur la saison Été';
  if (s === 'WINTER' || s === 'HIVER') displayedSeason = '❄️ Uniquement sur la saison Hiver';

  const matchingTemplate = giftTemplates.find(t => t.price_cents === flight.price_cents);

  return (
    <div
      className="bg-white rounded-[35px] p-8 shadow-xl border border-slate-100 hover:border-sky-400 hover:-translate-y-2 transition-all duration-300 cursor-pointer flex flex-col justify-between group"
      onClick={onSelect}
    >
      {flight.image_url && (
        <div
          className="w-full h-40 md:h-52 bg-cover bg-center rounded-2xl md:rounded-[20px] mb-6 shadow-sm border border-slate-100"
          style={{ backgroundImage: `url(${flight.image_url})` }}
        />
      )}

      <div>
        <div className="flex justify-between items-start mb-3 gap-2">
          <h3 className="text-2xl font-black uppercase italic text-slate-900">{flight.name}</h3>
          {flight.show_popup && flight.popup_content && (
            <button
              onClick={e => { e.stopPropagation(); onInfo(); }}
              className="w-8 h-8 shrink-0 rounded-full bg-transparent text-slate-400 flex items-center justify-center hover:bg-sky-50 hover:text-sky-600 hover:border-sky-300 transition-all border border-slate-200"
              title="Plus d'informations sur ce vol"
            >
              <span className="font-serif italic font-bold text-lg leading-none" style={{ fontFamily: 'Georgia, serif' }}>i</span>
            </button>
          )}
        </div>
        <div className="flex gap-3 text-sm font-bold text-slate-500 mb-6">
          <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">{getMarketingInfo(flight.name)}</span>
          <span className="bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
            ⚖️ {flight.weight_min ?? 20} - {flight.weight_max ?? 110} kg
          </span>
        </div>
        <div className="text-[10px] font-bold uppercase text-slate-400 mb-4 bg-slate-50 border border-slate-100 inline-block px-3 py-1 rounded-lg">
          {displayedSeason}
        </div>
      </div>

      <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between gap-2">
        <div className="text-3xl md:text-4xl font-black text-sky-600 shrink-0">
          {flight.price_cents ? flight.price_cents / 100 : 0}€
        </div>
        <div className="flex gap-2 flex-wrap justify-end">
          {matchingTemplate && (
            <button
              onClick={e => { e.stopPropagation(); onGift(matchingTemplate.id, flight.name); }}
              className="cursor-pointer bg-fuchsia-100 text-fuchsia-600 px-4 py-3 md:py-4 md:px-5 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-fuchsia-500 hover:text-white transition-colors"
            >
              🎁 Offrir
            </button>
          )}
          <button className="cursor-pointer bg-indigo-700 text-white px-4 py-3 md:px-6 md:py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest group-hover:bg-fuchsia-500 transition-all shadow-md hover:shadow-fuchsia-500/30">
            Réserver <span className="hidden md:inline">ce vol</span>
          </button>
        </div>
      </div>
    </div>
  );
}
