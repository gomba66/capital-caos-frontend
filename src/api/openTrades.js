import axios from "axios";

const API_URL = "/api/open_trades";

export async function getOpenTrades() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching open trades:", error);
    return null;
  }
}
