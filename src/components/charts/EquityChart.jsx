// test comment
import React, { useState, useRef, useEffect, useMemo } from "react";
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
  Area,
  Dot,
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
import { buildEquityDrawdownData } from "./equityChartUtils";

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
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

const RANGE_OPTIONS = [
  { id: "1d", label: "1d", days: 1 },
  { id: "3d", label: "3d", days: 3 },
  { id: "7d", label: "7d", days: 7 },
  { id: "30d", label: "30d", days: 30 },
  { id: "90d", label: "90d", days: 90 },
  { id: "all", label: "All", days: null },
];

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
  const [visibleRange, setVisibleRange] = useState({
    start: 0,
    end: data.length - 1,
  });
  const [selectedButton, setSelectedButton] = useState("1d");
  const prevDataLengthRef = useRef(data.length);
  const chartContainerRef = useRef(null);
  const effectiveShowDrawdown = showDrawdown && showDrawdownState;
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
    setSelectedButton(rangeId);

    if (rangeId === "all") {
      setVisibleRange({ start: 0, end: data.length - 1 });
      return;
    }

    const selectedRange = RANGE_OPTIONS.find((option) => option.id === rangeId);
    if (!selectedRange?.days) {
      return;
    }

    const latestDate = DateTime.fromISO(data[data.length - 1].date);
    const cutoffDate = latestDate.minus({ days: selectedRange.days });
    const startIdx = data.findIndex((d) => DateTime.fromISO(d.date) >= cutoffDate);
    setVisibleRange({
      start: startIdx >= 0 ? startIdx : 0,
      end: data.length - 1,
    });
  };

  // Si el rango seleccionado deja de estar disponible, usar un fallback válido.
  useEffect(() => {
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
  useEffect(() => {
    if (!data.length) {
      return;
    }

    if (selectedButton === "all") {
      setVisibleRange({ start: 0, end: data.length - 1 });
      return;
    }

    const selectedRange = RANGE_OPTIONS.find((option) => option.id === selectedButton);
    if (!selectedRange?.days) {
      return;
    }

    const latestDate = DateTime.fromISO(data[data.length - 1].date);
    const cutoffDate = latestDate.minus({ days: selectedRange.days });
    const startIdx = data.findIndex((d) => DateTime.fromISO(d.date) >= cutoffDate);
    setVisibleRange({
      start: startIdx >= 0 ? startIdx : 0,
      end: data.length - 1,
    });
  }, [data, selectedButton]);

  // Mantener el rango visible cuando los datos se actualizan
  useEffect(() => {
    if (data.length !== prevDataLengthRef.current) {
      // Si hay nuevos datos, ajustar el rango para mantener la misma vista relativa
      const oldLength = prevDataLengthRef.current;
      const newLength = data.length;

      setVisibleRange((currentRange) =>
        oldLength > 0 && currentRange.end === oldLength - 1
          ? { start: currentRange.start, end: newLength - 1 }
          : currentRange,
      );

      prevDataLengthRef.current = newLength;
    }
  }, [data]);

  // Filtrar datos según el rango visible
  const visibleData = data.slice(visibleRange.start, visibleRange.end + 1);

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
        {availableRangeOptions.map((option) => (
          <button
            key={option.id}
            type="button"
            className={`equity-range-button ${
              selectedButton === option.id ? "equity-range-button--active" : ""
            }`}
            aria-pressed={selectedButton === option.id}
            onClick={() => applyRangeSelection(option.id)}
          >
            {option.id === "all" ? t("analyticsCharts.rangeAll") : option.label}
          </button>
        ))}
      </Box>

      <Paper ref={chartContainerRef} sx={{ p: 2, width: "100%" }}>
        <ResponsiveContainer width="100%" height={height}>
          <LineChart
            data={visibleData}
            margin={{ top: 20, right: 40, left: 0, bottom: 0 }}
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
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#2de2e6", fontWeight: 700 }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name) => {
                if (name === "Equity") {
                  const convertedValue = convertFromUSDT(
                    Number(value),
                    currency
                  );
                  return [formatCurrency(convertedValue, currency), "Equity"];
                } else if (
                  name === t("analyticsCharts.drawdown") ||
                  name === "drawdown" ||
                  name === "Drawdown (%)"
                ) {
                  return [
                    formatCurrency(
                      convertFromUSDT(Number(value), currency),
                      currency,
                    ),
                    t("analyticsCharts.drawdown"),
                  ];
                }
                return [value, name];
              }}
              labelFormatter={(d) => `Date: ${formatDateLuxon(d, timeZone)}`}
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
                name={t("analyticsCharts.drawdown")}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
