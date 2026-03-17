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
        <Link href="/" className="logo-escalier">
          <span className="letter l1">f</span>
          <span className="letter l2">l</span>
          <span className="letter l3">u</span>
          <span className="letter l4">i</span>
          <span className="letter l5">d</span>
          <span className="letter l6">e</span>
        </Link>

        {/* MENU DESKTOP */}
        <div className="desktop-nav">
          <div className="nav-links-group">
            <Link href="/hiver" className={`nav-item ${pathname === '/hiver' ? 'active' : ''}`}>
              Biplace l'hiver
            </Link>
            <Link href="/ete" className={`nav-item ${pathname === '/ete' ? 'active' : ''}`}>
              Biplace l'été
            </Link>
            <Link href="/infos" className={`nav-item ${pathname === '/infos' ? 'active' : ''}`}>
              Infos pratiques
            </Link>
            <Link href="/cadeau" className={`nav-item ${pathname === '/cadeau' ? 'active' : ''}`}>
              Cartes cadeaux
            </Link>
          </div>
          <Link href="/booking" className="btn-cta">Réserver un vol</Link>
        </div>

        {/* BURGER MOBILE */}
        <button className={`burger-menu ${isOpen ? 'open' : ''}`} onClick={() => setIsOpen(!isOpen)}>
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      {/* MOBILE NAV */}
      <div className={`mobile-nav ${isOpen ? 'active' : ''}`}>
        <Link href="/hiver" onClick={() => setIsOpen(false)}>Biplace l'hiver</Link>
        <Link href="/ete" onClick={() => setIsOpen(false)}>Biplace l'été</Link>
        <Link href="/infos" onClick={() => setIsOpen(false)}>Infos pratiques</Link>
        <Link href="/cadeau" onClick={() => setIsOpen(false)}>Cartes cadeaux</Link>
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
          text-shadow: 0 4px 15px rgba(0,0,0,0.3);
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
          text-shadow: 0 2px 5px rgba(0,0,0,0.2);
        }

        .nav-item::after {
          content: "";
          position: absolute;
          bottom: 0;
          left: 0;
          width: 0;
          
          /* --- MODIFICATION ICI : ÉPAISSEUR RÉDUITE À 1.5PX --- */
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

        .burger-menu { display: none; flex-direction: column; gap: 6px; background: none; border: none; cursor: pointer; }
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
          .burger-menu { display: flex; }
        }
      `}} />
    </nav>
  );
}