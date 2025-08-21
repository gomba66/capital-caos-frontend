import React from "react";
import { render, screen } from "@testing-library/react";
import "@testing-library/jest-dom";
import ScannerPerformanceChart from "../ScannerPerformanceChart";

const mockOperations = [
  {
    symbol: "BTCUSDT",
    pnl: "150.50",
    type: "LONG",
    openTime: "2025-08-21T10:00:00Z",
    closeTime: "2025-08-21T12:00:00Z",
    scanner_info: {
      scanner: "aggressive",
      scanner_type: "MOMENTUM_AGGRESSIVE",
      momentum_data: {
        change_5m: 3.5,
        volume: 1000000,
      },
    },
  },
  {
    symbol: "ETHUSDT",
    pnl: "-75.25",
    type: "SHORT",
    openTime: "2025-08-21T11:00:00Z",
    closeTime: "2025-08-21T13:00:00Z",
    scanner_info: {
      scanner: "aggressive",
      scanner_type: "MOMENTUM_AGGRESSIVE",
      momentum_data: {
        change_2m: -2.1,
        volume: 800000,
      },
    },
  },
  {
    symbol: "ADAUSDT",
    pnl: "200.00",
    type: "LONG",
    openTime: "2025-08-21T09:00:00Z",
    closeTime: "2025-08-21T14:00:00Z",
    scanner_info: {
      scanner: "original",
      scanner_type: "MOMENTUM_ORIGINAL",
      momentum_data: {
        change_30m: 5.2,
        volume: 1200000,
      },
    },
  },
  {
    symbol: "DOTUSDT",
    pnl: "-50.00",
    type: "SHORT",
    openTime: "2025-08-21T10:30:00Z",
    closeTime: "2025-08-21T11:30:00Z",
    scanner_info: {
      scanner: "volume_momentum",
      scanner_type: "VOLUME_ORIGINAL",
      momentum_data: {
        change_30m: -3.1,
        volume: 2000000,
      },
    },
  },
];

const mockOperationsWithoutScanner = [
  {
    symbol: "BTCUSDT",
    pnl: "100.00",
    type: "LONG",
    openTime: "2025-08-21T10:00:00Z",
    closeTime: "2025-08-21T12:00:00Z",
  },
];

describe("ScannerPerformanceChart", () => {
  it("renders scanner performance chart with data", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("📊 Rendimiento por Scanner")).toBeInTheDocument();
    expect(screen.getByText("Wins vs Losses por Scanner")).toBeInTheDocument();
    expect(screen.getByText("Distribución de Trades")).toBeInTheDocument();
    expect(
      screen.getByText("📈 Métricas Detalladas por Scanner")
    ).toBeInTheDocument();
  });

  it("displays scanner metrics correctly", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // Verificar que se muestran los scanners
    expect(screen.getByText("AGGRESSIVE")).toBeInTheDocument();
    expect(screen.getByText("ORIGINAL")).toBeInTheDocument();
    expect(screen.getByText("VOLUME_MOMENTUM")).toBeInTheDocument();

    // Verificar métricas del scanner agresivo (debe aparecer primero por tener más trades)
    const scannerCards = screen.getAllByText(
      /AGGRESSIVE|ORIGINAL|VOLUME_MOMENTUM/
    );
    expect(scannerCards[0]).toHaveTextContent("AGGRESSIVE");

    // Verificar que se muestran las métricas
    expect(screen.getAllByText("2")[0]).toBeInTheDocument(); // Total trades del scanner agresivo
  });

  it("shows correct winrate calculations", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // Scanner agresivo: 1 win de 2 trades = 50%
    expect(screen.getByText("50.0%")).toBeInTheDocument();

    // Scanner original: 1 win de 1 trade = 100%
    expect(screen.getByText("100.0%")).toBeInTheDocument();
  });

  it("displays trade type chips correctly", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // Verificar chips de tipos de trade
    // El scanner agresivo tiene 1 LONG y 1 SHORT
    expect(screen.getAllByText("1 LONG")[0]).toBeInTheDocument();
    expect(screen.getAllByText("1 SHORT")[0]).toBeInTheDocument();
  });

  it("handles empty operations gracefully", () => {
    render(<ScannerPerformanceChart operations={[]} />);

    expect(
      screen.getByText("No hay datos de operaciones para analizar")
    ).toBeInTheDocument();
  });

  it("handles operations without scanner info", () => {
    render(
      <ScannerPerformanceChart operations={mockOperationsWithoutScanner} />
    );

    expect(
      screen.getByText("No hay información de scanner en las operaciones")
    ).toBeInTheDocument();
  });

  it("calculates time in trade correctly", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // BTCUSDT: 2 horas (10:00 - 12:00)
    // ETHUSDT: 2 horas (11:00 - 13:00)
    // ADAUSDT: 5 horas (09:00 - 14:00)
    // DOTUSDT: 1 hora (10:30 - 11:30)

    // El scanner agresivo tiene 2 trades: 2h + 2h = 4h total, promedio 2h
    expect(screen.getByText("Tiempo promedio: 2h 0m")).toBeInTheDocument();
  });

  it("displays scanner types correctly", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    expect(screen.getByText("MOMENTUM_AGGRESSIVE")).toBeInTheDocument();
    expect(screen.getByText("MOMENTUM_ORIGINAL")).toBeInTheDocument();
    expect(screen.getByText("VOLUME_ORIGINAL")).toBeInTheDocument();
  });

  it("shows profit factor calculations", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // Scanner agresivo: 1 win con $150.50, 1 loss con -$75.25
    // Profit Factor = 150.50 / 75.25 = 2.0
    expect(screen.getByText("2.00")).toBeInTheDocument();
  });

  it("formats PnL correctly", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // Verificar que se muestran los PnLs con formato correcto
    expect(screen.getByText("+$37.63")).toBeInTheDocument(); // Promedio del scanner agresivo
    expect(screen.getByText("+$200.00")).toBeInTheDocument(); // Scanner original
  });

  it("sorts scanners by total trades", () => {
    render(<ScannerPerformanceChart operations={mockOperations} />);

    // El scanner agresivo tiene 2 trades, debe aparecer primero
    const scannerCards = screen.getAllByText(
      /AGGRESSIVE|ORIGINAL|VOLUME_MOMENTUM/
    );
    expect(scannerCards[0]).toHaveTextContent("AGGRESSIVE");
  });
});
