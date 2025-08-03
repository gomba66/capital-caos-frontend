import { getOperations } from "../operations";
import axios from "axios";

// Mock axios
vi.mock("axios");

describe("operations API", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("fetches operations successfully", async () => {
    const mockData = {
      closed: [
        {
          id: 1,
          symbol: "BTCUSDT",
          side: "LONG",
          pnl: 100,
        },
      ],
    };

    axios.get.mockResolvedValue({ data: mockData });

    const result = await getOperations();

    expect(axios.get).toHaveBeenCalledWith("/api/operations");
    expect(result).toEqual(mockData);
  });

  test("handles API error gracefully", async () => {
    const mockError = new Error("Network error");
    axios.get.mockRejectedValue(mockError);

    const consoleSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await getOperations();

    expect(axios.get).toHaveBeenCalledWith("/api/operations");
    expect(result).toBeNull();
    expect(consoleSpy).toHaveBeenCalledWith(
      "Error fetching operations:",
      mockError
    );

    consoleSpy.mockRestore();
  });
});
