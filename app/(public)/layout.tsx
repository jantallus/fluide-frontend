"use client";
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const [hasSplat, setHasSplat] = useState(false);

  useEffect(() => {
    // Le splash apparaît après 2 secondes sur la partie publique uniquement
    const timer = setTimeout(() => setHasSplat(true), 2000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      
      {/* --- STYLES GLOBAUX DU FRONT-OFFICE --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes dropAndSplat {
          0% { transform: translateY(-100vh) scaleX(0.4); opacity: 0; }
          60% { transform: translateY(0) scaleX(0.7); opacity: 1; }
          100% { transform: translateY(0) scaleX(1); opacity: 1; }
        }
        .splash-widget { 
          position: fixed; 
          bottom: 30px; 
          left: 20px; 
          width: 350px; 
          height: 350px; 
          z-index: 20000; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          animation: dropAndSplat 0.8s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; 
          filter: drop-shadow(0 20px 40px rgba(0,0,0,0.6)); 
        }
        .img-splash { position: absolute; width: 100%; height: 100%; object-fit: contain; z-index: 1; }
        .splash-text-overlay { 
          position: relative; 
          z-index: 2; 
          width: 175px; 
          text-align: center; 
          color: #ffffff; 
          font-size: 0.82rem; 
          font-weight: 800; 
          line-height: 1.3; 
          margin-top: -20px; 
          text-shadow: 0 1px 3px rgba(0,0,0,0.6); 
        }
        .close-x { 
          position: absolute; 
          top: 35px; 
          right: 45px; 
          background: none; 
          border: none; 
          color: #1e40af; 
          font-size: 38px; 
          font-weight: 900; 
          cursor: pointer; 
          z-index: 10; 
          transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), color 0.3s ease; 
          filter: drop-shadow(0 0 2px white); 
        }
        .close-x:hover { color: #f026b8; transform: rotate(90deg) scale(1.1); }
      `}} />

      {/* --- NAVIGATION --- */}
      <Navbar />

      {/* --- SPLASH WIDGET (Texte complet) --- */}
      {hasSplat && (
        <div className="splash-widget">
          <button className="close-x" onClick={() => setHasSplat(false)}>✕</button>
          <img src="/splash.avif" alt="Splash Fluide" className="img-splash" />
          <div className="splash-text-overlay">
            Chez <span style={{ color: '#f026b8' }}>fluide</span> pilotage et sensations offerts ! <br /><br /> Demandez au pilote !
          </div>
        </div>
      )}

      {/* --- CONTENU DE LA PAGE CLIENT --- */}
      <main style={{ flex: 1 }}>
        {children}
      </main>

      {/* --- PIED DE PAGE (Design épuré & Escalier) --- */}
      <Footer />

    </div>
  );
}