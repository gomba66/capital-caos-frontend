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
    { result: "win" },
    { result: "win" },
    { result: "loss" },
    { result: "win" },
    { result: "loss" },
  ];

  test("renders winrate chart with title", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    expect(
      screen.getByText(
        /This chart shows the number of winning and losing trades/
      )
    ).toBeInTheDocument();
  });

  test("renders message when no operations", () => {
    renderWithTheme(<WinrateChart operations={[]} />);

    expect(
      screen.getByText("No closed trades to display winrate.")
    ).toBeInTheDocument();
  });

  test("renders message when operations is null", () => {
    renderWithTheme(<WinrateChart operations={null} />);

    expect(
      screen.getByText("No closed trades to display winrate.")
    ).toBeInTheDocument();
  });

  test("renders chart with operations data", () => {
    renderWithTheme(<WinrateChart operations={mockOperations} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    // Verificar que el chart se renderiza
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with only wins", () => {
    const onlyWins = [{ result: "win" }, { result: "win" }, { result: "win" }];

    renderWithTheme(<WinrateChart operations={onlyWins} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with only losses", () => {
    const onlyLosses = [
      { result: "loss" },
      { result: "loss" },
      { result: "loss" },
    ];

    renderWithTheme(<WinrateChart operations={onlyLosses} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with mixed results", () => {
    const mixedResults = [
      { result: "win" },
      { result: "loss" },
      { result: "win" },
      { result: "loss" },
      { result: "win" },
    ];

    renderWithTheme(<WinrateChart operations={mixedResults} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations with invalid results", () => {
    const invalidResults = [
      { result: "win" },
      { result: "invalid" },
      { result: "loss" },
      { result: "unknown" },
    ];

    renderWithTheme(<WinrateChart operations={invalidResults} />);

    expect(screen.getByText("Winrate")).toBeInTheDocument();
    expect(
      document.querySelector(".recharts-responsive-container")
    ).toBeInTheDocument();
  });

  test("handles operations without result field", () => {
    const operationsWithoutResult = [
      { symbol: "BTCUSDT" },
      { symbol: "ETHUSDT" },
    ];

    renderWithTheme(<WinrateChart operations={operationsWithoutResult} />);

    expect(
      screen.getByText("No closed trades to display winrate.")
    ).toBeInTheDocument();
  });
});
