import React, { useCallback, useEffect } from "react";
import { CandlestickChart, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import OpenTradeChart from "./OpenTradeChart";

export default function OpenTradeChartDialog({ trade, onClose }) {
  const { t } = useTranslation();
  const symbol = trade?.symbol;
  const closeDialog = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!trade) return undefined;

    const closeOnEscape = (event) => {
      if (event.key === "Escape") closeDialog();
    };
    const previousOverflow = document.body.style.overflow;
    document.addEventListener("keydown", closeOnEscape);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", closeOnEscape);
      document.body.style.overflow = previousOverflow;
    };
  }, [closeDialog, trade]);

  if (!trade) return null;

  return (
    <div
      className="chart-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeDialog();
      }}
    >
      <section
        className="chart-dialog open-trade-chart-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="open-trade-chart-title"
      >
        <header className="chart-dialog-header">
          <div className="chart-dialog-title">
            <span className="chart-dialog-icon">
              <CandlestickChart size={17} />
            </span>
            <div>
              <h2 id="open-trade-chart-title">{symbol}</h2>
              <p>{t("operations.positionChartSubtitle")}</p>
            </div>
          </div>
          <button
            className="chart-close"
            type="button"
            onClick={closeDialog}
            title={t("charts.close")}
            aria-label={t("charts.close")}
          >
            <X size={18} />
          </button>
        </header>
        <OpenTradeChart trade={trade} />
      </section>
    </div>
  );
}
