import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import { vi } from "vitest";
import MomentumPairsTable from "../MomentumPairsTable";

// Mock fetch for cooldowns
global.fetch = vi.fn();

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
    expect(screen.getByText(/BTCUSDT/)).toBeInTheDocument();
    expect(screen.getByText(/ETHUSDT/)).toBeInTheDocument();
  });

  it("marks symbols with an open trade without emoji decoration", async () => {
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

    expect(await screen.findByText("OPEN")).toBeInTheDocument();
    expect(screen.queryByText(/🔥|📈|📉/)).not.toBeInTheDocument();
  });

  it("displays cooldown and ready status with text indicators", async () => {
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

    const cooldown = await screen.findByText("COOLDOWN");
    expect(cooldown).toHaveAttribute("data-status", "cooldown");
    expect(screen.getByText("READY")).toHaveAttribute("data-status", "ready");
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

    const statusElements = await screen.findAllByText("READY");
    expect(statusElements).toHaveLength(2);
  });

  it("shows text status for cooldowns with different remaining times", async () => {
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

    expect(await screen.findAllByText("COOLDOWN")).toHaveLength(2);
    expect(screen.queryByText(/⏳|🔴|🟡|✅/)).not.toBeInTheDocument();
  });
});
