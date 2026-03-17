// L'URL de ton serveur Railway (assure-toi qu'elle est correcte dans tes paramètres Railway)
const BASE_URL = 'https://fluide-production.up.railway.app/';

export async function apiFetch(endpoint: string, options: any = {}) {
  // 1. On récupère le token si on est dans le navigateur
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 2. Nettoyage de l'endpoint pour éviter les doubles slashes (ex: //api/appointments)
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint;

  // 3. Configuration des headers
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    // 4. Appel Fetch avec l'URL complète
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    // 5. Gestion de l'expiration du token (Sécurité)
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