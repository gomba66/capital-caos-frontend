import axios from "axios";

const API_URL = "/api/price_history";

/**
 * Obtiene datos históricos de precio para un símbolo específico
 * @param {string} symbol - Símbolo del par de trading (ej: 'BTCUSDT')
 * @param {string} interval - Intervalo de tiempo (ej: '1m', '5m', '1h', '1d')
 * @param {number} limit - Número de velas a obtener (máximo 1000)
 * @returns {Promise<Object|null>} Datos históricos de precio
 */
export async function getPriceHistory(symbol, interval = "1m", limit = 100) {
  try {
    const url = `${API_URL}/${symbol}`;
    const params = { interval, limit };

    const response = await axios.get(url, { params });

    return response.data;
  } catch (error) {
    console.error("❌ Error fetching price history:", {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      params: error.config?.params,
    });
    return null;
  }
}

/**
 * Obtiene datos históricos para múltiples intervalos
 * @param {string} symbol - Símbolo del par de trading
 * @param {Array<string>} intervals - Array de intervalos
 * @param {number} limit - Número de velas por intervalo
 * @returns {Promise<Object>} Datos históricos para todos los intervalos
 */
export async function getMultiTimeframeData(
  symbol,
  intervals = ["1m", "5m", "1h"],
  limit = 100
) {
  try {
    const promises = intervals.map((interval) =>
      getPriceHistory(symbol, interval, limit)
    );

    const results = await Promise.all(promises);
    const data = {};

    intervals.forEach((interval, index) => {
      data[interval] = results[index];
    });

    return data;
  } catch (error) {
    console.error("Error fetching multi-timeframe data:", error);
    return null;
  }
}
