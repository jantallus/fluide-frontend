import { NextResponse } from 'next/server';

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

export async function POST() {
  // Notifie le backend (il efface son propre cookie)
  await fetch(`${BACKEND_URL}/api/logout`, { method: 'POST' }).catch(() => {});

  const response = NextResponse.json({ success: true });
  response.cookies.delete('auth_token');
  return response;
}
