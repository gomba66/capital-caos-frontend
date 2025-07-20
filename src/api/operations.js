import axios from "axios";

const API_URL = "/api/operations";

export async function getOperations() {
  try {
    const response = await axios.get(API_URL);
    return response.data;
  } catch (error) {
    console.error("Error fetching operations:", error);
    return null;
  }
}
