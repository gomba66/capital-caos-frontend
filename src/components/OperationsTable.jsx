import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
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
  IconButton,
  Tooltip,
} from "@mui/material";
import { ShowChart } from "@mui/icons-material";
import { DateTime } from "luxon";

import ScannerInfo from "./ScannerInfo";
import { convertFromUSDT, formatCurrency } from "../utils/currencyConverter";
import { useSymbolStatistics } from "../hooks/useSymbolStatistics";

function formatReason(reason) {
  if (!reason) return "-";
  const r = String(reason).toUpperCase();
  if (r.includes("TP_DINAM")) return "Take Profit";
  if (r.includes("TAKE") && r.includes("PROFIT")) return "Take Profit";
  if (r.includes("SL") || r.includes("STOP")) return "Stop Loss";
  if (r.includes("MANUAL")) return "Manual Close";
  if (r.includes("BINANCE")) return "Exchange Close";
  return String(reason);
}

function formatDate(date, timeZone) {
  if (!date) return "-";
  if (typeof date === "number") {
    // ms timestamp
    return DateTime.fromMillis(date)
      .setZone(timeZone)
      .toFormat("dd/MM/yy - h:mm:ss a");
  }
  let dt = DateTime.fromISO(date, { zone: "utc" });
  if (!dt.isValid) {
    dt = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
  }
  if (!dt.isValid) return date;
  return dt.setZone(timeZone).toFormat("dd/MM/yy - h:mm:ss a");
}

function formatNumber(val, decimals = 4) {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toFixed(decimals);
}

function formatUnrealizedProfit(val, currency = "USDT") {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  const isPositive = num > 0;
  const isNegative = num < 0;
  const color = isPositive ? "#2de2a6" : isNegative ? "#ff2e63" : undefined;

  // Convertir de USDT a la moneda seleccionada
  const convertedValue = convertFromUSDT(Math.abs(num), currency);
  const formattedValue = formatCurrency(convertedValue, currency);
  const sign = isPositive ? "+" : isNegative ? "-" : "";

  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}
      {formattedValue}
      {currency !== "USDT" && (
        <>
          {" "}
          <span style={{ color: "#aaa", fontWeight: 400, fontSize: "0.9em" }}>
            ({currency})
          </span>
        </>
      )}
    </span>
  );
}

function formatClosedPnL(val, currency = "USDT") {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  const isPositive = num > 0;
  const isNegative = num < 0;
  const color = isPositive ? "#2de2a6" : isNegative ? "#ff2e63" : undefined;

  // Convertir de USDT a la moneda seleccionada
  const convertedValue = convertFromUSDT(Math.abs(num), currency);
  const formattedValue = formatCurrency(convertedValue, currency);
  const sign = isPositive ? "+" : isNegative ? "-" : "";

  return (
    <span style={{ color, fontWeight: 600 }}>
      {sign}
      {formattedValue}
      {currency !== "USDT" && (
        <>
          {" "}
          <span style={{ color: "#aaa", fontWeight: 400, fontSize: "0.9em" }}>
            ({currency})
          </span>
        </>
      )}
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

function formatSide(side) {
  if (!side) return "-";
  const s = side.toLowerCase();
  if (s.includes("short")) return "SHORT";
  if (s.includes("long")) return "LONG";
  return side.toUpperCase();
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

export default function OperationsTable({
  operations,
  title,
  timeZone,
  binanceCount,
  dbCount,
  simplifiedView = false,
  config = null,
}) {
  const navigate = useNavigate();
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });

  // Fetch all symbol statistics for performance data
  const { data: symbolStats, loading: statsLoading } = useSymbolStatistics();

  // Create a map for quick lookup of symbol stats
  const symbolStatsMap = React.useMemo(() => {
    if (!symbolStats || !Array.isArray(symbolStats)) return {};
    return symbolStats.reduce((acc, stat) => {
      acc[stat.symbol] = stat;
      return acc;
    }, {});
  }, [symbolStats]);

  // Escuchar cambios en la moneda desde localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newCurrency = localStorage.getItem("capitalCurrency") || "USDT";
      setCurrency(newCurrency);
    };

    const handleCurrencyChange = () => {
      handleStorageChange();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChange", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChange", handleCurrencyChange);
    };
  }, []);

  // Detect if open_trades format (Binance) or closed trades (tracker)
  const isOpenTrades =
    operations &&
    operations.length > 0 &&
    (operations[0].positionAmt !== undefined ||
      operations[0].status === "open");

  // Estado para ordenamiento
  const [orderBy, setOrderBy] = useState(null);
  const [order, setOrder] = useState("asc");

  // Función para navegar al gráfico de trading
  const handleSymbolClick = (symbol) => {
    navigate(`/trading-chart/${symbol}`);
  };

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
        aVal = isOpenTrades
          ? Number(a.unrealizedProfit || a.unRealizedProfit)
          : Number(a.pnl);
        bVal = isOpenTrades
          ? Number(b.unrealizedProfit || b.unRealizedProfit)
          : Number(b.pnl);
      }
      // Si es winRate, obtener del symbolStatsMap
      if (col === "winRate") {
        const statsA = symbolStatsMap[a.symbol];
        const statsB = symbolStatsMap[b.symbol];

        if (!statsA && !statsB) return 0;
        if (!statsA) return 1;
        if (!statsB) return -1;

        const isLongA = a.side === "LONG";
        const isLongB = b.side === "LONG";

        const sideCountA = isLongA ? statsA.long_count : statsA.short_count;
        const sideCountB = isLongB ? statsB.long_count : statsB.short_count;

        const winRateA =
          sideCountA > 0
            ? isLongA
              ? statsA.long_win_rate
              : statsA.short_win_rate
            : statsA.win_rate;
        const winRateB =
          sideCountB > 0
            ? isLongB
              ? statsB.long_win_rate
              : statsB.short_win_rate
            : statsB.win_rate;

        aVal = winRateA;
        bVal = winRateB;
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

  // Sumatoria de PnL para open trades (en USDT)
  const totalPnL = isOpenTrades
    ? operations.reduce(
        (acc, op) =>
          acc + (Number(op.unrealizedProfit || op.unRealizedProfit) || 0),
        0
      )
    : null;

  // Sumatoria de TP targets potenciales (en USDT)
  const totalTPTarget = isOpenTrades
    ? operations.reduce((acc, op) => {
        if (op.take_profit_target) {
          const targetValue =
            typeof op.take_profit_target === "object"
              ? Number(op.take_profit_target.value_usd) || 0
              : 0;
          return acc + targetValue;
        }
        return acc;
      }, 0)
    : null;

  // Convertir el total PnL a la moneda seleccionada
  const totalPnLConverted =
    totalPnL !== null ? convertFromUSDT(Math.abs(totalPnL), currency) : null;
  const totalPnLFormatted =
    totalPnLConverted !== null
      ? formatCurrency(totalPnLConverted, currency)
      : "";

  // Convertir el total TP Target a la moneda seleccionada
  const totalTPTargetConverted =
    totalTPTarget !== null ? convertFromUSDT(totalTPTarget, currency) : null;
  const totalTPTargetFormatted =
    totalTPTargetConverted !== null
      ? formatCurrency(totalTPTargetConverted, currency)
      : "";

  // Mostrar contador solo para "Open Trades"
  const showCounter = title === "Open Trades" && binanceCount !== undefined;

  // Determinar qué sides están activos y sus límites
  const getActiveSidesAndLimits = () => {
    if (!config || !config.limits) return null;

    const limits = config.limits;
    const allowedSide = config.side_config?.allowed_side || "both";
    const activeSides = [];

    // Verificar si LONG está activo según la configuración de side
    if (
      (allowedSide === "long" || allowedSide === "both") &&
      limits.max_long_trades > 0
    ) {
      activeSides.push({
        side: "LONG",
        limit: limits.max_long_trades,
      });
    }

    // Verificar si SHORT está activo según la configuración de side
    if (
      (allowedSide === "short" || allowedSide === "both") &&
      limits.max_short_trades > 0
    ) {
      activeSides.push({
        side: "SHORT",
        limit: limits.max_short_trades,
      });
    }

    return activeSides.length > 0 ? activeSides : null;
  };

  const activeSidesAndLimits = getActiveSidesAndLimits();

  return (
    <>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={1}
        flexWrap="wrap"
        gap={2}
      >
        <Typography variant="h6" gutterBottom sx={{ mb: 0 }}>
          {title}
        </Typography>

        {title === "Open Trades" && (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
            sx={{ ml: "auto" }}
          >
            {/* Información de trades */}
            {showCounter && (
              <Box display="flex" alignItems="center" gap={1.5} flexWrap="wrap">
                <Box display="flex" alignItems="center" gap={0.5}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      opacity: 0.7,
                      fontSize: "0.75rem",
                    }}
                  >
                    Exchange trades:
                  </Typography>
                  <Typography
                    variant="body2"
                    sx={{
                      color: "text.primary",
                      fontFamily: "monospace",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                    }}
                  >
                    {binanceCount}
                  </Typography>
                </Box>

                {dbCount !== null && (
                  <>
                    <Box
                      sx={{
                        width: "1px",
                        height: "16px",
                        bgcolor: "rgba(255, 255, 255, 0.2)",
                      }}
                    />
                    <Box display="flex" alignItems="center" gap={0.5}>
                      <Typography
                        variant="caption"
                        sx={{
                          color: "text.secondary",
                          opacity: 0.7,
                          fontSize: "0.75rem",
                        }}
                      >
                        DB trades:
                      </Typography>
                      <Tooltip
                        title={
                          config?.database?.protected > 0
                            ? `${config.database.protected} protected of ${
                                dbCount + (config.database.protected || 0)
                              } total`
                            : ""
                        }
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              config?.database?.protected > 0
                                ? "#ff9800"
                                : "text.primary",
                            fontFamily: "monospace",
                            fontWeight: 600,
                            fontSize: "0.85rem",
                            cursor:
                              config?.database?.protected > 0
                                ? "help"
                                : "default",
                          }}
                        >
                          {dbCount + (config?.database?.protected || 0)}
                        </Typography>
                      </Tooltip>
                      {binanceCount !==
                        dbCount + (config?.database?.protected || 0) && (
                        <Tooltip title="DB trades count doesn't match Exchange trades">
                          <span
                            style={{
                              color: "#ff9800",
                              fontSize: "1rem",
                              marginLeft: "4px",
                            }}
                          >
                            ⚠️
                          </span>
                        </Tooltip>
                      )}
                    </Box>
                  </>
                )}
              </Box>
            )}

            {/* Límites */}
            {activeSidesAndLimits && (
              <>
                {showCounter && (
                  <Box
                    sx={{
                      width: "1px",
                      height: "16px",
                      bgcolor: "rgba(255, 255, 255, 0.2)",
                    }}
                  />
                )}
                <Box display="flex" alignItems="center" gap={1}>
                  <Typography
                    variant="caption"
                    sx={{
                      color: "text.secondary",
                      opacity: 0.7,
                      fontSize: "0.75rem",
                    }}
                  >
                    Limits:
                  </Typography>
                  {activeSidesAndLimits.map((item, index) => (
                    <Typography
                      key={item.side}
                      variant="body2"
                      sx={{
                        color: item.side === "LONG" ? "#2de2a6" : "#ff2e63",
                        opacity: 0.9,
                        fontFamily: "monospace",
                        fontSize: "0.85rem",
                        fontWeight: 600,
                      }}
                    >
                      {item.side} {item.limit}
                      {index < activeSidesAndLimits.length - 1 && (
                        <span
                          style={{
                            color: "rgba(255, 255, 255, 0.5)",
                            margin: "0 4px",
                          }}
                        >
                          |
                        </span>
                      )}
                    </Typography>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
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
                onClick={() => handleSort("pnl")}
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades ? "Unrealized PnL" : "PnL"}
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
              {!simplifiedView && (
                <TableCell
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("winRate")}
                >
                  <Tooltip title="Historical win rate percentage for this symbol">
                    <span>Win Rate</span>
                  </Tooltip>
                </TableCell>
              )}

              <TableCell
                onClick={() =>
                  handleSort(isOpenTrades ? "updateTime" : "timestamp")
                }
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades ? "Open Time" : "Open date"}
              </TableCell>
              <TableCell
                onClick={() => handleSort(isOpenTrades ? "" : "closeTime")}
                style={{ cursor: isOpenTrades ? undefined : "pointer" }}
              >
                {isOpenTrades ? "" : "Close date"}
              </TableCell>
              {!isOpenTrades && !simplifiedView && (
                <TableCell
                  onClick={() => handleSort("reason")}
                  style={{ cursor: "pointer" }}
                >
                  Reason
                </TableCell>
              )}
              {!simplifiedView && (
                <TableCell
                  onClick={() => handleSort("scanner")}
                  style={{ cursor: "pointer" }}
                >
                  Scanner
                </TableCell>
              )}
              {isOpenTrades && <TableCell>Chart</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody>
            {sortedOps && sortedOps.length > 0 ? (
              sortedOps.map((op, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell
                      style={{
                        fontWeight: 600,
                        color: "#2de2e6",
                      }}
                    >
                      {op.symbol || "-"}
                    </TableCell>
                    <TableCell style={getSideStyle(op.side || op.positionSide)}>
                      {formatSide(op.side || op.positionSide)}
                      {op.protected && (
                        <span title="Protected" style={{ marginLeft: 6 }}>
                          🔒
                        </span>
                      )}
                    </TableCell>
                    <TableCell>
                      {isOpenTrades
                        ? formatUnrealizedProfit(
                            op.unrealizedProfit || op.unRealizedProfit,
                            currency
                          )
                        : formatClosedPnL(op.pnl, currency)}
                    </TableCell>
                    {!isOpenTrades && (
                      <TableCell>{getWinLoss(op.pnl)}</TableCell>
                    )}
                    {isOpenTrades && (
                      <TableCell>
                        {op.take_profit_target ? (
                          typeof op.take_profit_target === "object" ? (
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "#2de2e6" }}
                              >
                                {Number(op.take_profit_target.ratio).toFixed(2)}
                                x{" "}
                              </Typography>
                              {op.take_profit_target.value_usd && (
                                <Typography
                                  variant="caption"
                                  style={{ color: "#2de2a6" }}
                                >
                                  (~
                                  {(() => {
                                    // Convertir de USD a la moneda seleccionada
                                    const convertedValue = convertFromUSDT(
                                      Number(op.take_profit_target.value_usd),
                                      currency
                                    );
                                    const formattedValue = formatCurrency(
                                      convertedValue,
                                      currency
                                    );
                                    return formattedValue;
                                  })()}
                                  {currency !== "USDT" && (
                                    <>
                                      {" "}
                                      <span
                                        style={{
                                          color: "#aaa",
                                          fontWeight: 400,
                                          fontSize: "0.85em",
                                        }}
                                      >
                                        ({currency})
                                      </span>
                                    </>
                                  )}
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
                    {!simplifiedView && (
                      <TableCell>
                        {symbolStatsMap[op.symbol] ? (
                          (() => {
                            const stats = symbolStatsMap[op.symbol];
                            const isLong = op.side === "LONG";
                            const sideCount = isLong
                              ? stats.long_count
                              : stats.short_count;

                            // Calculate win rate for this specific direction using exact data
                            let displayWinRate = stats.win_rate;
                            let displayTrades = `${stats.total_trades}`;

                            if (sideCount > 0) {
                              // Use exact win rate for this direction from backend
                              const sideWinRate = isLong
                                ? stats.long_win_rate
                                : stats.short_win_rate;
                              displayWinRate = sideWinRate;
                              displayTrades = `${sideCount} ${
                                isLong ? "L" : "S"
                              }`;
                            }

                            return (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "monospace",
                                  fontWeight: 600,
                                  color:
                                    displayWinRate >= 50
                                      ? "#2de2a6"
                                      : displayWinRate >= 30
                                      ? "#ffd700"
                                      : "#ff2e63",
                                }}
                                title={`Based on ${displayTrades} trades`}
                              >
                                {displayWinRate.toFixed(1)}%
                              </Typography>
                            );
                          })()
                        ) : (
                          <Typography
                            variant="body2"
                            sx={{ color: "text.disabled" }}
                          >
                            -
                          </Typography>
                        )}
                      </TableCell>
                    )}

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
                    {!isOpenTrades && !simplifiedView && (
                      <TableCell>{formatReason(op.reason)}</TableCell>
                    )}
                    {!simplifiedView && (
                      <TableCell>
                        <ScannerInfo
                          scannerInfo={op.scanner_info}
                          compact={true}
                        />
                      </TableCell>
                    )}
                    {isOpenTrades && (
                      <TableCell>
                        <Tooltip title={`View ${op.symbol} chart`}>
                          <IconButton
                            size="small"
                            onClick={() => handleSymbolClick(op.symbol)}
                            sx={{
                              color: "#2de2e6",
                              "&:hover": {
                                backgroundColor: "rgba(45, 226, 230, 0.1)",
                                color: "#2de2e6",
                              },
                            }}
                          >
                            <ShowChart />
                          </IconButton>
                        </Tooltip>
                      </TableCell>
                    )}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={
                    simplifiedView
                      ? isOpenTrades
                        ? 7 // Symbol, Side, PnL, Open Time, Close date (empty), TP Target, Chart
                        : 6 // Symbol, Side, PnL, Open date, Close date, Result
                      : isOpenTrades
                      ? 13 // Symbol, Side, Entry, PnL, Open Time, Close date (empty), Scanner, Hist.Trades, WinRate, TotalPnL, TP Target, Chart
                      : 10 // Symbol, Side, Entry, PnL, Open date, Close date, Reason, Result, Scanner, Type
                  }
                  align="center"
                >
                  No operations found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Total PnL para open trades */}
          {isOpenTrades && totalPnL !== null && (
            <tfoot>
              <TableRow>
                <TableCell colSpan={2} />
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
                  Total: {totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}
                  {totalPnLFormatted}
                  {currency !== "USDT" && (
                    <>
                      {" "}
                      <span
                        style={{
                          color: "#aaa",
                          fontWeight: 400,
                          fontSize: "0.9em",
                        }}
                      >
                        ({currency})
                      </span>
                    </>
                  )}
                  {totalTPTarget > 0 && (
                    <>
                      {" "}
                      <span
                        style={{
                          color: "#4ecdc4",
                          fontWeight: 600,
                          fontSize: "0.85em",
                        }}
                      >
                        ({((totalPnL / totalTPTarget) * 100).toFixed(1)}%)
                      </span>
                    </>
                  )}
                </TableCell>
                <TableCell
                  style={{
                    fontWeight: 700,
                    color: "#4ecdc4",
                  }}
                >
                  {totalTPTarget > 0 ? (
                    <>
                      Target: ~{totalTPTargetFormatted}
                      {currency !== "USDT" && (
                        <>
                          {" "}
                          <span
                            style={{
                              color: "#aaa",
                              fontWeight: 400,
                              fontSize: "0.9em",
                            }}
                          >
                            ({currency})
                          </span>
                        </>
                      )}
                    </>
                  ) : (
                    "-"
                  )}
                </TableCell>
                <TableCell
                  colSpan={simplifiedView ? 4 : 5} // Simplified: Open Time, Close date (empty), Chart | Normal: Win Rate, Open Time, Close date (empty), Scanner, Chart
                />
              </TableRow>
            </tfoot>
          )}
        </Table>
      </TableContainer>
    </>
  );
}
