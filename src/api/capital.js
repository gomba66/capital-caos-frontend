import axios from "axios";

const API_URL = "/api/capital";

/**
 * Get the total capital (equity) of the Binance Futures account.
 * @returns {Promise<number|null>} The total capital in USDT or null if error
 */
export async function getCapital() {
  try {
    const response = await axios.get(API_URL);
    return response.data.total_capital;
  } catch (error) {
    console.error("Error fetching capital:", error);
    return null;
  }
}
