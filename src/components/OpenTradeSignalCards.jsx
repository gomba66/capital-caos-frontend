import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Activity,
  ArrowDownRight,
  ArrowUpRight,
  Download,
  Maximize2,
  Share2,
} from "lucide-react";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from "@mui/material";
import {
  CandlestickSeries,
  ColorType,
  CrosshairMode,
  createChart,
  createSeriesMarkers,
  LineStyle,
  TickMarkType,
} from "lightweight-charts";
import { useTranslation } from "react-i18next";
import {
  getTradeCandles,
  calculateAtr14,
  getStopMarginScore,
  getTradeProjection,
  isTradeSignalEligible,
  TRADE_SIGNAL_MIN_STOP_ATR,
  TRADE_SIGNAL_CHART_CANDLE_LIMIT,
  TRADE_SIGNAL_EXPANDED_CHART_CANDLE_LIMIT,
  TRADE_SIGNAL_CHART_TIMEFRAME,
} from "../utils/tradeSignalMetrics";

const EMPTY_TRADES = [];
const TRADE_CHART_REFRESH_INTERVAL_MS = 30_000;

function tradeMetricsKey(trade) {
  return (
    (trade.id !== undefined && trade.id !== null
      ? String(trade.id)
      : null) ??
    [
      trade.symbol,
      trade.side ?? trade.positionSide,
      trade.entry_price ?? trade.entryPrice,
      trade.initial_stop ?? trade.stop_loss,
    ].join(":")
  );
}

function getTradeUpdateSignature(trades) {
  return JSON.stringify(
    trades.map((trade) => ({
      key: tradeMetricsKey(trade),
      symbol: trade.symbol,
      side: trade.side ?? trade.positionSide,
      entry: trade.entry_price ?? trade.entryPrice,
      stop: trade.initial_stop ?? trade.stop_loss,
      target:
        trade.tp_price ??
        trade.take_profit_target?.tp_price ??
        trade.estimated_tp_price ??
        trade.take_profit_target?.estimated_tp_price,
      ratio: trade.take_profit_target?.ratio,
    })),
  );
}

function getTradePriceLevels(entryValue, stopValue, targetValue) {
  const entry = Number(entryValue);
  const stop = Number(stopValue);
  const target = Number(targetValue);
  return [
    { id: "entry", price: Number.isFinite(entry) && entry > 0 ? entry : null },
    { id: "stop", price: Number.isFinite(stop) && stop > 0 ? stop : null },
    { id: "target", price: Number.isFinite(target) && target > 0 ? target : null },
  ];
}

function formatPrice(value) {
  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 8,
  }).format(value);
}

function getBotPnl(trade) {
  const pnl = Number(
    trade?.unrealizedProfit ??
      trade?.unRealizedProfit ??
      trade?.unrealized_pnl ??
      trade?.pnl,
  );
  return Number.isFinite(pnl) ? pnl : null;
}

function formatBotPnl(pnl) {
  const amount = new Intl.NumberFormat(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Math.abs(pnl));
  return `${pnl > 0 ? "+" : pnl < 0 ? "−" : ""}${amount} USDT`;
}

function formatShareDate(value) {
  const timestamp = toChartTimestamp(value);
  return timestamp === null
    ? "—"
    : new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(timestamp * 1000);
}

function formatSharePrice(value, t) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0
    ? formatPrice(price)
    : t("tradeToast.unavailable");
}

function toChartTimestamp(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? Number(value)
      : Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return Math.floor(parsed > 1e12 ? parsed / 1000 : parsed);
}

function nearestChartCandleTime(candles, timestamp) {
  if (!candles.length || timestamp === null) return null;
  return candles.reduce((closest, candle) =>
    Math.abs(candle.time - timestamp) < Math.abs(closest - timestamp)
      ? candle.time
      : closest,
  candles[0].time);
}

function stopMarginForTrade(trade) {
  const entry = Number(trade.entry_price ?? trade.entryPrice);
  const initialStop = Number(trade.initial_stop);
  const currentStop = Number(trade.stop_loss);
  const stop = initialStop > 0 ? initialStop : currentStop;
  return getTradeCandles(trade.symbol).then((candles) =>
    getStopMarginScore(entry, stop, calculateAtr14(candles)),
  );
}

const SHARE_STYLES = ["cipher", "moonshot", "garden", "chaos"];

function getNicePriceStep(range, targetTickCount = 4) {
  const roughStep = range / targetTickCount;
  const magnitude = 10 ** Math.floor(Math.log10(roughStep));
  const normalized = roughStep / magnitude;
  const niceStep =
    normalized <= 1 ? 1 : normalized <= 2 ? 2 : normalized <= 5 ? 5 : 10;
  return niceStep * magnitude;
}

function formatChartPrice(price) {
  return new Intl.NumberFormat(undefined, {
    maximumSignificantDigits: 6,
  }).format(price);
}

function formatCandleTime(candle) {
  const rawTime = Number(candle?.time ?? candle?.timestamp);
  if (!Number.isFinite(rawTime)) return "";
  const time = new Date(rawTime < 1e12 ? rawTime * 1000 : rawTime);
  if (Number.isNaN(time.getTime())) return "";
  return new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
  }).format(time);
}

function tradeChartGeometry(candles, trade) {
  const validCandles = candles.filter((candle) => {
    const [open, high, low, close] = [
      candle.open,
      candle.high,
      candle.low,
      candle.close,
    ].map(Number);
    return [open, high, low, close].every(Number.isFinite) && high >= low;
  });
  if (!validCandles.length) return null;

  const width = 390;
  const height = 174;
  const padding = { top: 10, right: 58, bottom: 24, left: 8 };
  const plotWidth = width - padding.left - padding.right;
  const plotHeight = height - padding.top - padding.bottom;
  const levels = [
    { id: "entry", price: Number(trade.entry_price ?? trade.entryPrice) },
    { id: "stop", price: Number(trade.initial_stop ?? trade.stop_loss) },
    { id: "target", price: getTradeProjection(trade).targetPrice },
  ].filter((level) => Number.isFinite(level.price) && level.price > 0);
  const minDataPrice = Math.min(
    ...validCandles.map((candle) => Number(candle.low)),
    ...levels.map((level) => level.price),
  );
  const maxDataPrice = Math.max(
    ...validCandles.map((candle) => Number(candle.high)),
    ...levels.map((level) => level.price),
  );
  const rawRange = maxDataPrice - minDataPrice || maxDataPrice * 0.001 || 1;
  const tickStep = getNicePriceStep(rawRange * 1.12);
  const minPrice = Math.floor((minDataPrice - rawRange * 0.06) / tickStep) * tickStep;
  const maxPrice = Math.ceil((maxDataPrice + rawRange * 0.06) / tickStep) * tickStep;
  const priceRange = maxPrice - minPrice || 1;
  const scalePrice = (price) =>
    padding.top + ((maxPrice - price) / priceRange) * plotHeight;
  const firstTick = Math.ceil(minPrice / tickStep);
  const lastTick = Math.floor(maxPrice / tickStep);
  const priceTicks = Array.from(
    { length: Math.min(8, lastTick - firstTick + 1) },
    (_, index) => (firstTick + index) * tickStep,
  );
  const candleAreaWidth = plotWidth * 0.88;
  const candleStep = candleAreaWidth / validCandles.length;
  const candleWidth = Math.max(2, Math.min(7, candleStep * 0.58));
  const timeIndexes = [...new Set([0, Math.floor((validCandles.length - 1) / 2), validCandles.length - 1])];
  const timeTicks = timeIndexes.map((index) => ({
    x: padding.left + (index + 0.5) * candleStep,
    label: formatCandleTime(validCandles[index]),
    index,
  }));

  return {
    width,
    height,
    padding,
    plotHeight,
    minPrice,
    maxPrice,
    priceRange,
    priceTicks,
    timeTicks,
    scalePrice,
    candleStep,
    candleWidth,
    candles: validCandles,
    levels,
  };
}

function TradeCandlestickChart({
  candles,
  trade,
  t,
  compact = false,
  onExpand,
  chartMode = "custom",
  chartInstanceRef,
  onChartReady,
}) {
  const geometry = useMemo(
    () => tradeChartGeometry(candles, trade),
    [candles, trade],
  );
  if (chartMode === "tradingview") {
    return (
      <TradingViewTradeChart
        trade={trade}
        candles={candles}
        t={t}
        compact={compact}
        onExpand={onExpand}
        chartInstanceRef={chartInstanceRef}
        onChartReady={onChartReady}
      />
    );
  }
  if (!geometry) {
    return (
      <div className="open-trade-signal-card__chart-empty">
        {t("tradeSignals.chartUnavailable")}
      </div>
    );
  }

  const {
    width,
    height,
    padding,
    plotHeight,
    scalePrice,
    priceTicks,
    timeTicks,
    candleStep,
    candleWidth,
    candles: visibleCandles,
    levels,
  } = geometry;

  return (
    <div
      className={`open-trade-signal-card__chart${compact ? " open-trade-signal-card__chart--compact" : ""}`}
    >
      <div className="open-trade-signal-card__chart-toolbar">
        <span>
          {t("tradeSignals.chartInterval", {
            interval: TRADE_SIGNAL_CHART_TIMEFRAME,
          })}
        </span>
        {onExpand && (
          <button
            type="button"
            className="open-trade-signal-card__expand"
            onClick={onExpand}
            aria-label={t("tradeSignals.expandChart")}
          >
            <Maximize2 size={13} aria-hidden="true" />
            {t("tradeSignals.expandChart")}
          </button>
        )}
      </div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label={t("tradeSignals.candlestickChart", {
          symbol: trade.symbol.replace(":USDT", ""),
          interval: TRADE_SIGNAL_CHART_TIMEFRAME,
        })}
      >
        {priceTicks.map((tick) => {
          const y = scalePrice(tick);
          return (
            <g key={`price-tick-${tick}`}>
              <line
                x1={padding.left}
                x2={width - padding.right}
                y1={y}
                y2={y}
                className="open-trade-signal-card__chart-grid"
              />
              <text
                x={width - padding.right + 5}
                y={y + 3}
                className="open-trade-signal-card__price-tick"
              >
                {formatChartPrice(tick)}
              </text>
            </g>
          );
        })}
        {timeTicks.map((tick) => (
          <line
            key={`time-grid-${tick.index}`}
            x1={tick.x}
            x2={tick.x}
            y1={padding.top}
            y2={padding.top + plotHeight}
            className="open-trade-signal-card__chart-grid open-trade-signal-card__chart-grid--vertical"
          />
        ))}
        {visibleCandles.map((candle, index) => {
          const x = padding.left + (index + 0.5) * candleStep;
          const openY = scalePrice(Number(candle.open));
          const closeY = scalePrice(Number(candle.close));
          const isUp = Number(candle.close) >= Number(candle.open);
          return (
            <g
              key={`${candle.time ?? candle.timestamp ?? index}-${index}`}
              className={
                isUp
                  ? "open-trade-signal-card__candle--up"
                  : "open-trade-signal-card__candle--down"
              }
            >
              <line
                x1={x}
                x2={x}
                y1={scalePrice(Number(candle.high))}
                y2={scalePrice(Number(candle.low))}
                className="open-trade-signal-card__candle-wick"
              />
              <rect
                x={x - candleWidth / 2}
                y={Math.min(openY, closeY)}
                width={candleWidth}
                height={Math.max(1, Math.abs(closeY - openY))}
                rx="0.7"
                className="open-trade-signal-card__candle-body"
              />
            </g>
          );
        })}
        {timeTicks.map((tick) => (
          <text
            key={`time-tick-${tick.index}`}
            x={tick.x}
            y={height - 5}
            textAnchor={tick.index === 0 ? "start" : tick.index === visibleCandles.length - 1 ? "end" : "middle"}
            className="open-trade-signal-card__time-tick"
          >
            {tick.label}
          </text>
        ))}
        {levels.map((level) => {
          const y = scalePrice(level.price);
          return (
            <g
              key={level.id}
              className={`open-trade-signal-card__level open-trade-signal-card__level--${level.id}`}
            >
              <line x1={padding.left} x2={width - padding.right} y1={y} y2={y} />
            </g>
          );
        })}
        {levels.map((level) => {
          const y = scalePrice(level.price);
          return (
            <g
              key={`axis-${level.id}`}
              className={`open-trade-signal-card__level-axis open-trade-signal-card__level-axis--${level.id}`}
            >
              <rect
                x={width - padding.right + 1}
                y={y - 6}
                width={padding.right - 5}
                height={12}
                rx={2}
              />
              <text
                x={width - padding.right + padding.right / 2 - 2}
                y={y + 3}
                textAnchor="middle"
              >
                {formatChartPrice(level.price)}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

function decimalPlaces(value) {
  const [coefficient, exponentText] = Number(value)
    .toPrecision(12)
    .toLowerCase()
    .split("e");
  const trimmedCoefficient = coefficient.replace(/(\.\d*?)0+$/, "$1");
  const fractionLength = trimmedCoefficient.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText || 0));
}

function TradingViewTradeChart({
  trade,
  candles,
  t,
  compact = false,
  onExpand,
  chartInstanceRef,
  onChartReady,
}) {
  const chartContainerRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const currentCandlesRef = useRef(null);
  const lastSetCandlesRef = useRef(null);
  const [themeRevision, setThemeRevision] = useState(0);
  const entryValue = trade.entry_price ?? trade.entryPrice;
  const stopValue = trade.initial_stop ?? trade.stop_loss;
  const targetValue =
    trade.closed_at || trade.closeTime
      ? trade.exit_price ?? trade.exitPrice
      : trade.tp_price ||
        trade.take_profit_target?.tp_price ||
        trade.estimated_tp_price ||
        trade.take_profit_target?.estimated_tp_price;
  const closedTrade = Boolean(trade.closed_at ?? trade.closeTime);
  const levels = useMemo(
    () => getTradePriceLevels(entryValue, stopValue, targetValue),
    [entryValue, stopValue, targetValue],
  );
  const validCandles = useMemo(
    () =>
      [...(candles || [])]
        .map((candle) => ({
          time: Math.floor(
            Number(candle.time ?? candle.timestamp) > 1e12
              ? Number(candle.time ?? candle.timestamp) / 1000
              : Number(candle.time ?? candle.timestamp),
          ),
          open: Number(candle.open),
          high: Number(candle.high),
          low: Number(candle.low),
          close: Number(candle.close),
        }))
        .filter(
          (candle) =>
            Number.isFinite(candle.time) &&
            [candle.open, candle.high, candle.low, candle.close].every(
              Number.isFinite,
            ) &&
            candle.high >= candle.low,
        )
        .sort((left, right) => left.time - right.time)
        .filter(
          (candle, index, sortedCandles) =>
            index === 0 || candle.time !== sortedCandles[index - 1].time,
        ),
    [candles],
  );
  currentCandlesRef.current = validCandles;
  const hasCandles = validCandles.length > 0;
  const prices = [
    ...validCandles.flatMap((candle) => [
      candle.open,
      candle.high,
      candle.low,
      candle.close,
    ]),
    ...levels.map(({ price }) => price).filter(Number.isFinite),
  ];
  const pricePrecision = Math.min(
    12,
    Math.max(2, ...prices.map(decimalPlaces)),
  );

  useEffect(() => {
    const root = document.documentElement;
    const observer = new MutationObserver(() => {
      setThemeRevision((revision) => revision + 1);
    });
    observer.observe(root, {
      attributes: true,
      attributeFilter: ["data-theme", "data-palette"],
    });
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || !hasCandles) return undefined;

    const styles = getComputedStyle(document.documentElement);
    const green = styles.getPropertyValue("--green").trim() || "#63d4a4";
    const red = styles.getPropertyValue("--red").trim() || "#ef8b7f";
    const amber = styles.getPropertyValue("--amber").trim() || "#dfaa68";
    const muted = styles.getPropertyValue("--muted").trim() || "#91aaa0";
    const line = styles.getPropertyValue("--line").trim() || "#213a31";
    const lineSoft = styles.getPropertyValue("--line-soft").trim() || "#213a31";
    const mono = styles.getPropertyValue("--mono").trim() || "monospace";
    const background =
      styles.getPropertyValue("--white").trim() || "#0d1b18";
    const levelColors = {
      entry: green,
      stop: red,
      target: amber,
    };
    const overlayPrices = levels
      .map(({ price }) => price)
      .filter(Number.isFinite);
    const chart = createChart(container, {
      autoSize: true,
      crosshair: { mode: CrosshairMode.Normal },
      layout: {
        background: { type: ColorType.Solid, color: background },
        textColor: muted,
        fontFamily: mono,
      },
      grid: {
        vertLines: { color: lineSoft },
        horzLines: { color: lineSoft },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: line,
        ticksVisible: true,
        minimumWidth: compact ? 62 : 82,
        scaleMargins: { top: 0.1, bottom: 0.1 },
      },
      timeScale: {
        borderColor: line,
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 8,
        tickMarkFormatter: (time, tickMarkType, locale) => {
          const date = new Date(Number(time) * 1000);
          const options =
            tickMarkType === TickMarkType.Year
              ? { year: "numeric" }
              : tickMarkType === TickMarkType.Month
                ? { month: "short", year: "numeric" }
                : tickMarkType === TickMarkType.DayOfMonth
                  ? { month: "short", day: "numeric" }
                  : tickMarkType === TickMarkType.TimeWithSeconds
                    ? { hour: "2-digit", minute: "2-digit", second: "2-digit" }
                    : { hour: "2-digit", minute: "2-digit" };
          return new Intl.DateTimeFormat(locale, options).format(date);
        },
      },
      localization: {
        priceFormatter: (price) =>
          price
            .toFixed(pricePrecision)
            .replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1"),
      },
    });
    if (chartInstanceRef) chartInstanceRef.current = chart;
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: green,
      downColor: red,
      borderVisible: false,
      wickUpColor: green,
      wickDownColor: red,
      priceFormat: {
        type: "price",
        precision: pricePrecision,
        minMove: Number((10 ** -pricePrecision).toPrecision(pricePrecision)),
      },
      autoscaleInfoProvider: (original) => {
        const info = original();
        if (!info || overlayPrices.length === 0) return info;
        return {
          ...info,
          priceRange: {
            ...info.priceRange,
            minValue: Math.min(info.priceRange.minValue, ...overlayPrices),
            maxValue: Math.max(info.priceRange.maxValue, ...overlayPrices),
          },
        };
      },
    });
    candleSeriesRef.current = candleSeries;
    const initialCandles = currentCandlesRef.current;
    candleSeries.setData(initialCandles);
    lastSetCandlesRef.current = initialCandles;
    levels.forEach(({ id, price }) => {
      if (!Number.isFinite(price)) return;
      candleSeries.createPriceLine({
        price,
        title:
          closedTrade && id === "target"
            ? t("closedTradeChart.exit")
            : t(`tradeSignals.levels.${id}`),
        color: levelColors[id],
        lineWidth: 1,
        lineStyle: LineStyle.Dashed,
        axisLabelVisible: true,
        axisLabelColor: levelColors[id],
        axisLabelTextColor: background,
      });
    });
    if (closedTrade) {
      const openTimestamp = toChartTimestamp(
        trade.opened_at ?? trade.timestamp ?? trade.openTime ?? trade.entry_time,
      );
      const closeTimestamp = toChartTimestamp(
        trade.closed_at ?? trade.closeTime,
      );
      const markers = [
        {
          time: nearestChartCandleTime(
            currentCandlesRef.current,
            openTimestamp,
          ),
          position: "belowBar",
          color: green,
          shape: "arrowUp",
          text: t("closedTradeChart.entry"),
        },
        {
          time: nearestChartCandleTime(
            currentCandlesRef.current,
            closeTimestamp,
          ),
          position: "aboveBar",
          color: amber,
          shape: "arrowDown",
          text: t("closedTradeChart.exit"),
        },
      ].filter((marker) => marker.time !== null);
      if (markers.length) createSeriesMarkers(candleSeries, markers);
    }
    chart.timeScale().fitContent();
    onChartReady?.();

    return () => {
      if (chartInstanceRef?.current === chart) chartInstanceRef.current = null;
      if (candleSeriesRef.current === candleSeries) {
        candleSeriesRef.current = null;
        lastSetCandlesRef.current = null;
      }
      chart.remove();
    };
  }, [
    hasCandles,
    levels,
    closedTrade,
    trade.opened_at,
    trade.timestamp,
    trade.openTime,
    trade.entry_time,
    trade.closed_at,
    trade.closeTime,
    pricePrecision,
    t,
    compact,
    chartInstanceRef,
    onChartReady,
    themeRevision,
  ]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (
      !candleSeries ||
      validCandles.length === 0 ||
      lastSetCandlesRef.current === validCandles
    ) {
      return;
    }
    candleSeries.setData(validCandles);
    lastSetCandlesRef.current = validCandles;
  }, [validCandles]);

  return (
    <div className="open-trade-signal-card__chart open-trade-signal-card__chart--tradingview">
      <div className="open-trade-signal-card__chart-toolbar">
        <span>
          {t("tradeSignals.chartInterval", {
            interval: TRADE_SIGNAL_CHART_TIMEFRAME,
          })}
        </span>
        {onExpand && (
          <button
            type="button"
            className="open-trade-signal-card__expand"
            onClick={onExpand}
            aria-label={t("tradeSignals.expandChart")}
          >
            <Maximize2 size={13} aria-hidden="true" />
            {t("tradeSignals.expandChart")}
          </button>
        )}
      </div>
      {validCandles.length ? (
        <div
          ref={chartContainerRef}
          className="open-trade-signal-card__tradingview-chart"
          role="img"
          aria-label={t("tradeChartMode.tradingViewChart", {
            symbol: trade.symbol.replace(":USDT", ""),
          })}
        />
      ) : (
        <div className="open-trade-signal-card__chart-empty">
          {t("tradeSignals.chartUnavailable")}
        </div>
      )}
    </div>
  );
}

function TradeChartDialog({ trade, candles, chartMode, open, onClose }) {
  const { t } = useTranslation();
  const symbol = trade.symbol.replace(":USDT", "");

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      aria-labelledby="trade-chart-title"
    >
      <DialogTitle id="trade-chart-title">
        {t("tradeSignals.chartTitle", {
          symbol,
          interval: TRADE_SIGNAL_CHART_TIMEFRAME,
        })}
      </DialogTitle>
      <DialogContent className="trade-chart-dialog">
        <TradeCandlestickChart
          candles={candles}
          trade={trade}
          t={t}
          chartMode={chartMode}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{t("tradeSignals.closeShare")}</Button>
      </DialogActions>
    </Dialog>
  );
}

function drawShareCandles(context, candles, x, y, width, height, colors, trade) {
  const geometry = tradeChartGeometry(candles, trade);
  if (!geometry) return;
  const {
    minPrice,
    maxPrice,
    candles: validCandles,
    levels,
    priceTicks,
    timeTicks,
  } = geometry;
  const axisWidth = 78;
  const plotWidth = width - axisWidth;
  const plotTop = y + 8;
  const plotHeightScaled = height - 28;
  const step = plotWidth / validCandles.length;
  const candleWidth = Math.max(2, Math.min(8, step * 0.6));
  const scalePrice = (price) =>
    plotTop + ((maxPrice - price) / (maxPrice - minPrice || 1)) * plotHeightScaled;

  context.save();
  context.beginPath();
  context.rect(x, y, width, height);
  context.clip();
  context.strokeStyle = colors.grid;
  context.lineWidth = 1;
  context.font = "500 16px Arial, sans-serif";
  priceTicks.forEach((tick) => {
    const gridY = scalePrice(tick);
    context.beginPath();
    context.moveTo(x, gridY);
    context.lineTo(x + plotWidth, gridY);
    context.stroke();
    context.fillStyle = colors.muted;
    context.textAlign = "left";
    context.fillText(formatChartPrice(tick), x + plotWidth + 8, gridY + 5);
  });
  timeTicks.forEach((tick) => {
    const tickX = x + (tick.index + 0.5) * step;
    context.strokeStyle = colors.grid;
    context.beginPath();
    context.moveTo(tickX, plotTop);
    context.lineTo(tickX, plotTop + plotHeightScaled);
    context.stroke();
  });
  validCandles.forEach((candle, index) => {
    const centerX = x + (index + 0.5) * step;
    const isUp = Number(candle.close) >= Number(candle.open);
    context.strokeStyle = isUp ? colors.up : colors.down;
    context.fillStyle = context.strokeStyle;
    context.lineWidth = 2;
    context.beginPath();
    context.moveTo(centerX, scalePrice(Number(candle.high)));
    context.lineTo(centerX, scalePrice(Number(candle.low)));
    context.stroke();
    const openY = scalePrice(Number(candle.open));
    const closeY = scalePrice(Number(candle.close));
    context.fillRect(
      centerX - candleWidth / 2,
      Math.min(openY, closeY),
      candleWidth,
      Math.max(2, Math.abs(closeY - openY)),
    );
  });
  context.setLineDash([8, 6]);
  context.font = "700 14px Arial, sans-serif";
  context.textAlign = "right";
  levels.forEach((level) => {
    const levelY = scalePrice(level.price);
    const color =
      level.id === "entry"
        ? colors.up
        : level.id === "stop"
          ? colors.down
          : colors.accent;
    context.strokeStyle = color;
    context.fillStyle = color;
    context.beginPath();
    context.moveTo(x, levelY);
    context.lineTo(x + plotWidth, levelY);
    context.stroke();
    const labelWidth = axisWidth - 8;
    const labelHeight = 28;
    const labelX = x + plotWidth + 4;
    const labelY = levelY - labelHeight / 2;
    context.fillRect(labelX, labelY, labelWidth, labelHeight);
    context.fillStyle = colors.background;
    context.textAlign = "center";
    context.font = "700 14px Arial, sans-serif";
    context.fillText(
      formatChartPrice(level.price),
      labelX + labelWidth / 2,
      levelY + 5,
    );
  });
  context.setLineDash([]);
  context.fillStyle = colors.muted;
  context.font = "500 14px Arial, sans-serif";
  context.textAlign = "center";
  timeTicks.forEach((tick) => {
    if (!tick.label) return;
    const tickX = x + (tick.index + 0.5) * step;
    context.fillText(tick.label, tickX, y + height - 3);
  });
  context.textAlign = "left";
  context.restore();
}

const SHARE_STYLE_PALETTES = {
  cipher: {
    background: "#071210",
    accent: "#63d4a4",
    text: "#e5f0e9",
    muted: "#91aaa0",
    grid: "rgba(145,170,160,.18)",
    up: "#63d4a4",
    down: "#ef8b7f",
    title: "CAPITAL CAOS",
  },
  moonshot: {
    background: "#090d12",
    accent: "#a9b2bb",
    text: "#edf0f2",
    muted: "#a0a9b0",
    grid: "rgba(226,232,237,.14)",
    up: "#9eafa6",
    down: "#b6a09e",
    title: "NEXT MOVE",
  },
  garden: {
    background: "#101412",
    accent: "#b0b8ae",
    text: "#edf0eb",
    muted: "#a3aaa2",
    grid: "rgba(225,232,225,.13)",
    up: "#a5b3a7",
    down: "#b5a09a",
    title: "STAY GROUNDED",
  },
  chaos: {
    background: "#111112",
    accent: "#b8b2a9",
    text: "#f0eeea",
    muted: "#aaa59f",
    grid: "rgba(235,231,224,.13)",
    up: "#a8b2a9",
    down: "#b69e99",
    title: "CONTROLLED CHAOS",
  },
};

function roundedRect(context, x, y, width, height, radius) {
  context.beginPath();
  context.moveTo(x + radius, y);
  context.lineTo(x + width - radius, y);
  context.quadraticCurveTo(x + width, y, x + width, y + radius);
  context.lineTo(x + width, y + height - radius);
  context.quadraticCurveTo(
    x + width,
    y + height,
    x + width - radius,
    y + height,
  );
  context.lineTo(x + radius, y + height);
  context.quadraticCurveTo(x, y + height, x, y + height - radius);
  context.lineTo(x, y + radius);
  context.quadraticCurveTo(x, y, x + radius, y);
  context.closePath();
  context.fill();
}

function drawShareBackdrop(context, style, palette) {
  context.fillStyle = palette.background;
  context.fillRect(0, 0, 1080, 1350);

  if (style === "cipher") {
    const glow = context.createRadialGradient(930, 125, 30, 930, 125, 720);
    glow.addColorStop(0, `${palette.accent}38`);
    glow.addColorStop(1, `${palette.accent}00`);
    context.fillStyle = glow;
    context.fillRect(0, 0, 1080, 1350);
    return;
  }

  const atmosphere = context.createLinearGradient(0, 0, 1080, 1050);
  atmosphere.addColorStop(0, "#34383b");
  atmosphere.addColorStop(0.46, palette.background);
  atmosphere.addColorStop(1, "#050607");
  context.fillStyle = atmosphere;
  context.fillRect(0, 0, 1080, 1350);

  if (style === "moonshot") {
    const moon = context.createRadialGradient(810, 350, 22, 810, 350, 255);
    moon.addColorStop(0, "rgba(231,235,237,.42)");
    moon.addColorStop(0.55, "rgba(183,192,198,.18)");
    moon.addColorStop(1, "rgba(128,139,147,0)");
    context.fillStyle = moon;
    context.fillRect(455, 0, 625, 850);
    context.fillStyle = "rgba(5,7,9,.28)";
    context.beginPath();
    context.moveTo(380, 790);
    context.lineTo(585, 565);
    context.lineTo(695, 674);
    context.lineTo(825, 448);
    context.lineTo(1080, 736);
    context.lineTo(1080, 1040);
    context.lineTo(380, 1040);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(0,0,0,.34)";
    context.beginPath();
    context.moveTo(510, 860);
    context.lineTo(755, 632);
    context.lineTo(895, 752);
    context.lineTo(1035, 564);
    context.lineTo(1080, 614);
    context.lineTo(1080, 1080);
    context.lineTo(510, 1080);
    context.closePath();
    context.fill();
  } else if (style === "garden") {
    const mist = context.createRadialGradient(810, 560, 25, 810, 560, 500);
    mist.addColorStop(0, "rgba(220,226,216,.24)");
    mist.addColorStop(1, "rgba(220,226,216,0)");
    context.fillStyle = mist;
    context.fillRect(300, 120, 780, 850);
    context.fillStyle = "rgba(7,10,9,.22)";
    context.beginPath();
    context.moveTo(280, 820);
    context.quadraticCurveTo(640, 550, 1080, 710);
    context.lineTo(1080, 1090);
    context.lineTo(280, 1090);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(0,0,0,.36)";
    context.beginPath();
    context.moveTo(350, 1010);
    context.quadraticCurveTo(750, 690, 1080, 870);
    context.lineTo(1080, 1130);
    context.lineTo(350, 1130);
    context.closePath();
    context.fill();
    context.fillStyle = "rgba(3,6,5,.52)";
    [735, 830, 945, 1025].forEach((x, index) => {
      const top = 530 + (index % 2) * 72;
      context.fillRect(x, top, 9, 360);
      context.beginPath();
      context.moveTo(x - 72, top + 65);
      context.lineTo(x + 4, top - 92);
      context.lineTo(x + 82, top + 65);
      context.closePath();
      context.fill();
    });
  } else {
    const light = context.createRadialGradient(880, 430, 12, 880, 430, 450);
    light.addColorStop(0, "rgba(222,218,211,.24)");
    light.addColorStop(1, "rgba(222,218,211,0)");
    context.fillStyle = light;
    context.fillRect(330, 0, 750, 950);
    context.fillStyle = "rgba(0,0,0,.26)";
    context.fillRect(660, 160, 420, 570);
    context.strokeStyle = "rgba(220,216,209,.16)";
    context.lineWidth = 8;
    context.beginPath();
    context.moveTo(800, 160);
    context.lineTo(800, 730);
    context.moveTo(960, 160);
    context.lineTo(960, 730);
    context.moveTo(660, 440);
    context.lineTo(1080, 440);
    context.stroke();
    context.strokeStyle = "rgba(214,210,204,.2)";
    context.lineWidth = 5;
    context.beginPath();
    context.moveTo(695, 400);
    context.lineTo(760, 355);
    context.lineTo(820, 380);
    context.lineTo(875, 295);
    context.lineTo(930, 325);
    context.lineTo(1010, 246);
    context.stroke();
  }

  const shade = context.createLinearGradient(0, 0, 1080, 0);
  shade.addColorStop(0, "rgba(0,0,0,.82)");
  shade.addColorStop(0.47, "rgba(0,0,0,.48)");
  shade.addColorStop(1, "rgba(0,0,0,.1)");
  context.fillStyle = shade;
  context.fillRect(0, 0, 1080, 1350);
  const vignette = context.createRadialGradient(650, 690, 140, 650, 690, 850);
  vignette.addColorStop(0, "rgba(0,0,0,0)");
  vignette.addColorStop(1, "rgba(0,0,0,.52)");
  context.fillStyle = vignette;
  context.fillRect(0, 0, 1080, 1350);
}

function buildShareCanvas(
  trade,
  candles,
  style,
  projection,
  t,
  chartScreenshot,
  includePnl,
  variant,
  shareInterval,
) {
  const canvas = document.createElement("canvas");
  canvas.width = 1080;
  canvas.height = 1350;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Image canvas is not available");
  const palette = SHARE_STYLE_PALETTES[style];
  const symbol = trade.symbol.replace(":USDT", "");
  const side = String(trade.side ?? trade.positionSide ?? "").toUpperCase();
  const closedTrade = variant === "closed";

  drawShareBackdrop(context, style, palette);

  context.fillStyle = `${palette.accent}22`;
  roundedRect(context, 72, 78, 54, 54, 14);
  context.strokeStyle = palette.accent;
  context.lineWidth = 4;
  context.lineCap = "round";
  context.lineJoin = "round";
  context.beginPath();
  context.moveTo(116, 105);
  context.lineTo(109, 105);
  context.lineTo(104, 121);
  context.lineTo(93, 88);
  context.lineTo(88, 105);
  context.lineTo(80, 105);
  context.stroke();
  context.fillStyle = palette.text;
  context.font = "800 42px Arial, sans-serif";
  context.fillText("CIPHER DESK", 150, 116);
  context.fillStyle = palette.muted;
  context.font = "600 20px Arial, sans-serif";
  context.font = "600 20px Arial, sans-serif";
  context.fillText(
    `by SIGLO CAPITAL · ${closedTrade ? "CLOSED BOT TRADE" : "LIVE BOT POSITION"} · ${shareInterval.toUpperCase()} MARKET VIEW`,
    152,
    151,
  );

  context.fillStyle = palette.text;
  context.font = "800 88px Arial, sans-serif";
  context.fillText(symbol, 72, 274);
  context.fillStyle = palette.accent;
  context.font = "700 28px Arial, sans-serif";
  context.fillText(side, 76, 326);
  context.textAlign = "right";
  context.fillStyle = palette.muted;
  context.font = "700 30px Arial, sans-serif";
  context.fillText(palette.title, 1008, 326);
  context.textAlign = "left";

  context.fillStyle = "rgba(4,11,10,.48)";
  roundedRect(context, 72, 378, 936, 550, 28);
  if (chartScreenshot) {
    context.drawImage(chartScreenshot, 108, 408, 864, 490);
  } else {
    drawShareCandles(context, candles, 108, 408, 864, 490, palette, trade);
  }

  const panelTop = 980;
  context.fillStyle = palette.muted;
  context.font = "600 22px Arial, sans-serif";
  if (closedTrade) {
    context.fillText(t("closedTradeChart.title").toUpperCase(), 84, panelTop);
    context.fillStyle = palette.text;
    context.font = "700 28px Arial, sans-serif";
    context.fillText(
      `${t("closedTradeChart.entry")}: ${formatSharePrice(trade.entry_price ?? trade.entryPrice, t)}  ·  ${t("closedTradeChart.exit")}: ${formatSharePrice(trade.exit_price ?? trade.exitPrice, t)}`,
      84,
      panelTop + 52,
    );
    context.fillStyle = palette.muted;
    context.font = "500 18px Arial, sans-serif";
    context.fillText(
      `${formatShareDate(trade.opened_at ?? trade.timestamp ?? trade.openTime)}  →  ${formatShareDate(trade.closed_at ?? trade.closeTime)}`,
      84,
      panelTop + 88,
    );
  } else {
    context.fillText(t("tradeToast.projection").toUpperCase(), 84, panelTop);
    context.fillStyle = palette.text;
    context.font = "700 34px Arial, sans-serif";
    context.fillText(
      projection.targetPrice
        ? t("tradeToast.targetAt", {
            price: formatPrice(projection.targetPrice),
          })
        : t("tradeToast.unavailable"),
      84,
      panelTop + 52,
    );
    const projectionDetails = [
      projection.movePercent !== null
        ? `+${projection.movePercent.toFixed(2)}%`
        : null,
      projection.rewardRiskRatio !== null
        ? `${projection.rewardRiskRatio.toFixed(1)}R`
        : null,
    ]
      .filter(Boolean)
      .join("  ·  ");
    context.fillStyle = palette.accent;
    context.font = "700 25px Arial, sans-serif";
    context.fillText(projectionDetails || "—", 84, panelTop + 94);
  }

  const pnl = getBotPnl(trade);
  if (includePnl && pnl !== null) {
    context.textAlign = "right";
    context.fillStyle = palette.muted;
    context.font = "600 22px Arial, sans-serif";
    context.fillText(
      t(
        closedTrade
          ? "closedTradeChart.realizedPnl"
          : "tradeSharePnl.label",
      ).toUpperCase(),
      996,
      panelTop,
    );
    context.fillStyle =
      pnl > 0 ? palette.accent : pnl < 0 ? palette.down : palette.text;
    context.font = "700 34px Arial, sans-serif";
    context.fillText(formatBotPnl(pnl), 996, panelTop + 52);
    context.textAlign = "left";
  }

  context.fillStyle = palette.muted;
  context.font = "500 18px Arial, sans-serif";
  context.fillText("CIPHER DESK  ·  Market data visualization", 84, 1280);
  return canvas;
}

export function TradeShareDialog({
  trade,
  candles,
  chartMode,
  chartInstanceRef,
  open,
  onClose,
  variant = "open",
  shareInterval = TRADE_SIGNAL_CHART_TIMEFRAME,
}) {
  const { t } = useTranslation();
  const [style, setStyle] = useState(SHARE_STYLES[0]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [previewImage, setPreviewImage] = useState("");
  const [includePnl, setIncludePnl] = useState(true);
  const [chartReadyVersion, setChartReadyVersion] = useState(0);
  const projection = useMemo(() => getTradeProjection(trade), [trade]);
  const symbol = trade.symbol.replace(":USDT", "");
  const side = String(trade.side ?? trade.positionSide ?? "").toUpperCase();
  const closedTrade = variant === "closed";
  const shareTitle = closedTrade
    ? t("closedTradeChart.shareTitle", { symbol })
    : t("tradeSignals.shareTitle", { symbol });
  const markChartReady = useCallback(() => {
    setChartReadyVersion((version) => version + 1);
  }, []);

  const createImage = useCallback(async () => {
    let chartScreenshot;
    if (chartMode === "tradingview") {
      if (!chartInstanceRef.current?.takeScreenshot) {
        throw new Error(t("tradeSignals.chartCaptureUnavailable"));
      }
      chartScreenshot = chartInstanceRef.current.takeScreenshot();
    }
    return buildShareCanvas(
      trade,
      candles,
      style,
      projection,
      t,
      chartScreenshot,
      includePnl,
      variant,
      shareInterval,
    );
  }, [
    chartInstanceRef,
    candles,
    chartMode,
    includePnl,
    projection,
    style,
    t,
    trade,
    variant,
    shareInterval,
  ]);

  useEffect(() => {
    if (!open) {
      setPreviewImage("");
      return;
    }
    if (chartMode === "tradingview" && chartReadyVersion === 0) return;
    let active = true;
    setPreviewImage("");
    createImage()
      .then((canvas) => {
        if (active) setPreviewImage(canvas.toDataURL("image/png"));
      })
      .catch((caught) => {
        if (active) setError(caught.message || t("tradeSignals.shareError"));
      });
    return () => {
      active = false;
    };
  }, [open, chartMode, chartReadyVersion, createImage, style, t]);

  const downloadImage = async () => {
    setBusy(true);
    setError("");
    try {
      const canvas = await createImage();
      const blob = await new Promise((resolve, reject) =>
        canvas.toBlob(
          (imageBlob) =>
            imageBlob
              ? resolve(imageBlob)
              : reject(new Error("Could not export the trade image")),
          "image/png",
        ),
      );
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `capital-caos-${symbol.toLowerCase()}-${side.toLowerCase()}.png`;
      link.click();
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } catch (caught) {
      setError(caught.message || t("tradeSignals.shareError"));
    } finally {
      setBusy(false);
    }
  };

  const shareImage = async () => {
    setBusy(true);
    setError("");
    try {
      const blob = await new Promise((resolve, reject) =>
        createImage()
          .then((canvas) =>
            canvas.toBlob(
              (imageBlob) =>
                imageBlob
                  ? resolve(imageBlob)
                  : reject(new Error("Could not export the trade image")),
              "image/png",
            ),
          )
          .catch(reject),
      );
      const file = new File([blob], `capital-caos-${symbol.toLowerCase()}.png`, {
        type: "image/png",
      });
      if (navigator.canShare?.({ files: [file] }) && navigator.share) {
        await navigator.share({
          files: [file],
          title: `${symbol} ${side} · Capital Caos`,
          text: t("tradeSignals.shareText", { symbol, side }),
        });
      } else {
        await downloadImage();
      }
    } catch (caught) {
      if (caught.name !== "AbortError") {
        setError(caught.message || t("tradeSignals.shareError"));
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="trade-share-title"
    >
      <DialogTitle id="trade-share-title">
        {shareTitle}
      </DialogTitle>
      <DialogContent className="trade-share-dialog">
        <div
          className="trade-share-styles"
          aria-label={t("tradeSignals.stylesLabel")}
        >
          {SHARE_STYLES.map((shareStyle) => (
            <button
              key={shareStyle}
              type="button"
              className={`trade-share-style trade-share-style--${shareStyle}${style === shareStyle ? " trade-share-style--selected" : ""}`}
              aria-pressed={style === shareStyle}
              onClick={() => setStyle(shareStyle)}
            >
              {t(`tradeSignals.styles.${shareStyle}`)}
            </button>
          ))}
        </div>
        <label className="trade-share-pnl-toggle">
          <input
            type="checkbox"
            checked={includePnl}
            onChange={(event) => setIncludePnl(event.target.checked)}
          />
          <span>
            {t(
              closedTrade
                ? "closedTradeChart.includePnl"
                : "tradeSharePnl.include",
            )}
          </span>
        </label>
        <div className={`trade-share-preview trade-share-preview--${style}`}>
          {previewImage ? (
            <img
              src={previewImage}
              alt={shareTitle}
            />
          ) : (
            <div className="trade-share-preview__loading" role="status">
              {t("tradeSignals.loading")}
            </div>
          )}
          {chartMode === "tradingview" && open && (
            <div className="trade-share-chart-overlay">
              <TradeCandlestickChart
                candles={candles}
                trade={trade}
                t={t}
                chartMode={chartMode}
                chartInstanceRef={chartInstanceRef}
                onChartReady={markChartReady}
              />
            </div>
          )}
        </div>
        {error && (
          <p className="trade-share-error" role="alert">
            {error}
          </p>
        )}
        <p className="trade-share-disclaimer">
          {t(
            closedTrade
              ? "closedTradeChart.shareDisclaimer"
              : "tradeSignals.shareDisclaimer",
          )}
        </p>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={busy}>
          {t("tradeSignals.closeShare")}
        </Button>
        <Button
          onClick={downloadImage}
          disabled={busy}
          startIcon={<Download size={16} />}
        >
          {t("tradeSignals.downloadImage")}
        </Button>
        <Button
          variant="contained"
          onClick={shareImage}
          disabled={busy}
          startIcon={<Share2 size={16} />}
        >
          {t("tradeSignals.share")}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function TradeSignalCard({ trade, candles, chartMode }) {
  const { t } = useTranslation();
  const [shareOpen, setShareOpen] = useState(false);
  const [chartOpen, setChartOpen] = useState(false);
  const shareChartInstanceRef = useRef(null);
  const [expandedCandles, setExpandedCandles] = useState(null);
  const projection = useMemo(() => getTradeProjection(trade), [trade]);
  const side = String(trade.side ?? trade.positionSide ?? "").toUpperCase();
  const isLong = side === "LONG";
  const pnl = getBotPnl(trade);

  useEffect(() => {
    if (!chartOpen || chartMode !== "tradingview") return undefined;
    let active = true;
    getTradeCandles(
      trade.symbol,
      TRADE_SIGNAL_CHART_TIMEFRAME,
      TRADE_SIGNAL_EXPANDED_CHART_CANDLE_LIMIT,
    ).then((history) => {
      if (active && history?.length) setExpandedCandles(history);
    });
    return () => {
      active = false;
    };
  }, [chartOpen, chartMode, trade.symbol]);

  return (
    <article
      className={`open-trade-signal-card open-trade-signal-card--${isLong ? "long" : "short"}`}
      aria-label={`${trade.symbol.replace(":USDT", "")} ${side}`}
    >
      <header className="open-trade-signal-card__header">
        <span className="open-trade-signal-card__icon" aria-hidden="true">
          {isLong ? <ArrowUpRight size={18} /> : <ArrowDownRight size={18} />}
        </span>
        <div className="open-trade-signal-card__identity">
          <h3>{trade.symbol.replace(":USDT", "")}</h3>
          <span className="open-trade-signal-card__side">{side}</span>
        </div>
        <div
          className="open-trade-signal-card__projection"
          role="group"
          aria-label={t("tradeSignals.projectedMove")}
        >
          {projection.movePercent !== null && (
            <span>+{projection.movePercent.toFixed(2)}%</span>
          )}
          {projection.rewardRiskRatio !== null && (
            <span>{projection.rewardRiskRatio.toFixed(1)}R</span>
          )}
        </div>
        <span className="open-trade-signal-card__live">
          <i aria-hidden="true" />
          {t("signalTide.live")}
        </span>
      </header>
      {pnl !== null && (
        <div
          className={`open-trade-signal-card__pnl${pnl > 0 ? " open-trade-signal-card__pnl--positive" : pnl < 0 ? " open-trade-signal-card__pnl--negative" : ""}`}
          role="group"
          aria-label={t("tradeSharePnl.label")}
        >
          <span>{t("tradeSharePnl.label")}</span>
          <strong>{formatBotPnl(pnl)}</strong>
        </div>
      )}

      <TradeCandlestickChart
        candles={candles || []}
        trade={trade}
        t={t}
        compact
        onExpand={() => setChartOpen(true)}
        chartMode={chartMode}
      />
      <TradeChartDialog
        trade={trade}
        candles={
          chartMode === "tradingview" && expandedCandles
            ? expandedCandles
            : candles || []
        }
        chartMode={chartMode}
        open={chartOpen}
        onClose={() => setChartOpen(false)}
      />

      <button
        type="button"
        className="open-trade-signal-card__share"
        onClick={() => setShareOpen(true)}
      >
        <Share2 size={15} aria-hidden="true" />
        {t("tradeSignals.share")}
      </button>
      <TradeShareDialog
        trade={trade}
        candles={candles || []}
        chartMode={chartMode}
        chartInstanceRef={shareChartInstanceRef}
        open={shareOpen}
        onClose={() => setShareOpen(false)}
      />
    </article>
  );
}

export default function OpenTradeSignalCards({
  trades = EMPTY_TRADES,
  loading = false,
}) {
  const { t } = useTranslation();
  const [marginScores, setMarginScores] = useState({});
  const [candlesByTrade, setCandlesByTrade] = useState({});
  const chartMode = "tradingview";
  const tradesRef = useRef(trades);
  tradesRef.current = trades;
  const tradeSignature = getTradeUpdateSignature(trades);

  useEffect(() => {
    let cancelled = false;
    const activeTrades = tradesRef.current.filter((trade) => trade?.symbol);
    const activeKeys = new Set(activeTrades.map(tradeMetricsKey));
    Promise.all(
      activeTrades.map(async (trade) => {
        const key = tradeMetricsKey(trade);
        const [candles, stopMargin] = await Promise.all([
          getTradeCandles(
            trade.symbol,
            TRADE_SIGNAL_CHART_TIMEFRAME,
            TRADE_SIGNAL_CHART_CANDLE_LIMIT,
          ),
          stopMarginForTrade(trade),
        ]);
        return [key, { candles: candles || [], stopMargin }];
      }),
    ).then((entries) => {
      if (cancelled) return;
      const data = Object.fromEntries(entries);
      setCandlesByTrade((current) => ({
        ...Object.fromEntries(
          Object.entries(current).filter(([key]) => activeKeys.has(key)),
        ),
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value.candles]),
        ),
      }));
      setMarginScores((current) => ({
        ...Object.fromEntries(
          Object.entries(current).filter(([key]) => activeKeys.has(key)),
        ),
        ...Object.fromEntries(
          Object.entries(data).map(([key, value]) => [key, value.stopMargin]),
        ),
      }));
    });

    return () => {
      cancelled = true;
    };
  }, [tradeSignature]);

  useEffect(() => {
    let cancelled = false;
    let refreshing = false;
    const refreshCandles = async () => {
      if (refreshing) return;
      refreshing = true;
      try {
        const activeTrades = tradesRef.current.filter((trade) => trade?.symbol);
        const entries = await Promise.all(
          activeTrades.map(async (trade) => {
            const history = await getTradeCandles(
              trade.symbol,
              TRADE_SIGNAL_CHART_TIMEFRAME,
              TRADE_SIGNAL_CHART_CANDLE_LIMIT,
              true,
            );
            return [tradeMetricsKey(trade), history];
          }),
        );
        if (cancelled) return;
        setCandlesByTrade((current) => {
          const updated = { ...current };
          entries.forEach(([key, history]) => {
            if (Array.isArray(history) && history.length > 0) {
              updated[key] = history;
            }
          });
          return updated;
        });
      } finally {
        refreshing = false;
      }
    };
    const interval = window.setInterval(
      refreshCandles,
      TRADE_CHART_REFRESH_INTERVAL_MS,
    );
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
  }, [tradeSignature]);

  const pendingEvaluation = trades.some(
    (trade) => !Object.hasOwn(marginScores, tradeMetricsKey(trade)),
  );
  const eligibleTrades = trades.filter((trade) => {
    const key = tradeMetricsKey(trade);
    return isTradeSignalEligible(marginScores[key]);
  });
  return (
    <section
      className="dashboard-section open-trade-signals"
      aria-labelledby="open-trade-signals-title"
    >
      <div className="open-trade-signals__heading">
        <div>
          <p className="open-trade-signals__eyebrow">{t("tradeSignals.eyebrow")}</p>
          <h2 id="open-trade-signals-title">{t("tradeSignals.title")}</h2>
          <p>
            {t("tradeSignals.description", {
              threshold: TRADE_SIGNAL_MIN_STOP_ATR,
            })}
          </p>
        </div>
        <div
          className="open-trade-signals__count"
          role="status"
          aria-label={t("tradeSignals.count", {
            count: loading || pendingEvaluation ? "—" : eligibleTrades.length,
          })}
        >
          <span className="open-trade-signals__count-value">
            {loading || pendingEvaluation ? "—" : eligibleTrades.length}
          </span>
          <span className="open-trade-signals__count-label">
            {t("tradeSignals.countLabel")}
          </span>
        </div>
      </div>
      {eligibleTrades.length > 0 ? (
        <div className="open-trade-signals__grid">
          {eligibleTrades.map((trade, index) => {
            const key = tradeMetricsKey(trade);
            return (
              <TradeSignalCard
                key={trade.id ?? key ?? index}
                trade={trade}
                candles={candlesByTrade[key] ?? []}
                chartMode={chartMode}
              />
            );
          })}
        </div>
      ) : (
        <div className="open-trade-signals__empty">
          <Activity size={18} aria-hidden="true" />
          <span>
            {loading
              ? t("tradeSignals.loading")
              : pendingEvaluation
                ? t("tradeSignals.checkingThreshold")
                : trades.length > 0
                  ? trades.some((trade) => {
                      const key = `${trade.symbol}:${trade.side ?? trade.positionSide}`;
                      return !marginScores[key];
                    })
                    ? t("tradeSignals.atrUnavailable")
                    : t("tradeSignals.noEligible", {
                        threshold: TRADE_SIGNAL_MIN_STOP_ATR,
                      })
                  : t("tradeSignals.empty")}
          </span>
        </div>
      )}
    </section>
  );
}
