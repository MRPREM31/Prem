import { useState, useEffect } from 'react';

/**
 * Standard backend fetch hook.
 * Automatically prepends VITE_API_URL for relative URLs.
 * @param {string} url - API endpoint (relative like /api/projects or absolute)
 * @param {any} fallbackData - Initial/fallback data to render while fetching
 */
export const useFetch = (url, fallbackData = null) => {
  const [data, setData] = useState(fallbackData);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!url) {
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);

    const fullUrl = url.startsWith('http')
      ? url
      : `${import.meta.env.VITE_API_URL}${url}`;

    fetch(fullUrl)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
        return res.json();
      })
      .then((jsonData) => {
        if (isMounted) {
          setData(jsonData);
          setError(null);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn(`[useFetch] Error fetching ${fullUrl}:`, err.message || err);
        if (isMounted) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [url]);

  return { data, loading, error, setData };
};

export default useFetch;
