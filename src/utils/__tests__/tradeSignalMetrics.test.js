import { describe, expect, test } from "vitest";
import {
  calculateAtr14,
  getStopMarginScore,
  getTradeProjection,
  TRADE_SIGNAL_ATR_TIMEFRAME,
  TRADE_SIGNAL_CHART_CANDLE_LIMIT,
  TRADE_SIGNAL_CHART_TIMEFRAME,
  TRADE_SIGNAL_MIN_STOP_ATR,
  isTradeSignalEligible,
} from "../tradeSignalMetrics";

describe("trade signal metrics", () => {
  test("uses the bot's 3-minute candles for ATR-based SL margin", () => {
    expect(TRADE_SIGNAL_ATR_TIMEFRAME).toBe("3m");
  });

  test("uses a less dense 15-minute chart with 30 candles for trade cards", () => {
    expect(TRADE_SIGNAL_CHART_TIMEFRAME).toBe("15m");
    expect(TRADE_SIGNAL_CHART_CANDLE_LIMIT).toBe(30);
  });

  test("calculates ATR from candle true ranges", () => {
    const candles = Array.from({ length: 20 }, (_, index) => ({
      high: 102 + index,
      low: 98 + index,
      close: 100 + index,
    }));

    expect(calculateAtr14(candles)).toBeCloseTo(4);
  });

  test("returns no ATR when there is insufficient valid candle data", () => {
    expect(calculateAtr14([])).toBeNull();
    expect(calculateAtr14([{ high: 10, low: 9, close: 9.5 }])).toBeNull();
  });

  test("scores stop distance in ATR units and caps it at 100", () => {
    expect(getStopMarginScore(100, 99, 1)).toEqual({
      score: 50,
      atrMultiple: 1,
      band: "buffered",
    });
    expect(getStopMarginScore(100, 98, 1)).toEqual({
      score: 100,
      atrMultiple: 2,
      band: "wide",
    });
    expect(getStopMarginScore(100, 99.5, 1)).toEqual({
      score: 25,
      atrMultiple: 0.5,
      band: "tight",
    });
    expect(getStopMarginScore(100, 95, 1).score).toBe(100);
  });

  test("requires a minimum 2 ATR stop buffer for recommendation eligibility", () => {
    expect(TRADE_SIGNAL_MIN_STOP_ATR).toBe(2);
    expect(isTradeSignalEligible(getStopMarginScore(100, 99, 1))).toBe(false);
    expect(isTradeSignalEligible(getStopMarginScore(100, 98, 1))).toBe(true);
    expect(isTradeSignalEligible(null)).toBe(false);
  });

  test("does not calculate an SL margin from invalid values", () => {
    expect(getStopMarginScore(100, 99, 0)).toBeNull();
    expect(getStopMarginScore(0, 99, 1)).toBeNull();
    expect(getStopMarginScore(100, null, 1)).toBeNull();
  });

  test("projects a long trade's target move and reward-to-risk ratio", () => {
    expect(
      getTradeProjection({
        side: "LONG",
        entry_price: "100",
        take_profit_target: { tp_price: 110, ratio: 2.5, value_usd: 25 },
      }),
    ).toEqual({
      entryPrice: 100,
      targetPrice: 110,
      movePercent: 10,
      projectedUsd: 25,
      rewardRiskRatio: 2.5,
    });
  });

  test("calculates short target movement in the trade direction", () => {
    expect(
      getTradeProjection({
        side: "SHORT",
        entryPrice: "100",
        estimated_tp_price: 90,
      }).movePercent,
    ).toBe(10);
  });
});
