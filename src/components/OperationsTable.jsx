import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Box,
  Tooltip,
  Skeleton,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import HelpOutlineIcon from "@mui/icons-material/HelpOutline";
import { DateTime } from "luxon";
import { Link as RouterLink } from "react-router-dom";

import ScannerInfo from "./ScannerInfo";
import OpenTradeChartDialog from "./OpenTradeChartDialog";
import StickyTradeSummary from "./StickyTradeSummary";
import { getClosedTradesPreview } from "../api/closedTradesPreview";
import { getOpenTradesPreview } from "../api/openTradesPreview";
import { convertFromUSDT, formatCurrency } from "../utils/currencyConverter";
import { useSymbolStatistics } from "../hooks/useSymbolStatistics";
import { useTranslation } from "react-i18next";
import { CandlestickChart } from "lucide-react";

function formatReason(reason, t) {
  if (!reason) return "-";
  const r = String(reason).toUpperCase();
  if (r.includes("TP_DINAM")) return t("operations.takeProfit");
  if (r.includes("TAKE") && r.includes("PROFIT"))
    return t("operations.takeProfit");
  if (r.includes("TIME_STOP_NEGATIVE_PNL")) return "Time Stop (Negative PnL)";
  if (r.includes("TIME_STOP_NEVER_POSITIVE")) return "Time Stop (Never Positive)";
  if (r.includes("TIME_STOP_MIN_PROGRESS")) return "Time Stop (Min Progress)";
  if (r.includes("TIME_STOP")) return "Time Stop";
  if (r.includes("SL") || r.includes("STOP")) return t("operations.stopLoss");
  if (r.includes("MANUAL")) return t("operations.manualClose");
  if (r.includes("BINANCE")) return t("operations.exchangeClose");
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

function ProtectedDataHint({ t, kind = "symbol", size = "medium" }) {
  return (
    <Tooltip
      arrow
      placement="top"
      enterDelay={200}
      slotProps={{
        tooltip: { className: "protected-upgrade-tooltip" },
      }}
      title={
        <Box className="protected-upgrade-tooltip__content">
          <Typography variant="subtitle2">
            {t("protectedOpenTrades.tooltipTitle")}
          </Typography>
          <Typography variant="body2">
            {t("protectedOpenTrades.tooltipMessage")}
          </Typography>
          <Button
            component={RouterLink}
            to="/upgrade"
            size="small"
            variant="contained"
          >
            {t("protectedOpenTrades.upgradeAction")}
          </Button>
        </Box>
      }
    >
      <span
        className={`operations-table__protected-hint operations-table__protected-hint--${kind}`}
        data-mask-size={kind === "side" ? undefined : size}
        tabIndex={0}
        aria-label={t("protectedOpenTrades.tooltipTitle")}
      >
        {kind === "target" ? (
          <span className="operations-table__mask-target" aria-hidden="true">
            <span className="operations-table__mask" />
            <span className="operations-table__mask" />
          </span>
        ) : (
          <span className="operations-table__mask" aria-hidden="true" />
        )}
        <HelpOutlineIcon
          className="operations-table__protected-help"
          aria-hidden="true"
        />
      </span>
    </Tooltip>
  );
}

function _formatNumber(val, decimals = 4) {
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
  const color = isPositive ? "var(--green)" : isNegative ? "var(--red)" : undefined;

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
          <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.9em" }}>
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
  const color = isPositive ? "var(--green)" : isNegative ? "var(--red)" : undefined;

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
          <span style={{ color: "var(--muted)", fontWeight: 400, fontSize: "0.9em" }}>
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
  if (s.includes("short")) return { color: "var(--red)", fontWeight: 700 };
  if (s.includes("long")) return { color: "var(--green)", fontWeight: 700 };
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

function getWinLoss(pnl, t) {
  if (pnl === undefined || pnl === null) return "-";
  const num = Number(pnl);
  if (isNaN(num)) return "-";
  if (num > 0)
    return (
      <span style={{ color: "var(--green)", fontWeight: 700 }}>
        {t("operations.win")}
      </span>
    );
  if (num < 0)
    return (
      <span style={{ color: "var(--red)", fontWeight: 700 }}>
        {t("operations.loss")}
      </span>
    );
  return (
    <span style={{ color: "var(--muted)", fontWeight: 700 }}>
      {t("operations.flat")}
    </span>
  );
}

export default function OperationsTable({
  operations,
  title,
  timeZone,
  binanceCount,
  dbCount,
  isOpenTrades: openTradesMode,
  config = null,
  protectedMode = false,
  protectedClosedMode = false,
  includeProtectedClosedPreview = false,
  protectedEmbeddedMode = false,
  onProtectedClosedSummaryChange,
  dataLoading = false,
}) {
  const { t } = useTranslation();
  const [chartTradeKey, setChartTradeKey] = useState(null);
  const [protectedPreview, setProtectedPreview] = useState(null);
  const [protectedPreviewError, setProtectedPreviewError] = useState(false);
  const [protectedClosedTrades, setProtectedClosedTrades] = useState(null);
  const [protectedClosedSummary, setProtectedClosedSummary] = useState(null);
  const [protectedClosedError, setProtectedClosedError] = useState(false);
  const [protectedClosedLoading, setProtectedClosedLoading] =
    useState(protectedClosedMode);
  const [embeddedClosedState, setEmbeddedClosedState] = useState({
    summary: null,
    error: false,
  });
  const [protectedExpanded, setProtectedExpanded] =
    useState(!protectedEmbeddedMode);
  const [protectedSummarySticky, setProtectedSummarySticky] = useState(false);
  const protectedSummaryRef = useRef(null);
  const [protectedPreviewLoading, setProtectedPreviewLoading] =
    useState(protectedMode);
  const closeChart = useCallback(() => setChartTradeKey(null), []);
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });
  const handleEmbeddedClosedSummaryChange = useCallback(
    (summary, error = false) => {
      setEmbeddedClosedState((current) => ({
        summary: summary ?? current.summary,
        error,
      }));
    },
    [],
  );

  // Fetch all symbol statistics for performance data
  const { data: symbolStats, loading: _statsLoading } = useSymbolStatistics(
    null,
    !protectedMode && !protectedClosedMode,
  );

  useEffect(() => {
    if (!protectedMode) return undefined;
    let isMounted = true;
    let refreshing = false;

    const refreshPreview = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const preview = await getOpenTradesPreview();
        const isValid =
          Number.isInteger(preview?.open_count) &&
          preview.open_count >= 0 &&
          Array.isArray(preview?.positions) &&
          preview.positions.length === preview.open_count &&
          Number.isInteger(preview?.long_count) &&
          Number.isInteger(preview?.short_count) &&
          typeof preview?.total_tp_target === "number" &&
          Number.isFinite(preview.total_tp_target) &&
          (preview.pnl_percentage === null ||
            (typeof preview.pnl_percentage === "number" &&
              Number.isFinite(preview.pnl_percentage))) &&
          preview.positions.every(
            (position) =>
              (position?.unrealized_pnl === null ||
                (typeof position?.unrealized_pnl === "number" &&
                  Number.isFinite(position.unrealized_pnl))) &&
              (position?.open_time === null ||
                typeof position?.open_time === "number" ||
                typeof position?.open_time === "string"),
          ) &&
          (preview.revealed_trade_index === null ||
            (Number.isInteger(preview.revealed_trade_index) &&
              preview.revealed_trade_index >= 0 &&
              preview.revealed_trade_index < preview.open_count)) &&
          (preview.revealed_trade_index === null
            ? preview.revealed_trade === null
            : preview.revealed_trade &&
              typeof preview.revealed_trade === "object");
        if (!isValid) throw new Error("Invalid open trade preview response");
        if (isMounted) {
          setProtectedPreview(preview);
          setProtectedPreviewError(false);
        }
      } catch (error) {
        console.error("Open trade preview refresh failed:", error);
        if (isMounted) setProtectedPreviewError(true);
      } finally {
        refreshing = false;
        if (isMounted) setProtectedPreviewLoading(false);
      }
    };

    refreshPreview();
    const intervalId = window.setInterval(refreshPreview, 30_000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [protectedMode]);

  useEffect(() => {
    if (!protectedClosedMode) return undefined;
    let isMounted = true;
    let refreshing = false;

    const refreshPreview = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const preview = await getClosedTradesPreview();
        const isValid =
          Array.isArray(preview?.closed_trades) &&
          preview.closed_trades.length <= 10 &&
          preview?.summary &&
          Number.isInteger(preview.summary.total_trades) &&
          preview.summary.total_trades >= 0 &&
          typeof preview.summary.total_pnl === "number" &&
          Number.isFinite(preview.summary.total_pnl) &&
          preview.closed_trades.every(
            (trade) =>
              trade &&
              typeof trade === "object" &&
              !Object.prototype.hasOwnProperty.call(trade, "reason") &&
              typeof trade.symbol === "string" &&
              typeof trade.side === "string" &&
              (trade.pnl === null ||
                (typeof trade.pnl === "number" &&
                  Number.isFinite(trade.pnl))) &&
              (trade.closed_at === null ||
                typeof trade.closed_at === "string"),
          );
        if (!isValid) throw new Error("Invalid closed trade preview response");
        if (isMounted) {
          setProtectedClosedTrades(preview.closed_trades);
          setProtectedClosedSummary(preview.summary);
          setProtectedClosedError(false);
          onProtectedClosedSummaryChange?.(preview.summary);
        }
      } catch (error) {
        console.error("Closed trade preview refresh failed:", error);
        if (isMounted) {
          setProtectedClosedError(true);
          onProtectedClosedSummaryChange?.(undefined, true);
        }
      } finally {
        refreshing = false;
        if (isMounted) setProtectedClosedLoading(false);
      }
    };

    refreshPreview();
    const intervalId = window.setInterval(refreshPreview, 30_000);
    return () => {
      isMounted = false;
      window.clearInterval(intervalId);
    };
  }, [onProtectedClosedSummaryChange, protectedClosedMode]);

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
  const isOpenTrades = protectedClosedMode
    ? false
    : (protectedMode ? true : openTradesMode) ??
      (operations?.length > 0 &&
        (operations[0].positionAmt !== undefined ||
          operations[0].status === "open"));

  const tableOperations = protectedMode
    ? (protectedPreview?.positions ?? []).map((position, index) => {
        const revealedTrade =
          index === protectedPreview.revealed_trade_index
            ? protectedPreview.revealed_trade
            : null;
        if (revealedTrade) {
          return {
            ...revealedTrade,
            side: revealedTrade.side,
            positionSide: revealedTrade.side,
            entryPrice: revealedTrade.entry_price,
            markPrice: revealedTrade.mark_price,
            unrealizedProfit: revealedTrade.unrealized_pnl,
            updateTime: revealedTrade.update_time,
            __protectedRow: false,
          };
        }
        return {
          unrealizedProfit: position.unrealized_pnl,
          updateTime: position.open_time,
          __protectedRow: true,
          __maskSize: ["long", "short", "medium", "wide"][index % 4],
        };
      })
    : protectedClosedMode
      ? protectedClosedTrades || []
      : operations || [];

  // Estado para ordenamiento
  // Para open trades, ordenar por defecto por Open Time (updateTime) descendente (más recientes primero)
  const [orderBy, setOrderBy] = useState(() => {
    const isOpen =
      operations &&
      operations.length > 0 &&
      (operations[0].positionAmt !== undefined ||
        operations[0].status === "open");
    return isOpen ? "updateTime" : null;
  });
  const [order, setOrder] = useState(() => {
    const isOpen =
      operations &&
      operations.length > 0 &&
      (operations[0].positionAmt !== undefined ||
        operations[0].status === "open");
    return isOpen ? "desc" : "asc";
  });

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
      // Si es updateTime o timestamp, convertir a número (timestamp en ms)
      if (col === "updateTime" || col === "timestamp" || col === "closeTime") {
        if (typeof aVal === "string") {
          const parsed = Date.parse(aVal);
          aVal = isNaN(parsed) ? 0 : parsed;
        } else if (typeof aVal === "number") {
          // Ya es un timestamp
        } else {
          aVal = 0;
        }
        if (typeof bVal === "string") {
          const parsed = Date.parse(bVal);
          bVal = isNaN(parsed) ? 0 : parsed;
        } else if (typeof bVal === "number") {
          // Ya es un timestamp
        } else {
          bVal = 0;
        }
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

  let sortedOps = tableOperations;
  if (orderBy) {
    sortedOps = [...tableOperations].sort(getComparator(orderBy));
  }
  const selectedTrade =
    chartTradeKey === null
      ? null
      : tableOperations.find(
          (operation) =>
            `${operation.symbol}:${operation.side || operation.positionSide}` ===
            chartTradeKey,
        ) || null;

  // Sumatoria de PnL para open trades (en USDT)
  const totalPnL = isOpenTrades
    ? tableOperations.reduce(
        (acc, op) =>
          acc + (Number(op.unrealizedProfit || op.unRealizedProfit) || 0),
        0
      )
    : null;

  // Sumatoria de TP targets potenciales (en USDT)
  const totalTPTarget = isOpenTrades
    ? protectedMode
      ? protectedPreview?.total_tp_target ?? 0
      : tableOperations.reduce((acc, op) => {
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
  const closedTotalPnl = protectedClosedSummary?.total_pnl;
  const closedTotalPnlConverted =
    closedTotalPnl !== undefined
      ? convertFromUSDT(Math.abs(closedTotalPnl), currency)
      : null;
  const closedTotalPnlFormatted =
    closedTotalPnlConverted !== null
      ? formatCurrency(closedTotalPnlConverted, currency)
      : "";
  const embeddedRealizedPnl = embeddedClosedState.summary?.total_pnl;
  const embeddedRealizedPnlConverted =
    embeddedRealizedPnl !== undefined
      ? convertFromUSDT(Math.abs(embeddedRealizedPnl), currency)
      : null;
  const embeddedRealizedPnlFormatted =
    embeddedRealizedPnlConverted !== null
      ? formatCurrency(embeddedRealizedPnlConverted, currency)
      : "";

  // Mostrar contador solo para "Open Trades"
  const showCounter = isOpenTrades && binanceCount !== undefined;

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
  const protectedTableMode = protectedMode || protectedClosedMode;
  const protectedAccordionMode = protectedTableMode;
  const tableColumnCount = isOpenTrades
    ? protectedMode
      ? 6
      : 7
    : protectedClosedMode
      ? 7
      : 9;
  const SectionWrapper = protectedAccordionMode ? Accordion : React.Fragment;
  const SectionContent = protectedAccordionMode
    ? AccordionDetails
    : React.Fragment;
  const sectionWrapperProps = protectedAccordionMode
    ? {
        expanded: protectedExpanded,
        onChange: (_, expanded) => setProtectedExpanded(expanded),
        className: protectedMode
          ? "operations-table__open-trades-accordion"
          : protectedEmbeddedMode
            ? "operations-table__embedded-accordion"
            : undefined,
        sx: { bgcolor: "var(--white)" },
      }
    : {};

  return (
    <>
    <SectionWrapper {...sectionWrapperProps}>
      <Box
        component={protectedAccordionMode ? AccordionSummary : "div"}
        ref={protectedAccordionMode ? protectedSummaryRef : undefined}
        className={
          protectedMode && protectedSummarySticky
            ? "trade-summary-source--disabled"
            : undefined
        }
        aria-disabled={
          protectedMode && protectedSummarySticky ? true : undefined
        }
        tabIndex={
          protectedMode && protectedSummarySticky ? -1 : undefined
        }
        {...(protectedAccordionMode ? { expandIcon: <ExpandMoreIcon /> } : {})}
        aria-label={
          protectedAccordionMode
            ? title || t("dashboard.openTrades")
            : undefined
        }
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={protectedAccordionMode ? 0 : 1}
        flexWrap="wrap"
        gap={2}
      >
        <Typography
          variant={protectedTableMode ? "body1" : "h6"}
          gutterBottom={!protectedTableMode}
          sx={{ mb: 0 }}
        >
          {title}
        </Typography>

        {isOpenTrades && (
          <Box
            display="flex"
            alignItems="center"
            gap={2}
            flexWrap="wrap"
            sx={{ ml: "auto" }}
          >
            {includeProtectedClosedPreview &&
              (embeddedClosedState.summary ? (
                <>
                  <Box
                    className="protected-realized-summary"
                    aria-live="polite"
                  >
                    <Typography variant="caption">
                      {t("protectedClosedTrades.totalRealizedPnl")}{" "}
                      <span
                        className={`protected-realized-summary__pnl protected-realized-summary__pnl--${
                          embeddedRealizedPnl > 0
                            ? "positive"
                            : embeddedRealizedPnl < 0
                              ? "negative"
                              : "neutral"
                        }`}
                      >
                        {embeddedRealizedPnl > 0
                          ? "+"
                          : embeddedRealizedPnl < 0
                            ? "-"
                            : ""}
                        {embeddedRealizedPnlFormatted}
                        {currency !== "USDT" && ` (${currency})`}
                      </span>
                    </Typography>
                    <Typography variant="caption">
                      {t("protectedClosedTrades.historicalTradeCount", {
                        count:
                          embeddedClosedState.summary.total_trades.toLocaleString(),
                      })}
                    </Typography>
                    {embeddedClosedState.error && (
                      <Typography
                        color="error"
                        role="status"
                        variant="caption"
                      >
                        {t("protectedClosedTrades.loadError")}
                      </Typography>
                    )}
                  </Box>
                  <Box
                    aria-hidden="true"
                    sx={{
                      width: "1px",
                      height: "14px",
                      bgcolor: "var(--line)",
                    }}
                  />
                </>
              ) : embeddedClosedState.error ? (
                <Typography color="error" role="status" variant="caption">
                  {t("protectedClosedTrades.loadError")}
                </Typography>
              ) : (
                <Skeleton
                  role="status"
                  aria-label={t("dashboard.loading")}
                  variant="text"
                  width={180}
                />
              ))}
            {protectedMode && (
              <Box
                className="protected-open-trades-summary"
                display="flex"
                alignItems="center"
                gap={1.5}
                flexWrap="wrap"
              >
                {protectedPreview ? (
                  <>
                    <Typography variant="caption">
                      {t("dashboard.openTradeCount", {
                        count: protectedPreview.open_count,
                      })}
                    </Typography>
                    <Typography variant="caption">
                      {t("dashboard.openTradeLong", {
                        count: protectedPreview.long_count,
                      })}
                    </Typography>
                    <Typography variant="caption">
                      {t("dashboard.openTradeShort", {
                        count: protectedPreview.short_count,
                      })}
                    </Typography>
                    <Typography
                      variant="caption"
                      sx={{
                        color:
                          totalPnL > 0
                            ? "var(--green)"
                            : totalPnL < 0
                              ? "var(--red)"
                              : "var(--muted)",
                      }}
                    >
                      <span
                        key={`${totalPnL}-${currency}`}
                        className="dashboard-value-update"
                      >
                        {t("dashboard.openTradePnl", {
                          amount:
                            totalPnL === null
                              ? "—"
                              : `${totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}${totalPnLFormatted}`,
                        })}
                      </span>
                    </Typography>
                  </>
                ) : protectedPreviewLoading ? (
                  <Box
                    role="status"
                    aria-label={t("dashboard.loading")}
                    sx={{ display: "flex", gap: 1 }}
                  >
                    {[54, 42, 48, 72].map((width) => (
                      <Skeleton
                        key={width}
                        variant="text"
                        width={width}
                        aria-hidden="true"
                      />
                    ))}
                  </Box>
                ) : (
                  <Typography variant="caption" role={protectedPreviewError ? "status" : undefined}>
                    {t("protectedOpenTrades.loadError")}
                  </Typography>
                )}
              </Box>
            )}
            {/* Información de trades */}
            {!protectedMode && showCounter && (
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
                    {t("operations.exchangeTrades")}:
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
                        bgcolor: "var(--line)",
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
                        {t("operations.dbTrades")}:
                      </Typography>
                      <Tooltip
                        title={
                          config?.database?.protected > 0
                            ? t("operations.protectedOf", {
                                protected: config.database.protected,
                                total:
                                  dbCount + (config.database.protected || 0),
                              })
                            : ""
                        }
                      >
                        <Typography
                          variant="body2"
                          sx={{
                            color:
                              config?.database?.protected > 0
                                ? "var(--amber)"
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
                        <Tooltip title={t("operations.mismatch")}>
                          <span
                            style={{
                              color: "var(--amber)",
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
            {!protectedMode && activeSidesAndLimits && (
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
                <Box
                  className="position-limits"
                  display="flex"
                  alignItems="center"
                  gap={0.75}
                >
                  <Typography
                    component="span"
                    variant="caption"
                    className="position-limits-label"
                  >
                    {t("operations.limits")}:
                  </Typography>
                  {activeSidesAndLimits.map((item) => (
                    <Box
                      key={item.side}
                      component="span"
                      className={`position-limit position-limit--${item.side.toLowerCase()}`}
                    >
                      <span>{item.side}</span>
                      <b>{item.limit}</b>
                    </Box>
                  ))}
                </Box>
              </>
            )}
          </Box>
        )}
      </Box>
      <SectionContent>
      <TableContainer component={Paper} sx={{ mb: 4, overflowX: "auto" }}>
        <Table
          className={`operations-table ${
            openTradesMode ? "operations-table--open" : "operations-table--closed"
          } ${protectedMode ? "operations-table--protected-open" : ""}`}
          size="small"
          sx={{ minWidth: 650 }}
        >
          <TableHead>
            <TableRow>
              <TableCell
                onClick={() => handleSort("symbol")}
                style={{ cursor: "pointer" }}
              >
                {t("operations.symbol")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("side")}
                style={{ cursor: "pointer" }}
              >
                {t("operations.side")}
              </TableCell>
              <TableCell
                onClick={() => handleSort("pnl")}
                className={isOpenTrades ? "operations-table__pnl-head" : undefined}
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades
                  ? t("operations.unrealizedPnl")
                  : t("operations.pnl")}
              </TableCell>
              {!isOpenTrades && (
                <TableCell
                  onClick={() => handleSort("pnl")}
                  style={{ cursor: "pointer" }}
                >
                  {t("operations.result")}
                </TableCell>
              )}
              {isOpenTrades && (
                <TableCell className="operations-table__numeric-head">
                  {t("operations.tpTarget")}
                </TableCell>
              )}
              {!protectedClosedMode && !protectedMode && (
                <TableCell
                  className={
                    isOpenTrades ? "operations-table__numeric-head" : undefined
                  }
                  style={{ cursor: "pointer" }}
                  onClick={() => handleSort("winRate")}
                >
                  <Tooltip title={t("operations.winRateTooltip")}>
                    <span>{t("operations.winRate")}</span>
                  </Tooltip>
                </TableCell>
              )}

              <TableCell
                onClick={() =>
                  handleSort(isOpenTrades ? "updateTime" : "timestamp")
                }
                style={{ cursor: "pointer" }}
              >
                {isOpenTrades
                  ? t("operations.openTime")
                  : t("operations.openDate")}
              </TableCell>
              {!isOpenTrades && (
                <TableCell
                  onClick={() => handleSort("closeTime")}
                  style={{ cursor: "pointer" }}
                >
                  {t("operations.closeDate")}
                </TableCell>
              )}
              {!isOpenTrades && !protectedClosedMode && (
                <TableCell
                  onClick={() => handleSort("reason")}
                  style={{ cursor: "pointer" }}
                >
                  {t("operations.reason")}
                </TableCell>
              )}
              {!isOpenTrades && (
                <TableCell
                  onClick={() => handleSort("scanner")}
                  style={{ cursor: "pointer" }}
                >
                  {t("operations.scanner")}
                </TableCell>
              )}
              {isOpenTrades && <TableCell>{t("operations.chart")}</TableCell>}
            </TableRow>
          </TableHead>
          <TableBody
            aria-busy={
              dataLoading ||
              (protectedMode && protectedPreviewLoading) ||
              (protectedClosedMode && protectedClosedLoading)
            }
          >
            {dataLoading ? (
              [0, 1, 2, 3].map((rowIndex) => (
                <TableRow key={`loading-${rowIndex}`}>
                  {Array.from(
                    { length: tableColumnCount },
                    (_, cellIndex) => (
                      <TableCell key={`loading-${rowIndex}-${cellIndex}`}>
                        <Skeleton
                          variant="text"
                          width={cellIndex === 0 ? 76 : cellIndex % 2 ? 48 : 64}
                          aria-hidden="true"
                        />
                      </TableCell>
                    ),
                  )}
                </TableRow>
              ))
            ) : protectedMode && protectedPreviewLoading ? (
              [0, 1, 2, 3].map((rowIndex) => (
                <TableRow key={`protected-loading-${rowIndex}`}>
                  {Array.from({ length: tableColumnCount }, (_, cellIndex) => (
                    <TableCell key={`protected-loading-${rowIndex}-${cellIndex}`}>
                      <Skeleton
                        variant="text"
                        width={cellIndex === 0 ? 76 : 48}
                        aria-hidden="true"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : protectedMode && protectedPreviewError && !protectedPreview ? (
              <TableRow>
                <TableCell colSpan={tableColumnCount} align="center" role="status">
                  {t("protectedOpenTrades.loadError")}
                </TableCell>
              </TableRow>
            ) : protectedClosedMode && protectedClosedLoading ? (
              [0, 1, 2, 3].map((rowIndex) => (
                <TableRow key={`closed-preview-loading-${rowIndex}`}>
                  {Array.from({ length: tableColumnCount }, (_, cellIndex) => (
                    <TableCell
                      key={`closed-preview-loading-${rowIndex}-${cellIndex}`}
                    >
                      <Skeleton
                        variant="text"
                        width={cellIndex === 0 ? 76 : 48}
                        aria-hidden="true"
                      />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : protectedClosedMode &&
              protectedClosedError &&
              !protectedClosedTrades ? (
              <TableRow>
                <TableCell
                  colSpan={tableColumnCount}
                  align="center"
                  role="status"
                >
                  {t("protectedClosedTrades.loadError")}
                </TableCell>
              </TableRow>
            ) : sortedOps.length > 0 ? (
              sortedOps.map((op, idx) => (
                <React.Fragment key={idx}>
                  <TableRow>
                    <TableCell
                      className={
                        op.__protectedRow
                          ? "operations-table__protected-cell"
                          : undefined
                      }
                      style={{
                        fontWeight: 600,
                        color: "var(--ink)",
                      }}
                    >
                      {op.__protectedRow ? (
                        <ProtectedDataHint
                          t={t}
                          kind="symbol"
                          size={op.__maskSize}
                        />
                      ) : (
                        op.symbol || "-"
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        op.__protectedRow
                          ? "operations-table__protected-cell"
                          : undefined
                      }
                      style={getSideStyle(op.side || op.positionSide)}
                    >
                      {op.__protectedRow ? (
                        <ProtectedDataHint
                          t={t}
                          kind="side"
                          size={op.__maskSize}
                        />
                      ) : (
                        formatSide(op.side || op.positionSide)
                      )}
                      {op.protected && (
                        <span
                          title={t("operations.protected")}
                          style={{ marginLeft: 6 }}
                        >
                          🔒
                        </span>
                      )}
                    </TableCell>
                    <TableCell
                      className={
                        isOpenTrades ? "operations-table__pnl-cell" : undefined
                      }
                    >
                      {isOpenTrades
                        ? formatUnrealizedProfit(
                            op.unrealizedProfit || op.unRealizedProfit,
                            currency
                          )
                        : formatClosedPnL(op.pnl, currency)}
                    </TableCell>
                    {!isOpenTrades && (
                      <TableCell>{getWinLoss(op.pnl, t)}</TableCell>
                    )}
                    {isOpenTrades && (
                      <TableCell
                        className={`operations-table__numeric-cell ${
                          op.__protectedRow
                            ? "operations-table__protected-cell"
                            : ""
                        }`}
                      >
                        {op.__protectedRow ? (
                          <ProtectedDataHint
                            t={t}
                            kind="target"
                            size={op.__maskSize}
                          />
                        ) : op.take_profit_target ? (
                          typeof op.take_profit_target === "object" ? (
                            <Box>
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: "var(--muted)" }}
                              >
                                {Number(op.take_profit_target.ratio).toFixed(2)}
                                x{" "}
                              </Typography>
                              {op.take_profit_target.value_usd && (
                                <Typography
                                  variant="caption"
                                  style={{ color: "var(--muted)" }}
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
                                          color: "var(--muted)",
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
                              sx={{ fontWeight: 600, color: "var(--muted)" }}
                            >
                              {Number(op.take_profit_target).toFixed(2)}x{" "}
                            </Typography>
                          )
                        ) : (
                          "-"
                        )}
                      </TableCell>
                    )}
                    {!protectedClosedMode && !protectedMode && (
                      <TableCell
                        className={
                          isOpenTrades
                            ? "operations-table__numeric-cell"
                            : undefined
                        }
                      >
                        {op.__protectedRow ? (
                          <ProtectedDataHint t={t} />
                        ) : symbolStatsMap[op.symbol] ? (
                          (() => {
                            const stats = symbolStatsMap[op.symbol];
                            const isLong = op.side === "LONG";
                            const sideCount = isLong
                              ? stats.long_count
                              : stats.short_count;

                            let displayWinRate = stats.win_rate;
                            let displayTrades = `${stats.total_trades}`;

                            if (sideCount > 0) {
                              const sideWinRate = isLong
                                ? stats.long_win_rate
                                : stats.short_win_rate;
                              displayWinRate = sideWinRate;
                              displayTrades = `${sideCount} ${
                                isLong ? "L" : "S"
                              }`;
                            }

                            if (
                              !Number.isFinite(stats.total_trades) ||
                              stats.total_trades <= 0 ||
                              !Number.isFinite(displayWinRate)
                            ) {
                              return (
                                <Typography
                                  variant="body2"
                                  sx={{ color: "text.disabled" }}
                                >
                                  —
                                </Typography>
                              );
                            }

                            return (
                              <Typography
                                variant="body2"
                                sx={{
                                  fontFamily: "monospace",
                                  fontWeight: 600,
                                  color:
                                    displayWinRate >= 50
                                      ? "var(--green)"
                                      : displayWinRate >= 30
                                        ? "var(--amber)"
                                        : "var(--red)",
                                }}
                                title={t("operations.basedOnTrades", {
                                  count: displayTrades,
                                })}
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
                      {op.__protectedRow ? (
                        op.updateTime
                          ? getDurationString(op.updateTime)
                          : "-"
                      ) : isOpenTrades
                        ? getDurationString(op.updateTime)
                        : formatDate(op.timestamp || op.openTime, timeZone)}
                    </TableCell>
                    {!isOpenTrades && (
                      <TableCell>
                        {formatDate(op.closed_at || op.closeTime, timeZone)}
                      </TableCell>
                    )}
                    {!isOpenTrades && !protectedClosedMode && (
                      <TableCell>{formatReason(op.reason, t)}</TableCell>
                    )}
                    {!isOpenTrades && (
                      <TableCell>
                        <ScannerInfo
                          scannerInfo={op.scanner_info}
                          compact={true}
                        />
                      </TableCell>
                    )}
                    {isOpenTrades && (
                      <TableCell className="operations-table__chart-cell">
                        {op.__protectedRow ? null : (
                        <button
                          className="chart-button"
                          type="button"
                          onClick={() =>
                            setChartTradeKey(
                              `${op.symbol}:${op.side || op.positionSide}`,
                            )
                          }
                          title={t("charts.view", {
                            symbol: op.symbol?.replace(":USDT", ""),
                          })}
                          aria-label={t("charts.view", {
                            symbol: op.symbol?.replace(":USDT", ""),
                          })}
                          disabled={!op.symbol}
                        >
                          <CandlestickChart size={15} />
                        </button>
                        )}
                      </TableCell>
                    )}
                  </TableRow>
                </React.Fragment>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={tableColumnCount}
                  align="center"
                  role={
                    protectedClosedMode && protectedClosedError
                      ? "status"
                      : undefined
                  }
                >
                  {protectedMode && protectedPreviewError
                    ? t("protectedOpenTrades.loadError")
                    : protectedClosedMode && protectedClosedError
                      ? t("protectedClosedTrades.loadError")
                      : protectedClosedMode
                        ? t("protectedClosedTrades.empty")
                    : t("operations.noOperations")}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
          {/* Total PnL para open trades */}
          {((isOpenTrades &&
            totalPnL !== null &&
            (!dataLoading || protectedMode) &&
            (!protectedMode || protectedPreview)) ||
            (protectedClosedMode &&
              protectedClosedSummary &&
              !protectedEmbeddedMode)) && (
            <tfoot>
              {isOpenTrades ? (
                <TableRow>
                  <TableCell colSpan={2} />
                  <TableCell
                    className="operations-table__pnl-total"
                    style={{
                      fontWeight: 700,
                      color:
                        totalPnL > 0
                          ? "var(--green)"
                          : totalPnL < 0
                            ? "var(--red)"
                            : undefined,
                    }}
                  >
                    {t("operations.total")}:{" "}
                    {totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}
                    {totalPnLFormatted}
                    {currency !== "USDT" && (
                      <span
                        style={{
                          color: "var(--muted)",
                          fontWeight: 400,
                          fontSize: "0.9em",
                        }}
                      >
                        {" "}
                        ({currency})
                      </span>
                    )}
                    {totalTPTarget > 0 && (
                      <span
                        style={{
                          color: "var(--muted)",
                          fontWeight: 400,
                          fontSize: "0.85em",
                        }}
                      >
                        {" "}
                        ({((totalPnL / totalTPTarget) * 100).toFixed(1)}%)
                      </span>
                    )}
                  </TableCell>
                  <TableCell
                    className="operations-table__numeric-cell"
                    style={{
                      fontWeight: 500,
                      color: "var(--muted)",
                    }}
                  >
                    {totalTPTarget > 0 ? (
                      <>
                        {t("operations.target")}: ~{totalTPTargetFormatted}
                        {currency !== "USDT" && (
                          <span
                            style={{
                              color: "var(--muted)",
                              fontWeight: 400,
                              fontSize: "0.9em",
                            }}
                          >
                            {" "}
                            ({currency})
                          </span>
                        )}
                      </>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell colSpan={3} />
                </TableRow>
              ) : (
                <TableRow className="operations-table__closed-summary">
                  <TableCell colSpan={2} />
                  <TableCell
                    className={`operations-table__closed-total operations-table__closed-total--${
                      closedTotalPnl > 0
                        ? "positive"
                        : closedTotalPnl < 0
                          ? "negative"
                          : "neutral"
                    }`}
                    sx={{ fontWeight: 700 }}
                  >
                    {t("protectedClosedTrades.totalRealizedPnl")}:{" "}
                    {closedTotalPnl > 0
                      ? "+"
                      : closedTotalPnl < 0
                        ? "-"
                        : ""}
                    {closedTotalPnlFormatted}
                    {currency !== "USDT" && (
                      <span className="operations-table__closed-summary-currency">
                        {" "}
                        ({currency})
                      </span>
                    )}
                  </TableCell>
                  <TableCell colSpan={tableColumnCount - 3}>
                    {t("protectedClosedTrades.historicalTradeCount", {
                      count: protectedClosedSummary.total_trades.toLocaleString(),
                    })}
                  </TableCell>
                </TableRow>
              )}
            </tfoot>
          )}
        </Table>
      </TableContainer>
      {protectedMode && protectedPreviewError && protectedPreview && (
        <Typography
          color="error"
          role="status"
          sx={{ mb: 1, fontSize: "0.75rem" }}
        >
          {t("protectedOpenTrades.loadError")}
        </Typography>
      )}
      {protectedClosedMode &&
        protectedClosedError &&
        protectedClosedTrades && (
          <Typography
            color="error"
            role="status"
            sx={{ mb: 1, fontSize: "0.75rem" }}
          >
            {t("protectedClosedTrades.loadError")}
          </Typography>
        )}
      {includeProtectedClosedPreview && (
        <OperationsTable
          operations={[]}
          title={t("dashboard.closedTradesPreview")}
          protectedClosedMode
          protectedEmbeddedMode
          onProtectedClosedSummaryChange={handleEmbeddedClosedSummaryChange}
        />
      )}
      </SectionContent>
      <OpenTradeChartDialog
        trade={selectedTrade}
        onClose={closeChart}
      />
    </SectionWrapper>
    {protectedMode && (
      <StickyTradeSummary
        anchorRef={protectedSummaryRef}
        expanded={protectedExpanded}
        label={t("dashboard.openTradesSummary", {
          count: protectedPreview?.open_count ?? 0,
          long: protectedPreview?.long_count ?? 0,
          short: protectedPreview?.short_count ?? 0,
          pnl:
            totalPnL === null
              ? "—"
              : `${totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}${totalPnLFormatted}`,
        })}
        onVisibilityChange={setProtectedSummarySticky}
      >
        <Box
          className="protected-open-trades-summary"
          display="flex"
          alignItems="center"
          gap={1.5}
          flexWrap="wrap"
        >
          {protectedPreview ? (
            <>
              <Typography variant="caption">
                {t("dashboard.openTradeCount", {
                  count: protectedPreview.open_count,
                })}
              </Typography>
              <Typography variant="caption">
                {t("dashboard.openTradeLong", {
                  count: protectedPreview.long_count,
                })}
              </Typography>
              <Typography variant="caption">
                {t("dashboard.openTradeShort", {
                  count: protectedPreview.short_count,
                })}
              </Typography>
              <Typography
                variant="caption"
                sx={{
                  color:
                    totalPnL > 0
                      ? "var(--green)"
                      : totalPnL < 0
                        ? "var(--red)"
                        : "var(--muted)",
                }}
              >
                {t("dashboard.openTradePnl", {
                  amount:
                    totalPnL === null
                      ? "—"
                      : `${totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}${totalPnLFormatted}`,
                })}
              </Typography>
            </>
          ) : (
            <Typography variant="caption">
              {protectedPreviewLoading
                ? t("dashboard.loading")
                : t("protectedOpenTrades.loadError")}
            </Typography>
          )}
        </Box>
      </StickyTradeSummary>
    )}
    </>
  );
}
