import { getOpenTrades } from "../openTrades";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("openTrades API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches open trades successfully", async () => {
    const mockData = {
      open_trades: [
        {
          id: 1,
          symbol: "BTCUSDT",
          side: "LONG",
          unrealizedProfit: 100,
        },
      ],
    };

    axios.get.mockResolvedValue({ data: mockData });

    const result = await getOpenTrades();

    expect(axios.get).toHaveBeenCalledWith("/api/open_trades");
    expect(result).toEqual(mockData);
  });

  test("handles API error gracefully", async () => {
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getOpenTrades();

    expect(axios.get).toHaveBeenCalledWith("/api/open_trades");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching open trades:",
      mockError
    );

    consoleSpy.mockRestore();
  });
});
