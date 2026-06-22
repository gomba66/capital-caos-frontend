import axios from "axios";

const API_URL = "/api/paper/commission_rate";

export async function getCommissionRate() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching commission rate:", error);
    return null;
  }
}

export async function setCommissionRate(rateBps, recalculate = true) {
  try {
    const response = await axios.post(API_URL, null, {
      params: {
        rate_bps: rateBps,
        recalculate,
      },
    });
    return response.data;
  } catch (error) {
    console.error("Error setting commission rate:", error);
    return null;
  }
}
