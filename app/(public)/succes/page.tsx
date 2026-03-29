"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');

  useEffect(() => {
    if (!session_id) {
      setStatus('error');
      return;
    }

    const confirmBooking = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/public/confirm-booking`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ session_id })
        });

        if (res.ok) {
          setStatus('success');
        } else {
          setStatus('error');
        }
      } catch (err) {
        console.error(err);
        setStatus('error');
      }
    };

    // Pour éviter de valider 2 fois si React recharge la page
    const timer = setTimeout(() => { confirmBooking(); }, 500);
    return () => clearTimeout(timer);
  }, [session_id]);

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100">
        
        {status === 'loading' && (
          <div className="animate-in fade-in duration-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-black uppercase italic text-slate-900">Validation en cours...</h2>
            <p className="text-slate-500 mt-2 font-medium">Ne fermez pas cette page, nous accrochons vos suspentes !</p>
          </div>
        )}

        {status === 'success' && (
          <div className="animate-in zoom-in-95 duration-500">
            <span className="text-7xl mb-6 block animate-bounce">🪂</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic text-emerald-500 mb-4 tracking-tight">
              Réservation Confirmée !
            </h1>
            <p className="text-lg text-slate-600 font-medium mb-8">
              Merci pour votre paiement. Vos créneaux sont officiellement réservés dans le planning de nos moniteurs. Vous allez recevoir un email de confirmation de Stripe très bientôt.
            </p>
            <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 inline-block text-left mb-8">
              <p className="font-bold text-slate-900 mb-2">📌 Prochaines étapes :</p>
              <ul className="text-sm text-slate-600 space-y-2">
                <li>• Habillez-vous chaudement (même en été).</li>
                <li>• Prenez des lunettes de soleil.</li>
                <li>• Soyez sur place 15 min avant l'heure du vol.</li>
              </ul>
            </div>
            <br/>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-slate-900 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-violet-600 transition-colors shadow-lg shadow-slate-900/20"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {status === 'error' && (
          <div className="animate-in zoom-in-95 duration-500">
            <span className="text-7xl mb-6 block">❌</span>
            <h1 className="text-4xl font-black uppercase italic text-rose-500 mb-4">Oops !</h1>
            <p className="text-slate-600 font-medium mb-8">
              Le paiement semble avoir été annulé ou une erreur est survenue lors de l'enregistrement de votre créneau. Veuillez réessayer ou nous contacter par téléphone.
            </p>
            <button 
              onClick={() => window.location.href = '/reserver'}
              className="bg-rose-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-colors"
            >
              Recommencer la réservation
            </button>
          </div>
        )}

      </div>
    </div>
  );
}

export default function PageSucces() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-slate-50"></div>}>
      <SuccessContent />
    </Suspense>
  );
}