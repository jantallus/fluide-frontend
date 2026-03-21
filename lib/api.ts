/**
 * Fonction de communication avec l'API
 * Corrigée pour TypeScript et pour éviter les redirections infinies
 */
export async function apiFetch(endpoint: string, options: any = {}) {
  // On récupère le token mis par le login
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

  // Si le serveur rejette le jeton (401), on log l'erreur mais on ne redirige pas ici
  if (response.status === 401) {
    console.error("Accès refusé par le serveur pour :", endpoint);
  }

  return response;
}