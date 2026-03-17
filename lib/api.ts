// lib/api.ts

// 1. Suppression du slash final pour éviter le double //
const BASE_URL = 'https://fluide-production.up.railway.app'; 

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 2. On s'assure que l'endpoint commence par un /
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    // 3. L'URL sera maintenant propre : BASE_URL + /api/...
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }

    return response;
  } catch (error) {
    console.error("Erreur de connexion à l'API :", error);
    throw error;
  }
}