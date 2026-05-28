/**
 * Professional Cache Manager for Frontend Resilience.
 * Protects against QuotaExceededError (Safari private, full disk)
 * Supports safe parsing, expiration tagging, and soft/hard validation.
 */

// Default TTL: 24 hours (in seconds)
const DEFAULT_TTL = 24 * 60 * 60;

export const cacheManager = {
  /**
   * Saves data to localStorage wrapped with metadata.
   * @param {string} key
   * @param {any} data
   * @param {number} ttlSeconds - Time-To-Live in seconds
   * @returns {boolean} - Success or failure
   */
  saveToCache(key, data, ttlSeconds = DEFAULT_TTL) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return false;
      
      const entry = {
        value: data,
        cachedAt: Date.now(),
        expiresAt: Date.now() + (ttlSeconds * 1000)
      };

      window.localStorage.setItem(key, JSON.stringify(entry));
      return true;
    } catch (error) {
      console.warn(`[CacheManager] Failed to save key "${key}" to localStorage:`, error);
      // Clean up older keys if quota exceeded, or do nothing gracefully
      return false;
    }
  },

  /**
   * Retrieves data from localStorage.
   * @param {string} key
   * @param {boolean} ignoreExpiry - If true, returns the value even if it is technically expired (great for resilient fallbacks)
   * @returns {any|null}
   */
  getFromCache(key, ignoreExpiry = true) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return null;

      const raw = window.localStorage.getItem(key);
      if (!raw) return null;

      const entry = JSON.parse(raw);
      if (!entry || typeof entry !== 'object' || !('value' in entry)) {
        return null; // Invalid cache format
      }

      // Check expiry
      const isExpired = Date.now() > entry.expiresAt;
      if (isExpired && !ignoreExpiry) {
        // Technically expired, remove it and return null
        this.removeCache(key);
        return null;
      }

      return entry.value;
    } catch (error) {
      console.warn(`[CacheManager] Failed to read key "${key}" from localStorage:`, error);
      return null;
    }
  },

  /**
   * Checks if a key exists in cache and is valid.
   * @param {string} key
   * @returns {boolean}
   */
  hasValidCache(key) {
    return this.getFromCache(key, false) !== null;
  },

  /**
   * Removes a specific item from localStorage.
   * @param {string} key
   */
  removeCache(key) {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      window.localStorage.removeItem(key);
    } catch (error) {
      console.warn(`[CacheManager] Failed to remove key "${key}":`, error);
    }
  },

  /**
   * Clears all portfolio-related cached items (prevents destroying admin tokens/JWTs).
   */
  clearAllCache() {
    try {
      if (typeof window === 'undefined' || !window.localStorage) return;
      
      const keysToRemove = [];
      for (let i = 0; i < window.localStorage.length; i++) {
        const key = window.localStorage.key(i);
        if (key && key.startsWith('mrprem_cache_')) {
          keysToRemove.push(key);
        }
      }
      
      keysToRemove.forEach(key => window.localStorage.removeItem(key));
      console.log('[CacheManager] Portfolio cache cleared successfully.');
    } catch (error) {
      console.warn('[CacheManager] Failed to clear portfolio cache:', error);
    }
  }
};

export default cacheManager;
