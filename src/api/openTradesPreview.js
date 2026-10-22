import axios from "axios";

export async function getOpenTradesPreview() {
  const response = await axios.get("/api/open_trades/preview", {
    headers: { "Cache-Control": "no-cache" },
  });
  return response.data;
}
