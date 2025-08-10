import { calculateProfitFactors, calculateWinrates } from "../formatting";

describe("calculateProfitFactors", () => {
  test("calculates profit factors correctly for mixed operations", () => {
    const operations = [
      { pnl: 100, side: "LONG" },
      { pnl: -50, side: "LONG" },
      { pnl: 75, side: "SHORT" },
      { pnl: -25, side: "SHORT" },
    ];

    const result = calculateProfitFactors(operations);

    expect(result.total).toBe(2.33); // (100+75)/(50+25) = 175/75 = 2.33
    expect(result.long).toBe(2.0); // 100/50 = 2.0
    expect(result.short).toBe(3.0); // 75/25 = 3.0
  });

  test("handles operations without side information", () => {
    const operations = [{ pnl: 100 }, { pnl: -50 }, { pnl: 75 }];

    const result = calculateProfitFactors(operations);

    expect(result.total).toBe(3.5); // (100+75)/50 = 175/50 = 3.5
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("returns null when no losses", () => {
    const operations = [
      { pnl: 100, side: "LONG" },
      { pnl: 75, side: "SHORT" },
    ];

    const result = calculateProfitFactors(operations);

    expect(result.total).toBeNull();
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("handles empty operations array", () => {
    const result = calculateProfitFactors([]);

    expect(result.total).toBeNull();
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("handles null operations", () => {
    const result = calculateProfitFactors(null);

    expect(result.total).toBeNull();
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });
});

describe("calculateWinrates", () => {
  test("calculates winrates correctly for mixed operations", () => {
    const operations = [
      { pnl: 100, side: "LONG" },
      { pnl: -50, side: "LONG" },
      { pnl: 75, side: "SHORT" },
      { pnl: -25, side: "SHORT" },
      { pnl: 200, side: "LONG" },
      { pnl: -100, side: "SHORT" },
    ];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(50.0); // 3 wins out of 6 trades = 50%
    expect(result.long).toBe(66.7); // 2 wins out of 3 long trades = 66.7%
    expect(result.short).toBe(33.3); // 1 win out of 3 short trades = 33.3%
  });

  test("handles operations without side information", () => {
    const operations = [{ pnl: 100 }, { pnl: -50 }, { pnl: 75 }, { pnl: -25 }];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(50.0); // 2 wins out of 4 trades = 50%
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("handles operations with only wins", () => {
    const operations = [
      { pnl: 100, side: "LONG" },
      { pnl: 75, side: "SHORT" },
    ];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(100.0); // 2 wins out of 2 trades = 100%
    expect(result.long).toBe(100.0); // 1 win out of 1 long trade = 100%
    expect(result.short).toBe(100.0); // 1 win out of 1 short trade = 100%
  });

  test("handles operations with only losses", () => {
    const operations = [
      { pnl: -100, side: "LONG" },
      { pnl: -75, side: "SHORT" },
    ];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(0.0); // 0 wins out of 2 trades = 0%
    expect(result.long).toBe(0.0); // 0 wins out of 1 long trade = 0%
    expect(result.short).toBe(0.0); // 0 wins out of 1 short trade = 0%
  });

  test("handles empty operations array", () => {
    const result = calculateWinrates([]);

    expect(result.total).toBeNull();
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("handles null operations", () => {
    const result = calculateWinrates(null);

    expect(result.total).toBeNull();
    expect(result.long).toBeNull();
    expect(result.short).toBeNull();
  });

  test("handles case-insensitive side detection", () => {
    const operations = [
      { pnl: 100, side: "long" },
      { pnl: -50, side: "LONG" },
      { pnl: 75, side: "short" },
      { pnl: -25, side: "SHORT" },
    ];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(50.0); // 2 wins out of 4 trades = 50%
    expect(result.long).toBe(50.0); // 1 win out of 2 long trades = 50%
    expect(result.short).toBe(50.0); // 1 win out of 2 short trades = 50%
  });

  test("handles positionSide field as alternative to side", () => {
    const operations = [
      { pnl: 100, positionSide: "LONG" },
      { pnl: -50, positionSide: "LONG" },
      { pnl: 75, positionSide: "SHORT" },
    ];

    const result = calculateWinrates(operations);

    expect(result.total).toBe(66.7); // 2 wins out of 3 trades = 66.7%
    expect(result.long).toBe(50.0); // 1 win out of 2 long trades = 50%
    expect(result.short).toBe(100.0); // 1 win out of 1 short trade = 100%
  });
});
