import axios from "axios";

const API_URL = "/api/momentum_pairs";

export async function getMomentumPairs() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching momentum pairs:", error);
    return null;
  }
}
