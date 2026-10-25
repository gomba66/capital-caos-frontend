import { describe, expect, test } from "vitest";
import { detectTradeLifecycleEvents } from "../tradeLifecycleNotifications";

describe("detectTradeLifecycleEvents", () => {
  test("does not notify on the initial snapshot", () => {
    expect(detectTradeLifecycleEvents(null, [{ symbol: "BTCUSDT", side: "LONG" }]))
      .toEqual([]);
  });

  test("notifies when trades open and close", () => {
    const previousTrades = [{ symbol: "BTCUSDT", side: "LONG" }];
    const currentTrades = [
      {
        symbol: "ETHUSDT",
        positionSide: "SHORT",
        entry_price: 3000,
        initial_stop: 3100,
        take_profit_target: { tp_price: 2700, ratio: 3 },
      },
    ];

    expect(detectTradeLifecycleEvents(previousTrades, currentTrades)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "opened",
          symbol: "ETHUSDT",
          side: "SHORT",
          entry_price: 3000,
          initial_stop: 3100,
          projection: expect.objectContaining({
            targetPrice: 2700,
            movePercent: 10,
            rewardRiskRatio: 3,
          }),
        }),
        expect.objectContaining({
          type: "closed",
          symbol: "BTCUSDT",
          side: "LONG",
        }),
      ]),
    );
  });

  test("does not notify when the open trades stay the same", () => {
    const trades = [{ symbol: "BTCUSDT", side: "LONG" }];

    expect(detectTradeLifecycleEvents(trades, trades)).toEqual([]);
  });
});
