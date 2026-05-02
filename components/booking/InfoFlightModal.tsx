"use client";
import React, { useEffect, useRef } from 'react';
import type { FlightType } from '@/lib/types';

interface Props {
  flight: FlightType;
  onClose: () => void;
}

export default function InfoFlightModal({ flight, onClose }: Props) {
  const savedScrollPos = useRef(0);

  useEffect(() => {
    savedScrollPos.current = window.scrollY;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = '';
      const target = savedScrollPos.current;
      if (target > 0) {
        setTimeout(() => window.scrollTo({ top: target, behavior: 'smooth' }), 50);
        savedScrollPos.current = 0;
      }
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-[30px] shadow-2xl w-full max-w-lg flex flex-col max-h-[90vh] animate-in zoom-in-95"
        onClick={e => e.stopPropagation()}
      >
        <div className="p-6 md:p-8 pb-4 shrink-0 flex justify-between items-start border-b border-slate-100">
          <h3 className="text-2xl font-black uppercase italic text-slate-900 pr-4">À propos de ce vol</h3>
          <button
            onClick={onClose}
            className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 hover:bg-rose-100 hover:text-rose-500 transition-colors shrink-0 cursor-pointer active:scale-95"
            aria-label="Fermer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar relative">
          <div className="relative prose prose-sm max-w-none text-slate-600 whitespace-pre-wrap font-medium leading-relaxed bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-100 overflow-hidden shadow-inner">
            {flight.image_url && (
              <div
                className="absolute inset-0 bg-cover bg-center opacity-10 pointer-events-none"
                style={{ backgroundImage: `url(${flight.image_url})` }}
              />
            )}
            <div className="relative z-10 text-base">
              {flight.popup_content && flight.popup_content.split(/(\*\*.*?\*\*)/g).map((part: string, i: number) =>
                part.startsWith('**') && part.endsWith('**')
                  ? <strong key={i} className="font-black text-slate-900">{part.slice(2, -2)}</strong>
                  : part
              )}
            </div>
          </div>

          <button
            onClick={e => { e.stopPropagation(); onClose(); }}
            className="mt-8 w-full bg-sky-500 text-white py-4 rounded-xl font-black uppercase tracking-widest hover:bg-sky-600 transition-colors shadow-md shrink-0 active:scale-[0.98]"
          >
            J'ai compris
          </button>
        </div>
      </div>
    </div>
  );
}
