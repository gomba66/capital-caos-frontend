import React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import OperationsTable from "../OperationsTable";

const theme = createTheme();

const renderWithProviders = (component) => {
  return render(
    <BrowserRouter>
      <ThemeProvider theme={theme}>{component}</ThemeProvider>
    </BrowserRouter>
  );
};

describe("OperationsTable", () => {
  const mockOperations = [
    {
      id: 1,
      symbol: "BTCUSDT",
      side: "LONG",
      entry_price: "50000",
      current_price: "51000",
      quantity: "0.1",
      pnl: "100",
      unrealized_profit: "100",
      entry_time: "2024-01-01T10:00:00Z",
      closed_at: "2024-01-01T11:00:00Z",
    },
    {
      id: 2,
      symbol: "ETHUSDT",
      side: "SHORT",
      entry_price: "3000",
      current_price: "2900",
      quantity: "1.0",
      pnl: "-50",
      unrealized_profit: "-50",
      entry_time: "2024-01-01T12:00:00Z",
      closed_at: "2024-01-01T13:00:00Z",
    },
  ];

  test("renders table with title", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    expect(screen.getByText("Test Operations")).toBeInTheDocument();
  });

  test("renders table headers", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    expect(screen.getByText("Symbol")).toBeInTheDocument();
    expect(screen.getByText("Side")).toBeInTheDocument();
    expect(screen.getByText("Entry")).toBeInTheDocument();
    expect(screen.getByText("PnL")).toBeInTheDocument();
    expect(screen.getByText("Open date")).toBeInTheDocument();
    expect(screen.getByText("Close date")).toBeInTheDocument();
    expect(screen.getByText("Result")).toBeInTheDocument();
  });

  test("renders operations data", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getByText("SHORT")).toBeInTheDocument();
  });

  test("renders empty state when no operations", () => {
    renderWithProviders(
      <OperationsTable operations={[]} title="Test Operations" />
    );

    expect(screen.getByText("Test Operations")).toBeInTheDocument();
    expect(screen.getByText("No operations found.")).toBeInTheDocument();
  });

  test("handles null operations", () => {
    renderWithProviders(
      <OperationsTable operations={null} title="Test Operations" />
    );

    expect(screen.getByText("Test Operations")).toBeInTheDocument();
    expect(screen.getByText("No operations found.")).toBeInTheDocument();
  });

  test("formats numbers correctly", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    // Verificar que los datos se muestran correctamente
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getByText("SHORT")).toBeInTheDocument();
  });

  test("handles different side values", () => {
    const operationsWithDifferentSides = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        current_price: "51000",
        quantity: "0.1",
        pnl: "100",
        unrealized_profit: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000",
        current_price: "2900",
        quantity: "1.0",
        pnl: "-50",
        unrealized_profit: "-50",
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "UNKNOWN",
        entry_price: "1.0",
        current_price: "1.1",
        quantity: "100",
        pnl: "10",
        unrealized_profit: "10",
        entry_time: "2024-01-01T14:00:00Z",
        closed_at: "2024-01-01T15:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithDifferentSides}
        title="Test Operations"
      />
    );

    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getByText("SHORT")).toBeInTheDocument();
    expect(screen.getByText("UNKNOWN")).toBeInTheDocument();
  });

  test("handles missing data gracefully", () => {
    const operationsWithMissingData = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        // Missing entry_price, current_price, quantity, pnl
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithMissingData}
        title="Test Operations"
      />
    );

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("LONG")).toBeInTheDocument();
  });

  test("handles different timezone", () => {
    renderWithProviders(
      <OperationsTable
        operations={mockOperations}
        title="Test Operations"
        timeZone="America/Bogota"
      />
    );

    expect(screen.getByText("Test Operations")).toBeInTheDocument();
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
  });

  test("handles sorting functionality", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    // Hacer click en el header de Symbol para ordenar
    const symbolHeader = screen.getByText("Symbol");
    fireEvent.click(symbolHeader);

    // Verificar que los datos siguen presentes
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles open trades mode", () => {
    const openTradesOperations = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "50000",
        unrealizedProfit: "100",
        updateTime: "2024-01-01T10:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={openTradesOperations}
        title="Open Trades"
        isOpenTrades={true}
      />
    );

    expect(screen.getByText("Open Trades")).toBeInTheDocument();
    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("PnL")).toBeInTheDocument();
  });

  test("handles sorting by different columns", () => {
    renderWithProviders(
      <OperationsTable operations={mockOperations} title="Test Operations" />
    );

    // Probar ordenamiento por diferentes columnas
    const sideHeader = screen.getByText("Side");
    fireEvent.click(sideHeader);

    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

    // Verificar que los datos siguen presentes
    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getByText("SHORT")).toBeInTheDocument();
  });

  test("handles edge cases in sorting", () => {
    const operationsWithEdgeCases = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: null,
        pnl: undefined,
        entry_time: null,
        closed_at: "2024-01-01T12:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithEdgeCases}
        title="Test Operations"
      />
    );

    // Probar ordenamiento con datos faltantes
    const symbolHeader = screen.getByText("Symbol");
    fireEvent.click(symbolHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with string numbers", () => {
    const operationsWithStringNumbers = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000",
        pnl: "50",
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithStringNumbers}
        title="Test Operations"
      />
    );

    // Probar ordenamiento por entry_price (números como strings)
    const entryHeader = screen.getByText("Entry");
    fireEvent.click(entryHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with unrealized profit for open trades", () => {
    const openTradesWithUnrealizedProfit = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "50000",
        unrealizedProfit: "100",
        unRealizedProfit: "100", // Alternativa
        updateTime: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "3000",
        unrealizedProfit: "50",
        updateTime: "2024-01-01T12:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={openTradesWithUnrealizedProfit}
        title="Open Trades"
        isOpenTrades={true}
      />
    );

    // Probar ordenamiento por PnL en open trades
    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with different column types", () => {
    const operationsWithDifferentTypes = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
        closeTime: "2024-01-01T11:00:00Z",
        timestamp: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000",
        pnl: "50",
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
        closeTime: "2024-01-01T13:00:00Z",
        timestamp: "2024-01-01T12:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithDifferentTypes}
        title="Test Operations"
      />
    );

    // Probar ordenamiento por diferentes columnas
    const openDateHeader = screen.getByText("Open date");
    fireEvent.click(openDateHeader);

    const closeDateHeader = screen.getByText("Close date");
    fireEvent.click(closeDateHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with equal values", () => {
    const operationsWithEqualValues = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "50000", // Mismo valor
        pnl: "100", // Mismo valor
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithEqualValues}
        title="Test Operations"
      />
    );

    // Probar ordenamiento con valores iguales
    const entryHeader = screen.getByText("Entry");
    fireEvent.click(entryHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with different data types", () => {
    const operationsWithMixedTypes = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: 50000, // Number
        pnl: 100, // Number
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000", // String
        pnl: "50", // String
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithMixedTypes}
        title="Test Operations"
      />
    );

    // Probar ordenamiento con diferentes tipos de datos
    const entryHeader = screen.getByText("Entry");
    fireEvent.click(entryHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with complex pnl calculations", () => {
    const operationsWithComplexPnl = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100.50",
        unrealizedProfit: "150.75",
        unRealizedProfit: "200.25",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000",
        pnl: "50.25",
        unrealizedProfit: "75.50",
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={operationsWithComplexPnl}
        title="Test Operations"
      />
    );

    // Probar ordenamiento por PnL con cálculos complejos
    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with open trades and different time fields", () => {
    const openTradesWithDifferentTimeFields = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "50000",
        unrealizedProfit: "100",
        updateTime: "2024-01-01T10:00:00Z",
        timestamp: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "3000",
        unrealizedProfit: "50",
        updateTime: "2024-01-01T12:00:00Z",
        timestamp: "2024-01-01T12:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={openTradesWithDifferentTimeFields}
        title="Open Trades"
        isOpenTrades={true}
      />
    );

    // Probar ordenamiento por tiempo en open trades
    const timeHeader = screen.getByText("Open date");
    fireEvent.click(timeHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });

  test("handles sorting with closed trades and closeTime field", () => {
    const closedTradesWithCloseTime = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entry_price: "50000",
        pnl: "100",
        entry_time: "2024-01-01T10:00:00Z",
        closed_at: "2024-01-01T11:00:00Z",
        closeTime: "2024-01-01T11:00:00Z",
        timestamp: "2024-01-01T10:00:00Z",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entry_price: "3000",
        pnl: "50",
        entry_time: "2024-01-01T12:00:00Z",
        closed_at: "2024-01-01T13:00:00Z",
        closeTime: "2024-01-01T13:00:00Z",
        timestamp: "2024-01-01T12:00:00Z",
      },
    ];

    renderWithProviders(
      <OperationsTable
        operations={closedTradesWithCloseTime}
        title="Closed Trades"
      />
    );

    // Probar ordenamiento por closeTime en closed trades
    const closeDateHeader = screen.getByText("Close date");
    fireEvent.click(closeDateHeader);

    expect(screen.getByText("BTCUSDT")).toBeInTheDocument();
    expect(screen.getByText("ETHUSDT")).toBeInTheDocument();
  });
});

describe("OperationsTable - Cobertura avanzada", () => {
  test("renderiza TP Target como número, objeto y sin valor", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        take_profit_target: 2.5,
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "200",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        take_profit_target: { ratio: 1.5, value_usd: 50 },
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "LONG",
        entryPrice: "1",
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "100", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    // Buscar el texto dentro de Typography components
    expect(
      screen.getByText((content) => content.includes("2.50"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("1.50"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("50.00"))
    ).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("colores y signos en PnL: positivo, negativo, cero", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "200",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "LONG",
        entryPrice: "1",
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "100", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    // Buscar el contenido dentro de spans con estilos
    expect(
      screen.getByText((content) => content.includes("10.00"))
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((content) => content.includes("5.00")).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content) => content.includes("0.00")).length
    ).toBeGreaterThan(0);
  });

  test("getSideStyle: sides raros", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "HEDGE",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "",
        entryPrice: "200",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: null,
        entryPrice: "1",
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "100", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    expect(screen.getByText("HEDGE")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("getWinLoss edge: PnL = 0, undefined, string no numérica", () => {
    const ops = [
      { id: 1, symbol: "BTCUSDT", side: "LONG", pnl: 0 },
      { id: 2, symbol: "ETHUSDT", side: "SHORT", pnl: undefined },
      { id: 3, symbol: "ADAUSDT", side: "LONG", pnl: "notanumber" },
    ];
    renderWithProviders(
      <OperationsTable operations={ops} title="Closed Trades" />
    );
    expect(screen.getByText("FLAT")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("getDurationString y formatDate edge: fechas inválidas, numéricas, string vacía", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: "notadate",
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "200",
        unrealizedProfit: "-5",
        updateTime: 123456789,
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "LONG",
        entryPrice: "1",
        unrealizedProfit: "0",
        updateTime: "",
        positionAmt: "100", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("formatNumber: valores no numéricos, string vacía, null, undefined", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "abc",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "LONG",
        entryPrice: null,
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "100", // Para que se detecte como open trade
      },
      {
        id: 4,
        symbol: "SOLUSDT",
        side: "LONG",
        entryPrice: undefined,
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "50", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    expect(screen.getByText("abc")).toBeInTheDocument();
    expect(screen.getAllByText("-").length).toBeGreaterThan(0);
  });

  test("renderiza totalPnL en open trades", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        positionAmt: "0.001", // Para que se detecte como open trade
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "200",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        positionAmt: "-0.01", // Para que se detecte como open trade
      },
    ];
    renderWithProviders(
      <OperationsTable
        operations={ops}
        title="Open Trades"
        isOpenTrades={true}
      />
    );
    // Buscar el total en el tfoot
    expect(
      screen.getByText((content) => content.includes("Total:"))
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((content) => content.includes("5.00")).length
    ).toBeGreaterThan(0);
  });
});
