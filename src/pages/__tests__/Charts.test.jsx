import React from "react";
import { render, screen, waitFor, act } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import Charts from "../Charts";
import { getOperations } from "../../api/operations";
import { TimeZoneContext, SidebarContext } from "../../contexts/AppContexts";

// Mock de las APIs
vi.mock("../../api/operations", () => ({
  getOperations: vi.fn(),
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

  beforeEach(() => {
    vi.clearAllMocks();
  });

  test("renders charts page with loading state", () => {
    // Mock API para que retorne datos
    getOperations.mockResolvedValue(mockOperations);

    act(() => {
      renderWithProviders(<Charts />);
    });

    // Verificar que se muestra el loading inicialmente
    expect(screen.getByRole("progressbar")).toBeInTheDocument();
  });

  test("renders charts page with data after loading", async () => {
    // Mock API para que retorne datos
    getOperations.mockResolvedValue(mockOperations);

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
    getOperations.mockResolvedValue({ closed: [] });

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
    getOperations.mockResolvedValue(null);

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
    getOperations.mockResolvedValue({});

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
