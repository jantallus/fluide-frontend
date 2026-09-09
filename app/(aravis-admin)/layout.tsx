import type { Metadata } from 'next';
import AravisClientLayout from './AravisClientLayout';

export const metadata: Metadata = {
  title: 'Planning · Aravis Parapente',
};

export default function AravisLayout({ children }: { children: React.ReactNode }) {
  return <AravisClientLayout>{children}</AravisClientLayout>;
}
