// lib/api.ts
export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  const response = await fetch(`https://fluide-production.up.railway.app${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}