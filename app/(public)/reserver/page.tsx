"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api'; // 1. Import ajouté

function ReserverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // 2. Ajout d'états pour le formulaire (indispensable pour réserver)
  const [nomClient, setNomClient] = useState('');
  const [emailClient, setEmailClient] = useState('');

  const volId = searchParams.get('volId');
  const volNom = searchParams.get('nom');
  const volPrix = searchParams.get('prix');

  useEffect(() => {
    apiFetch('/api/slots')
      .then(res => res.json())
      .then(data => {
        const disponibles = data.filter((s: any) => s.status === 'available');
        setSlots(disponibles);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur:", err);
        setLoading(false);
      });
  }, []);

  const confirmerReservation = async (slotId: number) => {
    // Vérification simple
    if (!nomClient || !emailClient) {
      alert("Merci de remplir votre nom et votre email avant de choisir un créneau.");
      return;
    }

    try {
      // 3. Correction du 'cconst' et suppression des '...'
      const res = await apiFetch('/api/bookings', { 
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slotId: slotId, 
          volId: volId,
          clientName: nomClient,
          email: emailClient
        }),
      });

      if (res.ok) {
        alert(`Bravo ! Votre vol "${volNom}" est réservé. À bientôt dans les airs ! 🪂`);
        router.push('/dashboard'); // Ou une page de confirmation
      } else {
        alert("Oups, ce créneau n'est plus disponible.");
      }
    } catch (err) {
      alert("Impossible de joindre le serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Formulaire de coordonnées */}
        <div className="bg-white p-8 rounded-[32px] shadow-sm border border-slate-100 mb-8">
          <h3 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-6">Vos informations</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" 
              placeholder="Votre nom complet"
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-sky-500 transition-all font-bold"
              value={nomClient}
              onChange={(e) => setNomClient(e.target.value)}
            />
            <input 
              type="email" 
              placeholder="votre@email.com"
              className="p-4 bg-slate-50 rounded-2xl outline-none focus:ring-2 ring-sky-500 transition-all font-bold"
              value={emailClient}
              onChange={(e) => setEmailClient(e.target.value)}
            />
          </div>
        </div>

        {/* Rappel du choix */}
        <div className="bg-slate-900 p-6 rounded-[32px] shadow-xl mb-8 flex justify-between items-center text-white">
          <div>
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">Formule choisie</p>
            <h2 className="text-xl font-bold">{volNom}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-sky-400">{Number(volPrix) / 100}€</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center italic uppercase">
          <span className="mr-2">📅</span> Choisissez votre créneau
        </h3>

        {loading ? (
          <p className="text-center py-10 text-slate-400 animate-pulse font-bold">Recherche des disponibilités...</p>
        ) : (
          <div className="space-y-4">
            {slots.length === 0 ? (
              <div className="bg-white p-10 rounded-[40px] text-center border-2 border-dashed border-slate-200">
                <p className="text-slate-400 font-bold italic">Aucun créneau libre pour le moment.</p>
              </div>
            ) : (
              slots.map((slot) => (
                <div 
                  key={slot.id} 
                  className="bg-white p-5 rounded-[28px] shadow-sm border border-slate-100 flex items-center justify-between hover:scale-[1.02] transition-all group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-slate-900 text-white w-14 h-14 rounded-2xl flex flex-col items-center justify-center font-black">
                      <span className="text-[10px] uppercase leading-none mb-1 text-sky-400">
                        {new Date(slot.start_time).toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-xl leading-none">{new Date(slot.start_time).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-black text-slate-800 uppercase text-xs tracking-widest">
                        {new Date(slot.start_time).toLocaleDateString('fr-FR', { weekday: 'long' })}
                      </p>
                      <p className="text-slate-400 font-bold">
                        À <span className="text-slate-900">{new Date(slot.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => confirmerReservation(slot.id)}
                    className="bg-sky-100 text-sky-600 px-8 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest hover:bg-sky-600 hover:text-white transition-all shadow-lg shadow-sky-100"
                  >
                    Réserver
                  </button>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function ReserverPage() {
  return (
    <Suspense fallback={<div className="p-20 text-center font-bold italic">Initialisation du système de réservation...</div>}>
      <ReserverContent />
    </Suspense>
  );
}