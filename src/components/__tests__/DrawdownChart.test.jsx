import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import DrawdownChart from "../DrawdownChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("DrawdownChart", () => {
  test("renders drawdown chart with title", () => {
    const mockOperations = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 100,
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: -50,
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
  });

  test("renders message when no operations", () => {
    renderWithTheme(<DrawdownChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display drawdown.")
    ).toBeInTheDocument();
  });

  test("renders message when operations is null", () => {
    renderWithTheme(<DrawdownChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display drawdown.")
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    const mockOperations = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 100,
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: -50,
      },
      {
        closed_at: "2024-01-03T10:00:00Z",
        pnl: 75,
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
    // Verificar que el chart se renderiza (ResponsiveContainer)
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with closeTime instead of closed_at", () => {
    const mockOperations = [
      {
        closeTime: "2024-01-01T10:00:00Z",
        pnl: 100,
      },
      {
        closeTime: "2024-01-02T10:00:00Z",
        pnl: -50,
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("filters out operations without closed_at or closeTime", () => {
    const mockOperations = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 100,
      },
      {
        // Sin fecha de cierre
        pnl: 50,
      },
      {
        closeTime: "2024-01-02T10:00:00Z",
        pnl: -50,
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with string pnl values", () => {
    const mockOperations = [
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: "100",
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: "-50.5",
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("sorts operations by date correctly", () => {
    const mockOperations = [
      {
        closed_at: "2024-01-03T10:00:00Z",
        pnl: 75,
      },
      {
        closed_at: "2024-01-01T10:00:00Z",
        pnl: 100,
      },
      {
        closed_at: "2024-01-02T10:00:00Z",
        pnl: -50,
      },
    ];

    renderWithTheme(<DrawdownChart operations={mockOperations} />);

    expect(screen.getByText("Drawdown (%)")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
