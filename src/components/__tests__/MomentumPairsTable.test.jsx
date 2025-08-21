import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import MomentumPairsTable from "../MomentumPairsTable";

// Mock fetch for cooldowns
global.fetch = jest.fn();

const mockPairs = [
  {
    symbol: "BTCUSDT",
    change_30m: "2.5",
    volume: "1000000",
    type: "30m",
    time: "2025-08-21T18:00:00Z",
  },
  {
    symbol: "ETHUSDT",
    change_2m: "1.8",
    volume: "500000",
    type: "FAST",
    time: "2025-08-21T18:00:00Z",
  },
];

const mockOpenTrades = [
  {
    symbol: "BTCUSDT",
    positionSide: "LONG",
    side: "BUY",
  },
];

describe("MomentumPairsTable", () => {
  beforeEach(() => {
    fetch.mockClear();
  });

  it("renders momentum pairs table with title", () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cooldowns: [] }),
    });

    render(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Test Momentum Pairs"
        openTrades={mockOpenTrades}
        timeZone="UTC"
      />
    );

    expect(screen.getByText("Test Momentum Pairs")).toBeInTheDocument();
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  it("shows open trade indicators", async () => {
    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cooldowns: [] }),
    });

    render(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Test Momentum Pairs"
        openTrades={mockOpenTrades}
        timeZone="UTC"
      />
    );

    await screen.findByText("🔥");
    expect(screen.getByText("📈")).toBeInTheDocument();
  });

  it("displays cooldown status correctly", async () => {
    const mockCooldowns = [
      {
        symbol: "BTCUSDT",
        time_remaining: "00:30:00",
        is_active: true,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cooldowns: mockCooldowns }),
    });

    render(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Test Momentum Pairs"
        openTrades={[]}
        timeZone="UTC"
      />
    );

    // Verificar que se muestra el indicador de cooldown
    await screen.findByText("🔴"); // Rojo para < 30 min
    expect(screen.getByText("✅")).toBeInTheDocument(); // Verde para ETHUSDT
  });

  it("handles fetch error gracefully", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    render(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Test Momentum Pairs"
        openTrades={[]}
        timeZone="UTC"
      />
    );

    // Debería mostrar todos los pares como disponibles (✅)
    await screen.findByText("✅");
    expect(screen.getAllByText("✅")).toHaveLength(2);
  });

  it("shows correct status for different cooldown times", async () => {
    const mockCooldowns = [
      {
        symbol: "BTCUSDT",
        time_remaining: "01:30:00",
        is_active: true,
      },
      {
        symbol: "ETHUSDT",
        time_remaining: "00:45:00",
        is_active: true,
      },
    ];

    fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ cooldowns: mockCooldowns }),
    });

    render(
      <MomentumPairsTable
        pairs={mockPairs}
        title="Test Momentum Pairs"
        openTrades={[]}
        timeZone="UTC"
      />
    );

    // Verificar diferentes indicadores según el tiempo
    await screen.findByText("⏳"); // Naranja para > 1 hora
    await screen.findByText("🟡"); // Amarillo para < 1 hora
  });
});
