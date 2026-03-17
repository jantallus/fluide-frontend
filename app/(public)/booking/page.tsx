"use client";
import Link from 'next/link';

export default function BookingPage() {
  return (
    <main style={{ paddingTop: '140px', paddingBottom: '100px', backgroundColor: '#f8fafc', minHeight: '90vh' }}>
      
      {/* --- STYLES INTERNES --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        .booking-container {
          max-width: 800px;
          margin: 0 auto;
          padding: 40px;
          background: white;
          border-radius: 20px;
          box-shadow: 0 10px 30px rgba(0,0,0,0.05);
          text-align: center;
        }

        .step-indicator {
          display: flex;
          justify-content: center;
          gap: 20px;
          marginBottom: 40px;
        }

        .step {
          width: 40px; height: 40px; border-radius: 50%;
          display: flex; align-items: center; justify-content: center;
          background-color: #e2e8f0; color: #64748b; font-weight: 900;
        }

        .step.active {
          background-color: #f026b8; color: white;
        }

        .booking-title {
          font-size: 2.5rem; font-weight: 900; color: #1e40af;
          text-transform: uppercase; margin-bottom: 10px;
        }

        .contact-box {
          margin-top: 40px; padding: 25px;
          border: 2px dashed #e2e8f0; border-radius: 15px;
          background-color: #f1f5f9;
        }
      `}} />

      <div className="booking-container">
        {/* INDICATEUR D'ÉTAPE */}
        <div className="step-indicator">
          <div className="step active">1</div>
          <div className="step">2</div>
          <div className="step">3</div>
        </div>

        <h1 className="booking-title">Réserver mon vol</h1>
        <p style={{ color: '#64748b', fontSize: '1.1rem', marginBottom: '40px' }}>
          Prêt pour le grand saut à La Clusaz ? Choisissez votre option ci-dessous.
        </p>

        <div style={{ display: 'grid', gap: '20px' }}>
          {/* OPTION 1 : RÉSERVATION DIRECTE */}
          <div style={{ padding: '30px', border: '2px solid #1e40af', borderRadius: '15px', textAlign: 'left', cursor: 'pointer', transition: '0.3s' }}>
            <h3 style={{ color: '#1e40af', margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>📅 J'ai une date précise</h3>
            <p style={{ margin: '10px 0 0', opacity: 0.7 }}>Réserver un créneau directement sur notre planning en ligne.</p>
          </div>

          {/* OPTION 2 : CARTE CADEAU */}
          <Link href="/cadeau" style={{ textDecoration: 'none' }}>
            <div style={{ padding: '30px', border: '2px solid #f026b8', borderRadius: '15px', textAlign: 'left', cursor: 'pointer' }}>
              <h3 style={{ color: '#f026b8', margin: 0, fontSize: '1.4rem', fontWeight: 900 }}>🎁 Offrir ou utiliser un bon</h3>
              <p style={{ margin: '10px 0 0', color: '#64748b' }}>Acheter une carte cadeau sans date fixée (valable 1 an).</p>
            </div>
          </Link>
        </div>

        {/* CONTACT RAPIDE */}
        <div className="contact-box">
          <p style={{ fontWeight: 700, marginBottom: '5px' }}>Besoin d'un conseil ?</p>
          <p style={{ fontSize: '1.2rem', color: '#1e40af', fontWeight: 900 }}>04 50 XX XX XX</p>
          <p style={{ fontSize: '0.9rem', opacity: 0.6 }}>Ouvert tous les jours de 9h à 18h</p>
        </div>
      </div>
    </main>
  );
}