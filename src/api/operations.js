import axios from "axios";

const API_URL = "/api/operations";

/**
 * Obtiene todas las operaciones (abiertas y cerradas)
 * @returns {Promise<Object|null>} Datos de operaciones
 */
export async function getOperations() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching operations:", error);
    return null;
  }
}

/**
 * Obtiene detalles específicos de una operación por símbolo
 * @param {string} symbol - Símbolo del par de trading (ej: 'BTCUSDT')
 * @returns {Promise<Object|null>} Detalles de la operación
 */
export async function getTradeDetails(symbol) {
  try {
    const response = await axios.get(`/api/trade/${symbol}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching trade details for ${symbol}:`, error);
    return null;
  }
}
