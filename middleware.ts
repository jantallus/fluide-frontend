import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

const MONITOR_PATHS = ['/planning'];

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('auth_token')?.value;

  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  const secret = process.env.JWT_SECRET;
  if (!secret) {
    // JWT_SECRET manquant côté frontend — refuser l'accès par sécurité
    return NextResponse.redirect(new URL('/login', request.url));
  }

  try {
    const { payload } = await jwtVerify(token, new TextEncoder().encode(secret));
    const role = payload.role as string;
    const { pathname } = request.nextUrl;

    const isMonitor = role === 'monitor' || role === 'permanent';
    const onMonitorPath = MONITOR_PATHS.some(p => pathname.startsWith(p));

    if (isMonitor && !onMonitorPath) {
      return NextResponse.redirect(new URL('/planning', request.url));
    }

    return NextResponse.next();
  } catch {
    // Token expiré ou invalide
    const response = NextResponse.redirect(new URL('/login', request.url));
    response.cookies.delete('auth_token');
    return response;
  }
}

export const config = {
  matcher: [
    '/dashboard/:path*',
    '/planning/:path*',
    '/prestations/:path*',
    '/moniteurs/:path*',
    '/clients/:path*',
    '/gift-cards/:path*',
    '/config/:path*',
  ],
};
