import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import { BrowserRouter } from "react-router-dom";
import OperationsTable from "../OperationsTable";
import { getPriceHistory } from "../../api/priceHistory";
import { getClosedTradesPreview } from "../../api/closedTradesPreview";
import { getOpenTradesPreview } from "../../api/openTradesPreview";
import { useSymbolStatistics } from "../../hooks/useSymbolStatistics";

vi.mock("../../api/priceHistory", () => ({
  getPriceHistory: vi.fn(),
}));

vi.mock("../../api/openTradesPreview", () => ({
  getOpenTradesPreview: vi.fn(),
}));

vi.mock("../../api/closedTradesPreview", () => ({
  getClosedTradesPreview: vi.fn(),
}));

vi.mock("../../hooks/useSymbolStatistics", () => ({
  useSymbolStatistics: vi.fn(() => ({ data: null, loading: false })),
}));

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

  test("reuses the open trades table while masking protected rows", async () => {
    getPriceHistory.mockResolvedValue({ data: [] });
    getOpenTradesPreview.mockResolvedValue({
      open_count: 3,
      long_count: 3,
      short_count: 0,
      positions: [
        { unrealized_pnl: 7.18, open_time: Date.now() - 60 * 60 * 1000 },
        { unrealized_pnl: 93.31, open_time: Date.now() - 60 * 1000 },
        { unrealized_pnl: 18.71, open_time: Date.now() - 3 * 60 * 60 * 1000 },
      ],
      total_tp_target: 281.17,
      pnl_percentage: 42.34,
      revealed_trade_index: 1,
      revealed_trade: {
        symbol: "MITOUSDT",
        side: "LONG",
        entry_price: 0.5,
        mark_price: 0.6,
        unrealized_pnl: 93.31,
        take_profit_target: { ratio: 3.38, value_usd: 154.94 },
        update_time: Date.now() - 60_000,
        protected: true,
      },
    });

    const { container } = renderWithProviders(
      <OperationsTable
        operations={[]}
        title="Open Trades"
        isOpenTrades
        protectedMode
      />,
    );

    expect(container.querySelector(".MuiAccordion-root")).toHaveStyle({
      backgroundColor: "var(--white)",
    });
    expect(container.querySelector(".MuiAccordionSummary-root")).toBeInTheDocument();
    expect(
      container.querySelector(".operations-table__open-trades-accordion"),
    ).toBeInTheDocument();
    const toggle = screen.getByRole("button", { name: "Open Trades" });
    expect(toggle).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByText("Open Trades")).toHaveClass("MuiTypography-body1");
    expect(container.querySelector(".MuiAccordionDetails-root")).toBeInTheDocument();

    expect(await screen.findByText("MITOUSDT")).toBeInTheDocument();
    const revealedTradeRow = screen.getByText("MITOUSDT").closest("tr");
    expect(revealedTradeRow.querySelector('[title="Protected"]')).toHaveTextContent(
      "🔒",
    );
    expect(screen.queryByText("Win Rate")).not.toBeInTheDocument();
    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getAllByText("+$93.31").length).toBeGreaterThan(0);
    expect(container.querySelectorAll(".operations-table--protected-open tbody tr:first-child td"))
      .toHaveLength(6);
    expect(container.querySelectorAll(".operations-table__mask")).toHaveLength(8);
    const maskedSymbols = container.querySelectorAll(
      ".operations-table__protected-hint--symbol",
    );
    expect(maskedSymbols[0]).toHaveAttribute("data-mask-size", "long");
    expect(maskedSymbols[1]).toHaveAttribute("data-mask-size", "medium");
    container
      .querySelectorAll(".operations-table__protected-hint")
      .forEach((hint) => {
        expect(hint).not.toHaveTextContent("🔒");
      });
    const maskedSides = container.querySelectorAll(
      ".operations-table__protected-hint--side",
    );
    expect(maskedSides).toHaveLength(2);
    maskedSides.forEach((sideMask) => {
      expect(sideMask).not.toHaveAttribute("data-mask-size");
    });
    expect(
      container.querySelectorAll(
        ".operations-table__mask-target .operations-table__mask",
      ),
    ).toHaveLength(4);
    expect(container.textContent).not.toContain("PHAROSUSDT");
    expect(screen.getByLabelText("View MITOUSDT chart")).toBeInTheDocument();
    fireEvent.mouseOver(
      screen.getAllByLabelText("Trade details are protected")[0],
    );
    const upgradeLink = await screen.findByRole("link", {
      name: "Explore Complete",
    });
    expect(upgradeLink).toHaveAttribute("href", "/upgrade");
    const openTimeCells = container.querySelectorAll("tbody tr td:nth-child(5)");
    expect(openTimeCells[0].textContent).toMatch(/^1h \d+m \d+s$/);
    expect(openTimeCells[2].textContent).toMatch(/^3h \d+m \d+s$/);

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "true");

    fireEvent.click(screen.getByLabelText("View MITOUSDT chart"));
    expect(await screen.findByRole("dialog")).toBeInTheDocument();
  });

  test("shows a dash for open-trade winrate when there are no closed trades", () => {
    useSymbolStatistics.mockReturnValue({
      data: [
        {
          symbol: "TESTUSDT",
          total_trades: 0,
          win_rate: 0,
          long_count: 0,
          short_count: 0,
          long_win_rate: 0,
          short_win_rate: 0,
        },
      ],
      loading: false,
      error: null,
    });

    renderWithProviders(
      <OperationsTable
        operations={[
          {
            symbol: "TESTUSDT",
            side: "LONG",
            positionAmt: "1",
            unrealizedProfit: "0",
            updateTime: Date.now(),
          },
        ]}
        title="Open Trades"
        isOpenTrades
      />,
    );

    expect(screen.getByText("Win Rate")).toBeInTheDocument();
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(screen.queryByText("0.0%")).not.toBeInTheDocument();
  });

  test("shows only recent closed trades and omits their closing reason", async () => {
    getClosedTradesPreview.mockResolvedValue({
      limit: 10,
      summary: { total_trades: 123, total_pnl: 456.78 },
      closed_trades: [
        {
          symbol: "CLOSED01USDT",
          side: "long",
          pnl: 12.5,
          result: "win",
          opened_at: "2026-10-20T12:00:00Z",
          timestamp: "2026-10-20T12:00:00Z",
          closed_at: "2026-10-20T13:00:00Z",
          scanner_info: { scanner: "Cipher Desk" },
        },
        {
          symbol: "CLOSED02USDT",
          side: "short",
          pnl: -4.25,
          result: "loss",
          opened_at: "2026-10-19T12:00:00Z",
          timestamp: "2026-10-19T12:00:00Z",
          closed_at: "2026-10-19T13:00:00Z",
          scanner_info: { scanner: "Cipher Desk" },
        },
      ],
    });

    const { container } = renderWithProviders(
      <OperationsTable
        operations={[]}
        title="Closed Trades (last 10)"
        protectedClosedMode
      />,
    );

    expect(
      screen.getByRole("button", { name: "Closed Trades (last 10)" }),
    ).toHaveAttribute("aria-expanded", "true");
    expect(await screen.findByText("CLOSED01USDT")).toBeInTheDocument();
    expect(screen.getByText("CLOSED02USDT")).toBeInTheDocument();
    expect(screen.getByText("Close date")).toBeInTheDocument();
    expect(screen.getByText("Scanner")).toBeInTheDocument();
    expect(screen.queryByText("Win Rate")).not.toBeInTheDocument();
    expect(screen.queryByText("Reason")).not.toBeInTheDocument();
    const summaryRow = container.querySelector(
      ".operations-table__closed-summary",
    );
    expect(
      summaryRow.querySelector(".operations-table__closed-total"),
    ).toHaveClass("operations-table__closed-total--positive");
    expect(summaryRow).toHaveTextContent("Historical realized PnL: +$456.78");
    expect(summaryRow).toHaveTextContent("Total historical trades: 123");
    expect(
      container.querySelectorAll(".operations-table--closed tbody tr"),
    ).toHaveLength(2);
    expect(
      container.querySelector(
        ".operations-table--closed tbody tr",
      ).children,
    ).toHaveLength(7);
    expect(getClosedTradesPreview).toHaveBeenCalledOnce();
  });

  test("embeds the closed trade preview at the end of the real trades accordion", async () => {
    getClosedTradesPreview.mockClear();
    getOpenTradesPreview.mockResolvedValue({
      open_count: 0,
      long_count: 0,
      short_count: 0,
      positions: [],
      total_tp_target: 0,
      pnl_percentage: null,
      revealed_trade_index: null,
      revealed_trade: null,
    });
    getClosedTradesPreview.mockResolvedValue({
      limit: 10,
      summary: { total_trades: 1, total_pnl: 12.5 },
      closed_trades: [
        {
          symbol: "CLOSED01USDT",
          side: "long",
          pnl: 12.5,
          result: "win",
          opened_at: "2026-10-20T12:00:00Z",
          timestamp: "2026-10-20T12:00:00Z",
          closed_at: "2026-10-20T13:00:00Z",
          scanner_info: { scanner: "Cipher Desk" },
        },
      ],
    });

    const { container } = renderWithProviders(
      <OperationsTable
        operations={[]}
        title="Real Trades Data"
        isOpenTrades
        protectedMode
        includeProtectedClosedPreview
      />,
    );

    expect(
      screen.getByRole("button", { name: "Real Trades Data" }),
    ).toHaveAttribute("aria-expanded", "true");
    const closedTradesToggle = screen.getByRole("button", {
      name: "Closed Trades (last 10)",
    });
    expect(closedTradesToggle).toHaveAttribute("aria-expanded", "false");
    expect(await screen.findByText("Historical realized PnL")).toBeInTheDocument();
    const realizedSummary = container.querySelector(
      ".MuiAccordionSummary-root .protected-realized-summary",
    );
    expect(realizedSummary).toHaveTextContent("Historical realized PnL +$12.50");
    expect(realizedSummary).toHaveTextContent("Total historical trades: 1");
    expect(
      container.querySelector(".MuiAccordionDetails-root"),
    ).not.toContainElement(realizedSummary);
    expect(container.querySelector(".protected-realized-summary")).toBeInTheDocument();
    expect(
      realizedSummary.compareDocumentPosition(
        container.querySelector(".protected-open-trades-summary"),
      ) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
    expect(container.querySelectorAll(".MuiAccordion-root")).toHaveLength(2);

    const tables = container.querySelectorAll(".operations-table");
    expect(tables).toHaveLength(2);
    expect(tables[0]).toHaveClass("operations-table--open");
    expect(tables[1]).toHaveClass("operations-table--closed");
    expect(container.querySelector(".operations-table__embedded-accordion"))
      .toBeInTheDocument();

    const realTradesToggle = screen.getByRole("button", {
      name: "Real Trades Data",
    });
    fireEvent.click(closedTradesToggle);
    expect(closedTradesToggle).toHaveAttribute("aria-expanded", "true");
    expect(realTradesToggle).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(closedTradesToggle);
    expect(closedTradesToggle).toHaveAttribute("aria-expanded", "false");
    expect(
      container.querySelector(".operations-table__closed-summary"),
    ).not.toBeInTheDocument();
    expect(getClosedTradesPreview).toHaveBeenCalledOnce();
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

  test("handles open trades mode", async () => {
    getPriceHistory.mockResolvedValue({ data: [] });
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
    expect(screen.getByText("Unrealized PnL")).toBeInTheDocument();
    expect(screen.getByText("Chart")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "View BTCUSDT chart" }));
    const chartDialog = await screen.findByRole("dialog", { name: "BTCUSDT" });
    expect(chartDialog).toBeInTheDocument();
    expect(chartDialog.closest(".chart-backdrop").parentElement).toBe(
      document.body,
    );
    expect(screen.getByText("Entry:")).toBeInTheDocument();
    expect(screen.getByText("Floating PnL:")).toBeInTheDocument();
    await waitFor(() => {
      expect(getPriceHistory).toHaveBeenCalledWith("BTCUSDT", "3m", 120);
    });
    fireEvent.click(screen.getByRole("button", { name: "Close chart" }));
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  test("keeps the open-trade layout when there are no positions", () => {
    renderWithProviders(
      <OperationsTable
        operations={[]}
        title="Open Trades"
        isOpenTrades
      />,
    );

    expect(screen.getByText("Unrealized PnL")).toBeInTheDocument();
    expect(screen.getByText("TP Target")).toBeInTheDocument();
    expect(screen.getByText("No operations found.")).toBeInTheDocument();
    expect(screen.getByText("Chart")).toBeInTheDocument();
  });

  test("emphasizes PnL and right-aligns numeric open-trade columns", () => {
    const { container } = renderWithProviders(
      <OperationsTable
        operations={[
          {
            id: 1,
            symbol: "BTCUSDT",
            side: "LONG",
            unrealizedProfit: "100",
            updateTime: "2024-01-01T10:00:00Z",
            take_profit_target: { ratio: 2.5, value_usd: 50 },
          },
        ]}
        title="Open Trades"
        isOpenTrades
      />,
    );

    expect(
      container.querySelector(".operations-table__pnl-head"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".operations-table__pnl-cell"),
    ).toBeInTheDocument();
    expect(
      container.querySelector(".operations-table__numeric-head"),
    ).toBeInTheDocument();
    expect(
      container.querySelectorAll(".operations-table__numeric-cell"),
    ).toHaveLength(3);
    expect(
      container.querySelector("tfoot .operations-table__numeric-cell"),
    ).toBeInTheDocument();
  });

  test("shows configured side limits as compact semantic badges", () => {
    renderWithProviders(
      <OperationsTable
        operations={[]}
        title="Open Trades"
        isOpenTrades
        binanceCount={0}
        config={{
          limits: { max_long_trades: 12, max_short_trades: 8 },
          side_config: { allowed_side: "both" },
        }}
      />,
    );

    expect(screen.getByText("LONG")).toBeInTheDocument();
    expect(screen.getByText("SHORT")).toBeInTheDocument();
    expect(screen.getByText("12")).toBeInTheDocument();
    expect(screen.getByText("8")).toBeInTheDocument();
    expect(document.querySelector(".position-limit--long")).toBeInTheDocument();
    expect(document.querySelector(".position-limit--short")).toBeInTheDocument();
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

    // Probar ordenamiento por PnL
    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

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
    const pnlHeader = screen.getByText("Unrealized PnL");
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
    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

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
    const pnlHeader = screen.getByText("PnL");
    fireEvent.click(pnlHeader);

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
    const timeHeader = screen.getByText("Open Time");
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
      {
        id: 4,
        symbol: "XRPUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "0",
        updateTime: Date.now(),
        take_profit_target: { ratio: 3, value_usd: 60 },
        positionAmt: "2",
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
    const numericTarget = screen.getByText((content) =>
      content.includes("2.50")
    );
    expect(numericTarget).toBeInTheDocument();
    expect(numericTarget).toHaveStyle({ color: "var(--muted)" });
    expect(
      screen.getByText((content) => content.includes("1.50"))
    ).toBeInTheDocument();
    expect(
      screen.getByText((content) => content.includes("3.00"))
    ).toBeInTheDocument();
    expect(
      screen.getAllByText((content) => content.includes("50.00")).length
    ).toBeGreaterThan(0);
    expect(
      screen.getAllByText((content) => content.includes("60.00")).length
    ).toBeGreaterThan(0);
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

  test("maneja valores no numéricos, string vacía, null, undefined en entry price", () => {
    const ops = [
      {
        id: 1,
        symbol: "BTCUSDT",
        side: "LONG",
        entryPrice: "100",
        unrealizedProfit: "10",
        updateTime: Date.now(),
        positionAmt: "0.001",
      },
      {
        id: 2,
        symbol: "ETHUSDT",
        side: "SHORT",
        entryPrice: "",
        unrealizedProfit: "-5",
        updateTime: Date.now(),
        positionAmt: "-0.01",
      },
      {
        id: 3,
        symbol: "ADAUSDT",
        side: "LONG",
        entryPrice: null,
        unrealizedProfit: "0",
        updateTime: Date.now(),
        positionAmt: "100",
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
        take_profit_target: { ratio: 3, value_usd: 25 },
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
    const footerCells = screen
      .getByText((content) => content.includes("Total:"))
      .closest("tr")
      .querySelectorAll("td");
    expect(footerCells[0]).toHaveAttribute("colspan", "2");
    expect(footerCells[1]).toContainElement(
      screen.getByText((content) => content.includes("Total:"))
    );
    expect(footerCells[2]).toHaveTextContent(/Target:/);
    expect(footerCells[2]).toHaveStyle({ color: "var(--muted)" });
    expect(footerCells[3]).toHaveAttribute("colspan", "3");
  });
});
