interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry<any>>();

export function makeKey(parts: string[]): string {
  return parts.join('::');
}

export function getCache<T>(key: string): T | undefined {
  const entry = cache.get(key);
  if (!entry) return undefined;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function setCache<T>(key: string, value: T, ttlSeconds: number): void {
  cache.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
}

export function deleteCache(key: string): void {
  cache.delete(key);
}

export function clearCache(): void {
  cache.clear();
}
