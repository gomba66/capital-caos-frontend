import { useState, useEffect } from "react";

// Get API base URL from window location or fallback
const getApiBaseUrl = () => {
  if (typeof window !== "undefined") {
    const { protocol, hostname } = window.location;
    // Si estamos en producción, usar el mismo host pero puerto 8000
    if (hostname !== "localhost" && hostname !== "127.0.0.1") {
      return `${protocol}//${hostname}:8000`;
    }
  }
  return "http://localhost:8000";
};

/**
 * Custom hook to fetch symbol statistics from the backend
 * @param {string|null} symbol - Optional symbol to filter by. If null, fetches all symbols.
 * @returns {Object} - { data, loading, error }
 */
export const useSymbolStatistics = (symbol = null) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = getApiBaseUrl();
        const url = symbol
          ? `${API_BASE_URL}/api/symbol-statistics/${symbol}`
          : `${API_BASE_URL}/api/symbol-statistics`;

        const response = await fetch(url);

        if (!response.ok) {
          // Si el endpoint no existe (404) o hay error del servidor, no es crítico
          console.warn(
            `Symbol statistics endpoint not available: ${response.status}`
          );
          setData(null);
          setError(null); // No tratarlo como error crítico
          return;
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.warn("Symbol statistics not available:", err.message);
        // No tratarlo como error crítico para no romper el UI
        setError(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [symbol]);

  return { data, loading, error };
};

/**
 * Custom hook to fetch symbol performance summary
 * @returns {Object} - { data, loading, error }
 */
export const useSymbolPerformanceSummary = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSummary = async () => {
      try {
        setLoading(true);
        const API_BASE_URL = getApiBaseUrl();
        const response = await fetch(
          `${API_BASE_URL}/api/symbol-performance-summary`
        );

        if (!response.ok) {
          console.warn(
            `Symbol performance summary endpoint not available: ${response.status}`
          );
          setData(null);
          setError(null);
          return;
        }

        const result = await response.json();
        setData(result);
        setError(null);
      } catch (err) {
        console.warn("Symbol performance summary not available:", err.message);
        setError(null);
        setData(null);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  return { data, loading, error };
};
