import React from "react";
import {
  cleanup,
  act,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, describe, expect, test, vi } from "vitest";
import OpenTradeSignalCards from "../OpenTradeSignalCards";
import { TradeShareDialog } from "../OpenTradeSignalCards";
import { getPriceHistory } from "../../api/priceHistory";
import {
  TRADE_SIGNAL_ATR_TIMEFRAME,
  TRADE_SIGNAL_CHART_CANDLE_LIMIT,
  TRADE_SIGNAL_CHART_TIMEFRAME,
  TRADE_SIGNAL_EXPANDED_CHART_CANDLE_LIMIT,
} from "../../utils/tradeSignalMetrics";

const chartMocks = vi.hoisted(() => ({
  createChart: vi.fn(),
  createPriceLine: vi.fn(),
  setData: vi.fn(),
  fitContent: vi.fn(),
  remove: vi.fn(),
  createSeriesMarkers: vi.fn(),
  seriesOptions: vi.fn(),
  takeScreenshot: vi.fn(() => document.createElement("canvas")),
}));

vi.mock("../../api/priceHistory", () => ({
  getPriceHistory: vi.fn(),
}));

vi.mock("lightweight-charts", () => ({
  CandlestickSeries: {},
  ColorType: { Solid: "solid" },
  CrosshairMode: { Normal: 0 },
  LineStyle: { Dashed: 2 },
  TickMarkType: {
    Year: 0,
    Month: 1,
    DayOfMonth: 2,
    Time: 3,
    TimeWithSeconds: 4,
  },
  createChart: chartMocks.createChart.mockImplementation(() => ({
    addSeries: vi.fn((_, options) => {
      chartMocks.seriesOptions(options);
      return {
        setData: chartMocks.setData,
        createPriceLine: chartMocks.createPriceLine,
      };
    }),
    timeScale: () => ({ fitContent: chartMocks.fitContent }),
    remove: chartMocks.remove,
    takeScreenshot: chartMocks.takeScreenshot,
  })),
  createSeriesMarkers: chartMocks.createSeriesMarkers,
}));

function mockShareCanvas() {
  let imageNumber = 0;
  const context = {
    beginPath: vi.fn(),
    closePath: vi.fn(),
    fill: vi.fn(),
    fillRect: vi.fn(),
    fillText: vi.fn(),
    lineTo: vi.fn(),
    moveTo: vi.fn(),
    quadraticCurveTo: vi.fn(),
    stroke: vi.fn(),
    drawImage: vi.fn(),
    createRadialGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
    createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })),
  };
  const getContextSpy = vi
    .spyOn(HTMLCanvasElement.prototype, "getContext")
    .mockReturnValue(context);
  const originalToDataURL = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    "toDataURL",
  );
  const originalToBlob = Object.getOwnPropertyDescriptor(
    HTMLCanvasElement.prototype,
    "toBlob",
  );
  Object.defineProperty(HTMLCanvasElement.prototype, "toDataURL", {
    configurable: true,
    value: () => `data:image/png;base64,preview-${++imageNumber}`,
  });
  Object.defineProperty(HTMLCanvasElement.prototype, "toBlob", {
    configurable: true,
    value: (callback) => callback(null),
  });

  return {
    context,
    restore() {
      getContextSpy.mockRestore();
      for (const [name, descriptor] of [
        ["toDataURL", originalToDataURL],
        ["toBlob", originalToBlob],
      ]) {
        if (descriptor) {
          Object.defineProperty(HTMLCanvasElement.prototype, name, descriptor);
        } else {
          delete HTMLCanvasElement.prototype[name];
        }
      }
    },
  };
}

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  window.localStorage.removeItem("openTradeSignalChartMode");
});

describe("OpenTradeSignalCards", () => {
  test("shows persistent trade cards with projection and ATR-based SL margin", async () => {
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        time: 1_792_000_000 + index * 180,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    const { rerender } = render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            unrealizedProfit: "42.5",
            take_profit_target: {
              tp_price: 110,
              ratio: 2.5,
            },
          },
        ]}
      />,
    );

    expect(
      screen.getByRole("region", { name: "Open trade signals" }),
    ).toBeInTheDocument();
    expect(
      await screen.findByRole("article", { name: "BTCUSDT LONG" }),
    ).toBeInTheDocument();
    expect(screen.getByText("+10.00%")).toBeInTheDocument();
    expect(screen.getByText("2.5R")).toBeInTheDocument();
    expect(screen.getByRole("group", { name: "BOT PNL" })).toHaveTextContent(
      "+42.50 USDT",
    );
    const projectedMove = screen.getByRole("group", { name: "Projected move" });
    expect(projectedMove.textContent).not.toContain("110");
    expect(projectedMove.parentElement).toHaveClass(
      "open-trade-signal-card__header",
    );
    expect(
      projectedMove.parentElement.querySelector(".open-trade-signal-card__live"),
    ).toBeInTheDocument();
    expect(screen.queryByText("TP projection")).not.toBeInTheDocument();
    expect(screen.queryByText("Wide · 2+ ATR")).not.toBeInTheDocument();
    const chart = await screen.findByRole("img", {
      name: "TradingView chart for BTCUSDT",
    });
    expect(chart).toBeInTheDocument();
    expect(
      screen.queryByRole("group", { name: "Trade levels" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Our chart" }),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "TradingView" }),
    ).not.toBeInTheDocument();

    expect(screen.queryByRole("meter", { name: "SL buffer" })).toBeNull();
    expect(screen.queryByText("This margin score is not a probability of profit.")).toBeNull();
    expect(getPriceHistory).toHaveBeenCalledWith(
      "BTCUSDT",
      TRADE_SIGNAL_ATR_TIMEFRAME,
      60,
    );
    expect(getPriceHistory).toHaveBeenCalledWith(
      "BTCUSDT",
      TRADE_SIGNAL_CHART_TIMEFRAME,
      TRADE_SIGNAL_CHART_CANDLE_LIMIT,
    );

    rerender(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: {
              tp_price: 110,
              ratio: 2.5,
            },
          },
        ]}
      />,
    );
    expect(screen.getByRole("article", { name: "BTCUSDT LONG" })).toBeInTheDocument();
    expect(getPriceHistory).toHaveBeenCalledTimes(2);
  });

  test("only shows recommendations with a stop buffer of at least 2 ATR", async () => {
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        time: 1_792_000_000 + index * 180,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "ETHUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 98,
            take_profit_target: { tp_price: 110 },
          },
          {
            symbol: "SOLUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 99,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    await waitFor(() => {
      expect(screen.getByRole("article", { name: "ETHUSDT LONG" })).toBeInTheDocument();
    });
    expect(screen.queryByRole("article", { name: "SOLUSDT LONG" })).not.toBeInTheDocument();
    expect(
      screen.getByRole("status", { name: "1 open trade signals" }),
    ).toBeInTheDocument();
  });

  test("refreshes the live chart candles periodically", async () => {
    window.localStorage.setItem("openTradeSignalChartMode", "tradingview");
    const interval = {};
    const setIntervalSpy = vi
      .spyOn(window, "setInterval")
      .mockImplementation((callback, delay) => {
        if (delay === 30_000) interval.callback = callback;
        return 1;
      });
    const clearIntervalSpy = vi
      .spyOn(window, "clearInterval")
      .mockImplementation(() => {});
    let chartRequestCount = 0;
    getPriceHistory.mockImplementation(async (_symbol, timeframe) => {
      const currentChartPrice =
        timeframe === TRADE_SIGNAL_CHART_TIMEFRAME
          ? 100 + chartRequestCount++ * 20
          : 100;
      return {
        data: Array.from({ length: 20 }, (_, index) => ({
          time: 1_792_000_000 + index * (timeframe === "3m" ? 180 : 900),
          open: currentChartPrice + index * 0.1,
          high: currentChartPrice + index * 0.1 + 0.5,
          low: currentChartPrice + index * 0.1 - 0.5,
          close: currentChartPrice + index * 0.1,
        })),
      };
    });
    chartMocks.setData.mockClear();
    chartMocks.createChart.mockClear();

    try {
      render(
        <OpenTradeSignalCards
          trades={[
            {
              symbol: "LIVEUSDT",
              side: "LONG",
              entry_price: 100,
              initial_stop: 96,
              take_profit_target: { tp_price: 110 },
            },
          ]}
        />,
      );
      await screen.findByRole("img", { name: "TradingView chart for LIVEUSDT" });
      await waitFor(() => expect(chartMocks.setData).toHaveBeenCalledTimes(1));

      await act(async () => {
        await interval.callback();
      });

      expect(getPriceHistory).toHaveBeenCalledTimes(3);
      expect(chartMocks.setData).toHaveBeenCalledTimes(2);
      expect(chartMocks.createChart).toHaveBeenCalledTimes(1);
      expect(chartMocks.setData.mock.calls.at(-1)[0].at(-1).close).toBe(121.9);
    } finally {
      cleanup();
      setIntervalSpy.mockRestore();
      clearIntervalSpy.mockRestore();
    }
  });

  test("does not show a recommendation when ATR data is unavailable", async () => {
    getPriceHistory.mockResolvedValue({ data: [] });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "ADAUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 98,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    expect(
      await screen.findByText(
        "Could not evaluate some positions because ATR market data is unavailable.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "ADAUSDT LONG" }),
    ).not.toBeInTheDocument();
  });

  test("opens the share preview and allows selecting a background style", async () => {
    window.localStorage.setItem("openTradeSignalChartMode", "tradingview");
    const canvas = mockShareCanvas();
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        open: 99 + index,
        high: 102 + index,
        low: 98 + index,
        close: 100 + index,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 92,
            unrealizedProfit: 12.34,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    try {
      fireEvent.click(await screen.findByRole("button", { name: "Share" }));
      expect(
        await screen.findByRole("dialog", {
          name: "Share BTCUSDT trade setup",
        }),
      ).toBeInTheDocument();
      const preview = await screen.findByRole("img", {
        name: "Share BTCUSDT trade setup",
      });
      await waitFor(() =>
        expect(preview).toHaveAttribute(
          "src",
          "data:image/png;base64,preview-1",
        ),
      );

      const moonshotStyle = screen.getByRole("button", { name: "Moon mission" });
      fireEvent.click(moonshotStyle);
      expect(moonshotStyle).toHaveAttribute("aria-pressed", "true");
      await waitFor(() =>
        expect(canvas.context.createLinearGradient).toHaveBeenCalledTimes(2),
      );
      expect(canvas.context.fillText).toHaveBeenCalledWith(
        "+12.34 USDT",
        996,
        1032,
      );
      const pnlToggle = screen.getByRole("checkbox", {
        name: "Include bot PnL in image",
      });
      canvas.context.fillText.mockClear();
      canvas.context.createLinearGradient.mockClear();
      fireEvent.click(pnlToggle);
      await waitFor(() =>
        expect(canvas.context.createLinearGradient).toHaveBeenCalled(),
      );
      expect(canvas.context.fillText).not.toHaveBeenCalledWith(
        "+12.34 USDT",
        996,
        1032,
      );
      expect(
        await screen.findByRole("img", { name: "Share BTCUSDT trade setup" }),
      ).toHaveAttribute("src", expect.stringContaining("preview-"));
    } finally {
      canvas.restore();
    }
  });

  test("uses the selected TradingView chart in the share preview and captures it for export", async () => {
    window.localStorage.setItem("openTradeSignalChartMode", "tradingview");
    chartMocks.takeScreenshot.mockClear();
    const canvas = mockShareCanvas();
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        time: 1_792_000_000 + index * 900,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    fireEvent.click(await screen.findByRole("button", { name: "Share" }));
    expect(
      await screen.findByRole("dialog", { name: "Share BTCUSDT trade setup" }),
    ).toBeInTheDocument();
    try {
      const preview = await screen.findByRole("img", {
        name: "Share BTCUSDT trade setup",
      });
      await waitFor(() =>
        expect(preview).toHaveAttribute(
          "src",
          "data:image/png;base64,preview-1",
        ),
      );
      const liveChart = document.querySelector(
        ".trade-share-chart-overlay [role='img']",
      );
      expect(liveChart).toBeInTheDocument();
      expect(liveChart.closest(".trade-share-preview")).toBeInTheDocument();
      expect(liveChart.closest("[aria-hidden='true']")).toBeNull();
      fireEvent.click(screen.getByRole("button", { name: "Moon mission" }));
      fireEvent.click(screen.getByRole("button", { name: "Download image" }));
      await waitFor(() => {
        expect(chartMocks.takeScreenshot).toHaveBeenCalled();
        expect(canvas.context.createLinearGradient).toHaveBeenCalled();
        expect(canvas.context.drawImage).toHaveBeenCalledWith(
          chartMocks.takeScreenshot.mock.results.at(-1).value,
          108,
          408,
          864,
          490,
        );
      });
      const imageText = canvas.context.fillText.mock.calls.map(([text]) =>
        String(text),
      );
      expect(imageText).not.toContain("SL BUFFER");
      expect(imageText).not.toContain("100/100");
    } finally {
      canvas.restore();
    }
  });

  test("uses the same background preview and download composer for closed trades", async () => {
    const canvas = mockShareCanvas();
    chartMocks.createSeriesMarkers.mockClear();
    const entryTime = 1_797_000_000;
    const trade = {
      symbol: "BTCUSDT",
      side: "LONG",
      entry_price: 100,
      exit_price: 102,
      pnl: 12.34,
      opened_at: new Date(entryTime * 1000).toISOString(),
      closed_at: new Date((entryTime + 900) * 1000).toISOString(),
    };
    const candles = [
      { time: entryTime - 900, open: 99, high: 101, low: 98, close: 100 },
      { time: entryTime, open: 100, high: 103, low: 99, close: 102 },
      { time: entryTime + 900, open: 102, high: 104, low: 100, close: 101 },
      { time: entryTime + 1800, open: 101, high: 103, low: 100, close: 102 },
    ];
    try {
      render(
        <TradeShareDialog
          trade={trade}
          candles={candles}
          chartMode="tradingview"
          chartInstanceRef={{ current: null }}
          open
          onClose={vi.fn()}
          variant="closed"
        />,
      );
      expect(
        await screen.findByRole("dialog", {
          name: "Share BTCUSDT closed trade",
        }),
      ).toBeInTheDocument();
      expect(
        await screen.findByRole("img", {
          name: "Share BTCUSDT closed trade",
        }),
      ).toBeInTheDocument();
      const chartOptions = chartMocks.createChart.mock.calls.at(-1)[1];
      expect(
        chartOptions.timeScale.tickMarkFormatter(entryTime, 3, "en-US"),
      ).toBe(
        new Intl.DateTimeFormat("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        }).format(new Date(entryTime * 1000)),
      );
      await waitFor(() => {
        expect(chartMocks.createSeriesMarkers).toHaveBeenCalledWith(
          expect.any(Object),
          expect.arrayContaining([
            expect.objectContaining({ text: "ENTRY", time: entryTime }),
            expect.objectContaining({ text: "EXIT", time: entryTime + 900 }),
          ]),
        );
        expect(canvas.context.fillText).toHaveBeenCalledWith(
          "+12.34 USDT",
          996,
          1032,
        );
      });
      expect(
        screen.getByRole("checkbox", {
          name: "Include realized PnL in image",
        }),
      ).toBeChecked();
      const moonshot = screen.getByRole("button", { name: "Moon mission" });
      fireEvent.click(moonshot);
      expect(moonshot).toHaveAttribute("aria-pressed", "true");
      await waitFor(() =>
        expect(canvas.context.createLinearGradient).toHaveBeenCalledTimes(2),
      );
    } finally {
      canvas.restore();
    }
  });

  test("uses TradingView only and keeps trade levels on the chart without level boxes", async () => {
    chartMocks.createPriceLine.mockClear();
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        time: 1_792_000_000 + index * 180,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    expect(
      await screen.findByRole("img", {
        name: "TradingView chart for BTCUSDT",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Our chart" })).toBeNull();
    expect(screen.queryByRole("button", { name: "TradingView" })).toBeNull();
    await waitFor(() => {
      expect(chartMocks.createPriceLine).toHaveBeenCalledTimes(3);
    });
    expect(chartMocks.setData).toHaveBeenCalledWith(
      expect.arrayContaining([
        expect.objectContaining({ time: 1_792_000_000, open: 99.5 }),
      ]),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 100,
        title: "ENTRY",
        axisLabelVisible: true,
      }),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 96,
        title: "SL",
        axisLabelVisible: true,
      }),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 110,
        title: "TP",
        axisLabelVisible: true,
      }),
    );
    expect(
      screen.queryByRole("group", { name: "Trade levels" }),
    ).not.toBeInTheDocument();
  });

  test("ignores the legacy custom chart preference and always uses TradingView", async () => {
    window.localStorage.setItem("openTradeSignalChartMode", "custom");
    getPriceHistory.mockResolvedValue({ data: [] });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    expect(
      await screen.findByRole("img", {
        name: "TradingView chart for BTCUSDT",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Our chart" })).toBeNull();
    expect(screen.queryByRole("button", { name: "TradingView" })).toBeNull();
  });

  test("loads more candles when expanding the TradingView chart", async () => {
    window.localStorage.setItem("openTradeSignalChartMode", "tradingview");
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 30 }, (_, index) => ({
        time: 1_792_000_000 + index * 900,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );

    await screen.findByRole("img", { name: "TradingView chart for BTCUSDT" });
    fireEvent.click(screen.getByRole("button", { name: "Expand chart" }));
    expect(
      await screen.findByRole("dialog", {
        name: "BTCUSDT · 15m candles and trade levels",
      }),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenCalledWith(
        "BTCUSDT",
        TRADE_SIGNAL_CHART_TIMEFRAME,
        TRADE_SIGNAL_EXPANDED_CHART_CANDLE_LIMIT,
      );
    });
  });

  test("recreates TradingView charts with the active theme colors", async () => {
    const root = document.documentElement;
    const previousGreen = root.style.getPropertyValue("--green");
    const previousPalette = root.dataset.palette;
    window.localStorage.setItem("openTradeSignalChartMode", "tradingview");
    root.style.setProperty("--green", "#123456");
    getPriceHistory.mockResolvedValue({
      data: Array.from({ length: 20 }, (_, index) => ({
        time: 1_792_000_000 + index * 900,
        open: 99.5 + index * 0.1,
        high: 100.5 + index * 0.1,
        low: 99.5 + index * 0.1,
        close: 100 + index * 0.1,
      })),
    });

    render(
      <OpenTradeSignalCards
        trades={[
          {
            symbol: "BTCUSDT",
            side: "LONG",
            entry_price: 100,
            initial_stop: 96,
            take_profit_target: { tp_price: 110 },
          },
        ]}
      />,
    );
    await screen.findByRole("img", { name: "TradingView chart for BTCUSDT" });
    await waitFor(() => {
      expect(chartMocks.seriesOptions).toHaveBeenCalledWith(
        expect.objectContaining({ upColor: "#123456" }),
      );
    });

    root.style.setProperty("--green", "#abcdef");
    root.dataset.palette = "test-theme";
    await waitFor(() => {
      expect(chartMocks.seriesOptions).toHaveBeenLastCalledWith(
        expect.objectContaining({ upColor: "#abcdef" }),
      );
      expect(chartMocks.remove).toHaveBeenCalled();
    });
    if (previousGreen) root.style.setProperty("--green", previousGreen);
    else root.style.removeProperty("--green");
    if (previousPalette) root.dataset.palette = previousPalette;
    else delete root.dataset.palette;
  });

  test("shows an empty state when there are no open trades", () => {
    render(<OpenTradeSignalCards trades={[]} />);

    expect(
      screen.getByText("There are no open bot positions right now."),
    ).toBeInTheDocument();
  });
});
