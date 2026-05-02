"use client";
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; 
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { ToastProvider } from '@/components/ui/ToastProvider';
import { ErrorBoundary } from '@/components/ui/ErrorBoundary';

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || "";
  const isLogin = pathname.toLowerCase().includes("login");

  const [hasSplat, setHasSplat] = useState(false);
  
  // 🎯 1. NOUVEAU : Un état pour savoir si on est "intégré" dans un autre site
  const [isEmbed, setIsEmbed] = useState(false); 

  useEffect(() => {
    // 🎯 2. NOUVEAU : On détecte le mot magique "?embed=true" dans l'URL
    if (window.location.search.includes('embed=true')) {
      setIsEmbed(true);
    }

    if (isLogin) return;

    const timer = setTimeout(() => setHasSplat(true), 2000);
    return () => clearTimeout(timer);
  }, [isLogin]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* ── Lien d'évitement (accessibilité clavier) ──────────────────────────────
          Invisible par défaut, visible seulement quand il reçoit le focus.
          Permet aux utilisateurs clavier/lecteurs d'écran de sauter la navigation. */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:bg-white focus:text-blue-700 focus:font-black focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg focus:outline-2 focus:outline-blue-500"
      >
        Aller au contenu principal
      </a>

      {/* 🚀 3. NOUVEAU NINJA SCRIPT : Cache instantanément les éléments avant même l'affichage */}
      <script dangerouslySetInnerHTML={{ __html: `
        if (window.location.search.includes('embed=true')) {
          document.documentElement.classList.add('embed-mode');
        }
      `}} />

      {/* --- STYLES GLOBAUX DU FRONT-OFFICE --- */}
      <style dangerouslySetInnerHTML={{ __html: `
        /* 🎯 4. NOUVEAU : La règle CSS qui efface visuellement les menus */
        .embed-mode #site-navbar, .embed-mode #site-footer {
          display: none !important;
        }

        @keyframes dropAndSplat {
          0% { transform: translateY(-100vh) scaleX(0.4); opacity: 0; }
          60% { transform: translateY(0) scaleX(0.7); opacity: 1; }
          100% { transform: translateY(0) scaleX(1); opacity: 1; }
        }
        {/*.splash-widget { 
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
        }*/}
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
      {/* 🎯 5. NOUVEAU : On n'affiche la navbar que si on n'est PAS en mode embed */}
      {!isEmbed && (
        <div id="site-navbar">
          <Navbar />
        </div>
      )}

      {/* --- SPLASH WIDGET (Texte complet) --- */}
      {/* 🎯 On coupe aussi le widget sur les autres sites pour éviter de les polluer visuellement */}
      {/*{hasSplat && !isLogin && !isEmbed && (
        <div className="splash-widget">
          <button className="close-x" onClick={() => setHasSplat(false)}>✕</button>
          <img src="/splash.avif" alt="Splash Fluide" className="img-splash" />
          <div className="splash-text-overlay">
            Chez <span style={{ color: '#f026b8' }}>fluide</span> pilotage et sensations offerts ! <br /><br /> Demandez au pilote !
          </div>
        </div>
      )}*/}

      {/* --- CONTENU DE LA PAGE CLIENT --- */}
      <main id="main-content" style={{ flex: 1 }}>
        <ToastProvider>
          <ErrorBoundary variant="public" zone="public/page">
            {children}
          </ErrorBoundary>
        </ToastProvider>
      </main>

      {/* --- PIED DE PAGE --- */}
      {/* 🎯 6. NOUVEAU : On cache le pied de page en mode embed */}
      {!isEmbed && (
        <div id="site-footer">
          <Footer />
        </div>
      )}

    </div>
  );
}