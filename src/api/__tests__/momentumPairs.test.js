import { getMomentumPairs } from "../momentumPairs";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("momentumPairs API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches momentum pairs successfully", async () => {
    const mockData = {
      momentum_pairs: [
        {
          symbol: "BTCUSDT",
          change: 2.5,
          volume: 1000000,
          type: "momentum",
        },
      ],
    };

    axios.get.mockResolvedValue({ data: mockData });

    const result = await getMomentumPairs();

    expect(axios.get).toHaveBeenCalledWith("/api/momentum_pairs");
    expect(result).toEqual(mockData);
  });

  test("handles API error gracefully", async () => {
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getMomentumPairs();

    expect(axios.get).toHaveBeenCalledWith("/api/momentum_pairs");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching momentum pairs:",
      mockError
    );

    consoleSpy.mockRestore();
  });
});
