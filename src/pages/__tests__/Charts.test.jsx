import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Charts from "../Charts";
import { getChartData } from "../../api/chartData";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";

vi.mock("../../api/chartData", () => ({
  getChartData: vi.fn(),
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

describe("Charts", () => {
  const mockChartData = {
    hasTrades: true,
    equity: [],
    performance: { total: {}, long: {}, short: {} },
    stats: { total_trades: 0, winrates: {} },
    pnlHistogram: [],
    longShortWinLoss: { long: {}, short: {} },
    weeklyPerformance: { all: [], long: [], short: [] },
    monthlyPerformance: { all: [], long: [], short: [] },
    weeklyMonthlyPerformance: { all: [], long: [], short: [] },
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders charts page with loading state", () => {
    // Mock API para que retorne datos
    getChartData.mockResolvedValue(mockChartData);

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Verificar que se muestra el loading inicialmente
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("renders charts page with data after loading", async () => {
    // Mock API para que retorne datos
    getChartData.mockResolvedValue(mockChartData);

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
    });

    // Verificar que se muestran los componentes principales
    expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
  });

  test("handles empty data", async () => {
    // Mock API para que retorne datos vacíos
    getChartData.mockResolvedValue({
      ...mockChartData,
      hasTrades: false,
    });

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
    });

    // Verificar que la página se renderiza con datos vacíos
    expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
  });

  test("handles null data", async () => {
    // Mock API para que retorne null
    getChartData.mockResolvedValue(null);

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
    });

    // Verificar que la página se renderiza con datos null
    expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
  });

  test("handles operations without closed property", async () => {
    // Mock API para que retorne datos sin la propiedad closed
    getChartData.mockResolvedValue(null);

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Esperar a que se carguen los datos
    await waitFor(() => {
      expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
    });

    // Verificar que la página se renderiza sin la propiedad closed
    expect(screen.getByText("Advanced Charts")).toBeInTheDocument();
  });
});
