import React from "react";
import { render, screen, waitFor } from "@testing-library/react";
import OpenTradeChart from "../OpenTradeChart";
import { getPriceHistory } from "../../api/priceHistory";

const chartMocks = vi.hoisted(() => ({
  createPriceLine: vi.fn(() => ({
    applyOptions: chartMocks.currentPriceLineApply,
  })),
  setData: vi.fn(),
  fitContent: vi.fn(),
  setVisibleLogicalRange: vi.fn(),
  createChart: vi.fn(),
  timeScale: vi.fn(),
  seriesOptions: vi.fn(),
  update: vi.fn(),
  currentPriceLineApply: vi.fn(),
  remove: vi.fn(),
}));

vi.mock("../../api/priceHistory", () => ({
  getPriceHistory: vi.fn(),
}));

vi.mock("lightweight-charts", () => ({
  CandlestickSeries: {},
  ColorType: { Solid: "solid" },
  LineStyle: { Dashed: 2 },
  createChart: chartMocks.createChart.mockImplementation(() => ({
    addSeries: vi.fn((_, options) => {
      chartMocks.seriesOptions(options);
      return {
        setData: chartMocks.setData,
        update: chartMocks.update,
        createPriceLine: chartMocks.createPriceLine,
      };
    }),
    timeScale: chartMocks.timeScale.mockImplementation(() => ({
      fitContent: chartMocks.fitContent,
      setVisibleLogicalRange: chartMocks.setVisibleLogicalRange,
    })),
    remove: chartMocks.remove,
  })),
}));

describe("OpenTradeChart", () => {
  const trade = {
    symbol: "BTCUSDT",
    side: "LONG",
    entryPrice: "50000",
    markPrice: "50500",
    unrealizedProfit: "50",
    initial_stop: 49000,
    tp_price: 52000,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("shows position data and draws entry, current, stop, and calculated TP levels", async () => {
    getPriceHistory.mockResolvedValue({
      data: [
        {
          time: 1_761_000_000,
          open: 50000,
          high: 50600,
          low: 49900,
          close: 50500,
        },
      ],
    });

    render(<OpenTradeChart trade={trade} />);

    expect(screen.getByText("Floating PnL:")).toBeInTheDocument();
    expect(screen.getByText("+$50.00")).toBeInTheDocument();
    expect(
      screen.getByText(
        "Estimated level only; it is not a fixed take-profit order.",
      ),
    ).toBeInTheDocument();

    await waitFor(() => {
      expect(chartMocks.createPriceLine).toHaveBeenCalledTimes(4);
    });
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({ price: 50000, title: "Entry" }),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({ price: 50500, title: "Current" }),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({ price: 49000, title: "Stop Loss" }),
    );
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 52000,
        title: "Level TP estimate",
      }),
    );
    expect(chartMocks.createChart).toHaveBeenCalledWith(
      expect.any(HTMLElement),
      expect.objectContaining({
        rightPriceScale: expect.objectContaining({
          visible: true,
          ticksVisible: true,
          minimumWidth: 82,
        }),
        timeScale: expect.objectContaining({ rightOffset: 12 }),
      }),
    );
    expect(chartMocks.setVisibleLogicalRange).toHaveBeenCalledWith({
      from: 0,
      to: 13,
    });
  });

  test("does not fabricate stop or TP levels when the API omits them", async () => {
    getPriceHistory.mockResolvedValue({
      data: [
        {
          time: 1_761_000_000,
          open: 50000,
          high: 50600,
          low: 49900,
          close: 50500,
        },
      ],
    });

    render(
      <OpenTradeChart
        trade={{ ...trade, initial_stop: 0, tp_price: 0 }}
      />,
    );

    await waitFor(() => {
      expect(chartMocks.createPriceLine).toHaveBeenCalledTimes(2);
    });
    expect(screen.getByText("Level TP estimate:")).toBeInTheDocument();
  });

  test("uses the API's estimated TP when no fixed TP price is available", async () => {
    getPriceHistory.mockResolvedValue({
      data: [
        {
          time: 1_761_000_000,
          open: 50000,
          high: 50600,
          low: 49900,
          close: 50500,
        },
      ],
    });

    render(
      <OpenTradeChart
        trade={{ ...trade, tp_price: 0, estimated_tp_price: 53000 }}
      />,
    );

    await waitFor(() => {
      expect(chartMocks.createPriceLine).toHaveBeenCalledTimes(4);
    });
    expect(chartMocks.createPriceLine).toHaveBeenCalledWith(
      expect.objectContaining({
        price: 53000,
        title: "Level TP estimate",
      }),
    );
  });

  test("uses candle precision for small token prices instead of rounding to cents", async () => {
    getPriceHistory.mockResolvedValue({
      data: [
        {
          time: 1_761_000_000,
          open: 0.0543,
          high: 0.05452,
          low: 0.05421,
          close: 0.05447,
        },
      ],
    });

    render(
      <OpenTradeChart
        trade={{
          ...trade,
          entryPrice: "0.0543",
          markPrice: "0.05447",
          initial_stop: 0.05363,
          tp_price: 0.05601,
        }}
      />,
    );

    expect(screen.getByText("$0.0543")).toBeInTheDocument();
    expect(screen.getByText("$0.05447")).toBeInTheDocument();
    expect(screen.getByText("$0.05363")).toBeInTheDocument();
    expect(screen.getByText("$0.05601")).toBeInTheDocument();

    await waitFor(() => {
      expect(chartMocks.seriesOptions).toHaveBeenCalled();
    });
    expect(chartMocks.seriesOptions).toHaveBeenCalledWith(
      expect.objectContaining({
        priceFormat: {
          type: "price",
          precision: 5,
          minMove: 0.00001,
        },
      }),
    );
  });

  test("updates the active candle and current-price line when the live price changes", async () => {
    const currentCandleTime =
      Math.floor(Date.now() / (3 * 60 * 1000)) * (3 * 60);
    getPriceHistory.mockResolvedValue({
      data: [
        {
          time: currentCandleTime,
          open: 50000,
          high: 50600,
          low: 49900,
          close: 50500,
        },
      ],
    });

    const { rerender } = render(<OpenTradeChart trade={trade} />);
    await waitFor(() => {
      expect(chartMocks.createPriceLine).toHaveBeenCalledTimes(4);
    });
    chartMocks.update.mockClear();
    chartMocks.currentPriceLineApply.mockClear();

    rerender(<OpenTradeChart trade={{ ...trade, markPrice: "50650" }} />);

    expect(chartMocks.currentPriceLineApply).toHaveBeenCalledWith({
      price: 50650,
    });
    expect(chartMocks.update).toHaveBeenCalledWith(
      expect.objectContaining({
        open: 50000,
        high: 50650,
        low: 49900,
        close: 50650,
      }),
    );
  });
});
