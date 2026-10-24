import React from "react";
import { render, screen, within } from "@testing-library/react";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import TradePerformanceTable from "../TradePerformanceTable";

const renderWithTheme = (component) =>
  render(<ThemeProvider theme={createTheme()}>{component}</ThemeProvider>);

describe("TradePerformanceTable", () => {
  test("combines total, long, and short metrics in one table", () => {
    renderWithTheme(
      <TradePerformanceTable
        operations={[
          { side: "LONG", pnl: 100 },
          { side: "LONG", pnl: -50 },
          { side: "SHORT", pnl: 75 },
          { side: "SHORT", pnl: -25 },
        ]}
        winrates={{ total: 62.5, long: 60, short: 65 }}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Profit factor and win rate by direction",
    });
    expect(within(table).getByText("Direction")).toBeInTheDocument();
    expect(within(table).getByText("Profit Factor")).toBeInTheDocument();
    expect(within(table).getByText("Win Rate")).toBeInTheDocument();
    expect(within(table).getByText("Total")).toBeInTheDocument();
    expect(within(table).getByText("Long")).toBeInTheDocument();
    expect(within(table).getByText("Short")).toBeInTheDocument();
    expect(within(table).getByText("63%")).toBeInTheDocument();
    expect(within(table).getByText("60%")).toBeInTheDocument();
    expect(within(table).getByText("65%")).toBeInTheDocument();
    expect(
      Array.from(table.querySelectorAll("tbody th")).map((cell) =>
        cell.textContent.trim(),
      ),
    ).toEqual(["Long", "Short", "Total"]);
  });

  test("renders unavailable values clearly", () => {
    renderWithTheme(<TradePerformanceTable operations={[]} />);

    const table = screen.getByRole("table", {
      name: "Profit factor and win rate by direction",
    });
    expect(within(table).getAllByText("—")).toHaveLength(6);
  });

  test("can omit the descriptive subtitle", () => {
    renderWithTheme(<TradePerformanceTable hideDescription />);

    expect(
      screen.queryByText("Profit factor and win rate by direction"),
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("table", {
        name: "Profit factor and win rate by direction",
      }),
    ).toBeInTheDocument();
  });

  test("combines directional trade statistics into a compact performance table", () => {
    renderWithTheme(
      <TradePerformanceTable
        operations={[
          { side: "LONG", pnl: 100 },
          { side: "LONG", pnl: -50 },
          { side: "SHORT", pnl: 75 },
          { side: "SHORT", pnl: -25 },
        ]}
        winrates={{ total: 50, long: 50, short: 50 }}
        stats={{
          total_trades: 4,
          max_win_streak: 3,
          max_loss_streak: 2,
        }}
      />,
    );

    const table = screen.getByRole("table", {
      name: "Trading performance by direction",
    });
    expect(within(table).getByText("Wins")).toBeInTheDocument();
    expect(within(table).getByText("Losses")).toBeInTheDocument();
    expect(within(table).getByText("Avg PnL")).toBeInTheDocument();
    expect(within(table).getAllByText("$25.00")).toHaveLength(3);
    expect(table.querySelectorAll("[data-label]")).toHaveLength(15);
    expect(screen.getByText("MAX WIN STREAK")).toBeInTheDocument();
    expect(screen.getByText("MAX LOSS STREAK")).toBeInTheDocument();
    expect(screen.getByText("TRADES")).toBeInTheDocument();
  });
});
