"use client";
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';

// Petit composant interne pour gérer les paramètres d'URL proprement avec Next.js 15+
function ReserverContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Récupération des infos du vol passées dans l'URL
  const volId = searchParams.get('volId');
  const volNom = searchParams.get('nom');
  const volPrix = searchParams.get('prix');

  useEffect(() => {
    // On récupère tous les créneaux du backend
    fetch('http://localhost:3001/api/slots')
      .then(res => res.json())
      .then(data => {
        // On ne garde que ceux qui sont "available"
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
    // ID de test pour le client (en attendant d'avoir un login client)
    const userId = "8f61c474-006e-4ba0-89d6-2f393ac420dd"; 

    try {
      const res = await fetch('http://localhost:3001/api/bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: userId,
          slotId: slotId,
          flightTypeId: volId,
          price: volPrix
        }),
      });

      if (res.ok) {
        alert(`Bravo ! Votre vol "${volNom}" est réservé. À bientôt dans les airs ! 🪂`);
        router.push('/tarifs');
      } else {
        alert("Oups, une erreur est survenue lors de la réservation.");
      }
    } catch (err) {
      alert("Impossible de joindre le serveur.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-2xl mx-auto">
        
        {/* Rappel du choix du client */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 mb-8 flex justify-between items-center">
          <div>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">Formule choisie</p>
            <h2 className="text-2xl font-bold text-slate-900">{volNom}</h2>
          </div>
          <div className="text-right">
            <p className="text-2xl font-black text-sky-600">{Number(volPrix) / 100}€</p>
          </div>
        </div>

        <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
          <span className="mr-2 text-2xl">📅</span> Choisissez votre créneau
        </h3>

        {loading ? (
          <p className="text-center py-10 text-slate-400 animate-pulse">Recherche des disponibilités...</p>
        ) : (
          <div className="space-y-4">
            {slots.length === 0 ? (
              <div className="bg-amber-50 border border-amber-100 p-8 rounded-3xl text-center">
                <p className="text-amber-700 font-medium">Aucun créneau libre pour le moment.</p>
                <button onClick={() => router.back()} className="mt-4 text-amber-800 underline text-sm">Retour aux tarifs</button>
              </div>
            ) : (
              slots.map((slot) => (
                <div 
                  key={slot.id} 
                  className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100 flex items-center justify-between hover:border-sky-300 transition-colors group"
                >
                  <div className="flex items-center gap-4">
                    <div className="bg-sky-50 text-sky-600 w-12 h-12 rounded-xl flex flex-col items-center justify-center font-bold">
                      <span className="text-xs uppercase leading-none">{new Date(slot.start_time).toLocaleDateString('fr-FR', { month: 'short' })}</span>
                      <span className="text-lg leading-none">{new Date(slot.start_time).getDate()}</span>
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 capitalize">
                        {new Date(slot.start_time).toLocaleDateString('fr-FR', { weekday: 'long' })}
                      </p>
                      <p className="text-slate-500 text-sm">
                        Décollage à <span className="text-slate-900 font-semibold">{new Date(slot.start_time).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                      </p>
                    </div>
                  </div>
                  
                  <button 
                    onClick={() => confirmerReservation(slot.id)}
                    className="bg-slate-100 text-slate-800 px-6 py-3 rounded-xl font-bold group-hover:bg-sky-600 group-hover:text-white transition-all"
                  >
                    Choisir
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

// Composant principal qui enveloppe le contenu dans un Suspense (requis par Next.js pour useSearchParams)
export default function ReserverPage() {
  return (
    <Suspense fallback={<div>Chargement...</div>}>
      <ReserverContent />
    </Suspense>
  );
}