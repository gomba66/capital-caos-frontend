import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import EquityChart from "../EquityChart";

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
});
