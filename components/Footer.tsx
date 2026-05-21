"use client";
import { useState } from 'react';

const PRIMARY   = '#312783';
const SECONDARY = '#E6007E';

const rangee: React.CSSProperties = {
  display: 'flex',
  width: '92%',
  maxWidth: '1240px',
  margin: '0 auto',
  flexFlow: 'row wrap',
};

const col25: React.CSSProperties = {
  flexBasis: '25%',
  width: '25%',
  position: 'relative',
};

const col75: React.CSSProperties = {
  flexBasis: '75%',
  width: '75%',
  position: 'relative',
};

const ecartNormal: React.CSSProperties = {
  padding: '15px 20px',
};

const titreFooter: React.CSSProperties = {
  fontWeight: 700,
  color: PRIMARY,
  fontSize: '17px',
  lineHeight: '30px',
  margin: 0,
};

const ulStyle: React.CSSProperties = {
  listStyle: 'none',
  margin: 0,
  padding: 0,
  marginBottom: '20px',
};

export default function Footer() {
  const [hovered, setHovered] = useState<string | null>(null);

  const linkStyle = (id: string): React.CSSProperties => ({
    color: hovered === id ? SECONDARY : PRIMARY,
    textDecoration: 'none',
    fontSize: '15px',
    lineHeight: '30px',
    display: 'block',
    transition: 'color 0.15s ease',
  });

  const creditLinkStyle = (id: string): React.CSSProperties => ({
    display: 'inline-block',
    margin: '0 33px 0 0',
    color: hovered === id ? SECONDARY : PRIMARY,
    textDecoration: 'none',
    fontSize: '12px',
    transition: 'color 0.15s ease',
  });

  return (
    <footer id="footer" style={{
      backgroundColor: '#fff',
      backgroundImage: 'url(/bg-footer.jpg)',
      backgroundPosition: 'bottom left',
      backgroundSize: '100% auto',
      backgroundRepeat: 'no-repeat',
      padding: '50px 0 29px 0',
    }}>

      {/* Rangée principale — 4 × col25 */}
      <div style={rangee}>

        {/* Contactez-nous */}
        <div style={{ ...col25, ...ecartNormal }}>
          <p style={titreFooter}>Contactez-nous</p>
          <ul style={ulStyle}>
            <li>
              <a href="tel:+33677285102"
                style={linkStyle('tel')}
                onPointerEnter={() => setHovered('tel')}
                onPointerLeave={() => setHovered(null)}>
                Tél : 06 77 28 51 02
              </a>
            </li>
            <li>
              <a href="mailto:contact@fluide-parapente.fr"
                style={linkStyle('mail')}
                onPointerEnter={() => setHovered('mail')}
                onPointerLeave={() => setHovered(null)}>
                Mail : contact@fluide-parapente.fr
              </a>
            </li>
            <li>
              <a href="https://www.fluide-parapente.fr/reservation/"
                style={linkStyle('resa')}
                onPointerEnter={() => setHovered('resa')}
                onPointerLeave={() => setHovered(null)}>
                Réserver en ligne
              </a>
            </li>
          </ul>
        </div>

        {/* C'est Fluide */}
        <div style={{ ...col25, ...ecartNormal }}>
          <p style={titreFooter}>C'est Fluide</p>
          <ul style={ulStyle}>
            <li>
              <a href="https://www.fluide-parapente.fr/bapteme-vol-biplace/"
                style={linkStyle('hiver')}
                onPointerEnter={() => setHovered('hiver')}
                onPointerLeave={() => setHovered(null)}>
                Baptême parapente La Clusaz hiver
              </a>
            </li>
            <li>
              <a href="https://www.fluide-parapente.fr/bapteme-vol-ete/"
                style={linkStyle('ete')}
                onPointerEnter={() => setHovered('ete')}
                onPointerLeave={() => setHovered(null)}>
                Baptême parapente La Clusaz été
              </a>
            </li>
            <li>
              <a href="https://www.fluide-parapente.fr/equipe/"
                style={linkStyle('equipe')}
                onPointerEnter={() => setHovered('equipe')}
                onPointerLeave={() => setHovered(null)}>
                L'équipe
              </a>
            </li>
            <li>
              <a href="https://www.fluide-parapente.fr/le-mag/"
                style={linkStyle('mag')}
                onPointerEnter={() => setHovered('mag')}
                onPointerLeave={() => setHovered(null)}>
                Le Mag'
              </a>
            </li>
          </ul>
        </div>

        {/* Suivez-nous */}
        <div style={{ ...col25, ...ecartNormal }}>
          <p style={titreFooter}>Suivez-nous</p>
          <ul style={ulStyle}>
            <li>
              <a href="https://www.instagram.com/fluide.parapente/" target="_blank" rel="noopener"
                style={linkStyle('ig')}
                onPointerEnter={() => setHovered('ig')}
                onPointerLeave={() => setHovered(null)}>
                Instagram
              </a>
            </li>
            <li>
              <a href="https://www.facebook.com/fluideparapente/" target="_blank" rel="noopener"
                style={linkStyle('fb')}
                onPointerEnter={() => setHovered('fb')}
                onPointerLeave={() => setHovered(null)}>
                Facebook
              </a>
            </li>
          </ul>
        </div>

        {/* Logo */}
        <div style={{ ...col25, ...ecartNormal }}>
          <p style={{ margin: 0, lineHeight: 0 }}>
            <a href="https://www.fluide-parapente.fr/" style={{ display: 'inline-block', lineHeight: 0 }}>
              <img src="/logo-fluide-fonce.svg" alt="Parapente La Clusaz" style={{ width: '150px', height: 'auto' }} />
            </a>
          </p>
        </div>

      </div>

      {/* Crédits */}
      <div id="credits" style={{ marginTop: '20px' }}>
        <div style={{ ...rangee, alignItems: 'center' }}>

          {/* Liens légaux — col75 */}
          <div style={{ ...col75, ...ecartNormal }}>
            <p style={{ fontSize: '12px', margin: 0 }}>
              <a href="https://www.fluide-parapente.fr/mentions-legales/"
                style={creditLinkStyle('cr-0')}
                onPointerEnter={() => setHovered('cr-0')}
                onPointerLeave={() => setHovered(null)}>
                Mentions légales
              </a>
              <a href="https://www.fluide-parapente.fr/cgv/"
                style={creditLinkStyle('cr-1')}
                onPointerEnter={() => setHovered('cr-1')}
                onPointerLeave={() => setHovered(null)}>
                CGV
              </a>
              <a href="https://www.laconfiserie.fr" target="_blank" rel="noopener"
                style={creditLinkStyle('cr-2')}
                onPointerEnter={() => setHovered('cr-2')}
                onPointerLeave={() => setHovered(null)}>
                Site : La Confiserie
              </a>
            </p>
          </div>

          {/* Icône Instagram — col25 */}
          <div style={{ ...col25, ...ecartNormal }}>
            <ul style={{ display: 'inline-block', margin: 0, padding: 0, listStyle: 'none' }}>
              <li style={{ display: 'inline-block' }}>
                <a href="https://www.instagram.com/fluideparapente" target="_blank" rel="noopener"
                  style={{ display: 'block', lineHeight: 0, opacity: hovered === 'ig-icon' ? 0.7 : 1, transition: 'opacity 0.15s ease' }}
                  onPointerEnter={() => setHovered('ig-icon')}
                  onPointerLeave={() => setHovered(null)}>
                  <img src="/instagram.svg" alt="Instagram" style={{ height: '25px', width: 'auto' }} />
                </a>
              </li>
            </ul>
          </div>

        </div>
      </div>

    </footer>
  );
}
