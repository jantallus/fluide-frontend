// app/layout.tsx
import "./globals.css";
import localFont from 'next/font/local';

const aeonik = localFont({
  src: [
    { path: './fonts/Aeonik-Light.woff2',        weight: '300', style: 'normal' },
    { path: './fonts/Aeonik-LightItalic.woff2',  weight: '300', style: 'italic' },
    { path: './fonts/Aeonik-Regular.woff2',       weight: '400', style: 'normal' },
    { path: './fonts/Aeonik-RegularItalic.woff2', weight: '400', style: 'italic' },
    { path: './fonts/Aeonik-Bold.woff2',          weight: '700', style: 'normal' },
    { path: './fonts/Aeonik-BoldItalic.woff2',    weight: '700', style: 'italic' },
  ],
  display: 'swap',
  variable: '--font-aeonik',
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr" suppressHydrationWarning className={aeonik.variable}>
      <body style={{ fontFamily: 'var(--font-aeonik), sans-serif' }}>{children}</body>
    </html>
  );
}
