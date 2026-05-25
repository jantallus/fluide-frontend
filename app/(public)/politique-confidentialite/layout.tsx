import type { Metadata } from 'next';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export const metadata: Metadata = {
  title: 'Politique de confidentialité',
  alternates: { canonical: '/politique-confidentialite', languages: { fr: '/politique-confidentialite', 'x-default': '/politique-confidentialite' } },
};

export default function PolitiqueConfidentialiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
}
