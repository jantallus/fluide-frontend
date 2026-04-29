// lib/api.ts

interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...(options.headers ?? {}),
  };

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
}