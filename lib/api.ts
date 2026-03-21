/**
 * Fonction de communication avec l'API
 * Corrigée pour TypeScript et pour éviter les redirections infinies
 */
export async function apiFetch(endpoint: string, options: any = {}) {
  // 1. Récupérer le token dans le stockage local
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  // 2. Préparer les entêtes (Headers)
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // 3. Appel au serveur Railway
  const response = await fetch(`https://fluide-production.up.railway.app${endpoint}`, {
    ...options,
    headers,
  });

  // 4. Gestion de l'erreur 401 (Session expirée)
  if (response.status === 401) {
    console.warn("Session invalide ou expirée pour l'endpoint:", endpoint);
    // On ne redirige pas brutalement ici pour laisser le code de la page gérer l'erreur
  }

  return response;
}