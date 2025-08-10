import React from "react";
import { render, screen } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import WinrateChart from "../WinrateChart";

const theme = createTheme();

const renderWithTheme = (component) => {
  return render(<ThemeProvider theme={theme}>{component}</ThemeProvider>);
};

describe("WinrateChart", () => {
  const mockOperations = [
    { pnl: 100, side: "LONG" },
    { pnl: -50, side: "LONG" },
    { pnl: 75, side: "SHORT" },
    { pnl: -25, side: "SHORT" },
    { pnl: 200, side: "LONG" },
    { pnl: -100, side: "SHORT" },
  ];

  test("renders winrate chart with title", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    expect(screen.getByText("Winrate")).toBeInTheDocument();
  });

  test("renders description when hideDescription is false", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    expect(
      screen.getByText(/Winrate is the percentage of profitable trades/)
    ).toBeInTheDocument();
  });

  test("hides description when hideDescription is true", () => {
    renderWithTheme(
      <WinrateChart operations={mockOperations} hideDescription />
    );
    expect(
      screen.queryByText(/Winrate is the percentage of profitable trades/)
    ).not.toBeInTheDocument();
  });

  test("displays total winrate correctly", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    // 3 wins out of 6 trades = 50%
    expect(screen.getByText("50%")).toBeInTheDocument();
  });

  test("displays long winrate correctly", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    // 2 wins out of 3 long trades = 66.7%
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  test("displays short winrate correctly", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    // 1 win out of 3 short trades = 33.3%
    expect(screen.getByText("33.3%")).toBeInTheDocument();
  });

  test("handles empty operations array", () => {
    renderWithTheme(<WinrateChart operations={[]} />);
    expect(screen.getAllByText("-")).toHaveLength(3); // Total, Long, Short
  });

  test("handles operations without side information", () => {
    const operationsWithoutSide = [{ pnl: 100 }, { pnl: -50 }, { pnl: 75 }];
    renderWithTheme(<WinrateChart operations={operationsWithoutSide} />);
    // Should still calculate total winrate (2 wins out of 3 trades = 66.7%)
    expect(screen.getByText("66.7%")).toBeInTheDocument();
  });

  test("displays all three sections: Total, Longs, Shorts", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    expect(screen.getByText("Total")).toBeInTheDocument();
    expect(screen.getByText("Longs")).toBeInTheDocument();
    expect(screen.getByText("Shorts")).toBeInTheDocument();
  });

  test("uses backend winrates when provided", () => {
    const backendWinrates = {
      total: 75.0,
      long: 80.0,
      short: 70.0,
    };

    renderWithTheme(
      <WinrateChart operations={[]} winrates={backendWinrates} />
    );

    expect(screen.getByText("75%")).toBeInTheDocument();
    expect(screen.getByText("80%")).toBeInTheDocument();
    expect(screen.getByText("70%")).toBeInTheDocument();
  });

  test("falls back to local calculation when backend winrates are not provided", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);
    // Should still calculate from operations (3 wins out of 6 trades = 50%)
    expect(screen.getByText("50%")).toBeInTheDocument();
  });
});
