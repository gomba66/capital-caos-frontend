import { getPriceHistory } from "../api/priceHistory";

const ATR_PERIOD = 14;
export const TRADE_SIGNAL_ATR_TIMEFRAME = "3m";
export const TRADE_SIGNAL_CHART_TIMEFRAME = "15m";
export const TRADE_SIGNAL_CHART_CANDLE_LIMIT = 30;
export const TRADE_SIGNAL_EXPANDED_CHART_CANDLE_LIMIT = 120;
export const TRADE_SIGNAL_MIN_STOP_ATR = 2;
const TRADE_ATR_CANDLE_LIMIT = 60;
const TRADE_CANDLE_CACHE_TTL_MS = 30_000;
const tradeCandleCache = new Map();

export function getTradeCandles(
  symbol,
  interval = TRADE_SIGNAL_ATR_TIMEFRAME,
  limit = TRADE_ATR_CANDLE_LIMIT,
  forceRefresh = false,
) {
  if (!symbol) return Promise.resolve(null);
  const cacheKey = `${symbol}:${interval}:${limit}`;
  const cached = tradeCandleCache.get(cacheKey);
  if (!forceRefresh && cached && cached.expiresAt > Date.now()) {
    return cached.request;
  }

  const request = getPriceHistory(symbol, interval, limit)
    .then((history) => {
      const candles = Array.isArray(history?.data) ? history.data : [];
      tradeCandleCache.set(cacheKey, {
        expiresAt: Date.now() + TRADE_CANDLE_CACHE_TTL_MS,
        request: Promise.resolve(candles),
      });
      return candles;
    })
    .catch((error) => {
      tradeCandleCache.delete(cacheKey);
      console.warn(`Could not load ${interval} candles for ${symbol}:`, error);
      return null;
    });
  tradeCandleCache.set(cacheKey, {
    expiresAt: Date.now() + TRADE_CANDLE_CACHE_TTL_MS,
    request,
  });
  return request;
}

export async function getTradeAtr14(symbol) {
  return calculateAtr14(await getTradeCandles(symbol));
}

export function calculateAtr14(candles) {
  if (!Array.isArray(candles) || candles.length <= ATR_PERIOD) return null;

  const ranges = [];
  let previousClose;
  for (const candle of candles) {
    const high = Number(candle?.high);
    const low = Number(candle?.low);
    const close = Number(candle?.close);
    if (![high, low, close].every(Number.isFinite) || high < low) continue;

    const trueRange =
      previousClose === undefined
        ? high - low
        : Math.max(
            high - low,
            Math.abs(high - previousClose),
            Math.abs(low - previousClose),
          );
    ranges.push(trueRange);
    previousClose = close;
  }

  if (ranges.length <= ATR_PERIOD) return null;
  const alpha = 1 / ATR_PERIOD;
  return ranges
    .slice(1)
    .reduce(
      (atr, trueRange) => atr + alpha * (trueRange - atr),
      ranges[0],
    );
}

export function getStopMarginScore(entryPrice, initialStop, atr) {
  const entry = Number(entryPrice);
  const stop = Number(initialStop);
  const atrValue = Number(atr);
  if (
    ![entry, stop, atrValue].every(Number.isFinite) ||
    entry <= 0 ||
    stop <= 0 ||
    atrValue <= 0
  ) {
    return null;
  }

  const atrMultiple = Math.abs(entry - stop) / atrValue;
  return {
    score: Math.max(0, Math.min(100, Math.round(atrMultiple * 50))),
    atrMultiple,
    band:
      atrMultiple < 1
        ? "tight"
        : atrMultiple < 2
          ? "buffered"
          : "wide",
  };
}

export function isTradeSignalEligible(stopMargin) {
  return (
    Number.isFinite(stopMargin?.atrMultiple) &&
    stopMargin.atrMultiple >= TRADE_SIGNAL_MIN_STOP_ATR
  );
}

export function getTradeProjection(trade) {
  const entry = Number(trade?.entry_price ?? trade?.entryPrice);
  const targetMetrics = trade?.take_profit_target;
  const target = Number(
    trade?.tp_price ||
      targetMetrics?.tp_price ||
      trade?.estimated_tp_price ||
      targetMetrics?.estimated_tp_price,
  );
  const side = String(trade?.side ?? trade?.positionSide ?? "").toUpperCase();
  const direction = side === "LONG" ? 1 : side === "SHORT" ? -1 : null;
  const movePercent =
    Number.isFinite(entry) &&
    entry > 0 &&
    Number.isFinite(target) &&
    target > 0 &&
    direction !== null
      ? ((target - entry) / entry) * direction * 100
      : null;
  const projectedUsd = Number(targetMetrics?.value_usd);

  return {
    entryPrice: Number.isFinite(entry) && entry > 0 ? entry : null,
    targetPrice:
      Number.isFinite(target) && target > 0 ? target : null,
    movePercent:
      Number.isFinite(movePercent) && movePercent > 0 ? movePercent : null,
    projectedUsd:
      Number.isFinite(projectedUsd) && projectedUsd > 0 ? projectedUsd : null,
    rewardRiskRatio:
      Number.isFinite(Number(targetMetrics?.ratio)) &&
      Number(targetMetrics.ratio) > 0
        ? Number(targetMetrics.ratio)
        : null,
  };
}
