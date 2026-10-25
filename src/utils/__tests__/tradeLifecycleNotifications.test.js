import { describe, expect, test } from "vitest";
import { detectTradeLifecycleEvents } from "../tradeLifecycleNotifications";

describe("detectTradeLifecycleEvents", () => {
  test("does not notify on the initial snapshot", () => {
    expect(detectTradeLifecycleEvents(null, [{ symbol: "BTCUSDT", side: "LONG" }]))
      .toEqual([]);
  });

  test("notifies when trades open and close", () => {
    const previousTrades = [{ symbol: "BTCUSDT", side: "LONG" }];
    const currentTrades = [{ symbol: "ETHUSDT", positionSide: "SHORT" }];

    expect(detectTradeLifecycleEvents(previousTrades, currentTrades)).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          type: "opened",
          symbol: "ETHUSDT",
          side: "SHORT",
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
