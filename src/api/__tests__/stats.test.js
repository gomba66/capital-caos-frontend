import { getStats } from "../stats";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("stats API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches stats successfully", async () => {
    const mockData = {
      winrate: 65.5,
      total_trades: 100,
      wins: 65,
      losses: 35,
    };

    axios.get.mockResolvedValue({ data: mockData });

    const result = await getStats();

    expect(axios.get).toHaveBeenCalledWith("/api/stats");
    expect(result).toEqual(mockData);
  });

  test("handles API error gracefully", async () => {
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    // Mock console.error para evitar logs en tests
    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getStats();

    expect(axios.get).toHaveBeenCalledWith("/api/stats");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching stats:", mockError);

    consoleSpy.mockRestore();
  });

  test("handles network timeout", async () => {
    const mockError = new Error("Request timeout");
    axios.get.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getStats();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching stats:", mockError);

    consoleSpy.mockRestore();
  });

  test("handles server error response", async () => {
    const mockError = {
      response: {
        status: 500,
        data: { message: "Internal server error" },
      },
    };
    axios.get.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getStats();

    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith("Error fetching stats:", mockError);

    consoleSpy.mockRestore();
  });
});
