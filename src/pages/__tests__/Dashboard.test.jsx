import React from "react";
import {
  render,
  screen,
  waitFor,
  act,
  fireEvent,
  within,
} from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../Dashboard";
import { getChartData, getClosedTradesPage } from "../../api/chartData";
import { getOpenTrades } from "../../api/openTrades";
import { getMomentumPairs } from "../../api/momentumPairs";
import { getConfig } from "../../api/config";
import { getCapital } from "../../api/capital";
import { getCommissionRate } from "../../api/paperBroker";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";

// Mock de las APIs
vi.mock("../../api/chartData", () => ({
  getChartData: vi.fn(),
  getClosedTradesPage: vi.fn(),
}));

vi.mock("../../api/openTrades", () => ({
  getOpenTrades: vi.fn(),
}));

vi.mock("../../api/momentumPairs", () => ({
  getMomentumPairs: vi.fn(),
}));

vi.mock("../../api/config", () => ({
  getConfig: vi.fn(),
}));

vi.mock("../../api/capital", () => ({
  getCapital: vi.fn(),
}));

vi.mock("../../api/paperBroker", () => ({
  getCommissionRate: vi.fn(),
}));

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <TimeZoneContext.Provider
          value={{ timeZone: "UTC", setTimeZone: vi.fn() }}
        >
          <SidebarContext.Provider
            value={{ sidebarWidth: 220, setSidebarWidth: vi.fn() }}
          >
            {component}
          </SidebarContext.Provider>
        </TimeZoneContext.Provider>
      </ThemeProvider>
    </BrowserRouter>
  );
};

describe("Dashboard", () => {
  const mockStats = {
    total_trades: 100,
    wins: 65,
    losses: 35,
    winrate: 65.0,
    winrates: {
      total: 65.0,
      long: 70.0,
      short: 60.0,
    },
    total_pnl: 1500.5,
    average_pnl: 15.005,
    max_win_streak: 8,
    max_loss_streak: 3,
  };

  const mockOperations = {
    closed: [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        pnl: 100,
        result: "win",
        closed_at: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        pnl: -50,
        result: "loss",
        closed_at: "2024-01-02T10:00:00Z",
      },
    ],
  };
  const mockChartData = {
    hasTrades: true,
    equity: [
      {
        date: "2024-01-01T10:00:00Z",
        equity: 100,
        drawdown: 0,
        pnl: 100,
      },
    ],
    performance: {
      total: { profitFactor: 2, winrate: 65, wins: 65, losses: 35, average: 15 },
      long: { profitFactor: 2, winrate: 70, wins: 7, losses: 3, average: 20 },
      short: { profitFactor: 2, winrate: 60, wins: 6, losses: 4, average: 10 },
    },
    stats: mockStats,
    total_fees: 0,
  };
  const mockClosedPage = {
    trades: mockOperations.closed,
    page: 1,
    page_size: 50,
    total: mockOperations.closed.length,
    total_pages: 1,
  };

  const mockOpenTrades = {
    open_trades: [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        unrealizedProfit: 100,
        entryPrice: "50000",
        updateTime: "2024-01-01T10:00:00Z",
      },
    ],
  };

  const mockMomentumPairs = {
    momentum_pairs: [
      {
        symbol: "BTCUSDT",
        change: 2.5,
        volume: 1500000000,
        type: "momentum",
        time: "2024-01-01T10:00:00Z",
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  test("loads closed history one page at a time", async () => {
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage
      .mockResolvedValueOnce({ ...mockClosedPage, total: 105, total_pages: 3 })
      .mockResolvedValue({
        ...mockClosedPage,
        trades: [{ ...mockOperations.closed[0], symbol: "PAGE2USDT" }],
        page: 2,
        total: 105,
        total_pages: 3,
      });
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);
    getConfig.mockResolvedValue({ database: { total: 10 } });
    getCapital.mockResolvedValue(3253.83);
    getCommissionRate.mockResolvedValue({ broker_mode: "paper" });

    renderWithProviders(<Dashboard />);

    await screen.findByText("Open Trades");
    fireEvent.click(screen.getByText("Closed trade history"));
    fireEvent.click(screen.getByLabelText("Go to next page"));

    await waitFor(() => {
      expect(getClosedTradesPage).toHaveBeenCalledWith(2);
      expect(screen.getByText("PAGE2USDT")).toBeInTheDocument();
    });
  });

  test("renders dashboard content while initial data is loading", () => {
    // Mock APIs para que retornen datos
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    expect(screen.queryByText("Loading available data…")).not.toBeInTheDocument();
    expect(screen.getByText("Open Trades")).toBeInTheDocument();
    expect(screen.queryByText("$1.00")).not.toBeInTheDocument();
    expect(screen.queryByText("Failed to load stats.")).not.toBeInTheDocument();
    expect(
      screen.queryByText("Local API unavailable: API temporarily unavailable."),
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("No closed trades to display equity curve."),
    ).not.toBeInTheDocument();
    expect(screen.getAllByRole("status").length).toBeGreaterThan(0);
  });

  test("renders dashboard with data after loading", async () => {
    // Mock APIs para que retornen datos
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("1 open")).toBeInTheDocument();
    });

    expect(screen.queryByText("Simplified View")).not.toBeInTheDocument();
    expect(screen.getByText("Total Capital")).toBeInTheDocument();
    expect(screen.getByText("Open Trades")).toBeInTheDocument();
    expect(screen.getByText("Trading Performance")).toBeInTheDocument();
    expect(
      document.querySelector(".dashboard-performance .MuiGrid-grid-md-8"),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".dashboard-performance .MuiGrid-grid-md-4"),
    ).toBeInTheDocument();

    const equityCurve = document.querySelector(".dashboard-performance");
    const openTrades = document.querySelector(".dashboard-open-positions");
    expect(
      equityCurve.compareDocumentPosition(openTrades) &
        Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();

    const openTradesToggle = screen.getByRole("button", {
      name: "Open Trades",
    });
    expect(openTradesToggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByText("1 open")).toBeInTheDocument();
    expect(screen.getByText("Long 1")).toBeInTheDocument();
    expect(screen.getByText("Short 0")).toBeInTheDocument();
    const openPnl = document.querySelector(".dashboard-open-pnl");
    expect(openPnl).toHaveTextContent("Unrealized +$100.00");
    expect(openPnl).toHaveClass("performance-win");
    expect(openPnl.querySelector(".dashboard-value-update")).toHaveTextContent(
      "+$100.00",
    );
    fireEvent.click(openTradesToggle);
    expect(openTradesToggle).toHaveAttribute("aria-expanded", "true");
    expect(
      document.querySelector(
        ".dashboard-open-positions .operations-table__open-trades-accordion",
      ),
    ).toBeInTheDocument();
    expect(
      within(document.querySelector(".dashboard-open-positions")).getByText(
        "BTCUSDT",
      ),
    ).toBeInTheDocument();
  });

  test("handles empty data", async () => {
    // Mock APIs para que retornen datos vacíos
    getChartData.mockResolvedValue(null);
    getClosedTradesPage.mockResolvedValue({
      trades: [],
      total: 0,
      page: 1,
      page_size: 50,
      total_pages: 0,
    });
    getOpenTrades.mockResolvedValue({ open_trades: [] });
    getMomentumPairs.mockResolvedValue({ momentum_pairs: [] });

    act(() => {
      renderWithProviders(
        <Dashboard interactiveSection={<div>Interactive scanner</div>} />,
      );
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Failed to load stats.")).toBeInTheDocument();
    });

    // Verificar que se muestra el mensaje de error cuando stats es null
    expect(screen.getByText("Failed to load stats.")).toBeInTheDocument();
    expect(screen.getByText("Interactive scanner")).toBeInTheDocument();
  });

  test("handles null data", async () => {
    // Mock APIs para que retornen null
    getChartData.mockResolvedValue(null);
    getClosedTradesPage.mockResolvedValue(null);
    getOpenTrades.mockResolvedValue(null);
    getMomentumPairs.mockResolvedValue(null);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Failed to load stats.")).toBeInTheDocument();
    });

    // Verificar que se muestra el mensaje de error cuando stats es null
    expect(screen.getByText("Failed to load stats.")).toBeInTheDocument();
  });

  test("handles operations without closed property", async () => {
    // Mock API para que retorne datos sin la propiedad closed
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Total Capital")).toBeInTheDocument();
    });

    expect(screen.queryByText("Simplified View")).not.toBeInTheDocument();
  });

  test("keeps dashboard visible when a refresh request rejects", async () => {
    getChartData.mockRejectedValue(new Error("API unavailable"));
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    renderWithProviders(<Dashboard />);

    expect(
      await screen.findByText(
        "Local API unavailable: API temporarily unavailable.",
      ),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Local API unavailable: API temporarily unavailable.")
        .closest(".api-notice"),
    ).toBeInTheDocument();
    expect(screen.getByText("Open Trades")).toBeInTheDocument();
  });

  test("clears displayed data when the API becomes unavailable", async () => {
    vi.useFakeTimers();
    getChartData.mockResolvedValue(mockChartData);
    getClosedTradesPage.mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);
    getConfig.mockResolvedValue({ database: { total: 10 } });
    getCapital.mockResolvedValue(3253.83);
    getCommissionRate.mockResolvedValue({ broker_mode: "paper" });

    renderWithProviders(<Dashboard />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const financialMetrics = screen.getByLabelText("Financial metrics");
    expect(within(financialMetrics).getByText("$3,253.83")).toBeInTheDocument();
    expect(within(financialMetrics).getByText("+$1,500.50")).toBeInTheDocument();

    getChartData.mockResolvedValue(null);
    getClosedTradesPage.mockResolvedValue(null);
    getOpenTrades.mockResolvedValue(null);
    getMomentumPairs.mockResolvedValue(null);
    getConfig.mockResolvedValue(null);
    getCapital.mockResolvedValue(null);
    getCommissionRate.mockResolvedValue(null);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(
      screen.getByText("Local API unavailable: API temporarily unavailable."),
    ).toBeInTheDocument();
    expect(within(financialMetrics).getAllByText("—")).toHaveLength(3);
    expect(screen.queryByText("BTCUSDT")).not.toBeInTheDocument();
    expect(screen.getByText("No closed trades to display equity curve.")).toBeInTheDocument();
  });

  test("retries closed trades and PnL promptly after the API returns", async () => {
    vi.useFakeTimers();
    getChartData
      .mockResolvedValueOnce(null)
      .mockResolvedValue(mockChartData);
    getClosedTradesPage
      .mockResolvedValueOnce(null)
      .mockResolvedValue(mockClosedPage);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);
    getConfig.mockResolvedValue({ database: { total: 10 } });
    getCapital.mockResolvedValue(3253.83);
    getCommissionRate.mockResolvedValue({ broker_mode: "paper" });

    renderWithProviders(<Dashboard />);

    await act(async () => {
      await Promise.resolve();
      await Promise.resolve();
    });

    const financialMetrics = screen.getByLabelText("Financial metrics");
    expect(within(financialMetrics).getAllByText("—")).toHaveLength(3);

    await act(async () => {
      await vi.advanceTimersByTimeAsync(10000);
    });

    expect(
      within(financialMetrics).getByText("+$1,500.50"),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("No closed trades to display equity curve."),
    ).not.toBeInTheDocument();
    expect(screen.queryByText("Failed to load stats.")).not.toBeInTheDocument();
  });

  test("renders the dashboard while the initial API requests are pending", () => {
    getChartData.mockReturnValue(new Promise(() => {}));
    getClosedTradesPage.mockReturnValue(new Promise(() => {}));
    getOpenTrades.mockReturnValue(new Promise(() => {}));
    getMomentumPairs.mockReturnValue(new Promise(() => {}));

    renderWithProviders(<Dashboard />);

    expect(screen.queryByText("Loading available data…")).not.toBeInTheDocument();
    expect(screen.getByText("Open Trades")).toBeInTheDocument();
    expect(screen.getByText("Trading Performance")).toBeInTheDocument();
  });
});
