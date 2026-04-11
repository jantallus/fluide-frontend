"use client";
import React from 'react';
import Link from 'next/link';

export default function Footer() {
  // Escalier ascendant : f en bas (80px), e en haut (-95px)
  const watermarkLetters = [
    { char: 'f', y: 80 }, 
    { char: 'l', y: 45 }, 
    { char: 'u', y: 10 },
    { char: 'i', y: -25 }, 
    { char: 'd', y: -60 }, 
    { char: 'e', y: -95 }
  ];

  return (
    <footer style={{ 
      position: 'relative', 
      backgroundColor: 'white', 
      color: '#1e40af', 
      padding: '40px 5% 30px', 
      overflow: 'hidden', 
      borderTop: 'none'
    }}>
      
      {/* --- FILIGRANE "FLUIDE" --- */}
      <div style={{
        position: 'absolute',
        top: '50%', 
        right: '20px',
        display: 'flex',
        alignItems: 'center',
        opacity: 0.05,
        pointerEvents: 'none',
        userSelect: 'none',
        zIndex: 0,
        whiteSpace: 'nowrap',
        transform: 'translateY(-50%)'
      }}>
        {watermarkLetters.map((l, i) => (
          <span key={i} style={{
            fontSize: '22rem', 
            fontWeight: 900,
            letterSpacing: '-25px', 
            lineHeight: 0.5,
            display: 'inline-block',
            transform: `translateY(${l.y}px)`
          }}>
            {l.char}
          </span>
        ))}
      </div>

      {/* --- CONTENU --- */}
      <div style={{ 
        position: 'relative', 
        zIndex: 1, 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
        gap: '30px', 
        maxWidth: '1300px', 
        margin: '0 auto' 
      }}>
        
        {/* COLONNE CONTACT */}
        <div className="footer-column">
          <h4 style={{ fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Contact</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px', fontWeight: 400, color: '#64748b' }}>Tél : <a href="tel:+33677285102" style={{ color: '#1e40af', fontWeight: 700, textDecoration: 'none' }}>06 77 28 51 02</a></li>
            <li style={{ marginBottom: '8px', fontWeight: 400, color: '#64748b' }}>Mail : contact@fluide-parapente.fr</li>
            <li style={{ marginTop: '12px' }}>
              <Link href="/booking" style={{ color: '#f026b8', fontWeight: 400, textDecoration: 'none' }}>Réserver en ligne</Link>
            </li>
          </ul>
        </div>

        {/* COLONNE NAVIGATION AVEC NOMS COMPLETS */}
        <div className="footer-column">
          <h4 style={{ fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.9rem' }}>C'est Fluide</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {/*<li style={{ marginBottom: '8px' }}>
              <Link href="/hiver" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>Baptême parapente La Clusaz hiver</Link>
            </li>
            <li style={{ marginBottom: '8px' }}>
              <Link href="/ete" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>Baptême parapente La Clusaz été</Link>
            </li>
            <li style={{ marginBottom: '8px' }}><Link href="/equipe" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>L'équipe</Link></li>
            <li style={{ marginBottom: '8px' }}><Link href="/mag" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>Le Mag'</Link></li>*/}
          </ul>
        </div>

        {/* COLONNE RÉSEAUX */}
        <div className="footer-column">
          <h4 style={{ fontWeight: 900, marginBottom: '15px', textTransform: 'uppercase', fontSize: '0.9rem' }}>Suivez-nous</h4>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            <li style={{ marginBottom: '8px' }}><a href="https://instagram.com" target="_blank" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>Instagram</a></li>
            <li style={{ marginBottom: '8px' }}><a href="https://facebook.com" target="_blank" style={{ color: '#64748b', fontWeight: 400, textDecoration: 'none' }}>Facebook</a></li>
          </ul>
        </div>
      </div>

      {/* --- BAS DU PIED DE PAGE --- */}
      <div style={{ 
        marginTop: '40px', 
        paddingTop: '20px', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        color: '#94a3b8', 
        fontSize: '0.8rem',
        position: 'relative',
        zIndex: 1
      }}>
        <p style={{ fontWeight: 400, margin: 0 }}>&copy; {new Date().getFullYear()} fluide - La Clusaz</p>
        
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <Link href="/mentions-legales" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 400, margin: 0 }}>Mentions légales</Link>
          <Link href="/cgv" style={{ color: '#94a3b8', textDecoration: 'none', fontWeight: 400, margin: 0 }}>CGV</Link>
        </div>
      </div>
    </footer>
  );
}