import React from "react";
import { Box, Tooltip, Typography } from "@mui/material";
import WarningIcon from "@mui/icons-material/Warning";
import {
  convertFromUSDT,
  formatCurrency,
} from "../utils/currencyConverter";
import { useTranslation } from "react-i18next";

function pnlColor(value) {
  return value > 0 ? "var(--green)" : value < 0 ? "var(--red)" : "var(--ink)";
}

function renderMetric(metric, t) {
  return (
    <Box className="dashboard-metric" role="listitem" key={metric.label}>
      <Box className="dashboard-metric-copy">
        <Typography component="span" className="dashboard-metric-label">
          {metric.label}
        </Typography>
        {metric.detail && (
          <Typography component="span" className="dashboard-metric-detail">
            {metric.detail}
          </Typography>
        )}
      </Box>
      <Box
        component="span"
        className="dashboard-metric-value"
        sx={{ color: metric.color || "var(--ink)" }}
      >
        {metric.warning && (
          <Tooltip
            title={t("metrics.capitalWarning")}
            arrow
            placement="top"
          >
            <WarningIcon
              sx={{
                color: "warning.main",
                fontSize: "1rem",
                cursor: "help",
              }}
            />
          </Tooltip>
        )}
        <span
          key={metric.animationKey ?? metric.value}
          className="dashboard-value-update"
        >
          {metric.value}
        </span>
      </Box>
    </Box>
  );
}

export default function DashboardMetrics({
  totalCapital,
  stats,
  openTrades,
  currency,
  brokerMode,
  includeFees,
  totalFees,
  apiUnavailable = false,
}) {
  const { t } = useTranslation();
  const feesApply =
    !apiUnavailable && brokerMode === "paper" && includeFees;
  const numericTotalPnl = Number(stats?.total_pnl);
  const totalPnl =
    !apiUnavailable &&
    stats?.total_pnl !== undefined &&
    Number.isFinite(numericTotalPnl)
      ? numericTotalPnl - (feesApply ? totalFees : 0)
      : null;
  const unrealizedPnl = apiUnavailable
    ? null
    : openTrades.reduce(
        (total, trade) => total + (Number(trade.unrealizedProfit) || 0),
        0,
      );
  const capitalValue =
    !apiUnavailable && totalCapital !== null
      ? formatCurrency(
          convertFromUSDT(
            totalCapital - (feesApply ? totalFees : 0),
            currency,
          ),
          currency,
        )
      : "—";

  const metrics = [
    {
      label: `${t("metrics.totalCapital")}${
        feesApply ? ` ${t("metrics.feesIncluded")}` : ""
      }`,
      value: capitalValue,
      animationKey: `${currency}:${totalCapital}:${feesApply ? totalFees : 0}`,
      warning: totalCapital === null || apiUnavailable,
      detail:
        feesApply && totalFees > 0
          ? t("metrics.feesDeducted", {
              amount: formatCurrency(
                convertFromUSDT(totalFees, currency),
                currency,
              ),
            })
          : null,
    },
    {
      label: `${t("metrics.totalPnl")}${
        feesApply ? ` ${t("metrics.net")}` : ""
      }`,
      value:
        totalPnl === null
          ? "—"
          : `${totalPnl > 0 ? "+" : ""}${formatCurrency(
              convertFromUSDT(totalPnl, currency),
              currency,
            )}`,
      animationKey: `${currency}:${totalPnl}`,
      color: totalPnl === null ? "var(--ink)" : pnlColor(totalPnl),
      detail:
        feesApply && totalFees > 0
          ? t("metrics.tradingFeesDeducted")
          : null,
    },
    {
      label: t("metrics.unrealizedPnl"),
      value:
        unrealizedPnl === null
          ? "—"
          : `${unrealizedPnl > 0 ? "+" : ""}${formatCurrency(
              convertFromUSDT(unrealizedPnl, currency),
              currency,
            )}`,
      animationKey: `${currency}:${unrealizedPnl}`,
      color: unrealizedPnl === null ? "var(--ink)" : pnlColor(unrealizedPnl),
    },
  ];

  return (
    <Box
      component="section"
      className="dashboard-metrics"
      aria-label={t("metrics.financial")}
    >
      <Box
        className="dashboard-metric-grid dashboard-metric-grid-financial"
        role="list"
      >
        {metrics.map((metric) => renderMetric(metric, t))}
      </Box>
    </Box>
  );
}
