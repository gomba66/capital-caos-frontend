import React from "react";
import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  Skeleton,
} from "@mui/material";
import { calculateProfitFactors } from "../../utils/formatting";
import { convertFromUSDT, formatCurrency } from "../../utils/currencyConverter";
import { useTranslation } from "react-i18next";

const formatWinrate = (value) =>
  value !== null && value !== undefined ? `${Math.round(value)}%` : "—";

const summarizeOperations = (operations, overrides = {}) => {
  const pnl = operations.map((operation) => Number(operation.pnl) || 0);
  const average = pnl.length
    ? pnl.reduce((total, value) => total + value, 0) / pnl.length
    : null;
  return {
    wins: pnl.filter((value) => value > 0).length,
    losses: pnl.filter((value) => value < 0).length,
    average,
    ...overrides,
  };
};

export default function TradePerformanceTable({
  operations,
  winrates,
  stats,
  performanceSummary,
  currency = "USDT",
  hideDescription = false,
  loading = false,
}) {
  const { t } = useTranslation();
  const profitFactors = calculateProfitFactors(operations);
  const directionalStats = {
    total: operations || [],
    long: (operations || []).filter((operation) =>
      String(operation.side || operation.positionSide || "")
        .toLowerCase()
        .includes("long"),
    ),
    short: (operations || []).filter((operation) =>
      String(operation.side || operation.positionSide || "")
        .toLowerCase()
        .includes("short"),
    ),
  };
  const rows = performanceSummary
    ? ["long", "short", "total"].map((direction) => ({
        label: t(`performance.${direction}`),
        profitFactor: performanceSummary[direction]?.profitFactor,
        winrate: performanceSummary[direction]?.winrate,
        operations: [],
        summary: {
          wins: performanceSummary[direction]?.wins ?? 0,
          losses: performanceSummary[direction]?.losses ?? 0,
          average: performanceSummary[direction]?.average ?? null,
        },
      }))
    : [
    {
      label: t("performance.long"),
      profitFactor: profitFactors.long,
      winrate: winrates?.long,
      operations: directionalStats.long,
      summary: summarizeOperations(directionalStats.long),
    },
    {
      label: t("performance.short"),
      profitFactor: profitFactors.short,
      winrate: winrates?.short,
      operations: directionalStats.short,
      summary: summarizeOperations(directionalStats.short),
    },
    {
      label: t("performance.total"),
      profitFactor: profitFactors.total,
      winrate: winrates?.total,
      operations: directionalStats.total,
      summary: summarizeOperations(directionalStats.total, {
        ...(stats?.wins !== undefined ? { wins: stats.wins } : {}),
        ...(stats?.losses !== undefined ? { losses: stats.losses } : {}),
        ...(stats?.average_pnl !== undefined
          ? { average: Number(stats.average_pnl) }
          : {}),
      }),
    },
    ];
  const includeTradeStats = Boolean(stats);

  return (
    <Box
      className={`trade-performance${includeTradeStats ? " trade-performance-compact" : ""}`}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "baseline",
          justifyContent: "space-between",
          gap: 2,
          mb: 1,
        }}
      >
        <Typography variant="h6" sx={{ color: "text.primary" }}>
          {t("performance.title")}
        </Typography>
        {!hideDescription && (
          <Typography variant="caption" color="text.secondary">
            {t("performance.description")}
          </Typography>
        )}
      </Box>
      <TableContainer component={Box}>
        <Table
          size="small"
          aria-label={
            includeTradeStats
              ? t("performance.byDirection")
              : t("performance.pfAndWinRate")
          }
          className={`trade-performance-table${includeTradeStats ? " trade-performance-table--compact" : ""}`}
        >
          <TableHead>
            <TableRow>
              <TableCell scope="col">{t("performance.direction")}</TableCell>
              <TableCell scope="col" align="right">
                {t("performance.profitFactor")}
              </TableCell>
              <TableCell scope="col" align="right">
                {t("performance.winRate")}
              </TableCell>
              {includeTradeStats && (
                <>
                  <TableCell scope="col" align="right">
                    {t("performance.wins")}
                  </TableCell>
                  <TableCell scope="col" align="right">
                    {t("performance.losses")}
                  </TableCell>
                  <TableCell scope="col" align="right">
                    {t("performance.avgPnl")}
                  </TableCell>
                </>
              )}
            </TableRow>
          </TableHead>
          <TableBody aria-busy={loading}>
            {loading ? (
              [0, 1, 2].map((rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  <TableCell
                    component="th"
                    scope="row"
                  >
                    <Skeleton variant="text" width={72} aria-hidden="true" />
                  </TableCell>
                  {Array.from(
                    { length: includeTradeStats ? 5 : 2 },
                    (_, cellIndex) => (
                      <TableCell
                        key={`loading-${rowIndex}-${cellIndex}`}
                        align="right"
                      >
                        <Skeleton
                          variant="text"
                          width={cellIndex === 0 ? 48 : 36}
                          sx={{ ml: "auto" }}
                          aria-hidden="true"
                        />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : rows.map((row) => (
              <TableRow key={row.label}>
                <TableCell component="th" scope="row">
                  {row.label}
                </TableCell>
                <TableCell
                  align="right"
                  data-label={t("performance.profitFactor")}
                >
                  {row.profitFactor !== null && row.profitFactor !== undefined
                    ? row.profitFactor
                    : "—"}
                </TableCell>
                <TableCell
                  align="right"
                  data-label={t("performance.winRate")}
                  sx={{
                    color:
                      row.winrate === null || row.winrate === undefined
                        ? "text.secondary"
                        : row.winrate >= 50
                          ? "success.main"
                          : "error.main",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {formatWinrate(row.winrate)}
                </TableCell>
                {includeTradeStats && (
                  <>
                    <TableCell
                      align="right"
                      data-label={t("performance.wins")}
                    >
                      <span className="performance-win">{row.summary.wins}</span>
                    </TableCell>
                    <TableCell
                      align="right"
                      data-label={t("performance.losses")}
                    >
                      <span className="performance-loss">{row.summary.losses}</span>
                    </TableCell>
                    <TableCell
                      align="right"
                      data-label={t("performance.avgPnl")}
                      className={
                        row.summary.average > 0
                          ? "performance-win"
                          : row.summary.average < 0
                            ? "performance-loss"
                            : undefined
                      }
                    >
                      {row.summary.average !== null
                        ? formatCurrency(
                            convertFromUSDT(row.summary.average, currency),
                            currency,
                          )
                        : "—"}
                    </TableCell>
                  </>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      {includeTradeStats && (
        <Box
          className="trade-performance-summary"
          aria-label={t("performance.tradeStats")}
        >
          <span>
            <b>{t("performance.trades")}</b>{" "}
            {stats.total_trades ?? operations?.length ?? 0}
          </span>
          <span>
            <b>{t("performance.maxWinStreak")}</b>{" "}
            <strong className="performance-win">
              {stats.max_win_streak ?? 0}
            </strong>
          </span>
          <span>
            <b>{t("performance.maxLossStreak")}</b>{" "}
            <strong className="performance-loss">
              {stats.max_loss_streak ?? 0}
            </strong>
          </span>
        </Box>
      )}
    </Box>
  );
}
