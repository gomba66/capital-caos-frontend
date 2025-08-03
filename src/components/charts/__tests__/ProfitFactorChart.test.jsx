import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import ProfitFactorChart from "../ProfitFactorChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("ProfitFactorChart", () => {
  const mockOperations = [
    {
      side: "LONG",
      pnl: 100,
    },
    {
      side: "LONG",
      pnl: -50,
    },
    {
      side: "SHORT",
      pnl: 75,
    },
    {
      side: "SHORT",
      pnl: -25,
    },
  ];

  test("renders profit factor chart with title", () => {
    renderWithTheme(<ProfitFactorChart operations={mockOperations} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(
      screen.getByText(
        /Profit factor is the ratio between gross profits and gross losses/
      )
    ).toBeInTheDocument();
  });

  test("renders profit factor chart without description when hideDescription is true", () => {
    renderWithTheme(
      <ProfitFactorChart operations={mockOperations} hideDescription={true} />
    );

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(
      screen.queryByText(
        /Profit factor is the ratio between gross profits and gross losses/
      )
    ).not.toBeInTheDocument();
  });

  test("renders profit factor values", () => {
    renderWithTheme(<ProfitFactorChart operations={mockOperations} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with only long trades", () => {
    const onlyLongTrades = [
      {
        side: "LONG",
        pnl: 100,
      },
      {
        side: "LONG",
        pnl: -50,
      },
    ];

    renderWithTheme(<ProfitFactorChart operations={onlyLongTrades} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with only short trades", () => {
    const onlyShortTrades = [
      {
        side: "SHORT",
        pnl: 75,
      },
      {
        side: "SHORT",
        pnl: -25,
      },
    ];

    renderWithTheme(<ProfitFactorChart operations={onlyShortTrades} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with mixed side formats", () => {
    const operationsWithMixedFormats = [
      {
        side: "long",
        pnl: 100,
      },
      {
        side: "SHORT",
        pnl: -50,
      },
      {
        side: "Long",
        pnl: 75,
      },
    ];

    renderWithTheme(
      <ProfitFactorChart operations={operationsWithMixedFormats} />
    );

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
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

    renderWithTheme(<ProfitFactorChart operations={operationsWithStringPnl} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with missing pnl", () => {
    const operationsWithMissingPnl = [
      {
        side: "LONG",
        pnl: 100,
      },
      {
        side: "SHORT",
        // Sin pnl
      },
    ];

    renderWithTheme(
      <ProfitFactorChart operations={operationsWithMissingPnl} />
    );

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with all positive pnl", () => {
    const operationsWithAllPositive = [
      {
        side: "LONG",
        pnl: 100,
      },
      {
        side: "SHORT",
        pnl: 50,
      },
    ];

    renderWithTheme(
      <ProfitFactorChart operations={operationsWithAllPositive} />
    );

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles operations with all negative pnl", () => {
    const operationsWithAllNegative = [
      {
        side: "LONG",
        pnl: -100,
      },
      {
        side: "SHORT",
        pnl: -50,
      },
    ];

    renderWithTheme(
      <ProfitFactorChart operations={operationsWithAllNegative} />
    );

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles empty operations", () => {
    renderWithTheme(<ProfitFactorChart operations={[]} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });

  test("handles null operations", () => {
    renderWithTheme(<ProfitFactorChart operations={null} />);

    expect(screen.getByText("Profit Factor")).toBeInTheDocument();
    expect(screen.getByText("Total")).toBeInTheDocument();
  });
});
