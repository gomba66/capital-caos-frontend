import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import MomentumPairsTable from "../MomentumPairsTable";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("MomentumPairsTable", () => {
  const mockPairs = [
    {
      symbol: "BTCUSDT",
      change: 2.5,
      volume: 1500000000,
      type: "momentum",
      time: "2024-01-01T10:00:00Z",
    },
    {
      symbol: "ETHUSDT",
      change: -1.2,
      volume: 800000000,
      type: "volume",
      time: "2024-01-01T11:00:00Z",
    },
  ];

  const mockOpenTrades = [
    {
      symbol: "BTCUSDT",
      positionSide: "LONG",
      quantity: "0.1",
    },
  ];

  test("renders table with title", () => {
    renderWithTheme(
      <MomentumPairsTable pairs={mockPairs} title="Momentum Pairs" />
    );

    expect(screen.getByText("Momentum Pairs")).toBeInTheDocument();
  });

  test("renders table headers", () => {
    renderWithTheme(
      <MomentumPairsTable pairs={mockPairs} title="Momentum Pairs" />
    );

    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Change %")).toBeInTheDocument();
    expect(screen.getByText("Volume")).toBeInTheDocument();
    expect(screen.getByText("Type")).toBeInTheDocument();
    expect(screen.getByText("Time")).toBeInTheDocument();
  });

  test("renders pairs data", () => {
    renderWithTheme(
      <MomentumPairsTable pairs={mockPairs} title="Momentum Pairs" />
    );

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    expect(screen.getByText("momentum")).toBeInTheDocument();
    expect(screen.getByText("volume")).toBeInTheDocument();
  });

  test("renders empty state when no pairs", () => {
    renderWithTheme(<MomentumPairsTable pairs={[]} title="Momentum Pairs" />);

    expect(screen.getByText("Momentum Pairs")).toBeInTheDocument();
    expect(screen.getByText("No momentum pairs found.")).toBeInTheDocument();
  });

  test("handles null pairs", () => {
    renderWithTheme(<MomentumPairsTable pairs={null} title="Momentum Pairs" />);

    expect(screen.getByText("Momentum Pairs")).toBeInTheDocument();
    expect(screen.getByText("No momentum pairs found.")).toBeInTheDocument();
  });

  test("formats volume correctly", () => {
    const pairsWithDifferentVolumes = [
      {
        symbol: "BTCUSDT",
        change: 2.5,
        volume: 1500000000, // 1.5B
        type: "momentum",
        time: "2024-01-01T10:00:00Z",
      },
      {
        symbol: "ETHUSDT",
        change: -1.2,
        volume: 800000000, // 800M
        type: "volume",
        time: "2024-01-01T11:00:00Z",
      },
      {
        symbol: "ADAUSDT",
        change: 0.5,
        volume: 5000000, // 5M
        type: "momentum",
        time: "2024-01-01T12:00:00Z",
      },
      {
        symbol: "DOTUSDT",
        change: -0.8,
        volume: 2500, // 2.5K
        type: "volume",
        time: "2024-01-01T13:00:00Z",
      },
    ];

    renderWithTheme(
      <MomentumPairsTable
        pairs={pairsWithDifferentVolumes}
        title="Momentum Pairs"
      />
    );

    expect(screen.getByText("1.5B")).toBeInTheDocument();
    expect(screen.getByText("800.0M")).toBeInTheDocument();
    expect(screen.getByText("5.0M")).toBeInTheDocument();
    expect(screen.getByText("2.5K")).toBeInTheDocument();
  });

  test("handles open trades highlighting", () => {
    renderWithTheme(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Momentum Pairs"
        openTrades={mockOpenTrades}
      />
    );

    // Verificar que los símbolos están presentes (pueden tener emojis)
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/ETHUSDT/)).toBeInTheDocument();
  });

  test("handles missing data gracefully", () => {
    const pairsWithMissingData = [
      {
        symbol: "BTCUSDT",
        // Missing change, volume, type, time
      },
      {
        symbol: "ETHUSDT",
        change: -1.2,
        volume: null,
        type: undefined,
        time: "",
      },
    ];

    renderWithTheme(
      <MomentumPairsTable pairs={pairsWithMissingData} title="Momentum Pairs" />
    );

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles different timezone", () => {
    renderWithTheme(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Momentum Pairs"
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Momentum Pairs")).toBeInTheDocument();
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
  });

  test("handles case insensitive symbol matching", () => {
    const openTradesWithDifferentCase = [
      {
        symbol: "btcusdt", // lowercase
        positionSide: "LONG",
        quantity: "0.1",
      },
    ];

    renderWithTheme(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Momentum Pairs"
        openTrades={openTradesWithDifferentCase}
      />
    );

    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
  });
});
