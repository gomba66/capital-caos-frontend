import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import LongShortWinLossChart from "../LongShortWinLossChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("LongShortWinLossChart", () => {
  const mockOperations = [
    {
      side: "LONG",
      result: "win",
      pnl: 100,
    },
    {
      side: "LONG",
      result: "loss",
      pnl: -50,
    },
    {
      side: "SHORT",
      result: "win",
      pnl: 75,
    },
    {
      side: "SHORT",
      result: "loss",
      pnl: -25,
    },
  ];

  test("renders long short win loss chart with title", () => {
    renderWithTheme(<LongShortWinLossChart operations={mockOperations} />);

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This chart shows the number of winning and losing trades/
      )
    ).toBeInTheDocument();
  });

  test("renders message when no operations", () => {
    renderWithTheme(<LongShortWinLossChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display long/short win/loss.")
    ).toBeInTheDocument();
  });

  test("renders message when operations is null", () => {
    renderWithTheme(<LongShortWinLossChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display long/short win/loss.")
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<LongShortWinLossChart operations={mockOperations} />);

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with positionSide instead of side", () => {
    const operationsWithPositionSide = [
      {
        positionSide: "LONG",
        result: "win",
        pnl: 100,
      },
      {
        positionSide: "SHORT",
        result: "loss",
        pnl: -50,
      },
    ];

    renderWithTheme(
      <LongShortWinLossChart operations={operationsWithPositionSide} />
    );

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with mixed side formats", () => {
    const operationsWithMixedFormats = [
      {
        side: "long",
        result: "win",
        pnl: 100,
      },
      {
        side: "SHORT",
        result: "loss",
        pnl: -50,
      },
      {
        positionSide: "Long",
        result: "win",
        pnl: 75,
      },
    ];

    renderWithTheme(
      <LongShortWinLossChart operations={operationsWithMixedFormats} />
    );

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with pnl-based win/loss determination", () => {
    const operationsWithPnlOnly = [
      {
        side: "LONG",
        pnl: 100, // Win por PnL positivo
      },
      {
        side: "LONG",
        pnl: -50, // Loss por PnL negativo
      },
      {
        side: "SHORT",
        pnl: 75, // Win por PnL positivo
      },
    ];

    renderWithTheme(
      <LongShortWinLossChart operations={operationsWithPnlOnly} />
    );

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with string pnl values", () => {
    const operationsWithStringPnl = [
      {
        side: "LONG",
        pnl: "100",
      },
      {
        side: "SHORT",
        pnl: "-50.5",
      },
    ];

    renderWithTheme(
      <LongShortWinLossChart operations={operationsWithStringPnl} />
    );

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations without side or positionSide", () => {
    const operationsWithoutSide = [
      {
        pnl: 100,
      },
      {
        pnl: -50,
      },
    ];

    renderWithTheme(
      <LongShortWinLossChart operations={operationsWithoutSide} />
    );

    expect(
      screen.getByText("No closed trades to display long/short win/loss.")
    ).toBeInTheDocument();
  });

  test("handles operations with only long trades", () => {
    const onlyLongTrades = [
      {
        side: "LONG",
        result: "win",
        pnl: 100,
      },
      {
        side: "LONG",
        result: "win",
        pnl: 50,
      },
    ];

    renderWithTheme(<LongShortWinLossChart operations={onlyLongTrades} />);

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with only short trades", () => {
    const onlyShortTrades = [
      {
        side: "SHORT",
        result: "loss",
        pnl: -50,
      },
      {
        side: "SHORT",
        result: "win",
        pnl: 25,
      },
    ];

    renderWithTheme(<LongShortWinLossChart operations={onlyShortTrades} />);

    expect(screen.getByText("Long vs Short Win/Loss")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
