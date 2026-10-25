import React from "react";
import {
  render,
  screen,
  fireEvent,
  createEvent,
  act,
} from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import EquityChart, { EquityChartTooltip } from "../EquityChart";
import {
  buildEquityDrawdownData,
  getWheelZoomRange,
  panEquityRange,
  panEquityRangeByPixels,
  remapEquityRange,
} from "../equityChartUtils";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("EquityChart", () => {
  const mockOperations = [
    {
      closed_at: "2024-01-01T10:00:00Z",
      pnl: 100,
      symbol: "BTCUSDT",
    },
    {
      closed_at: "2024-01-02T10:00:00Z",
      pnl: -50,
      symbol: "ETHUSDT",
    },
    {
      closed_at: "2024-01-03T10:00:00Z",
      pnl: 75,
      symbol: "ADAUSDT",
    },
  ];

  test("calculates drawdown as the loss from the previous equity peak", () => {
    const data = buildEquityDrawdownData(
      [
        { closed_at: "2024-01-01T10:00:00Z", pnl: 100 },
        { closed_at: "2024-01-02T10:00:00Z", pnl: -50 },
        { closed_at: "2024-01-03T10:00:00Z", pnl: 75 },
        { closed_at: "2024-01-04T10:00:00Z", pnl: -200 },
      ],
      "Start",
    );

    expect(data.map(({ equity, drawdown }) => ({ equity, drawdown }))).toEqual([
      { equity: 0, drawdown: 0 },
      { equity: 100, drawdown: 0 },
      { equity: 50, drawdown: -50 },
      { equity: 125, drawdown: 0 },
      { equity: -75, drawdown: -200 },
    ]);
  });

  test("renders equity chart with title", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      screen.getByText(/This chart shows your cumulative profit and loss/)
    ).toBeInTheDocument();
  });

  test("renders message when no operations", () => {
    renderWithTheme(<EquityChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display equity curve.")
    ).toBeInTheDocument();
  });

  test("renders message when operations is null", () => {
    renderWithTheme(<EquityChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display equity curve.")
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("does not render the brush navigator", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    expect(document.querySelector(".recharts-brush")).not.toBeInTheDocument();
  });

  test("wheel zooms in and out around the cursor index", () => {
    const currentRange = { start: 20, end: 80 };

    const zoomedIn = getWheelZoomRange(currentRange, 50, -1, 100);
    const zoomedOut = getWheelZoomRange(zoomedIn, 50, 1, 100);

    expect(zoomedIn.end - zoomedIn.start + 1).toBeLessThan(
      currentRange.end - currentRange.start + 1,
    );
    expect(zoomedIn.start).toBeLessThan(50);
    expect(zoomedIn.end).toBeGreaterThan(50);
    expect(zoomedOut.end - zoomedOut.start + 1).toBeGreaterThan(
      zoomedIn.end - zoomedIn.start + 1,
    );
    expect(getWheelZoomRange({ start: 0, end: 79 }, 50, 1, 100)).toEqual({
      start: 0,
      end: 99,
    });
  });

  test("drag panning preserves the selected span and clamps to dataset bounds", () => {
    expect(panEquityRange({ start: 20, end: 40 }, -8, 100)).toEqual({
      start: 12,
      end: 32,
    });
    expect(panEquityRange({ start: 20, end: 40 }, -50, 100)).toEqual({
      start: 0,
      end: 20,
    });
    expect(panEquityRange({ start: 70, end: 90 }, 50, 100)).toEqual({
      start: 79,
      end: 99,
    });
  });

  test("pixel-based pan uses the original pointer position without cumulative drift", () => {
    const initialRange = { start: 20, end: 60 };
    const firstMove = panEquityRangeByPixels(initialRange, -40, 800, 100);
    const secondMove = panEquityRangeByPixels(initialRange, -80, 800, 100);

    expect(firstMove).toEqual({ start: 18, end: 58 });
    expect(secondMove).toEqual({ start: 16, end: 56 });
    expect(
      panEquityRangeByPixels(initialRange, 800, 800, 100),
    ).toEqual({ start: 59, end: 99 });
  });

  test("pixel-based pan moves a single-point range", () => {
    expect(
      panEquityRangeByPixels({ start: 4, end: 4 }, 100, 800, 10),
    ).toEqual({ start: 5, end: 5 });
  });

  test("drag starts anywhere in the chart plot and tracks the pointer", () => {
    const originalResizeObserver = global.ResizeObserver;
    const originalRequestAnimationFrame = window.requestAnimationFrame;
    const originalCancelAnimationFrame = window.cancelAnimationFrame;
    const scheduledFrames = new Map();
    let nextFrameId = 1;
    window.requestAnimationFrame = vi.fn((callback) => {
      const frameId = nextFrameId++;
      scheduledFrames.set(frameId, callback);
      return frameId;
    });
    window.cancelAnimationFrame = vi.fn((frameId) => {
      scheduledFrames.delete(frameId);
    });
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 416 } }]);
      }

      unobserve() {}
      disconnect() {}
    };

    try {
      renderWithTheme(
        <EquityChart
          operations={[
            { closed_at: "2024-01-01T10:00:00Z", pnl: 10, symbol: "BTCUSDT" },
            { closed_at: "2024-01-03T10:00:00Z", pnl: 15, symbol: "ETHUSDT" },
            { closed_at: "2024-01-05T10:00:00Z", pnl: -5, symbol: "ADAUSDT" },
            { closed_at: "2024-01-07T10:00:00Z", pnl: 20, symbol: "SOLUSDT" },
          ]}
        />,
      );
      fireEvent.click(screen.getByRole("button", { name: "All" }));

      const chartSurface = document.querySelector(".MuiPaper-root");
      const chartWrapper = chartSurface.querySelector(".recharts-wrapper");
      const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
      svg.classList.add("recharts-surface");
      chartWrapper.prepend(svg);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      svg.append(path);
      svg.addEventListener("pointerdown", (event) => event.stopPropagation());
      vi.spyOn(svg, "getBoundingClientRect").mockReturnValue({
        left: 100,
        right: 900,
        top: 100,
        bottom: 500,
        width: 800,
        height: 400,
      });

      const createPointerEvent = (type, target, properties = {}) => {
        const event = new Event(type, { bubbles: true, cancelable: true });
        Object.defineProperties(event, {
          pointerId: { value: 1 },
          pointerType: { value: "mouse" },
          button: { value: 0 },
          ...Object.fromEntries(
            Object.entries(properties).map(([key, value]) => [
              key,
              { value },
            ]),
          ),
        });
        target.dispatchEvent(event);
        return event;
      };

      const pointerTarget = svg.querySelector("path") || svg;
      let pointerDown;
      act(() => {
        pointerDown = createPointerEvent("pointerdown", pointerTarget, {
          clientX: 500,
          clientY: 300,
        });
      });

      expect(pointerDown.defaultPrevented).toBe(true);
      expect(getComputedStyle(svg).cursor).toBe("grabbing");
      expect(
        document.querySelector(".recharts-tooltip-wrapper"),
      ).toHaveStyle({ visibility: "hidden" });

      let pointerMove;
      const scheduledFramesBeforeMoves =
        window.requestAnimationFrame.mock.calls.length;
      act(() => {
        pointerMove = createPointerEvent("pointermove", window, {
          clientX: 400,
          clientY: 300,
        });
        createPointerEvent("pointermove", window, {
          clientX: 300,
          clientY: 300,
        });
      });
      expect(pointerMove.defaultPrevented).toBe(true);
      expect(window.requestAnimationFrame).toHaveBeenCalledTimes(
        scheduledFramesBeforeMoves + 1,
      );
      expect(screen.getByRole("button", { name: "1d" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );

      act(() => {
        createPointerEvent("pointerup", window);
      });
      expect(getComputedStyle(svg).cursor).toBe("grab");
      expect(
        document.querySelector(".recharts-tooltip-wrapper"),
      ).toHaveStyle({ visibility: "hidden" });
      expect(chartSurface).toContainElement(svg);
    } finally {
      global.ResizeObserver = originalResizeObserver;
      window.requestAnimationFrame = originalRequestAnimationFrame;
      window.cancelAnimationFrame = originalCancelAnimationFrame;
    }
  });

  test("remaps a custom range to matching dates when chart data changes", () => {
    const previousData = [
      { date: "2024-01-01T00:00:00Z" },
      { date: "2024-01-02T00:00:00Z" },
      { date: "2024-01-03T00:00:00Z" },
      { date: "2024-01-04T00:00:00Z" },
      { date: "2024-01-05T00:00:00Z" },
      { date: "2024-01-06T00:00:00Z" },
      { date: "2024-01-07T00:00:00Z" },
    ];
    const nextData = [
      { date: "2024-01-01T00:00:00Z" },
      { date: "2024-01-02T00:00:00Z" },
      { date: "2024-01-03T00:00:00Z" },
      { date: "2024-01-04T00:00:00Z" },
      { date: "2024-01-06T00:00:00Z" },
      { date: "2024-01-07T00:00:00Z" },
      { date: "2024-01-08T00:00:00Z" },
    ];

    expect(
      remapEquityRange({ start: 2, end: 5 }, previousData, nextData),
    ).toEqual({ start: 2, end: 4 });
  });

  test("mouse wheel prevents page scrolling and switches to a custom range", () => {
    const originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 416 } }]);
      }

      unobserve() {}
      disconnect() {}
    };

    try {
    renderWithTheme(<EquityChart operations={mockOperations} />);
    fireEvent.click(screen.getByRole("button", { name: "All" }));

    const chartSvg = document.querySelector(
      ".recharts-wrapper > svg.recharts-surface",
    );
    chartSvg.addEventListener("wheel", (event) => event.stopPropagation());
    const wheelEvent = createEvent.wheel(chartSvg, {
      deltaY: -100,
      bubbles: true,
      cancelable: true,
    });
    fireEvent(chartSvg, wheelEvent);

    expect(wheelEvent.defaultPrevented).toBe(true);
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
    } finally {
      global.ResizeObserver = originalResizeObserver;
    }
  });

  test("range buttons and wheel zoom update the plotted data", () => {
    const originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 416 } }]);
      }

      unobserve() {}
      disconnect() {}
    };

    try {
      renderWithTheme(<EquityChart operations={mockOperations} />);
      const chartSvg = document.querySelector(
        ".recharts-wrapper > svg.recharts-surface",
      );
      const getCurvePath = () =>
        chartSvg.querySelector(".recharts-line-curve")?.getAttribute("d");
      const oneDayPath = getCurvePath();

      fireEvent.click(screen.getByRole("button", { name: "All" }));
      const allRangePath = getCurvePath();
      expect(allRangePath).not.toBe(oneDayPath);

      fireEvent.wheel(chartSvg, { deltaY: -100, bubbles: true, cancelable: true });
      const zoomedPath = getCurvePath();
      expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
        "aria-pressed",
        "false",
      );
      expect(
        screen.getByRole("button", { name: "Custom" }),
      ).toHaveAttribute("aria-pressed", "true");
      expect(zoomedPath).not.toBe(allRangePath);

      fireEvent.click(screen.getByRole("button", { name: "1d" }));
      expect(screen.getByRole("button", { name: "1d" })).toHaveAttribute(
        "aria-pressed",
        "true",
      );
      expect(
        screen.queryByRole("button", { name: "Custom" }),
      ).not.toBeInTheDocument();
      expect(getCurvePath()).not.toBe(zoomedPath);
    } finally {
      global.ResizeObserver = originalResizeObserver;
    }
  });

  test("shows the chart tooltip only after the pointer stays still", () => {
    const originalResizeObserver = global.ResizeObserver;
    global.ResizeObserver = class {
      constructor(callback) {
        this.callback = callback;
      }

      observe() {
        this.callback([{ contentRect: { width: 800, height: 416 } }]);
      }

      unobserve() {}
      disconnect() {}
    };
    vi.useFakeTimers();

    try {
      renderWithTheme(<EquityChart operations={mockOperations} />);
      const chartSurface = document.querySelector(".MuiPaper-root");
      const chartWrapper = document.querySelector(".recharts-wrapper");
      const chartSvg = chartWrapper.querySelector(
        ":scope > svg.recharts-surface",
      );
      vi.spyOn(chartWrapper, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 800,
        top: 0,
        bottom: 416,
        width: 800,
        height: 416,
      });
      vi.spyOn(chartSvg, "getBoundingClientRect").mockReturnValue({
        left: 0,
        right: 800,
        top: 0,
        bottom: 416,
        width: 800,
        height: 416,
      });
      fireEvent.click(screen.getByRole("button", { name: "All" }));

      fireEvent.mouseMove(chartSvg, { clientX: 400, clientY: 150 });
      expect(chartSurface).toHaveAttribute("data-tooltip-ready", "false");
      act(() => {
        vi.advanceTimersByTime(349);
      });
      expect(
        document.querySelector(".recharts-tooltip-wrapper"),
      ).toHaveStyle({ visibility: "hidden" });
      act(() => {
        vi.advanceTimersByTime(1);
      });
      expect(chartSurface).toHaveAttribute("data-tooltip-ready", "true");
    } finally {
      vi.useRealTimers();
      global.ResizeObserver = originalResizeObserver;
    }
  });

  test("mouse wheel remains contained when the chart reaches its zoom limit", () => {
    renderWithTheme(
      <EquityChart
        operations={[
          { closed_at: "2024-01-01T10:00:00Z", pnl: 25, symbol: "BTCUSDT" },
          { closed_at: "2024-01-01T11:00:00Z", pnl: -5, symbol: "ETHUSDT" },
        ]}
      />,
    );

    const chartSurface = document.querySelector(".MuiPaper-root");
    let lastWheelEvent;
    for (let index = 0; index < 5; index += 1) {
      lastWheelEvent = createEvent.wheel(chartSurface, {
        deltaY: -100,
        bubbles: true,
        cancelable: true,
      });
      fireEvent(chartSurface, lastWheelEvent);
    }

    expect(lastWheelEvent.defaultPrevented).toBe(true);
  });

  test("tooltip shows date, equity, drawdown, symbol, and trade pnl", () => {
    const translate = (key, options) =>
      key === "analyticsCharts.dateWithValue"
        ? `Date: ${options.date}`
        : {
            "analyticsCharts.equityLabel": "Equity",
            "analyticsCharts.drawdown": "Drawdown",
            "analyticsCharts.tradeSymbol": "Symbol",
            "analyticsCharts.tradePnl": "Trade PnL",
          }[key];

    render(
      <EquityChartTooltip
        active
        label="2024-01-02T10:00:00Z"
        currency="USDT"
        timeZone="UTC"
        t={translate}
        payload={[
          {
            dataKey: "equity",
            value: 50,
            payload: {
              equity: 50,
              drawdown: -25,
              pnl: -25,
              symbol: "ETHUSDT",
            },
          },
          {
            dataKey: "drawdown",
            value: -25,
            payload: {
              equity: 50,
              drawdown: -25,
              pnl: -25,
              symbol: "ETHUSDT",
            },
          },
        ]}
      />,
    );

    expect(screen.getByText(/Date: 02\/01\/24/)).toBeInTheDocument();
    expect(screen.getByText("Equity")).toBeInTheDocument();
    expect(screen.getByText("Drawdown")).toBeInTheDocument();
    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    expect(screen.getByText("Trade PnL")).toBeInTheDocument();
  });

  test("tooltip is hidden when it is inactive or has no data", () => {
    const { container, rerender } = render(
      <EquityChartTooltip active={false} payload={[]} />,
    );

    expect(container).toBeEmptyDOMElement();

    rerender(<EquityChartTooltip active payload={[]} />);

    expect(container).toBeEmptyDOMElement();
  });

  test("renders without drawdown when showDrawdown is false", () => {
    renderWithTheme(
      <EquityChart operations={mockOperations} showDrawdown={false} />
    );

    expect(screen.getByText("Equity Curve")).toBeInTheDocument();
    expect(
      screen.queryByText(/This chart shows your cumulative profit and loss/)
    ).not.toBeInTheDocument();
  });

  test("handles operations with closeTime instead of closed_at", () => {
    const operationsWithCloseTime = [
      {
        closeTime: "2024-01-01T10:00:00Z",
        pnl: 100,
        symbol: "BTCUSDT",
      },
      {
        closeTime: "2024-01-02T10:00:00Z",
        pnl: -50,
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithCloseTime} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with string pnl values", () => {
    const operationsWithStringPnl = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: "100",
        symbol: "BTCUSDT",
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: "-50.5",
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithStringPnl} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations without closed_at or closeTime", () => {
    const operationsWithoutCloseDate = [
      {
        pnl: 100,
        symbol: "BTCUSDT",
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: -50,
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithoutCloseDate} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles checkbox interactions", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    // Encontrar y hacer click en los checkboxes
    const checkboxes = screen.getAllByRole("checkbox");
    expect(checkboxes.length).toBeGreaterThan(0);

    // Hacer click en el primer checkbox
    if (checkboxes.length > 0) {
      fireEvent.click(checkboxes[0]);
      expect(checkboxes[0]).toBeInTheDocument();
    }
  });

  test("handles operations with zero pnl", () => {
    const operationsWithZeroPnl = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 0,
        symbol: "BTCUSDT",
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: 0,
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithZeroPnl} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with missing pnl", () => {
    const operationsWithMissingPnl = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        symbol: "BTCUSDT",
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: 100,
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithMissingPnl} />);

    expect(screen.getByText("Equity Curve & Drawdown")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("shows 3d button when history covers at least 3 days", () => {
    const operationsWithFourDays = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 10,
        symbol: "BTCUSDT",
      },
      {
        closed_at: "2024-01-05T10:00:00Z",
        pnl: 20,
        symbol: "ETHUSDT",
      },
    ];

    renderWithTheme(<EquityChart operations={operationsWithFourDays} />);

    expect(screen.getByRole("button", { name: "3d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "1d" })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  test("hides ranges that exceed available history", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    expect(screen.getByRole("button", { name: "1d" })).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "3d" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "7d" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "30d" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "90d" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });

  test("selects the 1d range by default", () => {
    renderWithTheme(<EquityChart operations={mockOperations} />);

    expect(screen.getByRole("button", { name: "1d" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toHaveAttribute(
      "aria-pressed",
      "false",
    );
  });

  test("keeps the 1d range available when history is shorter than one day", () => {
    renderWithTheme(
      <EquityChart
        operations={[
          { closed_at: "2024-01-01T10:00:00Z", pnl: 25, symbol: "BTCUSDT" },
        ]}
      />,
    );

    expect(screen.getByRole("button", { name: "1d" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    expect(screen.getByRole("button", { name: "All" })).toBeInTheDocument();
  });
});
