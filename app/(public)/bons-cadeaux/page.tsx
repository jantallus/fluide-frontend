"use client";
import React, { useState, useEffect } from 'react';
import Image from 'next/image';

export default function CadeauPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  
  const [buyer, setBuyer] = useState({ name: '', email: '', phone: '' });
  const [isCheckingOut, setIsCheckingOut] = useState(false);

  // 🎯 NOUVEAU : Gestion de l'envoi postal
  const [shippingSettings, setShippingSettings] = useState({ enabled: false, price: 0 });
  const [wantsShipping, setWantsShipping] = useState(false);
  const [address, setAddress] = useState({ street: '', zip: '', city: '' });

  useEffect(() => {
    const fetchData = async () => {
      try {
        const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
        // On charge les offres
        const res = await fetch(`${apiUrl}/api/gift-card-templates?publicOnly=true`, { cache: 'no-store' });
        if (res.ok) setTemplates(await res.json());

        // On charge vos paramètres postaux
        const setRes = await fetch(`${apiUrl}/api/public/site-settings`);
        if (setRes.ok) {
          const s = await setRes.json();
          setShippingSettings({
            enabled: s.physical_gift_card_enabled === 'true',
            price: parseInt(s.physical_gift_card_price) || 0
          });
        }
      } catch (err) {
        console.error("Erreur chargement boutique", err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchData();
  }, []);

  // 🎯 SÉCURITÉ : Le formulaire vérifie aussi l'adresse si la case est cochée
  const isShippingValid = !wantsShipping || (address.street && address.zip && address.city);
  const isFormValid = buyer.name && buyer.email && buyer.phone && isShippingValid;

  const handleCheckout = async () => {
    if (!isFormValid || !selectedTemplate) return;
    setIsCheckingOut(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
      const payload = { 
        template: selectedTemplate, 
        buyer,
        // On attache l'adresse si demandée
        physicalShipping: wantsShipping ? { enabled: true, address: `${address.street}, ${address.zip} ${address.city}` } : null
      };

      const res = await fetch(`${apiUrl}/api/public/checkout-gift-card`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
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
    setTimeout(() => { document.getElementById('achat-form')?.scrollIntoView({ behavior: 'smooth' }); }, 100);
  };

  const inputStyle = { width: '100%', padding: '15px', borderRadius: '12px', border: '2px solid #e2e8f0', fontSize: '1rem', fontWeight: 700, outline: 'none' };
  // Calcul du prix total affiché sur le bouton
  const totalPrice = selectedTemplate ? ((selectedTemplate.price_cents / 100) + (wantsShipping ? shippingSettings.price : 0)) : 0;

  return (
    <main style={{ width: '100%', overflowX: 'hidden', position: 'relative' }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes ultraSmoothReveal { 0% { opacity: 0; transform: translateY(100px); } 100% { opacity: 1; transform: translateY(0); } }
        .hero-animation-block { will-change: transform, opacity; animation: ultraSmoothReveal 2.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        .btn-page-action { background-color: #f026b8 !important; color: white !important; border: 2px solid #f026b8 !important; transition: all 0.4s ease !important; padding: 18px 45px; border-radius: 50px; text-decoration: none; font-weight: 900; display: inline-block; font-size: 1.1rem; box-shadow: 0 10px 20px rgba(240, 38, 184, 0.3); cursor: pointer; }
        .btn-page-action:hover { background-color: #1e40af !important; border-color: #1e40af !important; transform: translateY(-5px); box-shadow: 0 15px 30px rgba(30, 64, 175, 0.4); }
        .content-section { display: flex; align-items: center; gap: 60px; max-width: 1400px; margin: 0 auto; padding: 100px 4vw; }
        @media (max-width: 1024px) { .content-section { flex-direction: column; text-align: center; } .hero-cadeau { padding-left: 8vw !important; height: 60vh !important; } }
      `}} />

      <section className="hero-cadeau" style={{ position: 'relative', width: '100%', height: '70vh', display: 'flex', alignItems: 'center', paddingLeft: '15vw', background: 'linear-gradient(135deg, #1e3a8a 0%, #4c1d95 100%)', overflow: 'hidden' }}>
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ color: 'white', fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 900, margin: 0, lineHeight: 1.1, textShadow: '0 4px 15px rgba(0,0,0,0.3)', textTransform: 'none' }}>Cartes cadeaux</h1>
          <p style={{ color: 'white', fontSize: 'clamp(1rem, 2vw, 1.5rem)', fontWeight: 500, marginTop: '20px', opacity: 0.9, textTransform: 'none' }}>Faites plaisir ou faites-vous plaisir !</p>
        </div>
        <div style={{ position: 'absolute', bottom: -5, left: 0, width: '100%', zIndex: 5, lineHeight: 0 }}><img src="/montagnes.svg" alt="Montagnes" style={{ width: '100%', height: 'auto', display: 'block' }} /></div>
      </section>

      <section style={{ backgroundColor: 'white' }}>
        <div className="content-section">
          <div style={{ flex: 1 }}>
            <h2 style={{ fontSize: '2.2rem', fontWeight: 900, color: '#1e40af', marginBottom: '25px' }}>Offrez une carte cadeau !</h2>
            <p style={{ color: '#475569', fontSize: '1.1rem', lineHeight: '1.8', marginBottom: '35px' }}>
              Offrez une expérience inoubliable avec notre carte cadeau pour un vol en parapente au-dessus de la vallée de La Clusaz ! 
              <br /><br />
              Personnalisable selon les envies, la carte cadeau est valable 18 mois, offrant flexibilité et liberté de choix entre un vol l’été ou l’hiver. 
            </p>
            <button onClick={() => document.getElementById('boutique')?.scrollIntoView({ behavior: 'smooth' })} className="btn-page-action">Voir les offres</button>
          </div>
          <div style={{ flex: 1, position: 'relative', width: '100%', minHeight: '400px', borderRadius: '20px', overflow: 'hidden' }}>
            <Image src="/cadeau-body.png" alt="Expérience parapente" fill style={{ objectFit: 'cover' }} />
          </div>
        </div>
      </section>

      <section id="boutique" style={{ backgroundColor: '#f8fafc', padding: '100px 4vw' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '2.5rem', fontWeight: 900, color: '#1e40af', marginBottom: '15px' }}>Choisissez votre bon cadeau</h2>
            <p style={{ color: '#64748b', fontSize: '1.2rem', fontWeight: 500 }}>Sélectionnez l'offre de votre choix pour la personnaliser.</p>
          </div>

          {isLoading ? (
            <div style={{ textAlign: 'center', padding: '50px 0' }}><p style={{ color: '#1e40af', fontWeight: 900 }}>Chargement des offres...</p></div>
          ) : templates.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '50px 0', backgroundColor: 'white', borderRadius: '20px' }}><p style={{ color: '#64748b', fontWeight: 900 }}>Aucune offre n'est disponible.</p></div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {templates.map((tpl) => (
                <div key={tpl.id} onClick={() => { setSelectedTemplate(tpl); scrollToForm(); }} className={`bg-white rounded-[35px] p-8 shadow-xl border transition-all duration-300 cursor-pointer flex flex-col justify-between group ${selectedTemplate?.id === tpl.id ? 'border-sky-400 ring-4 ring-sky-50 -translate-y-2' : 'border-slate-100 hover:border-sky-400 hover:-translate-y-2'}`}>
                  {tpl.image_url && <div className="w-full h-40 md:h-52 bg-cover bg-center rounded-2xl md:rounded-[20px] mb-6 shadow-sm border border-slate-100" style={{ backgroundImage: `url(${tpl.image_url})` }} />}
                  <div>
                    <h3 className="text-2xl font-black uppercase italic text-slate-900 mb-3">{tpl.title}</h3>
                    <div className="flex flex-wrap gap-2 text-xs font-bold mb-6">
                      <span className="bg-slate-50 text-slate-500 px-3 py-1.5 rounded-lg border border-slate-100">⏳ Valable {tpl.validity_months} mois</span>
                      {tpl.flight_name ? <span className="bg-emerald-50 text-emerald-700 px-3 py-1.5 rounded-lg border border-emerald-100">🎯 {tpl.flight_name}</span> : <span className="bg-amber-50 text-amber-700 px-3 py-1.5 rounded-lg border border-amber-100">💶 Avoir Libre</span>}
                    </div>
                    <p className="text-slate-500 text-sm font-medium leading-relaxed mb-6">{tpl.description}</p>
                  </div>
                  <div className="mt-4 pt-6 border-t border-slate-100 flex items-center justify-between">
                    <div className="text-4xl font-black text-sky-600">{tpl.price_cents / 100}€</div>
                    <button className={`px-6 py-4 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-colors ${selectedTemplate?.id === tpl.id ? 'bg-sky-500 text-white shadow-md' : 'bg-slate-900 text-white group-hover:bg-sky-500'}`}>{selectedTemplate?.id === tpl.id ? '✓ Choisi' : 'Choisir ce bon'}</button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {selectedTemplate && (
            <div id="achat-form" style={{ marginTop: '60px', backgroundColor: 'white', borderRadius: '30px', padding: '40px', boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.15)', border: '2px solid #e2e8f0', scrollMarginTop: '100px' }}>
              <h3 style={{ fontSize: '2rem', fontWeight: 900, color: '#1e40af', marginBottom: '10px' }}>Personnalisez votre bon</h3>
              <p style={{ color: '#f026b8', fontSize: '1.5rem', fontWeight: 900, marginBottom: '30px' }}>{selectedTemplate.title} - {selectedTemplate.price_cents / 100}€</p>
              
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '30px' }}>
                <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Qui offre ? (Acheteur)</label><input type="text" placeholder="Ex: Jean Dupont" value={buyer.name} onChange={e => setBuyer({...buyer, name: e.target.value})} style={inputStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Votre Email (Réception du bon)</label><input type="email" placeholder="jean@email.com" value={buyer.email} onChange={e => setBuyer({...buyer, email: e.target.value})} style={inputStyle} /></div>
                <div><label style={{ display: 'block', fontSize: '0.8rem', fontWeight: 900, color: '#64748b', textTransform: 'uppercase', marginBottom: '8px' }}>Votre Téléphone</label><input type="tel" placeholder="06 12 34 56 78" value={buyer.phone} onChange={e => setBuyer({...buyer, phone: e.target.value})} style={inputStyle} /></div>
              </div>

              {/* 🎯 LA NOUVELLE OPTION POSTALE ! */}
              {shippingSettings.enabled && (
                <div className="mb-8 p-6 bg-orange-50 border-2 border-orange-100 rounded-[20px] transition-all">
                  <label className="flex items-center gap-3 cursor-pointer">
                    <input type="checkbox" className="w-5 h-5 accent-orange-500" checked={wantsShipping} onChange={e => setWantsShipping(e.target.checked)} />
                    <span className="font-black text-orange-900 md:text-lg">📮 Recevoir une carte imprimée par courrier (+{shippingSettings.price}€)</span>
                  </label>
                  
                  {wantsShipping && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                      <div className="md:col-span-2">
                        <input type="text" placeholder="Adresse postale (N° et Voie)" value={address.street} onChange={e => setAddress({...address, street: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <input type="text" placeholder="Code Postal" value={address.zip} onChange={e => setAddress({...address, zip: e.target.value})} style={inputStyle} />
                      </div>
                      <div>
                        <input type="text" placeholder="Ville" value={address.city} onChange={e => setAddress({...address, city: e.target.value})} style={inputStyle} />
                      </div>
                    </div>
                  )}
                </div>
              )}

              <div style={{ display: 'flex', gap: '20px', flexWrap: 'wrap' }}>
                <button onClick={handleCheckout} disabled={!isFormValid || isCheckingOut} className="btn-page-action" style={{ flex: 1, textAlign: 'center', opacity: (!isFormValid || isCheckingOut) ? 0.5 : 1, cursor: (!isFormValid || isCheckingOut) ? 'not-allowed' : 'pointer' }}>
                  {isCheckingOut ? 'Redirection Stripe...' : `Payer ${totalPrice}€ de façon sécurisée`}
                </button>
              </div>
              <p style={{ textAlign: 'center', color: '#94a3b8', fontSize: '0.85rem', marginTop: '20px', fontWeight: 600 }}>Le bon cadeau au format PDF vous sera de toute façon envoyé par email immédiatement après validation du paiement.</p>
            </div>
          )}
        </div>
      </section>
    </main>
  );
}