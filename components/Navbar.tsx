"use client";
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 50) setIsScrolled(true);
      else setIsScrolled(false);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <nav className={`nav-main ${isScrolled ? 'scrolled' : ''}`}>
      <div className="nav-container-fluid">
        
        {/* LOGO */}
        <Link href="/booking" className="logo-escalier" aria-label="Fluide Parapente – Accueil">
          {/* Les lettres sont purement décoratives — aria-hidden évite la lecture lettre par lettre */}
          <span className="letter l1" aria-hidden="true">f</span>
          <span className="letter l2" aria-hidden="true">l</span>
          <span className="letter l3" aria-hidden="true">u</span>
          <span className="letter l4" aria-hidden="true">i</span>
          <span className="letter l5" aria-hidden="true">d</span>
          <span className="letter l6" aria-hidden="true">e</span>
        </Link>

        {/* MENU DESKTOP */}
        <div className="desktop-nav">
          <div className="nav-links-group">
            {/*<Link href="/hiver" className={`nav-item ${pathname === '/hiver' ? 'active' : ''}`}>
              Biplace l'hiver
            </Link>
            <Link href="/ete" className={`nav-item ${pathname === '/ete' ? 'active' : ''}`}>
              Biplace l'été
            </Link>
            <Link href="/infos" className={`nav-item ${pathname === '/infos' ? 'active' : ''}`}>
              Infos pratiques
            </Link> */}
            {/* 🚨 CORRECTION : Le bon lien est /bons-cadeaux */}
            <Link href="/bons-cadeaux" className={`nav-item ${pathname === '/bons-cadeaux' ? 'active' : ''}`}>
              Cartes cadeaux
            </Link>
          </div>
          <Link href="/booking" className="btn-cta">Réserver un vol</Link>
        </div>

        {/* ACTIONS MOBILE (Icônes + Burger) */}
        <div className="mobile-actions">
          
          {/* 🎯 NOUVEAU : Icône Téléphone */}
          <a href="tel:+33677285102" className="mobile-icon" aria-label="Appeler Fluide">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"></path>
            </svg>
          </a>

          {/* Icône Cartes Cadeaux */}
          <Link href="/bons-cadeaux" className="mobile-icon" onClick={() => setIsOpen(false)} aria-label="Cartes Cadeaux">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 12 20 22 4 22 4 12"></polyline>
              <rect x="2" y="7" width="20" height="5"></rect>
              <line x1="12" y1="22" x2="12" y2="7"></line>
              <path d="M12 7H7.5a2.5 2.5 0 0 1 0-5C11 2 12 7 12 7z"></path>
              <path d="M12 7h4.5a2.5 2.5 0 0 0 0-5C13 2 12 7 12 7z"></path>
            </svg>
          </Link>

          {/* Icône Planning / Réservation */}
          <Link href="/booking" className="mobile-icon" onClick={() => setIsOpen(false)} aria-label="Réserver">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="16" y1="2" x2="16" y2="6"></line>
              <line x1="8" y1="2" x2="8" y2="6"></line>
              <line x1="3" y1="10" x2="21" y2="10"></line>
            </svg>
          </Link>

          {/* Hamburger */}
          {/*<button className={`burger-menu ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)} aria-label="Menu">
            <span></span>
            <span></span>
            <span></span>
          </button>*/}
        </div>
      </div>

      {/* MOBILE NAV */}
      <div className={`mobile-nav ${isOpen ? 'active' : ''}`}>
        {/*<Link href="/hiver" onClick={() => setIsOpen(false)}>Biplace l'hiver</Link>
        <Link href="/ete" onClick={() => setIsOpen(false)}>Biplace l'été</Link>
        <Link href="/infos" onClick={() => setIsOpen(false)}>Infos pratiques</Link>*/}
        <Link href="/bons-cadeaux" onClick={() => setIsOpen(false)}>Cartes cadeaux</Link>
        <Link href="/booking" className="cta-mobile" onClick={() => setIsOpen(false)}>Réserver mon vol</Link>
      </div>

      <style dangerouslySetInnerHTML={{ __html: `
        .nav-main {
          position: fixed; top: 0; left: 0; width: 100%; height: 100px;
          background: transparent; z-index: 9999;
          display: flex; align-items: center;
          transition: all 0.4s ease;
        }

        .nav-main.scrolled {
          height: 85px;
          background: #1e40af; 
          box-shadow: 0 10px 30px rgba(0,0,0,0.15);
        }

        .nav-container-fluid {
          width: 100%;
          display: flex; 
          justify-content: space-between; 
          align-items: center;
          padding: 0 4%;
        }

        .logo-escalier {
          text-decoration: none !important;
          display: flex;
          align-items: flex-end;
          height: 50px;
        }
        .letter {
          color: white;
          font-size: 2.6rem;
          font-weight: 900;
          line-height: 1;
          letter-spacing: -2px;
          display: inline-block;
        }
        .l1 { transform: translateY(0px); }
        .l2 { transform: translateY(-4px); }
        .l3 { transform: translateY(-8px); }
        .l4 { transform: translateY(-12px); }
        .l5 { transform: translateY(-16px); }
        .l6 { transform: translateY(-20px); }

        .desktop-nav { display: flex; gap: 40px; align-items: center; }
        .nav-links-group { display: flex; gap: 30px; }
        
        .nav-item {
          text-decoration: none !important;
          color: white; 
          font-weight: 700;
          font-size: 1.05rem; 
          position: relative;
          padding-bottom: 5px;
        }

        .nav-item::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          height: 1.5px;
          background-color: white;
          transition: width 0.3s ease-in-out;
        }

        .nav-item:hover::after, .nav-item.active::after {
          width: 100%;
        }

        .btn-cta {
          background: #f026b8; color: white !important; padding: 14px 32px;
          border-radius: 50px; text-decoration: none !important; font-weight: 800;
          box-shadow: 0 8px 20px rgba(240, 38, 184, 0.3);
          transition: all 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275);
        }
        .btn-cta:hover { 
          transform: scale(1.05); 
          background: white; 
          color: #f026b8 !important; 
        }

        .mobile-actions {
          display: none; 
          align-items: center;
          gap: 18px; 
        }
        
        .mobile-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          transition: transform 0.2s ease;
        }
        .mobile-icon:hover {
          transform: scale(1.1);
        }
        .mobile-icon svg {
          width: 26px;
          height: 26px;
          stroke: white;
        }

        /* 🚨 CORRECTION : On a remis le 'display: flex;' pour que le burger s'affiche bien ! */
        .burger-menu { display: flex; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; }
        .burger-menu span { width: 35px; height: 3px; background: white; border-radius: 3px; transition: 0.4s; }
        .burger-menu.open span:nth-child(1) { transform: rotate(45deg) translate(7px, 6px); }
        .burger-menu.open span:nth-child(2) { opacity: 0; }
        .burger-menu.open span:nth-child(3) { transform: rotate(-45deg) translate(7px, -6px); }

        .mobile-nav {
          position: fixed; top: 0; right: -100%; width: 100%; height: 100vh;
          background: #1e40af; display: flex; flex-direction: column; 
          justify-content: center; align-items: center; gap: 35px;
          transition: 0.5s cubic-bezier(0.16, 1, 0.3, 1); z-index: 9998;
        }
        .mobile-nav.active { right: 0; }
        .mobile-nav a { text-decoration: none !important; color: white; font-size: 1.8rem; font-weight: 800; }
        .cta-mobile { background: #f026b8; padding: 20px 50px; border-radius: 50px; }

        @media (max-width: 1250px) {
          .desktop-nav { display: none; }
          .mobile-actions { display: flex; } 
        }
      `}} />
    </nav>
  );
}