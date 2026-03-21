export async function apiFetch(endpoint, options = {}) {
  // 1. Récupérer le token
  const token = localStorage.getItem('token');

  // 2. Préparer les entêtes
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 3. Faire l'appel au serveur
  const response = await fetch(`https://fluide-production.up.railway.app${endpoint}`, {
    ...options,
    headers,
  });

  // 4. SI LE SERVEUR DIT QUE LE TOKEN EST MAUVAIS (401)
  if (response.status === 401) {
    console.error("Session expirée ou invalide");
    // NE SURTOUT PAS REDIRIGER ICI POUR TES TESTS
    // window.location.href = '/login'; 
  }

  return response;
}