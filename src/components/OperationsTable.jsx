import React, { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
} from "@mui/material";
import { DateTime } from "luxon";

function formatDate(date, timeZone) {
  if (!date) return "-";
  if (typeof date === "number") {
    // ms timestamp
    return DateTime.fromMillis(date)
      .setZone(timeZone)
      .toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
  }
  let dt = DateTime.fromISO(date, { zone: "utc" });
  if (!dt.isValid) {
    dt = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
  }
  if (!dt.isValid) return date;
  return dt
    .setZone(timeZone)
    .toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
}

function formatNumber(val, decimals = 4) {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toFixed(decimals);
}

function formatUnrealizedProfit(val) {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  const isPositive = num > 0;
  const isNegative = num < 0;
  const color = isPositive ? "#2de2a6" : isNegative ? "#ff2e63" : undefined;
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}${Math.abs(num).toFixed(2)}
    </span>
  );
}

function formatClosedPnL(val) {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  const isPositive = num > 0;
  const isNegative = num < 0;
  const color = isPositive ? "#2de2a6" : isNegative ? "#ff2e63" : undefined;
  const sign = isPositive ? "+" : isNegative ? "-" : "";
  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}${Math.abs(num).toFixed(2)}
    </span>
  );
}

function getSideStyle(side) {
  if (!side) return {};
  const s = side.toLowerCase();
  if (s.includes("short")) return { color: "#ff2e63", fontWeight: 700 };
  if (s.includes("long")) return { color: "#2de2a6", fontWeight: 700 };
  return { fontWeight: 700 };
}

function getDurationString(start) {
  if (!start) return "-";
  const startTime = typeof start === "number" ? start : Date.parse(start);
  if (isNaN(startTime)) return "-";
  const now = Date.now();
  let diff = Math.floor((now - startTime) / 1000); // en segundos
  const hours = Math.floor(diff / 3600);
  diff %= 3600;
  const minutes = Math.floor(diff / 60);
  const seconds = diff % 60;
  return `${hours > 0 ? hours + "h " : ""}${minutes}m ${seconds}s`;
}

function getWinLoss(pnl) {
  if (pnl === undefined || pnl === null) return "-";
  const num = Number(pnl);
  if (isNaN(num)) return "-";
  if (num > 0)
    return <span style={{ color: "#2de2a6", fontWeight: 700 }}>WIN</span>;
  if (num < 0)
    return <span style={{ color: "#ff2e63", fontWeight: 700 }}>LOSS</span>;
  return <span style={{ color: "#aaa", fontWeight: 700 }}>FLAT</span>;
}

export default function OperationsTable({ operations, title, timeZone }) {
  // Detect if open_trades format (Binance) or closed trades (tracker)
  const isOpenTrades =
    operations &&
    operations.length > 0 &&
    operations[0].positionAmt !== undefined;

  // Estado para ordenamiento
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

  // Función para ordenar
  function handleSort(col) {
    if (orderBy === col) {
      setOrder(order === "asc" ? "desc" : "asc");
    } else {
      setOrderBy(col);
      setOrder("asc");
    }
  }

  function getComparator(col) {
    return (a, b) => {
      let aVal = a[col];
      let bVal = b[col];
      // Si es PnL, usar unrealizedProfit o pnl
      if (col === "pnl") {
        aVal = isOpenTrades ? Number(a.unrealizedProfit) : Number(a.pnl);
        bVal = isOpenTrades ? Number(b.unrealizedProfit) : Number(b.pnl);
      }
      if (aVal === undefined || aVal === null) return 1;
      if (bVal === undefined || bVal === null) return -1;
      if (typeof aVal === "string" && !isNaN(Number(aVal))) aVal = Number(aVal);
      if (typeof bVal === "string" && !isNaN(Number(bVal))) bVal = Number(bVal);
      if (aVal < bVal) return order === "asc" ? -1 : 1;
      if (aVal > bVal) return order === "asc" ? 1 : -1;
      return 0;
    };
  }

  let sortedOps = operations;
  if (orderBy) {
    sortedOps = [...operations].sort(getComparator(orderBy));
  }

  // Sumatoria de PnL para open trades
  const totalPnL = isOpenTrades
    ? operations.reduce(
        (acc, op) => acc + (Number(op.unrealizedProfit) || 0),
        0
      )
    : null;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell
                onClick={() => handleSort("symbol")}
                style={{ cursor: "pointer" }}
              >
                Symbol
              </TableCell>
              <TableCell
                onClick={() => handleSort("side")}
                style={{ cursor: "pointer" }}
              >
                Side
              </TableCell>
              <TableCell
                onClick={() => handleSort("entryPrice")}
                style={{ cursor: "pointer" }}
              >
                Entry
              </TableCell>
              <TableCell
                onClick={() => handleSort("pnl")}
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades ? "Unrealized PnL" : "PnL"}
              </TableCell>

              <TableCell
                onClick={() =>
                  handleSort(isOpenTrades ? "updateTime" : "timestamp")
                }
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades ? "Tiempo abierto" : "Open date"}
              </TableCell>
              <TableCell
                onClick={() => handleSort(isOpenTrades ? "" : "closeTime")}
                style={{ cursor: isOpenTrades ? undefined : "pointer" }}
              >
                {isOpenTrades ? "" : "Close date"}
              </TableCell>
              {!isOpenTrades && (
                <TableCell
                  onClick={() => handleSort("pnl")}
                  style={{ cursor: "pointer" }}
                >
                  Result
                </TableCell>
              )}
              {isOpenTrades && <TableCell>TP Target</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOps && sortedOps.length > 0 ? (
              sortedOps.map((op, idx) => (
                <TableRow key={idx}>
                  <TableCell>{op.symbol || "-"}</TableCell>
                  <TableCell style={getSideStyle(op.side || op.positionSide)}>
                    {op.side || op.positionSide || "-"}
                    {op.protected && (
                      <span title="Protected" style={{ marginLeft: 6 }}>
                        🔒
                      </span>
                    )}
                  </TableCell>
                  <TableCell>
                    {formatNumber(op.entry || op.entryPrice)}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades
                      ? formatUnrealizedProfit(op.unrealizedProfit)
                      : formatClosedPnL(op.pnl)}
                  </TableCell>

                  <TableCell>
                    {isOpenTrades
                      ? getDurationString(op.updateTime)
                      : formatDate(op.timestamp || op.openTime, timeZone)}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades
                      ? ""
                      : formatDate(op.closed_at || op.closeTime, timeZone)}
                  </TableCell>
                  {!isOpenTrades && <TableCell>{getWinLoss(op.pnl)}</TableCell>}
                  {isOpenTrades && (
                    <TableCell>
                      {op.take_profit_target ? (
                        typeof op.take_profit_target === "object" ? (
                          <Box>
                            <Typography
                              variant="body2"
                              sx={{ fontWeight: 600, color: "#2de2e6" }}
                            >
                              {Number(op.take_profit_target.ratio).toFixed(2)}x{" "}
                            </Typography>
                            {op.take_profit_target.value_usd && (
                              <Typography
                                variant="caption"
                                style={{ color: "#2de2a6" }}
                              >
                                (~$
                                {Number(
                                  op.take_profit_target.value_usd
                                ).toFixed(2)}
                                )
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#2de2e6" }}
                          >
                            {Number(op.take_profit_target).toFixed(2)}x{" "}
                          </Typography>
                        )
                      ) : (
                        "-"
                      )}
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={9} align="center">
                  No operations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Total PnL para open trades */}
          {isOpenTrades && (
            <tfoot>
              <TableRow>
                <TableCell colSpan={3} />
                <TableCell
                  style={{
                    fontWeight: 700,
                    color:
                      totalPnL > 0
                        ? "#2de2a6"
                        : totalPnL < 0
                        ? "#ff2e63"
                        : undefined,
                  }}
                >
                  Total: {totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}$
                  {Math.abs(totalPnL).toFixed(2)}
                </TableCell>
                <TableCell colSpan={5} />
              </TableRow>
            </tfoot>
          )}
        </Table>
      </TableContainer>
    </>
  );
}
