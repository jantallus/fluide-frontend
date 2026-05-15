'use client';
import { useEffect } from 'react';

export default function BackNavigationGuard({ to }: { to: string }) {
  useEffect(() => {
    history.pushState(null, '', window.location.href);
    const handler = () => window.location.replace(to);
    window.addEventListener('popstate', handler);
    return () => window.removeEventListener('popstate', handler);
  }, [to]);
  return null;
}
