"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { apiFetch } from '@/lib/api';

// Définition du type pour TypeScript
interface Vol {
  id: number;
  name: string;
  price_cents: number;
  description?: string;
}

export default function TarifsPage() {
  const [vols, setVols] = useState<Vol[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    setLoading(true);
    // Appel à ton API Backend
    apiFetch('/api/vols')
      .then(res => res.json())
      .then(data => {
        setVols(data);
        setLoading(false);
      })
      .catch(err => {
        console.error("Erreur:", err);
        setLoading(false);
      });
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <p className="text-slate-500 font-medium animate-pulse">Chargement des formules...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4">
      <div className="max-w-6xl mx-auto">
        
        {/* En-tête de la page */}
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-slate-900 mb-4">
            Prêt pour le décollage ? 🪂
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto">
            Découvrez nos différentes formules de vol en parapente à La Clusaz. 
            Des sensations douces aux acrobaties aériennes, il y en a pour tous les goûts.
          </p>
        </div>

        {/* Grille des tarifs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {vols.map((vol) => (
            <div 
              key={vol.id} 
              className="bg-white rounded-3xl shadow-sm hover:shadow-2xl transition-all duration-300 overflow-hidden border border-slate-100 flex flex-col"
            >
              {/* Badge ou visuel haut de carte */}
              <div className="bg-sky-600 p-4 text-white text-center font-bold tracking-widest uppercase text-sm">
                {vol.name}
              </div>

              <div className="p-8 flex-1 flex flex-col">
                {/* Prix */}
                <div className="text-center mb-6">
                  <span className="text-4xl font-extrabold text-slate-900">
                    {vol.price_cents / 100}€
                  </span>
                  <span className="text-slate-400 block text-sm mt-1">TTC par personne</span>
                </div>

                {/* Description fictive (ou venant de la DB si tu l'ajoutes) */}
                <ul className="text-slate-600 text-sm space-y-3 mb-8 flex-1">
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span> 15 à 30 min de vol
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span> Photos et vidéos incluses
                  </li>
                  <li className="flex items-center">
                    <span className="mr-2 text-green-500">✓</span> Diplôme de vol offert
                  </li>
                </ul>

                {/* Bouton de redirection vers la passerelle de réservation */}
                <button 
                  onClick={() => router.push(`/reserver?volId=${vol.id}&nom=${vol.name}&prix=${vol.price_cents}`)}
                  className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-sky-600 transition-colors shadow-lg shadow-slate-200 hover:shadow-sky-100"
                >
                  Réserver
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Information complémentaire */}
        <div className="mt-16 bg-sky-50 rounded-2xl p-6 text-center border border-sky-100">
          <p className="text-sky-800 text-sm">
            <strong>Note :</strong> Tous nos vols dépendent des conditions météorologiques. 
            En cas d'annulation, nous reportons ou remboursons votre séance.
          </p>
        </div>

      </div>
    </div>
  );
}