import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import BackToTop from '@/components/BackToTop';

export default function BookingLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <Navbar transparentOnTop />
      {children}
      <Footer />
      <BackToTop />
    </>
  );
}
