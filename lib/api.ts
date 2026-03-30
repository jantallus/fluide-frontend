// lib/api.ts
export async function apiFetch(endpoint: string, options: any = {}) {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}),
    ...options.headers,
  };

  // On utilise la variable d'environnement, ou localhost par défaut
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

  const response = await fetch(`${baseUrl}${endpoint}`, {
    ...options,
    headers,
  });

  // 👇 SÉCURITÉ : GESTION DE LA DÉCONNEXION AUTOMATIQUE 👇
  if (response.status === 401 || response.status === 403) {
    if (typeof window !== 'undefined') {
      // 1. On vide la mémoire du navigateur
      localStorage.removeItem('token');
      localStorage.removeItem('user'); // (au cas où vous stockeriez aussi l'user)
      
      // 2. On redirige de force vers la page de connexion
      // ⚠️ Note : Si votre page de connexion a un autre nom (ex: /admin/login), 
      // pensez à modifier le '/login' ci-dessous !
      window.location.href = '/login'; 
    }
  }
  // 👆 FIN DE LA SÉCURITÉ 👆

  return response;
}