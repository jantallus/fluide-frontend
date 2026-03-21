// PROD CONFIG FINAL V3
const BASE_URL = "https://fluide-production.up.railway.app";

export async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('token'); // On récupère la clé
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { 'Authorization': `Bearer ${token}` } : {}), // On l'envoie au serveur
    ...options.headers,
  };

  const response = await fetch(`https://fluide-production.up.railway.app${endpoint}`, {
    ...options,
    headers,
  });

  return response;
}