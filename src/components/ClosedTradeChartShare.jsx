import { useEffect, useMemo, useRef, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@mui/material";
import { useTranslation } from "react-i18next";
import { getPriceHistory } from "../api/priceHistory";
import { TradeShareDialog } from "./OpenTradeSignalCards";

const CANDLE_OPTIONS = [
  { interval: "15m", duration: 15 * 60_000 },
  { interval: "1h", duration: 60 * 60_000 },
  { interval: "4h", duration: 4 * 60 * 60_000 },
  { interval: "1d", duration: 24 * 60 * 60_000 },
  { interval: "1w", duration: 7 * 24 * 60 * 60_000 },
];
const CANDLES_BEFORE_AND_AFTER = 10;
const MAX_CANDLES = 1000;

function toMilliseconds(value) {
  if (value === null || value === undefined || value === "") return null;
  const parsed =
    typeof value === "number" || /^\d+$/.test(String(value))
      ? Number(value)
      : Date.parse(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed < 1e12 ? parsed * 1000 : parsed;
}

function getClosedTradeWindow(openTimeValue, closeTimeValue) {
  const openTime = toMilliseconds(openTimeValue);
  const closeTime = toMilliseconds(closeTimeValue);
  if (
    openTime === null ||
    closeTime === null ||
    closeTime <= openTime
  ) {
    return null;
  }
  const option =
    CANDLE_OPTIONS.find(({ duration }) => {
      const openCandleTime = Math.floor(openTime / duration) * duration;
      const closeCandleTime = Math.floor(closeTime / duration) * duration;
      const candleCount =
        (closeCandleTime - openCandleTime) / duration +
        1 +
        CANDLES_BEFORE_AND_AFTER * 2;
      return candleCount <= MAX_CANDLES;
    }) ?? CANDLE_OPTIONS.at(-1);
  const openCandleTime = Math.floor(openTime / option.duration) * option.duration;
  const closeCandleTime =
    Math.floor(closeTime / option.duration) * option.duration;
  return {
    interval: option.interval,
    limit: Math.min(
      MAX_CANDLES,
      (closeCandleTime - openCandleTime) / option.duration +
        1 +
        CANDLES_BEFORE_AND_AFTER * 2,
    ),
    startTime: openCandleTime - CANDLES_BEFORE_AND_AFTER * option.duration,
    endTime: closeCandleTime + CANDLES_BEFORE_AND_AFTER * option.duration,
  };
}

export default function ClosedTradeChartShare({ trade, onClose }) {
  const { t } = useTranslation();
  const chartInstanceRef = useRef(null);
  const [candles, setCandles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const openTimeValue =
    trade.opened_at ?? trade.timestamp ?? trade.openTime ?? trade.entry_time;
  const closeTimeValue = trade.closed_at ?? trade.closeTime;
  const candleWindow = useMemo(
    () => getClosedTradeWindow(openTimeValue, closeTimeValue),
    [openTimeValue, closeTimeValue],
  );

  useEffect(() => {
    if (!candleWindow || !trade.symbol) {
      setCandles([]);
      setError(true);
      setLoading(false);
      return undefined;
    }
    let active = true;
    setLoading(true);
    setError(false);
    getPriceHistory(trade.symbol, candleWindow.interval, candleWindow.limit, {
      startTime: candleWindow.startTime,
      endTime: candleWindow.endTime,
    })
      .then((history) => {
        if (!active) return;
        const validCandles = (history?.data ?? [])
          .map((candle) => ({
            time: Number(candle.time),
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
          );
        setCandles(validCandles);
        setError(validCandles.length === 0);
      })
      .catch((requestError) => {
        console.error(
          `Could not load historical candles for closed trade ${trade.symbol}:`,
          requestError,
        );
        if (active) setError(true);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [trade.symbol, candleWindow]);

  if (!loading && !error && candles.length > 0) {
    return (
      <TradeShareDialog
        trade={trade}
        candles={candles}
        chartMode="tradingview"
        chartInstanceRef={chartInstanceRef}
        open
        onClose={onClose}
        variant="closed"
        shareInterval={candleWindow.interval}
      />
    );
  }

  return (
    <Dialog
      open
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      aria-labelledby="closed-trade-loading-title"
    >
      <DialogTitle id="closed-trade-loading-title">
        {t("closedTradeChart.shareTitle", {
          symbol: trade.symbol.replace(":USDT", ""),
        })}
      </DialogTitle>
      <DialogContent>
        <p role={error ? "alert" : "status"}>
          {error
            ? t("closedTradeChart.loadError")
            : t("closedTradeChart.loading")}
        </p>
      </DialogContent>
    </Dialog>
  );
}
