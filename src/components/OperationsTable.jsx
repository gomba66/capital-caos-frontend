import React from "react";
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

function formatDate(date) {
  if (!date) return "-";
  if (typeof date === "number") {
    // ms timestamp
    return new Date(date).toLocaleString();
  }
  if (typeof date === "string" && !isNaN(Date.parse(date))) {
    return new Date(date).toLocaleString();
  }
  return date;
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

export default function OperationsTable({ operations, title }) {
  // Detect if open_trades format (Binance) or closed trades (tracker)
  const isOpenTrades =
    operations &&
    operations.length > 0 &&
    operations[0].positionAmt !== undefined;

  return (
    <>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Side</TableCell>
              <TableCell>Entry</TableCell>
              <TableCell>{isOpenTrades ? "Unrealized PnL" : "PnL"}</TableCell>
              <TableCell>{isOpenTrades ? "Leverage" : "Status"}</TableCell>
              <TableCell>
                {isOpenTrades ? "Tiempo abierto" : "Open date"}
              </TableCell>
              <TableCell>{isOpenTrades ? "" : "Close date"}</TableCell>
              {!isOpenTrades && <TableCell>Resultado</TableCell>}
              {isOpenTrades && <TableCell>TP Target</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {operations && operations.length > 0 ? (
              operations.map((op, idx) => (
                <TableRow key={idx}>
                  <TableCell>{op.symbol || "-"}</TableCell>
                  <TableCell style={getSideStyle(op.side || op.positionSide)}>
                    {op.side || op.positionSide || "-"}
                  </TableCell>
                  <TableCell>
                    {formatNumber(op.entry || op.entryPrice)}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades
                      ? formatUnrealizedProfit(op.unrealizedProfit)
                      : formatNumber(op.pnl)}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades ? op.leverage || "-" : op.status || "-"}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades
                      ? getDurationString(op.updateTime)
                      : formatDate(op.timestamp || op.openTime)}
                  </TableCell>
                  <TableCell>
                    {isOpenTrades
                      ? ""
                      : formatDate(op.closed_at || op.closeTime)}
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
                              {op.take_profit_target.ratio}x
                            </Typography>
                            {op.take_profit_target.value_usd && (
                              <Typography
                                variant="caption"
                                style={{ color: "#2de2a6" }}
                              >
                                (~${op.take_profit_target.value_usd})
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ fontWeight: 600, color: "#2de2e6" }}
                          >
                            {op.take_profit_target}x
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
        </Table>
      </TableContainer>
    </>
  );
}
