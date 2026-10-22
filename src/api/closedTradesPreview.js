import axios from "axios";

export async function getClosedTradesPreview() {
  const response = await axios.get("/api/closed_trades/preview", {
    timeout: 10000,
  });
  return response.data;
}
