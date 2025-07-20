import axios from "axios";

const API_URL = "/api/stats";

export async function getStats() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching stats:", error);
    return null;
  }
}
