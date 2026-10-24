import axios from "axios";
import { getChartData, getClosedTradesPage } from "../chartData";

vi.mock("axios");

describe("chart data API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("requests compact chart data for the selected timezone", async () => {
    axios.get.mockResolvedValue({ data: { equity: [] } });

    await getChartData("America/Los_Angeles");

    expect(axios.get).toHaveBeenCalledWith("/api/chart-data", {
      params: { time_zone: "America/Los_Angeles" },
    });
  });

  test("requests a page of closed trades", async () => {
    axios.get.mockResolvedValue({ data: { trades: [] } });

    await getClosedTradesPage(3, 25);

    expect(axios.get).toHaveBeenCalledWith("/api/closed-trades", {
      params: { page: 3, page_size: 25 },
    });
  });
});
