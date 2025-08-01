import { calculateProfitFactors } from "../formatting";

describe("formatting utilities", () => {
  describe("calculateProfitFactors", () => {
    test("calculates profit factors correctly for mixed results", () => {
      const operations = [
        { pnl: 100 },
        { pnl: -50 },
        { pnl: 200 },
        { pnl: -30 },
        { pnl: 150 },
      ];

      const result = calculateProfitFactors(operations);

      expect(result).toEqual({
        total: 5.63,
        long: null,
        short: null,
      });
    });

    test("handles empty operations array", () => {
      const result = calculateProfitFactors([]);

      expect(result).toEqual({
        total: null,
        long: null,
        short: null,
      });
    });

    test("handles operations with only losses", () => {
      const operations = [{ pnl: -100 }, { pnl: -50 }, { pnl: -200 }];

      const result = calculateProfitFactors(operations);

      expect(result.total).toBe(0);
      expect(result.long).toBe(null);
      expect(result.short).toBe(null);
    });

    test("handles operations with only wins", () => {
      const operations = [{ pnl: 100 }, { pnl: 50 }, { pnl: 200 }];

      const result = calculateProfitFactors(operations);

      expect(result.total).toBe(null);
      expect(result.long).toBe(null);
      expect(result.short).toBe(null);
    });

    test("handles operations with long and short sides", () => {
      const operations = [
        { pnl: 100, side: "LONG" },
        { pnl: -50, side: "LONG" },
        { pnl: 200, side: "SHORT" },
        { pnl: -30, side: "SHORT" },
      ];

      const result = calculateProfitFactors(operations);

      expect(result.total).toBe(3.75);
      expect(result.long).toBe(2.0);
      expect(result.short).toBe(6.67);
    });
  });
});
