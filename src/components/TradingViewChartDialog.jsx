import React, { useEffect } from "react";
import { CandlestickChart, ExternalLink, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { tradingViewTicker } from "../utils/tradingView";

function tradingViewEmbedUrl(symbol, language, timeZone) {
  const params = new URLSearchParams({
    symbol: tradingViewTicker(symbol),
    interval: "3",
    theme: "dark",
    style: "8",
    timezone: timeZone,
    locale: language,
    hide_top_toolbar: "0",
    hide_legend: "0",
    saveimage: "0",
    toolbarbg: "101b19",
    withdateranges: "1",
    hide_side_toolbar: "0",
    allow_symbol_change: "1",
    details: "1",
    hotlist: "0",
    calendar: "0",
    studies: JSON.stringify([
      {
        id: "MAExp@tv-basicstudies",
        version: 60,
        inputs: { length: 21 },
      },
    ]),
  });
  return `https://www.tradingview.com/widgetembed/?${params.toString()}`;
}

export default function TradingViewChartDialog({
  symbol,
  onClose,
  timeZone,
}) {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const formattedSymbol = symbol?.replace(":USDT", "");

  useEffect(() => {
    if (!symbol) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") onClose();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, symbol]);

  if (!symbol) return null;

  return (
    <div
      className="chart-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        className="chart-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="chart-title"
      >
        <header className="chart-dialog-header">
          <div className="chart-dialog-title">
            <span className="chart-dialog-icon">
              <CandlestickChart size={17} />
            </span>
            <div>
              <h2 id="chart-title">{formattedSymbol}</h2>
              <p>
                {tradingViewTicker(symbol)} <span>·</span>{" "}
                {t("common.threeMin")} <span>·</span>
                {t("common.heikinAshi")} <span>·</span> EMA 21{" "}
                <span>·</span> {t("common.binance")}
              </p>
            </div>
          </div>
          <div className="chart-dialog-actions">
            <a
              className="chart-external-link"
              href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(tradingViewTicker(symbol))}`}
              target="_blank"
              rel="noreferrer"
              title={t("charts.open")}
              aria-label={t("charts.open")}
            >
              <ExternalLink size={16} />
            </a>
            <button
              className="chart-close"
              type="button"
              onClick={onClose}
              title={t("charts.close")}
              aria-label={t("charts.close")}
            >
              <X size={18} />
            </button>
          </div>
        </header>
        <div className="chart-frame">
          <iframe
            key={symbol}
            title={t("charts.title", { symbol })}
            src={tradingViewEmbedUrl(symbol, language, timeZone)}
            allowFullScreen
            loading="lazy"
          />
        </div>
        <div className="chart-dialog-footer">
          <span>{t("charts.marketData")}</span>
          <span>
            {t("common.utc")} · {t("common.threeMin")}
          </span>
        </div>
      </section>
    </div>
  );
}
