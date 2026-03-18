// Version Production 2.2 - Fix Localhost Redirect
const BASE_URL = 'https://fluide-production.up.railway.app'; 

export async function apiFetch(endpoint: string, options: any = {}) {
  // On récupère le token (vérifie bien que ton login utilise 'token' et pas 'adminToken')
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // Nettoyage de l'endpoint pour éviter les doubles slashs //
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  try {
    // Force l'utilisation de la BASE_URL de production
    const response = await fetch(`${BASE_URL}${cleanEndpoint}`, {
      ...options,
      headers,
    });

    // Si le token est expiré ou invalide, on déconnecte
    if (response.status === 401 || response.status === 403) {
      if (typeof window !== 'undefined') {
        console.warn("Session expirée ou non autorisée");
        localStorage.removeItem('token');
        // Optionnel : rediriger vers le login si on n'y est pas déjà
        if (!window.location.pathname.includes('/login')) {
            window.location.href = '/login';
        }
      }
    }

    return response;
  } catch (error) {
    console.error("Erreur de connexion à l'API Railway :", error);
    throw error;
  }
}