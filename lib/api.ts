// PROD CONFIG FINAL V3
const BASE_URL = "https://fluide-production.up.railway.app";

export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const url = `${BASE_URL}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  return fetch(url, { ...options, headers }).then(res => {
    if (res.status === 401 || res.status === 403) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('token');
        window.location.href = '/login';
      }
    }
    return res;
  });
}