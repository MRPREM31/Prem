import { useState, useEffect, useCallback } from 'react';
import cacheManager from './cacheManager';

/**
 * Perform a fetch request with active 3-layer resilience fallback.
 * LAYER 1: Try backend. If ok, save to cache and return.
 * LAYER 2: Try cache (even if expired).
 * LAYER 3: Use static frontend fallback.
 */
export const fetchWithFallback = async (url, cacheKey, fallbackData, options = {}) => {
  const { 
    method = 'GET', 
    headers = {}, 
    body = null, 
    timeout = 8000, // 8 seconds failsafe timeout
    transform = (data) => data 
  } = options;

  try {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), timeout);

    const res = await fetch(url, {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      },
      body: body ? JSON.stringify(body) : null,
      signal: controller.signal
    });
    
    clearTimeout(id);

    if (!res.ok) {
      throw new Error(`HTTP Error Status: ${res.status}`);
    }

    const rawData = await res.json();
    const processed = transform(rawData);

    // Save to cache
    if (cacheKey) {
      cacheManager.saveToCache(cacheKey, processed);
    }

    return {
      data: processed,
      dataSource: 'live',
      error: null
    };

  } catch (error) {
    console.warn(`[Resilience] Background fetch failed for URL: ${url}. Error:`, error.message || error);

    // Attempt Layer 2: Cache lookup
    if (cacheKey) {
      const cached = cacheManager.getFromCache(cacheKey, true);
      if (cached !== null) {
        console.log(`[Resilience] Successfully fell back to CACHED data for key: ${cacheKey}`);
        return {
          data: cached,
          dataSource: 'cache',
          error: error.message
        };
      }
    }

    // Attempt Layer 3: Dynamic Public Fallback JSON Snapshot fetch
    if (cacheKey) {
      const KEY_TO_FILE_MAP = {
        mrprem_cache_projects: '/fallback/projects.json',
        mrprem_cache_profile_image: '/fallback/profile.json',
        mrprem_cache_resume_url: '/fallback/profile.json',
        mrprem_cache_skills: '/fallback/skills.json',
        mrprem_cache_certificates: '/fallback/certificates.json',
        mrprem_cache_memories: '/fallback/memories.json',
        mrprem_cache_stats: '/fallback/stats.json'
      };

      const fallbackFileUrl = KEY_TO_FILE_MAP[cacheKey];
      if (fallbackFileUrl) {
        try {
          console.log(`[Resilience] Cache empty. Attempting public fallback JSON snapshot fetch from: ${fallbackFileUrl}`);
          const fallbackRes = await fetch(fallbackFileUrl);
          if (fallbackRes.ok) {
            const fallbackJson = await fallbackRes.json();
            
            // Format check for settings type queries
            let resolvedData = fallbackJson;
            if (cacheKey === 'mrprem_cache_profile_image') {
              resolvedData = { imageUrl: fallbackJson.profileImage };
            } else if (cacheKey === 'mrprem_cache_resume_url') {
              resolvedData = { resumeUrl: fallbackJson.resumeUrl };
            }

            const processed = transform(resolvedData);
            console.log(`[Resilience] Successfully fetched public fallback JSON snapshot for key: ${cacheKey}`);
            return {
              data: processed,
              dataSource: 'fallback',
              error: null
            };
          }
        } catch (fetchErr) {
          console.warn(`[Resilience] Public fallback JSON snapshot fetch failed for: ${fallbackFileUrl}`, fetchErr);
        }
      }
    }

    // Attempt Layer 4: Bundled Fallback Import Data (Offline/No-Vercel ultimate failsafe)
    console.log(`[Resilience] Network & Cache depleted. Falling back to BUNDLED ES module dataset for URL: ${url}`);
    return {
      data: fallbackData,
      dataSource: 'fallback',
      error: error.message
    };
  }
};

/**
 * Premium SWR-Style Hook for Portfolio Frontend Resilience.
 * Instantly loads cached/fallback data (no loader!) and revalidates in the background.
 */
export const useResilientData = (url, cacheKey, fallbackData, options = {}) => {
  const { 
    transform = (data) => data, 
    enabled = true,
    tParam = true // Automatically append timestamp to prevent browser aggressive cache
  } = options;

  // 1. Initialize state synchronously from cache, falling back to static
  const [state, setState] = useState(() => {
    if (!enabled) return { data: fallbackData, loading: true, dataSource: 'fallback', error: null };

    const cached = cacheKey ? cacheManager.getFromCache(cacheKey, true) : null;
    if (cached !== null) {
      return { data: cached, loading: false, dataSource: 'cache', error: null };
    }
    return { data: fallbackData, loading: false, dataSource: 'fallback', error: null };
  });

  const revalidate = useCallback(async () => {
    if (!enabled || !url) return;

    // Append dynamic timestamp to skip browser-side edge cache
    const separator = url.includes('?') ? '&' : '?';
    const fetchUrl = tParam ? `${url}${separator}t=${Date.now()}` : url;

    const result = await fetchWithFallback(fetchUrl, cacheKey, fallbackData, { transform });
    
    setState({
      data: result.data,
      loading: false,
      dataSource: result.dataSource,
      error: result.error
    });
  }, [url, cacheKey, fallbackData, transform, enabled, tParam]);

  useEffect(() => {
    revalidate();
  }, [revalidate]);

  return {
    data: state.data,
    loading: state.loading,
    dataSource: state.dataSource,
    error: state.error,
    mutate: setState,
    revalidate
  };
};

export default fetchWithFallback;
