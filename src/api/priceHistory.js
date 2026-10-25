import axios from "axios";

export async function getPriceHistory(
  symbol,
  interval = "3m",
  limit = 120,
  { startTime, endTime } = {},
) {
  const response = await axios.get(
    `/api/price_history/${encodeURIComponent(symbol)}`,
    {
      params: { interval, limit, start_time: startTime, end_time: endTime },
    },
  );
  return response.data;
}
