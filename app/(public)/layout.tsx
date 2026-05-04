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

  // Masque navbar/footer quand la page est intégrée en iframe (?embed=true)
  const [isEmbed, setIsEmbed] = useState(false);

  useEffect(() => {
    if (window.location.search.includes('embed=true')) {
      setIsEmbed(true);
    }
  }, []);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>

      {/* Lien d'évitement — visible au focus clavier uniquement (accessibilité) */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-[99999] focus:bg-white focus:text-blue-700 focus:font-black focus:px-4 focus:py-2 focus:rounded-xl focus:shadow-lg focus:outline-2 focus:outline-blue-500"
      >
        Aller au contenu principal
      </a>

      {/* Script inline : ajoute la classe embed-mode avant le premier rendu pour éviter le flash */}
      <script dangerouslySetInnerHTML={{ __html: `
        if (window.location.search.includes('embed=true')) {
          document.documentElement.classList.add('embed-mode');
        }
      `}} />

      {/* Cache navbar et footer en mode embed (ex : intégration sur site partenaire) */}
      <style dangerouslySetInnerHTML={{ __html: `
        .embed-mode #site-navbar, .embed-mode #site-footer {
          display: none !important;
        }
      `}} />

      {!isEmbed && (
        <div id="site-navbar">
          <Navbar />
        </div>
      )}

      <main id="main-content" style={{ flex: 1 }}>
        <ToastProvider>
          <ErrorBoundary variant="public" zone="public/page">
            {children}
          </ErrorBoundary>
        </ToastProvider>
      </main>

      {!isEmbed && (
        <div id="site-footer">
          <Footer />
        </div>
      )}

    </div>
  );
}