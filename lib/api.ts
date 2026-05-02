interface FetchOptions extends RequestInit {
  headers?: Record<string, string>;
}

// Tous les appels passent par le proxy Next.js (/api/proxy/...).
// Le proxy lit le cookie HttpOnly côté serveur et le transmet au backend en Authorization header.
// Le token n'est jamais accessible depuis le JavaScript du browser.
export async function apiFetch(endpoint: string, options: FetchOptions = {}): Promise<Response> {
  // /api/flight-types → /api/proxy/flight-types
  const path = endpoint.replace(/^\/api\//, '');
  const proxyUrl = `/api/proxy/${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(options.headers ?? {}),
  };

  const response = await fetch(proxyUrl, { ...options, headers });

  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
  }

  return response;
}
