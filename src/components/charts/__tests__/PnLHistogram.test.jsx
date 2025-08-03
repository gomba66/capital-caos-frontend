import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import PnLHistogram from "../PnLHistogram";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("PnLHistogram", () => {
  const mockOperations = [
    {
      pnl: 100,
    },
    {
      pnl: -50,
    },
    {
      pnl: 75,
    },
    {
      pnl: -25,
    },
  ];

  test("renders PnL histogram with title", () => {
    renderWithTheme(<PnLHistogram operations={mockOperations} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      screen.getByText(/Distribution of trades by PnL ranges/)
    ).toBeInTheDocument();
  });

  test("renders message when no operations", () => {
    renderWithTheme(<PnLHistogram operations={[]} />);

    expect(
      screen.getByText("No closed trades to display PnL histogram.")
    ).toBeInTheDocument();
  });

  test("renders message when operations is null", () => {
    renderWithTheme(<PnLHistogram operations={null} />);

    expect(
      screen.getByText("No closed trades to display PnL histogram.")
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<PnLHistogram operations={mockOperations} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with string pnl values", () => {
    const operationsWithStringPnl = [
      {
        pnl: "100",
      },
      {
        pnl: "-50.5",
      },
      {
        pnl: "75.25",
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithStringPnl} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with missing pnl", () => {
    const operationsWithMissingPnl = [
      {
        pnl: 100,
      },
      {
        // Sin pnl
      },
      {
        pnl: null,
      },
      {
        pnl: undefined,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithMissingPnl} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with invalid pnl values", () => {
    const operationsWithInvalidPnl = [
      {
        pnl: 100,
      },
      {
        pnl: "invalid",
      },
      {
        pnl: NaN,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithInvalidPnl} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with large range of pnl values", () => {
    const operationsWithLargeRange = [
      {
        pnl: 1000000, // 1M
      },
      {
        pnl: -500000, // -500K
      },
      {
        pnl: 2500000, // 2.5M
      },
      {
        pnl: -1000000, // -1M
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithLargeRange} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with very small pnl values", () => {
    const operationsWithSmallPnl = [
      {
        pnl: 0.01,
      },
      {
        pnl: -0.05,
      },
      {
        pnl: 0.001,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithSmallPnl} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with zero pnl values", () => {
    const operationsWithZeroPnl = [
      {
        pnl: 0,
      },
      {
        pnl: 100,
      },
      {
        pnl: -50,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithZeroPnl} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with all positive pnl", () => {
    const operationsWithAllPositive = [
      {
        pnl: 100,
      },
      {
        pnl: 50,
      },
      {
        pnl: 75,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithAllPositive} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with all negative pnl", () => {
    const operationsWithAllNegative = [
      {
        pnl: -100,
      },
      {
        pnl: -50,
      },
      {
        pnl: -75,
      },
    ];

    renderWithTheme(<PnLHistogram operations={operationsWithAllNegative} />);

    expect(screen.getByText("PnL Distribution")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });
});
