/**
 * cacheService.js
 * Simple in-memory cache to optimize performance and reduce API costs.
 */

class CacheService {
  constructor(ttl = 1000 * 60 * 60) { // Default 1 hour TTL
    this.cache = new Map();
    this.ttl = ttl;
  }

  set(key, value) {
    const expires = Date.now() + this.ttl;
    this.cache.set(key, { value, expires });
  }

  get(key) {
    const entry = this.cache.get(key);
    if (!entry) return null;
    if (Date.now() > entry.expires) {
      this.cache.delete(key);
      return null;
    }
    return entry.value;
  }

  clear() {
    this.cache.clear();
  }
}

module.exports = new CacheService();
