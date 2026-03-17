"use client";
import Link from 'next/link';

export default function MentionsLegalesPage() {
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

        .legal-content-section {
          padding: 100px 15vw;
          background-color: white;
          position: relative;
          z-index: 10;
        }

        .legal-content-section h2 { color: #1e40af; font-size: 1.8rem; font-weight: 900; margin-top: 50px; margin-bottom: 20px; text-transform: uppercase; }
        .legal-content-section p { color: #475569; line-height: 1.8; font-size: 1.1rem; margin-bottom: 15px; }
        .legal-content-section strong { color: #1e40af; font-weight: 800; }
        .link-pink { color: #f026b8; text-decoration: none; font-weight: 700; transition: 0.3s; }
        .link-pink:hover { text-decoration: underline; }
      `}} />

      <section style={{ position: 'relative', width: '100%', height: '100vh', display: 'flex', alignItems: 'center', paddingLeft: '15vw', overflow: 'hidden', backgroundColor: '#1e40af' }}>
        <div className="hero-animation-block" style={{ position: 'relative', zIndex: 10 }}>
          <h1 style={{ fontSize: 'clamp(2.5rem, 6vw, 3.8rem)', fontWeight: 900, color: 'white', margin: 0, lineHeight: 1.1, maxWidth: '800px' }}>
            Mentions<br /> Légales
          </h1>
        </div>

        <div className="mountains-container">
          <img src="/montagnes.svg" alt="Montagnes" />
        </div>
      </section>

      <section className="legal-content-section">
        <div className="hero-animation-block">
          <h2>Éditeur du Site</h2>
          <p><strong>Léo Guyonnet et Julien Wirtz</strong></p>

          <h2>Création du site internet</h2>
          <p>Agence web Rennes : <strong>La Confiserie</strong></p>

          <h2>Crédits photos</h2>
          <p>DR / <strong>Tilby Vattard</strong></p>

          <h2>Hébergement</h2>
          <p>
            <strong>INFOMANIAK NETWORK SA</strong> – 26, Avenue de la Praille – 1227 Carouge / Genève – SUISSE<br />
            Tél. : +41 22 820 35 44<br />
            <a href="https://www.infomaniak.ch" target="_blank" className="link-pink">www.infomaniak.ch</a>
          </p>

          <h2>Conservation et modification des informations</h2>
          <p>
            En application de la législation française, vous disposez d’un droit d’accès, de modification, de rectification ou de suppression de toute information personnelle vous concernant par simple demande via notre courriel.
          </p>

          <h2>Protection des données personnelles</h2>
          <p>
            L’éditeur ne récupère sur le présent site que les données personnelles communiquées à l’initiative des visiteurs. L’éditeur s’engage à ne pas divulguer à des tiers les informations ainsi recueillies.
          </p>

          <h2>Hyperliens et Responsabilité</h2>
          <p>
            Le site peut contenir des liens hypertextes menant à d’autres sites Internet totalement indépendants. L’éditeur ne peut garantir l’exactitude, la complétude, l’actualité des informations diffusées sur le Site. L’éditeur met tout en œuvre pour diffuser des informations exactes et mises à jour. Vous reconnaissez utiliser ces informations sous votre responsabilité.
          </p>
          <p>
            L’éditeur ne peut être tenu responsable des dommages directs ou indirects qui pourraient résulter de l’accès ou de l’utilisation du site.
          </p>
        </div>
      </section>
    </main>
  );
}