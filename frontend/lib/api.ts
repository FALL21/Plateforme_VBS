import axios from 'axios';

// Normalise la baseURL pour garantir la présence de /api
const rawBase = process.env.NEXT_PUBLIC_API_URL;
const normalisedBase = rawBase
  ? `${rawBase.replace(/\/$/, '')}${rawBase.endsWith('/api') ? '' : '/api'}`
  : 'http://localhost:4000/api';

const api = axios.create({
  baseURL: normalisedBase,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Intercepteur pour ajouter le token
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    try {
      const authStorage = localStorage.getItem('auth-storage');
      if (authStorage) {
        const { state } = JSON.parse(authStorage);
        if (state?.accessToken) {
          config.headers.Authorization = `Bearer ${state.accessToken}`;
          console.log('🔑 Token ajouté à la requête:', config.method?.toUpperCase(), config.url);
        } else {
          console.warn('⚠️ Pas de token dans auth-storage');
        }
      } else {
        console.warn('⚠️ auth-storage vide');
      }
    } catch (error) {
      console.error('❌ Erreur lecture token:', error);
    }
  }
  return config;
});

// Intercepteur pour gérer les erreurs
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('auth-storage');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  },
);

export default api;
