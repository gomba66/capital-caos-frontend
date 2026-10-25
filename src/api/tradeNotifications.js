import axios from "axios";

export async function getTradeNotificationState() {
  try {
    const response = await axios.get("/api/trade_notifications/state", {
      headers: { "Cache-Control": "no-cache" },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching trade notification state:", error);
    return null;
  }
}
