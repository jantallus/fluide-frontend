import { NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env.API_URL ?? 'http://localhost:3001';
const IS_PROD = process.env.NODE_ENV === 'production';

// ── Rate limiter en mémoire ────────────────────────────────────────────────────
// Limite à 10 tentatives par IP sur une fenêtre glissante de 15 minutes.
// Note : en multi-instance (Railway scale-out), chaque instance a sa propre
// mémoire. Pour une protection stricte, utiliser Redis/Upstash à la place.

const WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const MAX_ATTEMPTS = 10;

interface RateLimitEntry {
  count: number;
  resetAt: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

function checkRateLimit(ip: string): { allowed: boolean; retryAfter: number } {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);

  if (!entry || now > entry.resetAt) {
    // Première tentative ou fenêtre expirée — on repart à zéro
    rateLimitMap.set(ip, { count: 1, resetAt: now + WINDOW_MS });
    return { allowed: true, retryAfter: 0 };
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return { allowed: false, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count += 1;
  return { allowed: true, retryAfter: 0 };
}

// Nettoyage périodique pour éviter les fuites mémoire
// (exécuté lors de chaque requête, mais seulement si > 500 entrées)
function pruneExpiredEntries() {
  if (rateLimitMap.size < 500) return;
  const now = Date.now();
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key);
  }
}

// ── Handler ───────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  pruneExpiredEntries();

  // Récupère l'IP réelle derrière le proxy Railway / Vercel
  const ip =
    request.headers.get('x-forwarded-for')?.split(',')[0].trim() ??
    request.headers.get('x-real-ip') ??
    '0.0.0.0';

  const { allowed, retryAfter } = checkRateLimit(ip);

  if (!allowed) {
    return NextResponse.json(
      { error: 'Trop de tentatives. Réessayez dans quelques minutes.' },
      {
        status: 429,
        headers: {
          'Retry-After': String(retryAfter),
          'X-RateLimit-Limit': String(MAX_ATTEMPTS),
          'X-RateLimit-Remaining': '0',
        },
      }
    );
  }

  const body = await request.json();

  const backendRes = await fetch(`${BACKEND_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = await backendRes.json();

  if (!backendRes.ok) {
    return NextResponse.json(data, { status: backendRes.status });
  }

  const response = NextResponse.json({ user: data.user });

  // Pose le cookie sur le domaine frontend — lisible par middleware.ts et le proxy
  response.cookies.set('auth_token', data.token, {
    httpOnly: true,
    secure: IS_PROD,
    sameSite: 'lax',
    maxAge: 30 * 60,
    path: '/',
  });

  return response;
}
