import { useContext, useEffect, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import Skeleton from "@mui/material/Skeleton";
import { normalizeCapitalCaosPayload } from "../api/legacyDashboardAdapter";
import {
  Activity,
  AlertTriangle,
  ArrowDownRight,
  ArrowUpRight,
  CandlestickChart,
  Clock3,
  ChevronDown,
  Database,
  Info,
  Radio,
  RefreshCw,
  Search,
  Signal,
  WifiOff,
  X,
} from "lucide-react";
import {
  NotificationContext,
  TimeZoneContext,
} from "../contexts/AppContexts";
import { NOTIFICATION_HISTORY_LIMIT } from "../contexts/NotificationProvider";
import SignalTide from "../components/SignalTide";
import { formatUtcOffset } from "../utils/timeZones";
import {
  getUpcomingParentSessionOpening,
  getSessionCountdownClass,
  getSessionPresentation,
  isParentSessionOpening,
  SESSION_CRITICAL_WINDOW_MS,
  SESSION_URGENT_WINDOW_MS,
} from "../utils/sessionPresentation";
import { selectNewSignalNotifications } from "../utils/signalNotifications";
import { SIGNAL_TIDE_MIN_ACTIVE } from "../utils/signalTide";
import TradingViewChartDialog from "../components/TradingViewChartDialog";

const POLL_MS = 5000;
const SESSION_HANDOFF_WINDOW_MS = 15 * 60 * 1000;
const SIGNAL_TOAST_COOLDOWN_MS = 60 * 60 * 1000;
const SIGNAL_TOAST_STORAGE_KEY = "market-watch-reported-signals";
const MIN_ACTIVE_SIGNALS_FOR_TRADING = SIGNAL_TIDE_MIN_ACTIVE;
const ACTIVE_SIGNAL_DENSITY_THRESHOLD = 20;
const PRIORITY_SIGNAL_CONFIDENCE = 80;

function prioritySignalSides(row) {
  const sides = [];
  if (
    row.signal_long_light &&
    Number(row.light_long_pct) >= PRIORITY_SIGNAL_CONFIDENCE &&
    row.price_above_ema21_3m === true
  ) {
    sides.push("LONG");
  }
  if (
    row.signal_short_light &&
    Number(row.light_short_pct) >= PRIORITY_SIGNAL_CONFIDENCE &&
    row.price_above_ema21_3m === false
  ) {
    sides.push("SHORT");
  }
  return sides;
}

function hasGreenLongSparkline(row) {
  if (row.best_side !== "LONG") return false;
  const prices = (row.sparkline_history || row.price_history || [])
    .map(Number)
    .filter(Number.isFinite);
  return prices.length >= 2 && prices[0] > 0 && prices.at(-1) >= prices[0];
}

function formatTime(value, language, t, timeZone) {
  if (!value) return t("intro.waitingFirstScan");
  return new Intl.DateTimeFormat(language === "es" ? "es" : "en-US", {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
    timeZone,
  }).format(new Date(value));
}

function formatCountdown(milliseconds, t) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return t("sessionNotice.countdown", { days, hours, minutes, seconds });
}

function formatSessionDuration(milliseconds, language) {
  const totalSeconds = Math.max(0, Math.ceil(milliseconds / 1000));
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  if (minutes || hours || days) {
    parts.push(language === "es" ? `${minutes} min` : `${minutes}m`);
  }
  parts.push(language === "es" ? `${seconds} s` : `${seconds}s`);
  return parts.join(" ");
}

function scanSignalEvents(scan) {
  if (Array.isArray(scan?.detected_signals)) return scan.detected_signals;

  const events = [];
  for (const row of scan?.active_signals || []) {
    for (const side of [
      ...(row.signal_long_light ? ["LONG"] : []),
      ...(row.signal_short_light ? ["SHORT"] : []),
    ]) {
      const timestamp =
        row.current_signal_time_ms ?? Date.parse(scan.timestamp);
      events.push({
        id: `${row.symbol}:${side}:${timestamp}`,
        symbol: row.symbol,
        side,
        signal_type: row.notes,
        timestamp_ms: timestamp,
        recent_age_bars: null,
      });
    }
  }
  for (const row of scan?.recent_long_signals || []) {
    const timestamp = row.recent_signal_time_ms;
    if (timestamp == null) continue;
    events.push({
      id: `${row.symbol}:LONG:${timestamp}`,
      symbol: row.symbol,
      side: "LONG",
      signal_type: row.recent_signal_note || "SIGNAL",
      timestamp_ms: timestamp,
      recent_age_bars: row.recent_signal_age_bars,
    });
  }
  return events;
}

function playRetroSound() {
  try {
    const AudioCtx =
      (typeof window !== "undefined" &&
        (window.AudioContext || window.webkitAudioContext)) ||
      null;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "square";
    osc.frequency.setValueAtTime(880, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(1320, ctx.currentTime + 0.08);
    gain.gain.setValueAtTime(0.08, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    // Audio unavailable or blocked; ignore silently.
  }
}

function SignalToast({ event, onDismiss }) {
  const { t } = useTranslation();
  const onDismissRef = useRef(onDismiss);
  onDismissRef.current = onDismiss;
  const isRecent = event.recent_age_bars != null;

  useEffect(() => {
    if (
      window.matchMedia &&
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    )
      return;
    playRetroSound();
  }, [event.id]);

  useEffect(() => {
    const timer = window.setTimeout(() => onDismissRef.current(event.id), 7000);
    return () => window.clearTimeout(timer);
  }, [event.id]);

  return (
    <div
      className={`signal-toast signal-toast--${event.side.toLowerCase()}`}
      role="status"
      aria-live="polite"
    >
      <span className="signal-toast-mark">
        <Signal size={15} />
      </span>
      <div className="signal-toast-copy">
        <strong>
          {t(isRecent ? "signalToast.recentTitle" : "signalToast.activeTitle")}
        </strong>
        <span>{event.symbol.replace(":USDT", "")}</span>
        <small>
          {isRecent
            ? t("signal.recent", {
                side: event.side,
                minutes: event.recent_age_bars * 5,
              })
            : t("signal.active", { side: event.side })}
        </small>
      </div>
      <button
        className="signal-toast-dismiss"
        type="button"
        onClick={() => onDismiss(event.id)}
        aria-label={t("signalToast.dismiss")}
        title={t("signalToast.dismiss")}
      >
        <X size={14} />
      </button>
    </div>
  );
}

function SessionOpening({ nextSession, timeZone }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  if (!nextSession?.opens_at) return null;
  const presentation = getSessionPresentation(nextSession.name);
  const sessionName = t(`sessionNotice.sessions.${presentation.name}`);
  const opensAt = new Date(nextSession.opens_at);

  return (
    <div className="session-opening">
      <div className="session-opening-copy">
        <span>{t("sessionNotice.nextSession")}</span>
        <strong className={`session-name session-name--${presentation.name}`}>
          {sessionName}
        </strong>
        {presentation.parent && (
          <small className="session-parent-context">
            {t("sessionNotice.withinSession", {
              session: t(`sessionNotice.sessions.${presentation.parent}`),
            })}
          </small>
        )}
      </div>
      <div className="session-opening-time">
        <strong aria-live="off">
          {formatCountdown(opensAt.getTime() - now, t)}
        </strong>
        <small>
          {t("sessionNotice.opensAt", {
            time: formatTime(opensAt, language, t, timeZone),
            timezone: formatUtcOffset(timeZone),
          })}
        </small>
      </div>
    </div>
  );
}

function CurrentSessionTracker({ currentSession, nextSession }) {
  const { t, i18n } = useTranslation();
  const [now, setNow] = useState(Date.now());
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const opensAt = new Date(currentSession.opens_at).getTime();
  const closesAt = new Date(currentSession.closes_at).getTime();
  const duration = Math.max(1, closesAt - opensAt);
  const elapsed = Math.max(0, now - opensAt);
  const remaining = Math.max(0, closesAt - now);
  const progress = Math.min(100, Math.max(0, (elapsed / duration) * 100));
  const presentation = getSessionPresentation(currentSession.name);
  const parentOpening = getUpcomingParentSessionOpening(currentSession, now);
  const nextSessionToShow =
    parentOpening ||
    (remaining <= SESSION_HANDOFF_WINDOW_MS ||
    isParentSessionOpening(currentSession.name, nextSession?.name)
      ? nextSession
      : null);
  const showNext =
    nextSessionToShow?.opens_at &&
    Date.parse(nextSessionToShow.opens_at) > now;
  const nextOpensIn = showNext
    ? Date.parse(nextSessionToShow.opens_at) - now
    : 0;
  const sessionName = t(`sessionNotice.sessions.${presentation.name}`);
  const nextPresentation = showNext
    ? getSessionPresentation(nextSessionToShow.name)
    : null;
  const nextName = nextPresentation
    ? t(`sessionNotice.sessions.${nextPresentation.name}`)
    : null;
  return (
    <section
      className={`session-tracker session-tracker--active${remaining <= SESSION_URGENT_WINDOW_MS ? " session-tracker--ending" : ""}${remaining <= SESSION_CRITICAL_WINDOW_MS ? " session-tracker--critical" : ""}`}
      aria-label={t("sessionNotice.currentSession")}
    >
      <Clock3 className="session-tracker-icon" size={17} />
      <div className="session-tracker-main">
        <div className="session-opening-copy">
          <span>{t("sessionNotice.currentSession")}</span>
          <strong
            className={`session-name session-name--${presentation.name}`}
          >
            {sessionName}
          </strong>
          {presentation.parent && (
            <small className="session-parent-context">
              {t("sessionNotice.withinSession", {
                session: t(`sessionNotice.sessions.${presentation.parent}`),
              })}
            </small>
          )}
        </div>
        <div className="session-metrics">
          <div className="session-metric">
            <span>{t("sessionNotice.elapsed")}</span>
            <strong aria-live="off">
              {formatSessionDuration(elapsed, language)}
            </strong>
          </div>
          <div className="session-metric">
            <span>{t("sessionNotice.endsIn")}</span>
            <strong
              className={`session-countdown ${getSessionCountdownClass(remaining)}`}
              aria-live="off"
            >
              {formatSessionDuration(remaining, language)}
            </strong>
          </div>
          {showNext && (
            <div className="session-metric session-metric--next">
              <span>{t("sessionNotice.nextSession")}</span>
              <strong
                className={`session-name session-name--${nextPresentation.name}`}
              >
                {nextName}
              </strong>
              <small className={getSessionCountdownClass(nextOpensIn)}>
                {t("sessionNotice.opensIn", {
                  time: formatSessionDuration(nextOpensIn, language),
                })}
              </small>
            </div>
          )}
        </div>
      </div>
      <div
        className={`session-timeline session-timeline--${currentSession.name}`}
        role="progressbar"
        aria-label={t("sessionNotice.currentSession")}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.floor(progress)}
        aria-valuetext={`${Math.round(progress)}%`}
      >
        <span className="session-timeline-track">
          <i style={{ width: `${progress}%` }} />
        </span>
      </div>
    </section>
  );
}

function formatPrice(value, language) {
  if (value == null || Number.isNaN(Number(value))) return "—";
  return new Intl.NumberFormat(language === "es" ? "es" : "en-US", {
    maximumSignificantDigits: 7,
  }).format(Number(value));
}

function scoreClass(value) {
  if (value >= 300) return "score score--live";
  if (value >= 100) return "score score--recent";
  if (value >= 70) return "score score--strong";
  return "score";
}

function signalDirectionClass(side) {
  const normalizedSide = String(side || "").toUpperCase();
  if (normalizedSide.includes("SHORT")) return "signal-tag--short";
  if (normalizedSide.includes("LONG")) return "signal-tag--long";
  return "signal-tag--mixed";
}

function SignalMark({ result }) {
  const { t } = useTranslation();
  const liveLong = result.signal_long_light;
  const liveShort = result.signal_short_light;
  const recentSide = result.recent_signal_side;

  if (liveLong || liveShort) {
    const activeText =
      liveLong && liveShort
        ? t("signal.bothActive")
        : t("signal.active", { side: liveLong ? "LONG" : "SHORT" });
    return (
      <span
        className={`signal-tag signal-tag--live ${liveLong && liveShort ? "signal-tag--mixed" : signalDirectionClass(liveLong ? "LONG" : "SHORT")}`}
      >
        <Signal size={12} /> {activeText}
      </span>
    );
  }
  if (recentSide) {
    return (
      <span
        className={`signal-tag signal-tag--recent ${signalDirectionClass(recentSide)}`}
      >
        <Clock3 size={12} />{" "}
        {t("signal.recent", {
          side: recentSide,
          minutes: result.recent_signal_age_bars * 5,
        })}
      </span>
    );
  }
  if (result.short_observation) {
    return (
      <span className="signal-tag signal-tag--observation">
        <AlertTriangle size={12} /> {result.observation_notes || "WT_OB_SHORT"}
      </span>
    );
  }
  return <span className="muted-dash">{t("signal.none")}</span>;
}

function SideMark({ side, observation = false }) {
  const { t } = useTranslation();
  if (observation) {
    return (
      <span className="side-mark side-mark--observation">
        <AlertTriangle size={14} /> {t("signal.watch")}
      </span>
    );
  }
  const isLong = side === "LONG";
  const Icon = isLong ? ArrowUpRight : ArrowDownRight;
  return (
    <span
      className={`side-mark ${isLong ? "side-mark--long" : "side-mark--short"}`}
    >
      <Icon size={14} />
      {side}
    </span>
  );
}

function ScoreHistory({ values = [], sides = [] }) {
  const { t } = useTranslation();
  const points = values.slice(-10);
  const historySides = sides.slice(-points.length);
  const max = Math.max(...points, 1);
  const longCount = sides.filter((side) => side === "LONG").length;
  const shortCount = sides.filter((side) => side === "SHORT").length;
  const direction =
    longCount === shortCount
      ? sides.length === 0
        ? "none"
        : "mixed"
      : longCount > shortCount
        ? "long"
        : "short";
  const directionLabel =
    direction === "none" ? "—" : t(`recurring.trend${direction}`);

  return (
    <div className="trend-cell">
      <div
        className="score-history"
        aria-label={t("accessibility.scoreHistory", {
          long: longCount,
          short: shortCount,
        })}
      >
        {points.map((value, index) => {
          const side = historySides[index]?.toLowerCase();
          return (
            <span
              className={`trend-bar${side ? ` trend-bar--${side}` : ""}`}
              key={`${index}-${value}`}
              style={{ height: `${Math.max(14, (value / max) * 100)}%` }}
            />
          );
        })}
      </div>
      <span className={`trend-direction trend-direction--${direction}`}>
        {directionLabel}
      </span>
    </div>
  );
}

function EmptyRow({ columns, children }) {
  return (
    <tr>
      <td className="empty-cell" colSpan={columns}>
        {children}
      </td>
    </tr>
  );
}

function LoadingRows({ columns }) {
  return [0, 1, 2, 3, 4].map((rowIndex) => (
    <tr key={`loading-${rowIndex}`}>
      {Array.from({ length: columns }, (_, columnIndex) => (
        <td
          key={`loading-${rowIndex}-${columnIndex}`}
        >
          <Skeleton
            variant="text"
            width={columnIndex === 0 ? 22 : columnIndex === 1 ? 72 : 48}
            aria-hidden="true"
          />
        </td>
      ))}
    </tr>
  ));
}

function MarketRows({ rows, setChartSymbol, crowded = false }) {
  const { t } = useTranslation();
  return rows.map((row, index) => {
    const prioritySides =
      row.priority_sides ??
      (crowded ? prioritySignalSides(row) : []);
    const prioritySignal = row.priority_signal ?? prioritySides.length > 0;
    return (
      <tr
        key={row.symbol}
        className={prioritySignal ? "market-row--priority" : undefined}
      >
        <td className="rank-col">
          {String(index + 1).padStart(2, "0")}
        </td>
        <td className="symbol-cell">
          {row.symbol.replace(":USDT", "")}
          <small>{t("common.perp")}</small>
        </td>
        <td>
          <SideMark side={row.best_side} observation={row.short_observation} />
        </td>
        <td className="numeric">
          <span className={scoreClass(row.rank_score)}>
            {Number(row.rank_score).toFixed(1)}
          </span>
        </td>
        <td className="numeric confidence-cell">
          {Number(row.light_long_pct).toFixed(0)}%
        </td>
        <td className="numeric confidence-cell">
          {Number(row.light_short_pct).toFixed(0)}%
        </td>
        <td>
          <span className="active-signal-cell">
            <SignalMark result={row} />
            {crowded && (
              <span
                className="crowded-signal-mark"
                aria-label={t("activeSignals.crowdedPairTitle")}
                title={t("activeSignals.crowdedPairTitle")}
              >
                <Signal size={11} aria-hidden="true" />
                {t("activeSignals.activePool")}
              </span>
            )}
            {prioritySignal && (
              <span
                className="priority-signal-mark"
                aria-label={t("activeSignals.priorityForSide", {
                  sides: prioritySides.join("/"),
                })}
                title={t("activeSignals.priorityForSide", {
                  sides: prioritySides.join("/"),
                })}
              >
                <Signal size={11} aria-hidden="true" />
                {t("activeSignals.priority")}
              </span>
            )}
          </span>
        </td>
        <td className="price-sparkline-cell">
          <PriceSparkline
            values={row.sparkline_history || row.price_history}
            symbol={row.symbol}
          />
        </td>
        <td className="numeric price-cell">{formatPrice(row.close)}</td>
        <td className="chart-col">
          <ChartButton symbol={row.symbol} onClick={setChartSymbol} />
        </td>
      </tr>
    );
  });
}

function ChartButton({ symbol, onClick }) {
  const { t } = useTranslation();
  const formattedSymbol = symbol.replace(":USDT", "");
  return (
    <button
      className="chart-button"
      type="button"
      onClick={() => onClick(symbol)}
      title={t("charts.view", { symbol: formattedSymbol })}
      aria-label={t("charts.view", { symbol: formattedSymbol })}
    >
      <CandlestickChart size={15} />
    </button>
  );
}

function PriceSparkline({ values = [], symbol, loading = false }) {
  const { t, i18n } = useTranslation();
  const prices = values.map(Number).filter(Number.isFinite);
  if (prices.length < 2 || prices[0] <= 0) {
    return (
      <span
        className={`price-sparkline-placeholder${loading ? " is-loading" : ""}`}
        role="status"
        title={t(loading ? "latest.price2hLoading" : "latest.price2hWaiting")}
      >
        {loading ? "···" : "—"}
      </span>
    );
  }

  const width = 88;
  const height = 24;
  const padding = 2;
  const minimum = Math.min(...prices);
  const maximum = Math.max(...prices);
  const range = maximum - minimum || 1;
  const coordinates = prices
    .map((price, index) => {
      const x = padding + (index / (prices.length - 1)) * (width - padding * 2);
      const y =
        maximum === minimum
          ? height / 2
          : height -
            padding -
            ((price - minimum) / range) * (height - padding * 2);
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  const change = ((prices.at(-1) - prices[0]) / prices[0]) * 100;
  const changeLabel = new Intl.NumberFormat(
    i18n.resolvedLanguage === "es" ? "es" : "en-US",
    {
      style: "percent",
      signDisplay: "exceptZero",
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    },
  ).format(change / 100);
  const accessibleLabel = `${symbol.replace(":USDT", "")}: ${t("latest.price2hTrend", { change: changeLabel })}`;

  return (
    <div
      className={`price-sparkline ${change < 0 ? "price-sparkline--down" : "price-sparkline--up"}`}
      role="img"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      <svg viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
        <polyline points={coordinates} />
      </svg>
      <span>{changeLabel}</span>
    </div>
  );
}

export default function ScannerDashboard() {
  const { t, i18n } = useTranslation();
  const { timeZone } = useContext(TimeZoneContext);
  const { setNotificationHistory } = useContext(NotificationContext);
  const [dashboard, setDashboard] = useState(null);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [sideFilter, setSideFilter] = useState("ALL");
  const [refreshTime, setRefreshTime] = useState(null);
  const [chartSymbol, setChartSymbol] = useState(null);
  const [showSessionDisclaimer, setShowSessionDisclaimer] = useState(false);
  const [signalToasts, setSignalToasts] = useState([]);
  const [sessionDisclaimerResolved, setSessionDisclaimerResolved] =
    useState(false);
  const sessionDisclaimerRef = useRef(null);
  const seenSignalTimesRef = useRef(null);
  const listedSignalSymbolsRef = useRef(null);
  const [activityExpanded, setActivityExpanded] = useState(false);
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";

  useEffect(() => {
    let alive = true;
    let timer;
    let polling = false;
    const poll = async () => {
      if (document.visibilityState !== "visible" || polling) return;
      polling = true;
      try {
        const candidates = ["/api/state", "/api/momentum_pairs"];
        let payload = null;
        let response = null;

        for (const url of candidates) {
          response = await fetch(url, { cache: "no-store" });
          if (response.ok) {
            payload = await response.json();
            break;
          }
        }

        if (!payload) {
          throw new Error(
            response
              ? t("errors.apiStatus", { status: response.status })
              : t("errors.noConnection"),
          );
        }

        if (!alive) return;
        const next = payload?.last_scan
          ? payload
          : normalizeCapitalCaosPayload(payload);
        setDashboard(next);
        setConnected(true);
        setError("");
        setRefreshTime(new Date());
      } catch (caught) {
        if (!alive) return;
        setConnected(false);
        setError(
          caught instanceof TypeError
            ? t("errors.noConnection")
            : caught.message || t("errors.noConnection"),
        );
      } finally {
        polling = false;
        if (alive && document.visibilityState === "visible") {
          timer = window.setTimeout(poll, POLL_MS);
        }
      }
    };
    const handleVisibilityChange = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") poll();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "visible") poll();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [t]);

  useEffect(() => {
    const scan = dashboard?.last_scan;
    if (!scan) return;

    const events = scanSignalEvents(scan);
    const listedRows =
      scan.top?.length > 0
        ? scan.top
        : [...(scan.active_signals || []), ...(scan.recent_long_signals || [])];
    const currentSymbols = new Set(
      listedRows
        .map((row) => row.symbol)
        .filter((symbol) => typeof symbol === "string" && symbol.length > 0),
    );
    const newListedEvents = selectNewSignalNotifications(
      events,
      currentSymbols,
      listedSignalSymbolsRef.current,
    );
    listedSignalSymbolsRef.current = currentSymbols;

    if (seenSignalTimesRef.current === null) {
      let storedSignals = {};
      try {
        storedSignals = JSON.parse(
          window.sessionStorage.getItem(SIGNAL_TOAST_STORAGE_KEY) || "{}",
        );
      } catch {
        storedSignals = {};
      }
      seenSignalTimesRef.current = storedSignals;
    }

    const seen = seenSignalTimesRef.current;
    const newToasts = [];
    for (const event of newListedEvents) {
      const key = `${event.symbol}:${event.side}`;
      const timestamp = Number(event.timestamp_ms);
      if (!Number.isFinite(timestamp)) continue;
      const previousTimestamp = Number(seen[key]);
      if (
        previousTimestamp > 0 &&
        (timestamp <= previousTimestamp ||
          timestamp - previousTimestamp < SIGNAL_TOAST_COOLDOWN_MS)
      ) {
        continue;
      }
      seen[key] = timestamp;
      newToasts.push(event);
    }
    const entries = Object.entries(seen);
    if (entries.length > 500) {
      seenSignalTimesRef.current = Object.fromEntries(entries.slice(-500));
    }
    try {
      window.sessionStorage.setItem(
        SIGNAL_TOAST_STORAGE_KEY,
        JSON.stringify(seenSignalTimesRef.current),
      );
    } catch {
      // Storage may be unavailable in private browsing contexts.
    }
    if (newToasts.length) {
      setSignalToasts((current) => [...newToasts, ...current].slice(0, 5));
      setNotificationHistory((current) => {
        const existingIds = new Set(current.map((event) => event.id));
        const added = newToasts
          .filter((event) => !existingIds.has(event.id))
          .map((event) => ({ ...event, received_at: Date.now(), read: false }));
        return [...added, ...current].slice(0, NOTIFICATION_HISTORY_LIMIT);
      });
    }
  }, [dashboard, setNotificationHistory]);

  useEffect(() => {
    if (sessionDisclaimerResolved || !Array.isArray(dashboard?.valid_sessions))
      return;
    setSessionDisclaimerResolved(true);
    if (dashboard.valid_sessions.length === 0) setShowSessionDisclaimer(true);
  }, [dashboard, sessionDisclaimerResolved]);

  useEffect(() => {
    const dialog = sessionDisclaimerRef.current;
    if (!showSessionDisclaimer || !dialog) return undefined;
    if (!dialog.open) dialog.showModal();
    return () => {
      if (dialog.open) dialog.close();
    };
  }, [showSessionDisclaimer]);

  const lastScan = dashboard?.last_scan;
  const initialLoading = !dashboard && !error;
  const rows = lastScan?.top || [];
  const activity = dashboard?.activity || [];
  const scannerStatus =
    dashboard?.scanner_status || (dashboard?.scanning ? "scanning" : "stopped");
  const scannerIsScanning = scannerStatus === "scanning";
  const scannerIsWaiting = scannerStatus === "waiting";
  const recurring = dashboard?.recurring || [];
  const scanActiveRows = Array.isArray(lastScan?.active_signals)
    ? lastScan.active_signals
    : rows.filter((row) => row.signal_long_light || row.signal_short_light);
  const recurringBySymbol = new Map(recurring.map((row) => [row.symbol, row]));
  const scanRowsBySymbol = new Map();
  [
    ...rows,
    ...(lastScan?.long_top || []),
    ...(lastScan?.short_top || []),
  ].forEach((row, index) => {
    if (!scanRowsBySymbol.has(row.symbol)) {
      scanRowsBySymbol.set(row.symbol, {
        ...row,
        scanRank: row.scan_rank ?? index + 1,
        watchlist: recurringBySymbol.get(row.symbol),
      });
    }
  });
  const scanRows = [...scanRowsBySymbol.values()];
  const unifiedRows = [
    ...scanRows,
    ...recurring
      .filter((row) => !scanRowsBySymbol.has(row.symbol))
      .map((row) => ({
        ...row,
        best_side: row.side,
        rank_score: row.latest_score,
        scanRank: null,
        watchlist: row,
      })),
  ];
  const candidateCount = unifiedRows.length;
  const normalizedQuery = query.trim().toUpperCase();
  const filteredRows = unifiedRows.filter((row) => {
    const matchesQuery =
      !normalizedQuery || row.symbol.toUpperCase().includes(normalizedQuery);
    const matchesSide = sideFilter === "ALL" || row.best_side === sideFilter;
    return matchesQuery && matchesSide;
  });
  const visibleRows = [...filteredRows].sort((left, right) => {
    const priority = (row) =>
      Number(Boolean(row.price_above_ema21_3m)) * 2 +
      Number(Boolean(row.heikin_ashi_3m_green)) +
      Number(hasGreenLongSparkline(row));
    return (
      priority(right) - priority(left) ||
      Number(right.rank_score || 0) - Number(left.rank_score || 0)
    );
  });
  const signalPressure = lastScan?.signal_pressure;
  const signalCrowded =
    signalPressure?.crowded ??
    scanActiveRows.length > ACTIVE_SIGNAL_DENSITY_THRESHOLD;
  const hasPrioritySignal = (row) =>
    row.priority_signal ??
    (signalCrowded && prioritySignalSides(row).length > 0);
  const signalRows = [...scanActiveRows].sort((left, right) => {
    const matchesDirection = (row) =>
      (row.signal_long_light &&
        row.price_above_ema21_3m &&
        row.heikin_ashi_3m_green) ||
      (row.signal_short_light &&
        !row.price_above_ema21_3m &&
        !row.heikin_ashi_3m_green);
    return (
      Number(hasPrioritySignal(right)) - Number(hasPrioritySignal(left)) ||
      Number(hasGreenLongSparkline(right)) -
        Number(hasGreenLongSparkline(left)) ||
      Number(matchesDirection(right)) - Number(matchesDirection(left)) ||
      Number(right.rank_score || 0) - Number(left.rank_score || 0)
    );
  });
  const activeCount = scanActiveRows.length;
  const recentCount = rows.filter((row) => row.recent_signal_side).length;
  const connectedLabel = connected
    ? dashboard?.scanning
      ? t("connection.scanning")
      : t("connection.connected")
    : t("connection.offline");
  const dismissSignalToast = (eventId) => {
    setSignalToasts((current) =>
      current.filter((toast) => toast.id !== eventId),
    );
  };
  return (
    <div className="shell" id="scanner">
      <aside
        className="signal-toast-stack"
        aria-label={t("signalToast.region")}
      >
        {signalToasts.map((event) => (
          <SignalToast
            key={event.id}
            event={event}
            onDismiss={dismissSignalToast}
          />
        ))}
      </aside>
      <section className="page-intro" id="top">
        <div>
          <p className="eyebrow">
            {t("intro.eyebrow")} <span>·</span> {t("intro.liveMonitor")}
          </p>
          <h1>
            {t("intro.title")}
            <span className="title-period">.</span>
          </h1>
          <p className="intro-note">{t("intro.note")}</p>
        </div>
        <div className="refresh-stamp">
          <span>
            {t("intro.lastUpdate")} · {formatUtcOffset(timeZone)}
          </span>
          <strong>
            {initialLoading ? (
              <span role="status" aria-label={t("dashboard.loading")}>
                <Skeleton variant="text" width={112} aria-hidden="true" />
              </span>
            ) : (
              formatTime(lastScan?.timestamp, language, t, timeZone)
            )}
          </strong>
          <small>
            {dashboard?.scanning
              ? t("intro.scanInProgress")
              : refreshTime
                ? t("intro.polling", { seconds: POLL_MS / 1000 })
                : t("intro.waiting")}
          </small>
        </div>
      </section>

      {error && (
        <div className="api-notice" role="status">
          <WifiOff size={16} />
          <span>{t("errors.apiUnavailable", { error })}</span>
          <RefreshCw size={14} className="notice-icon" />
        </div>
      )}

      {activity.length > 0 && (
        <section className="activity-section" aria-label={t("activity.title")}>
          <div className="activity-heading">
            <button
              className="activity-toggle"
              type="button"
              aria-expanded={activityExpanded}
              aria-controls="activity-feed"
              aria-label={t(
                activityExpanded ? "activity.collapse" : "activity.expand",
              )}
              onClick={() => setActivityExpanded((expanded) => !expanded)}
            >
              <span className="activity-toggle-title">
                <Activity
                  className={
                    scannerIsScanning ? "activity-wave-icon--live" : ""
                  }
                  size={15}
                />
                <span className="activity-copy">
                  <span
                    className="activity-heading-title"
                    role="heading"
                    aria-level="2"
                  >
                    {t("activity.title")}
                  </span>
                  <span className="activity-description">
                    {scannerIsScanning
                      ? t("activity.scanning")
                      : scannerIsWaiting
                        ? t("activity.waiting")
                        : t("activity.recent")}
                  </span>
                </span>
              </span>
              <span className="activity-toggle-meta">
                <span
                  className={`activity-state activity-state--${scannerStatus}`}
                >
                  <i />
                  {t(`activity.status.${scannerStatus}`)}
                </span>
                <ChevronDown
                  className={`activity-chevron ${activityExpanded ? "activity-chevron--open" : ""}`}
                  size={15}
                />
              </span>
            </button>
          </div>
          <div
            className={`activity-signal-track activity-signal-track--${scannerStatus}`}
            aria-hidden="true"
          >
            <span />
          </div>
          <ol
            className="activity-feed"
            id="activity-feed"
            hidden={!activityExpanded}
          >
            {[...activity]
              .reverse()
              .slice(0, 12)
              .map((event, index) => (
                <li
                  className={`activity-item activity-item--${event.level || "info"}${index === 0 ? " activity-item--latest" : ""}`}
                  key={event.id}
                >
                  <time>
                    {formatTime(event.timestamp, language, t, timeZone)}
                  </time>
                  <span className="activity-level">
                    {String(event.level || "info").toUpperCase()}
                  </span>
                  <i className="activity-led" aria-hidden="true" />
                  <span className="activity-message">{event.message}</span>
                </li>
              ))}
          </ol>
        </section>
      )}

      <section
        className="stats-strip"
        aria-label={t("stats.summary")}
        aria-busy={initialLoading}
      >
        <div className="stat-item">
          <span className="stat-label">
            <Database size={13} /> {t("stats.validPairs")}
          </span>
          <strong>
            {initialLoading ? (
              <Skeleton variant="text" width={42} aria-hidden="true" />
            ) : (
              lastScan?.valid_count ?? "—"
            )}
          </strong>
          <small>
            {initialLoading ? (
              <Skeleton variant="text" width={92} aria-hidden="true" />
            ) : (
              t("stats.scannedOf", { count: lastScan?.symbols_count ?? "—" })
            )}
          </small>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Signal size={13} /> {t("stats.activeSignals")}
          </span>
          <strong
            className={
              lastScan && activeCount < MIN_ACTIVE_SIGNALS_FOR_TRADING
                ? "stat-accent-amber"
                : lastScan && activeCount >= MIN_ACTIVE_SIGNALS_FOR_TRADING
                  ? "stat-accent-green"
                  : ""
            }
          >
            {initialLoading ? (
              <Skeleton variant="text" width={42} aria-hidden="true" />
            ) : lastScan ? activeCount : "—"}
          </strong>
          <small>
            {lastScan
              ? t("activeSignals.entryThreshold", {
                  threshold: MIN_ACTIVE_SIGNALS_FOR_TRADING,
                })
              : t("stats.inLatestScan")}
          </small>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Clock3 size={13} /> {t("stats.recentSignals")}
          </span>
          <strong className={recentCount ? "stat-accent-amber" : ""}>
            {initialLoading ? (
              <Skeleton variant="text" width={42} aria-hidden="true" />
            ) : lastScan ? recentCount : "—"}
          </strong>
          <small>{t("stats.withinLookback")}</small>
        </div>
        <div className="stat-item">
          <span className="stat-label">
            <Radio size={13} /> {t("stats.candidates")}
          </span>
          <strong>
            {initialLoading ? (
              <Skeleton variant="text" width={42} aria-hidden="true" />
            ) : (
              candidateCount
            )}
          </strong>
          <small>{t("stats.watchlistPairs")}</small>
        </div>
      </section>

      {lastScan && (
        <SignalTide
          activeCount={activeCount}
          history={dashboard?.signal_tide?.history || []}
        />
      )}

      {lastScan && activeCount < MIN_ACTIVE_SIGNALS_FOR_TRADING && (
        <div
          className="signal-availability-notice signal-availability-notice--low"
          role="status"
          aria-live="polite"
        >
          <AlertTriangle size={16} aria-hidden="true" />
          <div>
            <strong>
              {t("activeSignals.lowSignalsTitle", {
                count: activeCount,
                threshold: MIN_ACTIVE_SIGNALS_FOR_TRADING,
              })}
            </strong>
            <p>
              {t("activeSignals.lowSignalsMessage", {
                count: activeCount,
                threshold: MIN_ACTIVE_SIGNALS_FOR_TRADING,
              })}
            </p>
          </div>
        </div>
      )}

      {signalCrowded && (
        <div
          className="signal-availability-notice signal-availability-notice--high"
          role="status"
          aria-live="polite"
        >
          <Info size={16} aria-hidden="true" />
          <div>
            <strong>
              {t("activeSignals.highSignalsTitle", { count: activeCount })}
            </strong>
            <p>
              {t("activeSignals.highSignalsMessage")}
            </p>
          </div>
        </div>
      )}

      {lastScan &&
        activeCount === 0 &&
        dashboard?.valid_sessions?.length === 0 && (
          <div className="session-notice" role="status" aria-live="polite">
            <AlertTriangle size={17} />
            <div className="session-notice-copy">
              <strong>{t("sessionNotice.title")}</strong>
              <span>
                <Trans
                  i18nKey="sessionNotice.message"
                  components={{
                    asia: <span className="session-name session-name--asia" />,
                    newYork: (
                      <span className="session-name session-name--new_york" />
                    ),
                  }}
                />
              </span>
            </div>
            <SessionOpening
              nextSession={dashboard?.next_session}
              timeZone={timeZone}
            />
          </div>
        )}
      {dashboard?.current_session ? (
        <CurrentSessionTracker
          currentSession={dashboard.current_session}
          nextSession={dashboard.next_session}
        />
      ) : (
        !(
          lastScan &&
          activeCount === 0 &&
          dashboard?.valid_sessions?.length === 0
        ) &&
        dashboard?.next_session && (
          <section
            className="session-tracker"
            aria-label={t("sessionNotice.nextSession")}
          >
            <Clock3 size={17} />
            <SessionOpening
              nextSession={dashboard.next_session}
              timeZone={timeZone}
            />
          </section>
        )
      )}

      <div className="data-sections">
        {(signalRows.length > 0 || initialLoading) && (
          <section className="data-section active-signals-section">
            <div className="section-heading">
              <div className="section-title-group">
                <div>
                  <h2>{t("activeSignals.title")}</h2>
                  <p>
                    {initialLoading ? (
                      <Skeleton
                        variant="text"
                        width={132}
                        aria-hidden="true"
                      />
                    ) : (
                      t("activeSignals.subtitle", {
                        count: scanActiveRows.length,
                      })
                    )}
                  </p>
                </div>
              </div>
            </div>
            <div className="table-frame">
              <table className="market-table">
                <thead>
                  <tr>
                    <th className="rank-col">{t("latest.rank")}</th>
                    <th>{t("latest.pair")}</th>
                    <th>{t("latest.side")}</th>
                    <th className="numeric">{t("latest.score")}</th>
                    <th className="numeric">LONG</th>
                    <th className="numeric">SHORT</th>
                    <th>{t("latest.signal")}</th>
                    <th>{t("latest.price2h")}</th>
                    <th className="numeric">{t("latest.price")}</th>
                    <th className="chart-col">{t("latest.chart")}</th>
                  </tr>
                </thead>
                <tbody aria-busy={initialLoading}>
                  {initialLoading ? (
                    <LoadingRows
                      columns={10}
                    />
                  ) : (
                    <MarketRows
                      rows={signalRows}
                      setChartSymbol={setChartSymbol}
                      crowded={signalCrowded}
                    />
                  )}
                </tbody>
              </table>
            </div>
            <div className="table-foot">
              <span>{t("activeSignals.liveOnly")}</span>
              <span>
                {initialLoading ? (
                  <Skeleton variant="text" width={70} aria-hidden="true" />
                ) : (
                  t("activeSignals.count", { count: signalRows.length })
                )}
              </span>
            </div>
          </section>
        )}

        <section className="data-section latest-section">
          <div className="section-heading">
            <div className="section-title-group">
              <div>
                <h2>{t("latest.title")}</h2>
                <p>
                  {initialLoading ? (
                    <Skeleton variant="text" width={180} aria-hidden="true" />
                  ) : (
                    t("latest.subtitle", {
                      visible: visibleRows.length,
                      total: filteredRows.length,
                    })
                  )}
                </p>
              </div>
            </div>
            <div className="table-tools">
              <label className="search-box">
                <Search size={15} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder={t("latest.search")}
                />
                {query && (
                  <button
                    type="button"
                    className="clear-search"
                    onClick={() => setQuery("")}
                    aria-label={t("latest.clearSearch")}
                  >
                    ×
                  </button>
                )}
              </label>
              <div className="segmented" aria-label={t("latest.filterSide")}>
                {[
                  ["ALL", t("latest.allSides")],
                  ["LONG", t("latest.long")],
                  ["SHORT", t("latest.short")],
                ].map(([value, label]) => (
                  <button
                    key={value}
                    className={sideFilter === value ? "selected" : ""}
                    onClick={() => setSideFilter(value)}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div className="table-frame">
            <table className="market-table">
              <thead>
                <tr>
                  <th className="rank-col">{t("latest.rank")}</th>
                  <th>{t("latest.pair")}</th>
                  <th>{t("latest.side")}</th>
                  <th className="numeric">{t("latest.score")}</th>
                  <th className="numeric">LONG</th>
                  <th className="numeric">SHORT</th>
                  <th>{t("recurring.recurrence")}</th>
                  <th className="numeric">{t("recurring.bestScore")}</th>
                  <th>{t("recurring.trend")}</th>
                  <th>{t("latest.signal")}</th>
                  <th>{t("latest.price2h")}</th>
                  <th className="numeric">{t("latest.price")}</th>
                  <th className="chart-col">{t("latest.chart")}</th>
                </tr>
              </thead>
              <tbody aria-busy={initialLoading}>
                {initialLoading ? (
                  <LoadingRows
                    columns={13}
                  />
                ) : (
                  <>
                    {visibleRows.map((row, index) => (
                  <tr key={row.symbol}>
                    <td className="rank-col">
                      {String(index + 1).padStart(2, "0")}
                    </td>
                    <td className="symbol-cell">
                      {row.symbol.replace(":USDT", "")}
                      <small>{t("common.perp")}</small>
                    </td>
                    <td>
                      <SideMark
                        side={row.best_side}
                        observation={row.short_observation}
                      />
                    </td>
                    <td className="numeric">
                      <span className={scoreClass(row.rank_score)}>
                        {Number(row.rank_score).toFixed(1)}
                      </span>
                    </td>
                    <td className="numeric confidence-cell">
                      {row.light_long_pct == null
                        ? "—"
                        : `${Number(row.light_long_pct).toFixed(0)}%`}
                    </td>
                    <td className="numeric confidence-cell">
                      {row.light_short_pct == null
                        ? "—"
                        : `${Number(row.light_short_pct).toFixed(0)}%`}
                    </td>
                    <td>
                      {row.watchlist ? (
                        <div className="recurrence-cell">
                          <span className="recurrence-count">
                            {row.watchlist.appearances}
                            <small>/{row.watchlist.scans_considered}</small>
                          </span>
                          <span className="recurrence-track">
                            <i
                              style={{
                                width: `${Math.min(100, (row.watchlist.appearances / Math.max(1, row.watchlist.scans_considered)) * 100)}%`,
                              }}
                            />
                          </span>
                        </div>
                      ) : (
                        <span className="muted-dash">—</span>
                      )}
                    </td>
                    <td className="numeric best-score">
                      {row.watchlist
                        ? Number(row.watchlist.best_score).toFixed(1)
                        : "—"}
                    </td>
                    <td>
                      {row.watchlist ? (
                        <ScoreHistory
                          values={row.watchlist.history}
                          sides={row.watchlist.history_sides}
                        />
                      ) : (
                        <span className="muted-dash">—</span>
                      )}
                    </td>
                    <td>
                      {row.scanRank ? (
                        <SignalMark result={row} />
                      ) : row.watchlist.current_signal ? (
                        <span
                          className={`signal-tag signal-tag--live ${signalDirectionClass(row.watchlist.signal || row.watchlist.side)}`}
                        >
                          <Signal size={12} /> {row.watchlist.signal}
                        </span>
                      ) : row.watchlist.recent_signal_side ? (
                        <span
                          className={`signal-tag signal-tag--recent ${signalDirectionClass(row.watchlist.recent_signal_side)}`}
                        >
                          <Clock3 size={12} />{" "}
                          {t("signal.recentSide", {
                            side: row.watchlist.recent_signal_side,
                          })}
                        </span>
                      ) : row.watchlist.last_signal &&
                        row.watchlist.last_signal !== "-" ? (
                        <span
                          className={`signal-tag signal-tag--recent ${signalDirectionClass(row.watchlist.last_signal)}`}
                          title={t("signal.lastSeenTitle")}
                        >
                          <Clock3 size={12} />{" "}
                          {t("signal.lastSeen", {
                            signal: row.watchlist.last_signal,
                          })}
                        </span>
                      ) : (
                        <span className="muted-dash">{t("signal.none")}</span>
                      )}
                    </td>
                    <td className="price-sparkline-cell">
                      <PriceSparkline
                        values={
                          row.sparkline_history || row.price_history
                        }
                        symbol={row.symbol}
                      />
                    </td>
                    <td className="numeric price-cell">
                      {formatPrice(row.close)}
                    </td>
                    <td className="chart-col">
                      <ChartButton
                        symbol={row.symbol}
                        onClick={setChartSymbol}
                      />
                    </td>
                  </tr>
                    ))}
                    {!filteredRows.length && (
                      <EmptyRow columns={13}>
                        {lastScan ? t("latest.noMatches") : t("latest.waiting")}
                      </EmptyRow>
                    )}
                  </>
                )}
              </tbody>
            </table>
          </div>
          <div className="table-foot">
            <span>
              {initialLoading ? (
                <Skeleton variant="text" width={230} aria-hidden="true" />
              ) : (
                <>
                  {t("latest.source")} · {t("recurring.persistent")} ·{" "}
                  {t("recurring.criteria")} · {dashboard?.history_count ?? 0}{" "}
                  {t("recurring.scans")}
                </>
              )}
            </span>
            <span>
              {t("latest.scan")}{" "}
              {initialLoading ? (
                <Skeleton
                  component="span"
                  variant="text"
                  width={84}
                  aria-hidden="true"
                />
              ) : lastScan
                ? formatTime(lastScan.timestamp, language, t, timeZone)
                : "—"}{" "}
              {formatUtcOffset(timeZone)}
            </span>
          </div>
        </section>
      </div>

      <footer className="footer-bar">
        <span>
          <span
            className={`footer-dot${connected ? " footer-dot--online" : ""}`}
          />{" "}
          {initialLoading ? (
            <Skeleton
              component="span"
              variant="text"
              width={58}
              aria-label={t("dashboard.loading")}
            />
          ) : (
            connectedLabel.toUpperCase()
          )}
        </span>
        <span>
          {initialLoading ? (
            <Skeleton
              component="span"
              variant="text"
              width={136}
              aria-hidden="true"
            />
          ) : (
            t("footer.updated", {
              time: formatTime(refreshTime, language, t, timeZone),
            })
          )}
        </span>
        <span>{t("footer.product")}</span>
      </footer>

      {showSessionDisclaimer && (
        <dialog
          ref={sessionDisclaimerRef}
          className="session-disclaimer"
          role="alertdialog"
          aria-labelledby="session-disclaimer-title"
          aria-describedby="session-disclaimer-message"
          onClose={() => setShowSessionDisclaimer(false)}
        >
          <div className="session-disclaimer-mark">
            <AlertTriangle size={19} />
          </div>
          <p className="session-disclaimer-eyebrow">
            {t("sessionNotice.disclaimerLabel")}
          </p>
          <h2 id="session-disclaimer-title">
            {t("sessionNotice.disclaimerTitle")}
          </h2>
          <p id="session-disclaimer-message">
            {t("sessionNotice.disclaimerMessage")}
          </p>
          <button
            className="session-disclaimer-confirm"
            type="button"
            onClick={() => setShowSessionDisclaimer(false)}
          >
            {t("sessionNotice.disclaimerConfirm")}
          </button>
        </dialog>
      )}

      <TradingViewChartDialog
        symbol={chartSymbol}
        onClose={() => setChartSymbol(null)}
        timeZone={timeZone}
      />
    </div>
  );
}
