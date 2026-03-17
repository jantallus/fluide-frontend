"use client";

export default function CGVPage() {
  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .hero-animation-block {
          will-change: transform, opacity;
          animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .mountains-container {
          position: absolute;
          bottom: -5px; 
          left: 0;
          width: 100%;
          z-index: 5;
          line-height: 0;
        }
        .mountains-container img {
          width: 100%;
          height: auto;
          display: block;
        }

        .cgv-content-section {
          padding: 100px 15vw;
          background-color: white;
          position: relative;
          z-index: 10;
        }

        .cgv-content-section h2 { color: #1e40af; font-size: 1.8rem; font-weight: 900; margin-top: 50px; margin-bottom: 20px; text-transform: uppercase; }
        .cgv-content-section p, .cgv-content-section li { color: #475569; line-height: 1.8; font-size: 1.1rem; margin-bottom: 15px; }
        .cgv-content-section ul { padding-left: 20px; margin-bottom: 20px; }
      `}} />

      <section style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', alignItems: 'center', paddingLeft: '15vw', overflow: 'hidden', backgroundColor: '#1e40af' }}>
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, maxWidth: '800px' }}>
            Conditions Générales<br /> de Vente
          </h1>
          <p style={{ color: 'rgba(255,255,255,0.7)', marginTop: '20px', fontSize: '1.2rem' }}>
            Mise à jour au 09/12/24
          </p>
        </div>

        <div className="mountains-container">
          <img src="/montagnes.svg" alt="Montagnes" />
        </div>
      </section>

      <section className="cgv-content-section">
        <div className="hero-animation-block">
          <h2>Objet des CGV</h2>
          <p>Les présentes Conditions Générales de Vente (CGV) ont pour objet de régir la vente des prestations de baptême en parapente proposées par Fluide parapente.</p>

          <h2>Conditions de participation</h2>
          <ul>
            <li>Peser entre 20 et 110 kg maximum.</li>
            <li>Ne pas souffrir de troubles médicaux incompatibles avec la pratique du parapente.</li>
            <li>Être en bonne forme physique.</li>
          </ul>

          <h2>Modification et annulation</h2>
          <p><strong>Annulation jusqu’à 48 heures avant le vol :</strong> remboursement intégral.</p>
          <p><strong>Annulation entre 48h et 24h avant le vol :</strong> remboursement de 50%.</p>
          <p><strong>Moins de 24h :</strong> aucun remboursement.</p>
          <p>En cas de conditions météorologiques défavorables, l’Organisateur se réserve le droit de reporter ou annuler le vol (remboursement complet possible).</p>

          <h2>Loi applicable</h2>
          <p>Les présentes CGV sont soumises à la législation Française et tout litige sera soumis aux tribunaux compétents d’Annecy, FRANCE.</p>
        </div>
      </section>
    </main>
  );
}