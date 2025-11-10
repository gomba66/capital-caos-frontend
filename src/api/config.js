import axios from "axios";

const API_URL = "/api/config";

/**
 * Get system configuration including trade limits and trade counts.
 * @returns {Promise<Object|null>} The config object or null if error
 */
export async function getConfig() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching config:", error);
    return null;
  }
}
