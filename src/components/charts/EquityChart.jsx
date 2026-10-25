// test comment
import React, {
  useState,
  useRef,
  useEffect,
  useLayoutEffect,
  useMemo,
  useCallback,
} from "react";
import {
  convertFromUSDT,
  formatCurrency,
  getCurrencySymbol,
} from "../../utils/currencyConverter";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
} from "recharts";
import {
  Typography,
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
  Skeleton,
} from "@mui/material";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import {
  buildEquityDrawdownData,
  panEquityRangeByPixels,
  remapEquityRange,
  getWheelZoomRange,
} from "./equityChartUtils";

function formatDateLuxon(date, timeZone = "UTC") {
  if (!date) return "-";
  let dt = DateTime.fromISO(date, { zone: "utc" });
  if (!dt.isValid) {
    dt = DateTime.fromFormat(date, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
  }
  if (!dt.isValid) return date;
  return dt.setZone(timeZone).toFormat("dd/MM/yy - h:mm:ss a");
}

const getAxisStyle = (currency) => {
  // Currencies with large values need smaller font
  const needsSmallFont = ["COP", "CLP", "IDR", "KRW", "JPY"].includes(currency);
  return {
    fill: "#fff",
    fontWeight: 600,
    fontSize: needsSmallFont ? 13 : 14,
  };
};
const RANGE_OPTIONS = [
  { id: "1d", label: "1d", days: 1 },
  { id: "3d", label: "3d", days: 3 },
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "all", label: "All", days: null },
];
const TOOLTIP_SHOW_DELAY_MS = 350;

function getRangeForOption(option, data) {
  if (!data.length) {
    return { start: 0, end: 0 };
  }

  if (option.id === "all") {
    return { start: 0, end: data.length - 1 };
  }

  const latestDate = DateTime.fromISO(data[data.length - 1].date);
  const cutoffDate = latestDate.minus({ days: option.days });
  const startIdx = data.findIndex(
    (point) => DateTime.fromISO(point.date) >= cutoffDate,
  );
  return {
    start: startIdx >= 0 ? startIdx : 0,
    end: data.length - 1,
  };
}

function getRangeSelection(range, data, availableOptions) {
  const matchingOption = availableOptions.find((option) => {
    const optionRange = getRangeForOption(option, data);
    return range.start === optionRange.start && range.end === optionRange.end;
  });
  return matchingOption?.id ?? "custom";
}

export function EquityChartTooltip({
  active,
  payload,
  label,
  currency,
  timeZone,
  t,
}) {
  if (!active || !payload?.length) {
    return null;
  }

  const point = payload[0].payload;
  const formatValue = (value) =>
    formatCurrency(convertFromUSDT(Number(value), currency), currency);

  return (
    <Paper
      elevation={8}
      sx={{
        minWidth: 190,
        p: 1.5,
        border: 1,
        borderColor: "divider",
        borderLeft: 3,
        borderLeftColor: "primary.main",
        borderRadius: 1.5,
        backgroundColor: "background.paper",
        color: "text.primary",
        boxShadow: (theme) => theme.shadows[8],
        backdropFilter: "blur(12px)",
      }}
    >
      <Typography
        variant="caption"
        sx={{
          display: "block",
          color: "text.secondary",
          fontWeight: 700,
          letterSpacing: "0.04em",
          mb: 0.75,
        }}
      >
        {t("analyticsCharts.dateWithValue", {
          date: formatDateLuxon(label, timeZone),
        })}
      </Typography>
      <Box sx={{ display: "grid", gap: 0.5 }}>
        {payload.map((entry) => {
          const labelKey =
            entry.dataKey === "equity"
              ? "analyticsCharts.equityLabel"
              : "analyticsCharts.drawdown";

          return (
            <Box
              key={entry.dataKey}
              sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}
            >
              <Typography variant="body2" color="text.secondary">
                {t(labelKey)}
              </Typography>
              <Typography variant="body2" fontWeight={700}>
                {formatValue(entry.value)}
              </Typography>
            </Box>
          );
        })}
        {point?.symbol && (
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("analyticsCharts.tradeSymbol")}
            </Typography>
            <Typography variant="body2" fontWeight={700}>
              {point.symbol}
            </Typography>
          </Box>
        )}
        {point?.pnl !== undefined && point?.pnl !== null && (
          <Box sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              {t("analyticsCharts.tradePnl")}
            </Typography>
            <Typography
              variant="body2"
              fontWeight={700}
              color={point.pnl < 0 ? "error.main" : "success.main"}
            >
              {formatValue(point.pnl)}
            </Typography>
          </Box>
        )}
      </Box>
    </Paper>
  );
}

export default function EquityChart({
  operations,
  seriesData,
  showDrawdown = true,
  timeZone = "UTC",
  height = 416,
  currency = "USDT",
  loading = false,
}) {
  const { t } = useTranslation();
  const data = useMemo(
    () =>
      seriesData ??
      buildEquityDrawdownData(operations, t("charts.startingPoint")),
    [operations, seriesData, t],
  );
  const [showEquity, setShowEquity] = useState(true);
  const [showDrawdownState, setShowDrawdown] = useState(true);
  const [isPanning, setIsPanning] = useState(false);
  const [tooltipReady, setTooltipReady] = useState(false);
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: data.length - 1,
  });
  const visibleData = useMemo(
    () => data.slice(visibleRange.start, visibleRange.end + 1),
    [data, visibleRange],
  );
  const [selectedButton, setSelectedButton] = useState("1d");
  const previousDataRef = useRef(data);
  const hoveredIndexRef = useRef(data.length - 1);
  const panStartRef = useRef(null);
  const pendingPanRangeRef = useRef(null);
  const panFrameRef = useRef(null);
  const tooltipTimerRef = useRef(null);
  const chartSurfaceRef = useRef(null);
  const visibleRangeRef = useRef(visibleRange);
  visibleRangeRef.current = visibleRange;
  const effectiveShowDrawdown = showDrawdown && showDrawdownState;

  const delayTooltip = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
    }
    setTooltipReady(false);
    tooltipTimerRef.current = setTimeout(() => {
      tooltipTimerRef.current = null;
      setTooltipReady(true);
    }, TOOLTIP_SHOW_DELAY_MS);
  };

  const hideTooltip = () => {
    if (tooltipTimerRef.current) {
      clearTimeout(tooltipTimerRef.current);
      tooltipTimerRef.current = null;
    }
    setTooltipReady(false);
  };

  useEffect(
    () => () => {
      if (tooltipTimerRef.current) {
        clearTimeout(tooltipTimerRef.current);
      }
    },
    [],
  );
  const availableRangeOptions = useMemo(() => {
    const firstDate = DateTime.fromISO(data[0]?.date || "");
    const lastDate = DateTime.fromISO(data[data.length - 1]?.date || "");

    if (data.length < 2 || !firstDate.isValid || !lastDate.isValid) {
      return RANGE_OPTIONS.filter(
        (option) => option.id === "1d" || option.id === "all",
      );
    }

    const coverageDays = lastDate.diff(firstDate, "days").days;

    return RANGE_OPTIONS.filter(
      (option) =>
        option.id === "1d" ||
        option.days === null ||
        coverageDays >= option.days,
    );
  }, [data]);

  const applyRangeSelection = (rangeId) => {
    if (rangeId === "custom") {
      return;
    }

    setSelectedButton(rangeId);

    const selectedRange = availableRangeOptions.find(
      (option) => option.id === rangeId,
    );
    if (!selectedRange) {
      return;
    }
    setVisibleRange(getRangeForOption(selectedRange, data));
  };

  // Si el rango seleccionado deja de estar disponible, usar un fallback válido.
  useEffect(() => {
    if (selectedButton === "custom") {
      return;
    }

    if (availableRangeOptions.some((option) => option.id === selectedButton)) {
      return;
    }

    const preferredOrder = ["7d", "3d", "1d", "all"];
    const fallbackSelection =
      preferredOrder.find((id) =>
        availableRangeOptions.some((option) => option.id === id)
      ) || "all";

    setSelectedButton(fallbackSelection);
  }, [availableRangeOptions, selectedButton]);

  // Aplicar el rango seleccionado cuando cambia la selección o llegan nuevos datos.
  useLayoutEffect(() => {
    if (!data.length) {
      return;
    }

    if (selectedButton === "all") {
      setVisibleRange((currentRange) =>
        currentRange.start === 0 && currentRange.end === data.length - 1
          ? currentRange
          : { start: 0, end: data.length - 1 },
      );
      return;
    }

    if (selectedButton === "custom") {
      return;
    }

    const selectedRange = RANGE_OPTIONS.find((option) => option.id === selectedButton);
    if (!selectedRange?.days) {
      return;
    }

    const latestDate = DateTime.fromISO(data[data.length - 1].date);
    const cutoffDate = latestDate.minus({ days: selectedRange.days });
    const startIdx = data.findIndex((d) => DateTime.fromISO(d.date) >= cutoffDate);
    const nextRange = {
      start: startIdx >= 0 ? startIdx : 0,
      end: data.length - 1,
    };
    setVisibleRange((currentRange) =>
      currentRange.start === nextRange.start &&
      currentRange.end === nextRange.end
        ? currentRange
        : nextRange,
    );
  }, [data, selectedButton]);

  const getDataIndex = (chartState) => {
    if (chartState?.activeLabel !== undefined) {
      const index = data.findIndex(
        (point) => point.date === chartState.activeLabel,
      );
      if (index >= 0) {
        return index;
      }
    }
    return chartState?.activeTooltipIndex;
  };

  const handleChartMouseMove = (chartState) => {
    const activeIndex = getDataIndex(chartState);
    delayTooltip();
    if (typeof activeIndex === "number") {
      hoveredIndexRef.current = activeIndex;
    }
  };

  const handleChartWheel = useCallback(
    (event) => {
      if (data.length < 2 || event.deltaY === 0) {
        return;
      }

      event.preventDefault();
      const anchorIndex = Number.isInteger(hoveredIndexRef.current)
        ? hoveredIndexRef.current
        : Math.floor((visibleRange.start + visibleRange.end) / 2);
      const nextRange = getWheelZoomRange(
        visibleRange,
        anchorIndex,
        event.deltaY,
        data.length,
      );
      if (
        nextRange.start === visibleRange.start &&
        nextRange.end === visibleRange.end
      ) {
        return;
      }

      setVisibleRange(nextRange);
      setSelectedButton(
        getRangeSelection(nextRange, data, availableRangeOptions),
      );
    },
    [availableRangeOptions, data, visibleRange],
  );

  useEffect(() => {
    const chartSurface = chartSurfaceRef.current;
    if (!chartSurface) {
      return undefined;
    }

    const handleWheelOnChart = (event) => {
      if (chartSurface.contains(event.target)) {
        handleChartWheel(event);
      }
    };

    window.addEventListener("wheel", handleWheelOnChart, {
      capture: true,
      passive: false,
    });
    return () => window.removeEventListener("wheel", handleWheelOnChart, true);
  }, [handleChartWheel]);

  useEffect(() => {
    const applyPendingPan = () => {
      const nextRange = pendingPanRangeRef.current;
      pendingPanRangeRef.current = null;
      if (!nextRange) {
        return;
      }

      setVisibleRange((currentRange) =>
        currentRange.start === nextRange.start &&
        currentRange.end === nextRange.end
          ? currentRange
          : nextRange,
      );
      setSelectedButton(
        getRangeSelection(nextRange, data, availableRangeOptions),
      );
    };

    const handlePointerDown = (event) => {
      if (event.pointerType !== "mouse" || event.button !== 0) {
        return;
      }

      const chartSurface = chartSurfaceRef.current;
      const chartSvg = chartSurface?.querySelector(
        ".recharts-wrapper > svg.recharts-surface",
      );
      const target = event.target;
      const excludedRegion = target.closest?.(
        ".recharts-brush, .recharts-xAxis, .recharts-yAxis, .recharts-legend-wrapper",
      );
      if (
        !chartSvg ||
        (excludedRegion && excludedRegion !== chartSvg)
      ) {
        return;
      }

      const bounds = chartSvg.getBoundingClientRect();
      if (
        bounds.width <= 0 ||
        bounds.height <= 0 ||
        event.clientX < bounds.left ||
        event.clientX > bounds.right ||
        event.clientY < bounds.top ||
        event.clientY > bounds.bottom
      ) {
        return;
      }

      event.preventDefault();
      hideTooltip();
      panStartRef.current = {
        pointerId: event.pointerId,
        startX: event.clientX,
        plotWidth: bounds.width,
        range: visibleRangeRef.current,
      };
      setIsPanning(true);
      setSelectedButton("custom");
    };

    const handlePointerMove = (event) => {
      const panStart = panStartRef.current;
      if (
        !panStart ||
        event.pointerId !== panStart.pointerId ||
        !Number.isFinite(event.clientX)
      ) {
        return;
      }

      event.preventDefault();
      const nextRange = panEquityRangeByPixels(
        panStart.range,
        panStart.startX - event.clientX,
        panStart.plotWidth,
        data.length,
      );
      pendingPanRangeRef.current = nextRange;
      if (panFrameRef.current === null) {
        panFrameRef.current = window.requestAnimationFrame(() => {
          panFrameRef.current = null;
          applyPendingPan();
        });
      }
    };

    const handlePointerEnd = (event) => {
      if (panStartRef.current?.pointerId === event.pointerId) {
        if (panFrameRef.current !== null) {
          window.cancelAnimationFrame(panFrameRef.current);
          panFrameRef.current = null;
        }
        applyPendingPan();
        panStartRef.current = null;
        setIsPanning(false);
        delayTooltip();
      }
    };

    window.addEventListener("pointerdown", handlePointerDown, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointermove", handlePointerMove, {
      capture: true,
      passive: false,
    });
    window.addEventListener("pointerup", handlePointerEnd, true);
    window.addEventListener("pointercancel", handlePointerEnd, true);
    return () => {
      window.removeEventListener("pointerdown", handlePointerDown, true);
      window.removeEventListener("pointermove", handlePointerMove, true);
      window.removeEventListener("pointerup", handlePointerEnd, true);
      window.removeEventListener("pointercancel", handlePointerEnd, true);
      if (panFrameRef.current !== null) {
        window.cancelAnimationFrame(panFrameRef.current);
        panFrameRef.current = null;
      }
      pendingPanRangeRef.current = null;
    };
  }, [availableRangeOptions, data]);

  // Keep custom views anchored to their dates when backend compaction changes indexes.
  useLayoutEffect(() => {
    const previousData = previousDataRef.current;
    if (previousData !== data) {
      if (selectedButton === "custom") {
        setVisibleRange((currentRange) => {
          const nextRange = remapEquityRange(currentRange, previousData, data);
          return currentRange.start === nextRange.start &&
            currentRange.end === nextRange.end
            ? currentRange
            : nextRange;
        });
      } else if (selectedButton === "all") {
        setVisibleRange((currentRange) =>
          currentRange.start === 0 && currentRange.end === data.length - 1
            ? currentRange
            : { start: 0, end: data.length - 1 },
        );
      }
      previousDataRef.current = data;
    }
  }, [data, selectedButton]);

  // Filtrar datos según el rango visible
  // Determinar color de la ReferenceLine según el último equity
  const lastEquity = data.length ? data[data.length - 1].equity : 0;
  const refLineColor = lastEquity >= 0 ? "#2de2e6" : "#ff2e63";

  // Verificar si hay operaciones reales (no solo el punto inicial)
  const hasRealOperations = seriesData
    ? seriesData.length > 0
    : operations && operations.some((op) => op.closed_at || op.closeTime);

  if (loading) {
    return (
      <Box
        role="status"
        aria-label={t("dashboard.loading")}
        aria-busy="true"
        sx={{ minHeight: height, width: "100%" }}
      >
        <Skeleton variant="text" width="42%" height={34} sx={{ mb: 1 }} />
        <Skeleton variant="rounded" width="100%" height={height - 48} />
      </Box>
    );
  }

  if (!hasRealOperations) {
    return <Typography>{t("analyticsCharts.noEquity")}</Typography>;
  }

  return (
    <Box
      mb={4}
      sx={{
        minWidth: 0,
        width: "100%",
        maxWidth: "100%",
      }}
    >
      <Typography variant="h6" gutterBottom>
        {t("analyticsCharts.equity")}
        {showDrawdown ? ` & ${t("analyticsCharts.drawdown")}` : ""}
      </Typography>
      {showDrawdown && (
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block" }}
        >
          {t("charts.equityDescription")}
        </Typography>
      )}
      {showDrawdown && (
        <FormGroup row sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showEquity}
                onChange={() => setShowEquity((v) => !v)}
              />
            }
            label={t("analyticsCharts.showEquity")}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDrawdownState}
                onChange={() => setShowDrawdown((v) => !v)}
              />
            }
            label={t("analyticsCharts.showDrawdown")}
          />
        </FormGroup>
      )}

      {/* Controles de zoom */}
      <Box sx={{ mb: 2, display: "flex", gap: 0.5 }}>
        {[
          ...availableRangeOptions,
          ...(selectedButton === "custom"
            ? [{ id: "custom", label: t("analyticsCharts.rangeCustom") }]
            : []),
        ].map((option) => (
          <button
            key={option.id}
            type="button"
            className={`equity-range-button ${
              selectedButton === option.id ? "equity-range-button--active" : ""
            }`}
            aria-pressed={selectedButton === option.id}
            onClick={() => applyRangeSelection(option.id)}
          >
            {option.id === "all"
              ? t("analyticsCharts.rangeAll")
              : option.label}
          </button>
        ))}
      </Box>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: "block" }}>
        {t("analyticsCharts.zoomHint")}
      </Typography>

      <Paper
        ref={chartSurfaceRef}
        data-tooltip-ready={tooltipReady}
        sx={{
          p: 2,
          width: "100%",
          "& .recharts-surface": {
            cursor: isPanning ? "grabbing" : "grab",
            touchAction: "pan-y",
            userSelect: "none",
          },
        }}
      >
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={visibleData}
            margin={{ top: 20, right: 40, left: 0, bottom: 0 }}
            onMouseMove={handleChartMouseMove}
            onMouseLeave={() => {
              hideTooltip();
              hoveredIndexRef.current = Math.floor(
                (visibleRange.start + visibleRange.end) / 2,
              );
            }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="date"
              tickFormatter={(date) => formatDateLuxon(date, timeZone)}
              minTickGap={20}
              tick={getAxisStyle(currency)}
              axisLine={{ stroke: "#2de2e6" }}
            />
            <YAxis
              yAxisId="left"
              width={["COP", "CLP", "IDR", "KRW"].includes(currency) ? 85 : 70}
              tick={getAxisStyle(currency)}
              axisLine={{ stroke: "#2de2e6" }}
              tickFormatter={(value) => {
                const converted = convertFromUSDT(value, currency);
                const symbol = getCurrencySymbol(currency);
                return `${symbol}${converted.toLocaleString(undefined, {
                  maximumFractionDigits: 0,
                })}`;
              }}
            />
            {showDrawdown && (
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: t("analyticsCharts.drawdown"),
                  angle: 90,
                  position: "insideRight",
                  fill: "#fff",
                }}
                domain={["auto", 0]}
                tick={getAxisStyle(currency)}
                axisLine={{ stroke: "#ff2e63" }}
                tickFormatter={(value) => {
                  const converted = convertFromUSDT(value, currency);
                  const symbol = getCurrencySymbol(currency);
                  return `${symbol}${converted.toLocaleString(undefined, {
                    maximumFractionDigits: 0,
                  })}`;
                }}
              />
            )}
            {/* Línea horizontal en y=0, color dinámico, sin label */}
            <ReferenceLine
              y={0}
              yAxisId="left"
              stroke={refLineColor}
              strokeDasharray="4 2"
              ifOverflow="visible"
            />
            <Tooltip
              active={isPanning || !tooltipReady ? false : undefined}
              content={
                <EquityChartTooltip
                  currency={currency}
                  timeZone={timeZone}
                  t={t}
                />
              }
              cursor={false}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: "#fff" }}
            />
            {/* Línea de equity única, siempre cyan */}
            {showEquity && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="equity"
                stroke="#2de2e6"
                strokeWidth={3}
                dot={false}
                activeDot={isPanning ? false : undefined}
                name="Equity"
                isAnimationActive={false}
              />
            )}
            {effectiveShowDrawdown && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="drawdown"
                stroke="#ff2e63"
                strokeWidth={2}
                dot={false}
                activeDot={isPanning ? false : undefined}
                name={t("analyticsCharts.drawdown")}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
