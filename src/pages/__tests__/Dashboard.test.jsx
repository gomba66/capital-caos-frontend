import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Dashboard from "../Dashboard";
import { getStats } from "../../api/stats";
import { getOperations } from "../../api/operations";
import { getOpenTrades } from "../../api/openTrades";
import { getMomentumPairs } from "../../api/momentumPairs";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";

// Mock de las APIs
vi.mock("../../api/stats", () => ({
  getStats: vi.fn(),
}));

vi.mock("../../api/operations", () => ({
  getOperations: vi.fn(),
}));

vi.mock("../../api/openTrades", () => ({
  getOpenTrades: vi.fn(),
}));

vi.mock("../../api/momentumPairs", () => ({
  getMomentumPairs: vi.fn(),
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
  });

  test("renders dashboard with loading state", () => {
    // Mock APIs para que retornen datos
    getStats.mockResolvedValue(mockStats);
    getOperations.mockResolvedValue(mockOperations);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Verificar que se muestra el loading inicialmente
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("renders dashboard with data after loading", async () => {
    // Mock APIs para que retornen datos
    getStats.mockResolvedValue(mockStats);
    getOperations.mockResolvedValue(mockOperations);
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Simplified View")).toBeInTheDocument();
    });

    // Verificar que se muestran los componentes principales
    expect(screen.getByText("Simplified View")).toBeInTheDocument();
    expect(screen.getByText("Total Capital")).toBeInTheDocument();
  });

  test("handles empty data", async () => {
    // Mock APIs para que retornen datos vacíos
    getStats.mockResolvedValue(null);
    getOperations.mockResolvedValue({ closed: [] });
    getOpenTrades.mockResolvedValue({ open_trades: [] });
    getMomentumPairs.mockResolvedValue({ momentum_pairs: [] });

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

  test("handles null data", async () => {
    // Mock APIs para que retornen null
    getStats.mockResolvedValue(null);
    getOperations.mockResolvedValue(null);
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
    getStats.mockResolvedValue(mockStats);
    getOperations.mockResolvedValue({});
    getOpenTrades.mockResolvedValue(mockOpenTrades);
    getMomentumPairs.mockResolvedValue(mockMomentumPairs);

    act(() => {
      renderWithProviders(<Dashboard />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Simplified View")).toBeInTheDocument();
    });

    // Verificar que la página se renderiza sin la propiedad closed
    expect(screen.getByText("Simplified View")).toBeInTheDocument();
  });
});
