import React from "react";
import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import ClosedTradeChartShare from "../ClosedTradeChartShare";
import { getPriceHistory } from "../../api/priceHistory";

vi.mock("../../api/priceHistory", () => ({
  getPriceHistory: vi.fn(),
}));

vi.mock("../OpenTradeSignalCards", () => ({
  TradeShareDialog: ({ candles, open, trade, variant }) =>
    React.createElement(
      "div",
      { role: "dialog", "aria-label": "Share closed trade" },
      `${trade.symbol} · ${candles.length} candles · ${variant} · ${open}`,
    ),
}));

describe("ClosedTradeChartShare", () => {
  beforeEach(() => {
    getPriceHistory.mockResolvedValue({
      data: [
        { time: 1_797_000_000, open: 100, high: 103, low: 99, close: 102 },
        { time: 1_797_000_900, open: 102, high: 104, low: 100, close: 101 },
      ],
    });
  });

  afterEach(() => {
    cleanup();
    vi.clearAllMocks();
  });

  test("requests historical candles around entry and exit for the shared preview", async () => {
    const trade = {
      symbol: "BTCUSDT",
      side: "long",
      entry_price: 100,
      exit_price: 102,
      pnl: 12.5,
      opened_at: "2026-10-20T12:00:00Z",
      closed_at: "2026-10-20T13:00:00Z",
    };
    const startTime = Date.parse(trade.opened_at) - 10 * 15 * 60_000;
    const endTime = Date.parse(trade.closed_at) + 10 * 15 * 60_000;

    render(<ClosedTradeChartShare trade={trade} onClose={vi.fn()} />);

    expect(await screen.findByRole("dialog", { name: "Share closed trade" })).toHaveTextContent(
      "BTCUSDT · 2 candles · closed · true",
    );
    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenCalledWith("BTCUSDT", "15m", 25, {
        startTime,
        endTime,
      });
    });
  });

  test("includes every candle intersecting the trade and ten full candles on each side", async () => {
    const trade = {
      symbol: "BTCUSDT",
      opened_at: "2026-10-20T12:07:00Z",
      closed_at: "2026-10-20T13:02:00Z",
    };
    const interval = 15 * 60_000;
    const openCandleTime = Math.floor(Date.parse(trade.opened_at) / interval) * interval;
    const closeCandleTime =
      Math.floor(Date.parse(trade.closed_at) / interval) * interval;

    render(<ClosedTradeChartShare trade={trade} onClose={vi.fn()} />);

    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenCalledWith("BTCUSDT", "15m", 25, {
        startTime: openCandleTime - 10 * interval,
        endTime: closeCandleTime + 10 * interval,
      });
    });
  });
});
