"use client";
import Image from 'next/image';
import Link from 'next/link';

export default function CadeauPage() {
  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
      
      <style dangerouslySetInnerHTML={{ __html: `
        /* --- ANIMATION SIGNATURE (2.5s) --- */
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .hero-animation-block {
          will-change: transform, opacity;
          animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        /* --- STYLE DU BOUTON --- */
        .btn-page-action {
          background-color: #f026b8 !important; 
          color: white !important;
          border: 2px solid #f026b8 !important; 
          transition: all 0.4s ease !important;
          padding: 18px 45px; 
          border-radius: 50px; 
          text-decoration: none; 
          font-weight: 900; 
          display: inline-block;
          font-size: 1.1rem;
          box-shadow: 0 10px 20px rgba(240, 38, 184, 0.3);
        }
        .btn-page-action:hover { 
          background-color: #1e40af !important; 
          border-color: #1e40af !important;
          transform: translateY(-5px);
          box-shadow: 0 15px 30px rgba(30, 64, 175, 0.4);
        }

        .content-section {
          display: flex;
          align-items: center;
          gap: 60px;
          max-width: 1400px;
          margin: 0 auto;
          padding: 100px 4vw;
        }

        @media (max-width: 1024px) {
          .content-section { flex-direction: column; text-align: center; }
          .hero-cadeau { padding-left: 8vw !important; height: 60vh !important; }
        }
      `}} />

      {/* --- SECTION 1 : HERO (DÉGRADÉ SOMBRE) --- */}
      <section className="hero-cadeau" style={{ 
        position: 'relative', 
        width: '100%', 
        height: '70vh', 
        display: 'flex', 
        alignItems: 'center', 
        paddingLeft: '15vw', 
        background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 100%)', 
        overflow: 'hidden' 
      }}>
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ 
            color: 'white', 
            fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', 
            fontWeight: 900, 
            margin: 0,
            lineHeight: 1.1,
            textShadow: '0 4px 15px rgba(0,0,0,0.3)',
            textTransform: 'none' 
          }}>
            Cartes cadeaux
          </h1>
          <p style={{ 
            color: 'white', 
            fontSize: 'clamp(1rem, 2vw, 1.5rem)', 
            fontWeight: 500, 
            marginTop: '20px',
            opacity: 0.9,
            textTransform: 'none'
          }}>
            Faites plaisir ou faites-vous plaisir !
          </p>
        </div>

        {/* --- MISE À JOUR : TON NOUVEAU DESSIN ICI --- */}
        <div style={{ position: 'absolute', bottom: -5, left: 0, width: '100%', zIndex: 5, lineHeight: 0 }}>
          <img 
            src="/montagnes.svg" 
            alt="Montagnes" 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
        </div>
      </section>

      {/* --- SECTION 2 : DESCRIPTION ET PHOTO --- */}
      <section style={{ backgroundColor: 'white' }}>
        <div className="content-section">
          
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e40af', marginBottom: '25px' }}>
              Offrez une carte cadeau !
            </h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '35px' }}>
              Offrez une expérience inoubliable avec notre carte cadeau pour un vol en parapente au-dessus de la vallée de La Clusaz ! 
              Un cadeau unique, de 65 à 155€, qui allie sensations de liberté, panoramas alpins spectaculaires et immersion en pleine nature. 
              Encadré par des moniteurs expérimentés, ce vol biplace est accessible à tous, des débutants aux plus audacieux.
              <br /><br />
              Personnalisable selon les envies (vol découverte, performance, options photos/vidéos, message personnel…), 
              la carte cadeau est valable 18 mois, offrant flexibilité et liberté de choix entre un vol l’été ou l’hiver sans contrainte. 
              Offrir un vol en parapente, c’est offrir un souvenir impérissable au cœur des montagnes !
            </p>
            <Link href="/booking" className="btn-page-action">
              Voir les offres
            </Link>
          </div>

          <div style={{ flex: 1, position: 'relative', height: '500px', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 40px rgba(0,0,0,0.1)' }}>
            <Image 
              src="/cadeau-body.jpg" 
              alt="Expérience parapente" 
              fill 
              style={{ objectFit: 'cover' }} 
            />
          </div>

        </div>
      </section>

    </main>
  );
}