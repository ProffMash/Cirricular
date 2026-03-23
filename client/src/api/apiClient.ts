import axios from 'axios';

const API_BASE = 'http://localhost:8000/api';
// const API_BASE = 'https://cirricular.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
});


export function setAuthToken(token: string | null) {
  if (token) {
    api.defaults.headers.common['Authorization'] = `Token ${token}`; 
  } else {
    delete api.defaults.headers.common['Authorization'];
  }
}

import { makeKey, getCache, setCache, deleteCache, clearCache } from '../utils/cache';

export async function cachedGet<T = any>(
  url: string,
  params?: Record<string, any>,
  ttlSeconds = 30
): Promise<T> {
  const key = makeKey([url, JSON.stringify(params || {})]);
  const cached = getCache<T>(key);
  if (cached !== undefined) {
    return cached;
  }
  const response = await api.get<T>(url, { params });
  setCache<T>(key, response.data, ttlSeconds);
  return response.data;
}

export function invalidateCacheFor(url: string, params?: Record<string, any>) {
  const key = makeKey([url, JSON.stringify(params || {})]);
  deleteCache(key);
}

export function clearAllCache() {
  clearCache();
}

export default api;
