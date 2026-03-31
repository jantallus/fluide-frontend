"use client";
import React, { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';

function SuccessContent() {
  const searchParams = useSearchParams();
  const session_id = searchParams.get('session_id');
  
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  
  // NOUVEAU : Mémoire pour le Bon Cadeau
  const [isGiftCard, setIsGiftCard] = useState(false);
  const [giftCode, setGiftCode] = useState('');

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
          const data = await res.json(); // On lit la réponse du serveur
          
          // 🎁 C'est un bon cadeau !
          if (data.is_gift_card) {
            setIsGiftCard(true);
            setGiftCode(data.code);
          }
          
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

  // FONCTION DE TÉLÉCHARGEMENT INVISIBLE (Contourne le blocage de Chrome)
  const handleDownloadPDF = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      // On va chercher le fichier silencieusement
      const res = await fetch(`${apiUrl}/api/public/download-gift-card/${giftCode}`);
      
      if (!res.ok) throw new Error("Erreur de téléchargement");

      // On transforme la réponse en fichier (Blob)
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      // On crée un faux lien invisible pour forcer le téléchargement proprement
      const a = document.createElement('a');
      a.href = url;
      a.download = `Bon_Cadeau_${giftCode}.pdf`;
      document.body.appendChild(a);
      a.click(); // 👈 Clic magique invisible !

      // On nettoie derrière nous
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert("Le téléchargement a échoué. Veuillez réessayer.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans flex items-center justify-center p-4">
      <div className="max-w-xl w-full bg-white rounded-[40px] shadow-2xl p-10 text-center border border-slate-100">
        
        {/* ÉCRAN 1 : CHARGEMENT */}
        {status === 'loading' && (
          <div className="animate-in fade-in duration-500">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-violet-600 mx-auto mb-6"></div>
            <h2 className="text-2xl font-black uppercase italic text-slate-900">Validation en cours...</h2>
            <p className="text-slate-500 mt-2 font-medium">Ne fermez pas cette page, nous accrochons vos suspentes !</p>
          </div>
        )}

        {/* ÉCRAN 2A : SUCCÈS VOL CLASSIQUE */}
        {status === 'success' && !isGiftCard && (
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

        {/* ÉCRAN 2B : SUCCÈS BON CADEAU */}
        {status === 'success' && isGiftCard && (
          <div className="animate-in zoom-in-95 duration-500">
            <span className="text-7xl mb-6 block animate-bounce">🎁</span>
            <h1 className="text-4xl md:text-5xl font-black uppercase italic text-amber-500 mb-4 tracking-tight">
              Achat Réussi !
            </h1>
            <p className="text-lg text-slate-600 font-medium mb-8">
              Votre bon cadeau est prêt ! Vous pouvez noter ce code ou le transmettre directement à son heureux bénéficiaire.
            </p>
            
            <div className="bg-amber-50 p-8 rounded-3xl border-2 border-dashed border-amber-300 inline-block text-center mb-8 relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-amber-400 to-orange-500"></div>
              <p className="font-bold text-amber-700 uppercase text-xs tracking-widest mb-2">Code d'activation unique</p>
              <p className="text-4xl font-black text-slate-900 tracking-wider font-mono">{giftCode}</p>
            </div>
            
            <br/>
            {/* Bouton pour télécharger le PDF avec la méthode silencieuse */}
            <button 
              onClick={handleDownloadPDF}
              className="bg-blue-600 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-blue-700 transition-colors shadow-lg mb-4 w-full"
            >
              📥 Télécharger le Bon (PDF)
            </button>
            <br/>
            <button 
              onClick={() => window.location.href = '/'}
              className="text-slate-400 font-bold uppercase text-xs hover:text-slate-900 transition-colors"
            >
              Retour à l'accueil
            </button>
          </div>
        )}

        {/* ÉCRAN 3 : ERREUR */}
        {status === 'error' && (
          <div className="animate-in zoom-in-95 duration-500">
            <span className="text-7xl mb-6 block">❌</span>
            <h1 className="text-4xl font-black uppercase italic text-rose-500 mb-4">Oops !</h1>
            <p className="text-slate-600 font-medium mb-8">
              Le paiement semble avoir été annulé ou une erreur est survenue lors de l'enregistrement. Veuillez réessayer ou nous contacter par téléphone.
            </p>
            <button 
              onClick={() => window.location.href = '/bons-cadeaux'}
              className="bg-rose-500 text-white px-8 py-4 rounded-full font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-colors"
            >
              Retour à la boutique
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