import axios from "axios";

export async function getChartData(timeZone = "UTC") {
  try {
    const response = await axios.get("/api/chart-data", {
      params: { time_zone: timeZone },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching chart summaries:", error);
    return null;
  }
}

export async function getClosedTradesPage(page = 1, pageSize = 50) {
  try {
    const response = await axios.get("/api/closed-trades", {
      params: { page, page_size: pageSize },
    });
    return response.data;
  } catch (error) {
    console.error("Error fetching closed trades page:", error);
    return null;
  }
}
