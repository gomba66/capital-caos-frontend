import React from "react";
import { render, screen, within } from "@testing-library/react";
import DashboardMetrics from "../DashboardMetrics";

const defaultProps = {
  totalCapital: 1250.5,
  stats: {
    total_pnl: 100,
    average_pnl: 12.5,
    wins: 7,
    losses: 3,
    max_win_streak: 4,
    max_loss_streak: 2,
    total_trades: 10,
  },
  openTrades: [{ unrealizedProfit: 5.25 }],
  currency: "USDT",
  brokerMode: "paper",
  includeFees: true,
  totalFees: 2,
};

describe("DashboardMetrics", () => {
  test("shows only the three financial metrics", () => {
    render(<DashboardMetrics {...defaultProps} />);

    expect(screen.getAllByRole("listitem")).toHaveLength(3);
    expect(screen.getByText("Total Capital (fees included)")).toBeInTheDocument();
    expect(screen.getByText("Total PnL (net)")).toBeInTheDocument();
    expect(screen.getByText("Unrealized PnL")).toBeInTheDocument();
    const metrics = screen.getAllByRole("listitem");
    const capitalValue = within(metrics[0]).getByText("$1,248.50");
    const totalPnlValue = within(metrics[1]).getByText("+$98.00");
    const unrealizedPnlValue = within(metrics[2]).getByText("+$5.25");
    expect(capitalValue).toHaveClass("dashboard-value-update");
    expect(totalPnlValue).toHaveClass("dashboard-value-update");
    expect(unrealizedPnlValue).toHaveClass("dashboard-value-update");
    expect(screen.getByText("Total Capital (fees included)")).not.toHaveClass(
      "dashboard-value-update",
    );
  });

  test("shows unavailable capital as a dash instead of zero", () => {
    render(<DashboardMetrics {...defaultProps} totalCapital={null} />);

    const capitalMetric = screen.getAllByRole("listitem")[0];
    expect(within(capitalMetric).getByText("—")).toBeInTheDocument();
    expect(within(capitalMetric).queryByText("$0.00")).not.toBeInTheDocument();
  });

  test("hides live PnL when the API is unavailable", () => {
    render(<DashboardMetrics {...defaultProps} apiUnavailable />);

    const metrics = screen.getAllByRole("listitem");
    expect(within(metrics[1]).getByText("—")).toBeInTheDocument();
    expect(within(metrics[2]).getByText("—")).toBeInTheDocument();
  });
});
