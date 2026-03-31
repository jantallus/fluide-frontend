"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CadeauPage() {
  // --- ÉTATS & LOGIQUE DYNAMIQUE DE LA BOUTIQUE ---
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  // Formulaire de l'acheteur
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '', beneficiaryName: '' });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // Chargement des modèles depuis l'API publique
  useEffect(() => {
    const fetchTemplates = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        const res = await fetch(`${apiUrl}/api/gift-card-templates?publicOnly=true`, { cache: 'no-store' });
        if (res.ok) {
          const data = await res.json();
          setTemplates(data);
        }
      } catch (err) {
        console.error("Erreur chargement boutique", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchTemplates();
  }, []);

  const isFormValid = buyer.name && buyer.email && buyer.phone && buyer.beneficiaryName;

  const handleCheckout = async () => {
    if (!isFormValid || !selectedTemplate) return;
    setIsCheckingOut(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const res = await fetch(`${apiUrl}/api/public/checkout-gift-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ template: selectedTemplate, buyer })
      });

      const data = await res.json();
      if (data.url) {
        window.location.href = data.url; 
      } else {
        alert("Erreur lors de la création du paiement.");
        setIsCheckingOut(false);
      }
    } catch (err) {
      alert("Erreur de connexion au serveur de paiement.");
      setIsCheckingOut(false);
    }
  };

  const scrollToForm = () => {
    setTimeout(() => {
      document.getElementById('achat-form')?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
      
      {/* --- VOS STYLES ORIGINAUX --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal {
          0% { opacity: 0; transform: translateY(100px); }
          100% { opacity: 1; transform: translateY(0); }
        }

        .hero-animation-block {
          will-change: transform, opacity;
          animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

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
          cursor: pointer;
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

      {/* --- SECTION 1 : HERO (VOTRE DESIGN EXACT) --- */}
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

        {/* VOS MONTAGNES SVG */}
        <div style={{ position: 'absolute', bottom: -5, left: 0, width: '100%', zIndex: 5, lineHeight: 0 }}>
          <img 
            src="/montagnes.svg" 
            alt="Montagnes" 
            style={{ width: '100%', height: 'auto', display: 'block' }} 
          />
        </div>
      </section>

      {/* --- SECTION 2 : DESCRIPTION ET PHOTO (VOTRE DESIGN EXACT) --- */}
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
            {/* Bouton qui scrolle vers la boutique au lieu de changer de page */}
            <button onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })} className="btn-page-action">
              Voir les offres
            </button>
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

      {/* --- SECTION 3 : LA BOUTIQUE DYNAMIQUE --- */}
      <section id="boutique" style={{ backgroundColor: '#f8fafc', padding: '100px 4vw' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e40af', marginBottom: '15px' }}>Choisissez votre bon cadeau</h2>
            <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>Sélectionnez l'offre de votre choix pour la personnaliser.</p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
              <p style={{ color: '#1e40af', fontWeight: 900 }}>Chargement des offres...</p>
            </div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', backgroundColor: 'white', borderRadius: '20px' }}>
              <p style={{ color: '#64748b', fontWeight: 900 }}>Aucune offre n'est disponible pour le moment.</p>
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '30px' }}>
              {templates.map((tpl) => (
                <div key={tpl.id} style={{ 
                  backgroundColor: 'white', 
                  borderRadius: '20px', 
                  padding: '30px', 
                  boxShadow: selectedTemplate?.id === tpl.id ? '0 0 0 4px #1e40af, 0 20px 40px rgba(0,0,0,0.1)' : '0 10px 30px rgba(0,0,0,0.05)',
                  transition: 'all 0.3s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'space-between'
                }}>
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <span style={{ backgroundColor: '#eff6ff', color: '#1e40af', padding: '5px 12px', borderRadius: '8px', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase' }}>
                        Valable {tpl.validity_months} mois
                      </span>
                      <span style={{ fontSize: '2.2rem', fontWeight: 900, color: '#0f172a' }}>{tpl.price_cents / 100}€</span>
                    </div>
                    <h3 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#1e40af', marginBottom: '15px' }}>{tpl.title}</h3>
                    
                    {tpl.flight_name ? (
                      <p style={{ backgroundColor: '#f0fdf4', color: '#166534', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '20px' }}>
                        🎯 Prestation : {tpl.flight_name}
                      </p>
                    ) : (
                      <p style={{ backgroundColor: '#fffbeb', color: '#b45309', padding: '10px', borderRadius: '10px', fontSize: '0.85rem', fontWeight: 700, marginBottom: '20px' }}>
                        💶 Avoir Libre (Sur tout le site)
                      </p>
                    )}
                    
                    <p style={{ color: '#475569', fontSize: '0.95rem', lineHeight: '1.6', marginBottom: '30px' }}>{tpl.description}</p>
                  </div>
                  
                  <button 
                    onClick={() => { setSelectedTemplate(tpl); scrollToForm(); }}
                    style={{ 
                      width: '100%', 
                      padding: '15px', 
                      borderRadius: '12px', 
                      backgroundColor: selectedTemplate?.id === tpl.id ? '#f026b8' : '#1e40af', 
                      color: 'white', 
                      fontWeight: 900, 
                      border: 'none', 
                      cursor: 'pointer',
                      transition: 'background-color 0.3s ease'
                    }}
                  >
                    {selectedTemplate?.id === tpl.id ? '✓ Sélectionné' : 'Sélectionner ce bon'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* --- FORMULAIRE D'ACHAT --- */}
          {selectedTemplate && (
            <div id="achat-form" style={{ 
              marginTop: '60px', 
              backgroundColor: 'white', 
              borderRadius: '30px', 
              padding: '40px', 
              boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)',
              border: '2px solid #e2e8f0',
              scrollMarginTop: '100px'
            }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e40af', marginBottom: '10px' }}>Personnalisez votre bon</h3>
              <p style={{ color: '#f026b8', fontSize: '1.5rem', fontWeight: 900, marginBottom: '30px' }}>{selectedTemplate.title} - {selectedTemplate.price_cents / 100}€</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Qui offre ? (Acheteur)</label>
                  <input type="text" placeholder="Ex: Jean Dupont" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#f026b8', textTransform: 'uppercase', marginBottom: '8px' }}>Pour qui ? (Bénéficiaire)</label>
                  <input type="text" placeholder="Ex: Marie (Celui qui vole)" value={buyer.beneficiaryName} onChange={e => setBuyer({...buyer, beneficiaryName: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #fbcfe8', backgroundColor: '#fdf2f8', color: '#9d174d', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Votre Email (Réception du bon)</label>
                  <input type="email" placeholder="jean@email.com" value={buyer.email} onChange={e => setBuyer({...buyer, email: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Votre Téléphone</label>
                  <input type="tel" placeholder="06 12 34 56 78" value={buyer.phone} onChange={e => setBuyer({...buyer, phone: e.target.value})} style={{ width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', fontWeight: 700, outline: 'none' }} />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <button 
                  onClick={handleCheckout}
                  disabled={!isFormValid || isCheckingOut}
                  className="btn-page-action"
                  style={{ flex: 1, textAlign: 'center', opacity: (!isFormValid || isCheckingOut) ? 0.5 : 1, cursor: (!isFormValid || isCheckingOut) ? 'not-allowed' : 'pointer' }}
                >
                  {isCheckingOut ? 'Redirection Stripe...' : `Payer ${selectedTemplate.price_cents / 100}€ de façon sécurisée`}
                </button>
              </div>
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '20px', fontWeight: 600 }}>Le bon cadeau au format PDF vous sera envoyé par email immédiatement après validation du paiement.</p>
            </div>
          )}
        </div>
      </section>

    </main>
  );
}