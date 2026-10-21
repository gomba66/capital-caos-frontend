import React, { useEffect, useMemo, useRef, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";
import {
  CandlestickSeries,
  ColorType,
  createChart,
  LineStyle,
} from "lightweight-charts";
import { useTranslation } from "react-i18next";
import { getPriceHistory } from "../api/priceHistory";
import { formatCurrency } from "../utils/currencyConverter";

function positivePrice(value) {
  const price = Number(value);
  return Number.isFinite(price) && price > 0 ? price : null;
}

function decimalPlaces(value) {
  const normalized = Number(value).toPrecision(12).toLowerCase();
  const [coefficient, exponentText] = normalized.split("e");
  const trimmedCoefficient = coefficient.replace(/(\.\d*?)0+$/, "$1");
  const fractionLength = trimmedCoefficient.split(".")[1]?.length ?? 0;
  return Math.max(0, fractionLength - Number(exponentText || 0));
}

function getTradeLevels(trade, currentPrice) {
  const entry = positivePrice(trade.entryPrice ?? trade.entry_price);
  const stop = positivePrice(trade.stop_loss ?? trade.initial_stop);
  const takeProfit =
    positivePrice(trade.tp_price) ??
    positivePrice(trade.take_profit_target?.tp_price) ??
    positivePrice(trade.estimated_tp_price) ??
    positivePrice(trade.take_profit_target?.estimated_tp_price);
  const mark = positivePrice(trade.markPrice ?? trade.mark_price) ?? currentPrice;
  const pnl = Number(trade.unrealizedProfit ?? trade.unRealizedProfit);
  return { entry, stop, takeProfit, mark, pnl: Number.isFinite(pnl) ? pnl : null };
}

export default function OpenTradeChart({ trade }) {
  const { t } = useTranslation();
  const chartContainerRef = useRef(null);
  const candleSeriesRef = useRef(null);
  const currentPriceLineRef = useRef(null);
  const liveCandleRef = useRef(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const currentPrice = candles.at(-1)?.close ?? null;
  const levels = useMemo(
    () => getTradeLevels(trade, currentPrice),
    [trade, currentPrice],
  );
  const latestMarkRef = useRef(levels.mark);
  latestMarkRef.current = levels.mark;
  const pricePrecision = useMemo(
    () =>
      Math.min(
        12,
        Math.max(
          2,
          ...candles.flatMap((candle) =>
            [candle.open, candle.high, candle.low, candle.close].map(
              decimalPlaces,
            ),
          ),
          ...[
            levels.entry,
            levels.stop,
            levels.takeProfit,
            levels.mark,
          ]
            .filter(Boolean)
            .map(decimalPlaces),
        ),
      ),
    [candles, levels.entry, levels.stop, levels.takeProfit, levels.mark],
  );
  const side = String(trade.side ?? trade.positionSide ?? "").toUpperCase();
  const pnlText =
    levels.pnl === null
      ? "—"
      : `${levels.pnl > 0 ? "+" : ""}${formatCurrency(levels.pnl, "USDT")}`;
  const formatPrice = (price) =>
    price === null
      ? "—"
      : `$${price
          .toFixed(pricePrecision)
          .replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1")}`;

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(false);
    setCandles([]);

    getPriceHistory(trade.symbol, "3m", 120)
      .then((response) => {
        if (!active) return;
        const validCandles = (response?.data ?? [])
          .filter(
            (candle) =>
              Number.isFinite(Number(candle.time)) &&
              positivePrice(candle.open) &&
              positivePrice(candle.high) &&
              positivePrice(candle.low) &&
              positivePrice(candle.close),
          )
          .map((candle) => ({
            time: Number(candle.time),
            open: Number(candle.open),
            high: Number(candle.high),
            low: Number(candle.low),
            close: Number(candle.close),
          }));
        setCandles(validCandles);
      })
      .catch((requestError) => {
        console.error(`Error fetching chart candles for ${trade.symbol}:`, requestError);
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [trade.symbol]);

  useEffect(() => {
    const container = chartContainerRef.current;
    if (!container || candles.length === 0) return undefined;

    const styles = getComputedStyle(document.documentElement);
    const chart = createChart(container, {
      autoSize: true,
      layout: {
        background: {
          type: ColorType.Solid,
          color: styles.getPropertyValue("--white").trim(),
        },
        textColor: styles.getPropertyValue("--muted").trim(),
        fontFamily: styles.getPropertyValue("--mono").trim(),
      },
      grid: {
        vertLines: { color: styles.getPropertyValue("--line-soft").trim() },
        horzLines: { color: styles.getPropertyValue("--line-soft").trim() },
      },
      rightPriceScale: {
        visible: true,
        borderVisible: true,
        borderColor: styles.getPropertyValue("--line").trim(),
        ticksVisible: true,
        minimumWidth: 82,
        scaleMargins: { top: 0.08, bottom: 0.08 },
      },
      timeScale: {
        borderColor: styles.getPropertyValue("--line").trim(),
        timeVisible: true,
        secondsVisible: false,
        rightOffset: 12,
      },
      localization: {
        priceFormatter: (price) =>
          price
            .toFixed(pricePrecision)
            .replace(/(\.\d*?[1-9])0+$|\.0+$/, "$1"),
      },
    });
    const initialMark = latestMarkRef.current;
    const overlayPrices = [
      levels.entry,
      levels.stop,
      levels.takeProfit,
      initialMark,
    ].filter(Boolean);
    const candleSeries = chart.addSeries(CandlestickSeries, {
      upColor: styles.getPropertyValue("--green").trim(),
      downColor: styles.getPropertyValue("--red").trim(),
      borderVisible: false,
      wickUpColor: styles.getPropertyValue("--green").trim(),
      wickDownColor: styles.getPropertyValue("--red").trim(),
      priceFormat: {
        type: "price",
        precision: pricePrecision,
        minMove: Number((10 ** -pricePrecision).toPrecision(pricePrecision)),
      },
      autoscaleInfoProvider: (original) => {
        const info = original();
        if (!info || overlayPrices.length === 0) return info;
        const values = [
          info.priceRange.minValue,
          info.priceRange.maxValue,
          ...overlayPrices,
        ];
        return {
          ...info,
          priceRange: {
            ...info.priceRange,
            minValue: Math.min(...values),
            maxValue: Math.max(...values),
          },
        };
      },
    });
    candleSeries.setData(candles);
    candleSeriesRef.current = candleSeries;
    liveCandleRef.current = candles.at(-1) ?? null;

    const priceLines = [
      { price: levels.entry, title: t("operations.entryPrice"), color: "#5ba8ff" },
      { price: levels.stop, title: t("operations.stopLoss"), color: styles.getPropertyValue("--red").trim() },
      { price: levels.takeProfit, title: t("operations.calculatedTakeProfit"), color: styles.getPropertyValue("--green").trim() },
    ];
    priceLines.forEach(({ price, title, color }) => {
      if (price) {
        candleSeries.createPriceLine({
          price,
          color,
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
          title,
        });
      }
    });
    currentPriceLineRef.current = initialMark
      ? candleSeries.createPriceLine({
          price: initialMark,
          title: t("operations.currentPrice"),
          color: styles.getPropertyValue("--amber").trim(),
          lineWidth: 1,
          lineStyle: LineStyle.Dashed,
          axisLabelVisible: true,
        })
      : null;
    const timeScale = chart.timeScale();
    timeScale.fitContent();
    timeScale.setVisibleLogicalRange({
      from: 0,
      to: candles.length + 12,
    });

    return () => {
      chart.remove();
      candleSeriesRef.current = null;
      currentPriceLineRef.current = null;
      liveCandleRef.current = null;
    };
  }, [
    candles,
    levels.entry,
    levels.stop,
    levels.takeProfit,
    pricePrecision,
    t,
  ]);

  useEffect(() => {
    const candleSeries = candleSeriesRef.current;
    if (
      !candleSeries ||
      levels.mark === null ||
      !Number.isFinite(levels.mark)
    ) {
      return;
    }

    currentPriceLineRef.current?.applyOptions({ price: levels.mark });

    const previousCandle = liveCandleRef.current;
    if (!previousCandle) return;

    const intervalSeconds = 3 * 60;
    const currentBucket =
      Math.floor(Date.now() / (intervalSeconds * 1000)) * intervalSeconds;
    const candleTime = Math.max(currentBucket, previousCandle.time);
    const isNewCandle = candleTime > previousCandle.time;
    const updatedCandle = {
      time: candleTime,
      open: isNewCandle ? previousCandle.close : previousCandle.open,
      high: isNewCandle
        ? Math.max(previousCandle.close, levels.mark)
        : Math.max(previousCandle.high, levels.mark),
      low: isNewCandle
        ? Math.min(previousCandle.close, levels.mark)
        : Math.min(previousCandle.low, levels.mark),
      close: levels.mark,
    };

    candleSeries.update(updatedCandle);
    liveCandleRef.current = updatedCandle;
  }, [levels.mark]);

  return (
    <Box className="open-trade-chart">
      <Box className="open-trade-chart-summary" aria-label={t("operations.positionSummary")}>
        <span>
          {t("operations.side")}: <strong className={side === "SHORT" ? "performance-loss" : "performance-win"}>{side || "—"}</strong>
        </span>
        <span>
          {t("operations.entryPrice")}: <strong>{formatPrice(levels.entry)}</strong>
        </span>
        <span>
          {t("operations.currentPrice")}: <strong>{formatPrice(levels.mark)}</strong>
        </span>
        <span>
          {t("operations.floatingPnl")}: <strong className={levels.pnl > 0 ? "performance-win" : levels.pnl < 0 ? "performance-loss" : ""}>{pnlText}</strong>
        </span>
        <span>
          {t("operations.stopLoss")}: <strong>{formatPrice(levels.stop)}</strong>
        </span>
        <span>
          {t("operations.calculatedTakeProfit")}: <strong>{formatPrice(levels.takeProfit)}</strong>
        </span>
      </Box>
      {loading ? (
        <Box className="open-trade-chart-state" role="status">
          <CircularProgress size={24} />
        </Box>
      ) : error ? (
        <Typography className="open-trade-chart-state" role="alert">
          {t("operations.chartLoadError")}
        </Typography>
      ) : candles.length === 0 ? (
        <Typography className="open-trade-chart-state" role="status">
          {t("operations.priceUnavailable")}
        </Typography>
      ) : (
        <div
          ref={chartContainerRef}
          className="open-trade-chart-canvas"
          role="img"
          aria-label={t("operations.positionChart", { symbol: trade.symbol })}
        />
      )}
      <Typography className="open-trade-chart-note">
        {t("operations.calculatedTakeProfitNote")}
      </Typography>
    </Box>
  );
}
