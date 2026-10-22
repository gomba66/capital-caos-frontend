import axios from "axios";

export async function getPriceHistory(symbol, interval = "3m", limit = 120) {
  const response = await axios.get(
    `/api/price_history/${encodeURIComponent(symbol)}`,
    {
      params: { interval, limit },
    },
  );
  return response.data;
}
