import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

// API_URL est une variable serveur (non NEXT_PUBLIC) — non exposée dans le bundle client.
// Rétrocompatible avec l'ancienne variable NEXT_PUBLIC_API_URL le temps de la transition Railway.
const BACKEND_URL = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

type Params = Promise<{ path: string[] }>;

async function handler(request: NextRequest, { params }: { params: Params }) {
  const { path } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('auth_token')?.value;

  const searchParams = request.nextUrl.searchParams.toString();
  const backendPath = path.join('/');
  const backendUrl = `${BACKEND_URL}/api/${backendPath}${searchParams ? `?${searchParams}` : ''}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };

  let body: string | undefined;
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    body = await request.text();
  }

  const backendRes = await fetch(backendUrl, { method: request.method, headers, body });

  const contentType = backendRes.headers.get('Content-Type') ?? 'application/json';
  const responseBody = await backendRes.arrayBuffer();

  return new NextResponse(responseBody, {
    status: backendRes.status,
    headers: { 'Content-Type': contentType },
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
