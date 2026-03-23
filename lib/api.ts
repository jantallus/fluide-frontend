// lib/api.ts
export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // NOUVEAU : On lit l'adresse depuis le fichier .env
  // (On met un '|| http://localhost:8080' par sécurité au cas où le .env n'est pas lu)
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8080';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}