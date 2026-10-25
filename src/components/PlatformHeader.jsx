import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "../i18n";
import {
  Activity,
  Bell,
  CandlestickChart,
  Clock3,
  Coins,
  Languages,
  Menu,
  Moon,
  Palette,
  Radio,
  Signal,
  Sun,
  Trash2,
  Waves,
} from "lucide-react";
import {
  CurrencyContext,
  NotificationContext,
  SidebarContext,
  PlatformThemeContext,
  TimeZoneContext,
} from "../contexts/AppContexts";
import {
  COMMON_TIME_ZONES,
  formatTimeZoneOption,
  formatUtcOffset,
} from "../utils/timeZones";
import { APP_PALETTES } from "../theme";
import { useAuth } from "../contexts/authState";
import { PLAN_IDENTITIES } from "../utils/planIdentity";
import {
  getSessionPresentation,
  getUpcomingParentSessionOpening,
  getSessionCountdownClass,
} from "../utils/sessionPresentation";
import TradingViewChartDialog from "./TradingViewChartDialog";
import { detectKairosEvents } from "../utils/kairosNotifications";
import { getSignalTideReading } from "../utils/signalTide";

const STATUS_POLL_MS = 5000;
const KAIROS_GLOBAL_EVENT_MS = 2400;

function readScannerStatus(payload) {
  const scannerStatus =
    payload?.scanner_status ||
    (payload?.scanning === true
      ? "scanning"
      : payload?.scanning === false
        ? "waiting"
        : "unknown");

  return scannerStatus;
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

function formatSessionCountdown(milliseconds, language) {
  const totalMinutes = Math.max(0, Math.ceil(milliseconds / 60000));
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  const parts = [];
  if (days) parts.push(`${days}d`);
  if (hours || days) parts.push(`${hours}h`);
  parts.push(language === "es" ? `${minutes} min` : `${minutes}m`);
  return parts.join(" ");
}

export default function PlatformHeader() {
  const { t, i18n } = useTranslation();
  const { user, planChange, updateLanguagePreference } = useAuth();
  const isAdmin = user?.role === "admin";
  const planIdentity = PLAN_IDENTITIES[user?.plan_code];
  const PlanIcon = planIdentity?.icon;
  const canViewSignals =
    isAdmin || user?.features?.includes("signals") === true;
  const canViewKairos =
    isAdmin || user?.features?.includes("kairos") === true;
  const canViewTrades =
    isAdmin || user?.features?.includes("bot_trades") === true;
  const availablePalettes = isAdmin
    ? APP_PALETTES
    : APP_PALETTES.filter(({ adminOnly }) => !adminOnly);
  const { mode, setMode, palette, setPalette } =
    useContext(PlatformThemeContext);
  const currentPalette = availablePalettes.find(({ id }) => id === palette);
  const darkModeOnly = currentPalette?.darkOnly === true;
  const { timeZone, setTimeZone } = useContext(TimeZoneContext);
  const { currency, setCurrency } = useContext(CurrencyContext);
  const { notificationHistory, setNotificationHistory } =
    useContext(NotificationContext);
  const { setMobileNavOpen } = useContext(SidebarContext);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [languagePreferenceError, setLanguagePreferenceError] = useState(false);
  const [chartSymbol, setChartSymbol] = useState(null);
  const [paletteMenuOpen, setPaletteMenuOpen] = useState(false);
  const [systemStatus, setSystemStatus] = useState({
    connection: "connecting",
    scanner: "unknown",
  });
  const [marketSession, setMarketSession] = useState(null);
  const [kairosReading, setKairosReading] = useState(null);
  const [now, setNow] = useState(Date.now());
  const previousKairosSnapshotRef = useRef(null);
  const kairosAnimationTimerRef = useRef(null);
  const kairosAnimationStartTimerRef = useRef(null);
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const visibleNotificationHistory = canViewTrades
    ? notificationHistory
    : notificationHistory.filter((event) => event.category === "kairos");
  const unreadNotificationCount = visibleNotificationHistory.filter(
    (event) => !event.read,
  ).length;
  const marketSessionPresentation = marketSession
    ? getSessionPresentation(marketSession.name)
    : null;
  const parentSessionOpening =
    marketSession?.type === "active"
      ? getUpcomingParentSessionOpening(
          { name: marketSession.name, opens_at: marketSession.opensAt },
          now,
        )
      : null;

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!canViewSignals) {
      setSystemStatus({ connection: "connected", scanner: "unknown" });
      setMarketSession(null);
      setKairosReading(null);
      previousKairosSnapshotRef.current = null;
      return undefined;
    }
    let alive = true;
    let timer;
    let polling = false;
    const pollStatus = async () => {
      if (document.visibilityState !== "visible" || polling) return;
      polling = true;
      try {
        let payload = null;
        let response = null;
        for (const url of ["/api/state", "/api/momentum_pairs"]) {
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
        const scannerStatus = readScannerStatus(payload);
        setSystemStatus({
          connection: "connected",
          scanner: scannerStatus,
        });
        const activeRows = Array.isArray(payload.last_scan?.active_signals)
          ? payload.last_scan.active_signals
          : Array.isArray(payload.momentum_pairs)
            ? payload.momentum_pairs.filter(
                (row) => row.signal_long_light || row.signal_short_light,
              )
            : Array.isArray(payload.last_scan?.top)
              ? payload.last_scan.top.filter(
                  (row) => row.signal_long_light || row.signal_short_light,
                )
              : null;
        const history = canViewKairos ? payload.signal_tide?.history || [] : [];
        const reading =
          canViewKairos && activeRows
            ? getSignalTideReading(activeRows.length, history)
            : null;
        setKairosReading(reading);
        const { events, snapshot } =
          canViewKairos && activeRows
            ? detectKairosEvents(
                previousKairosSnapshotRef.current,
                activeRows.length,
                history,
              )
            : { events: [], snapshot: null };
        previousKairosSnapshotRef.current = canViewKairos ? snapshot : null;
        if (events.length > 0 && document.visibilityState === "visible") {
          const eventType = events.some((event) => event.type === "surge")
            ? "surge"
            : "peak";
          const root = document.documentElement;
          window.clearTimeout(kairosAnimationTimerRef.current);
          window.clearTimeout(kairosAnimationStartTimerRef.current);
          root.classList.remove("kairos-global-event");
          root.dataset.kairosEvent = eventType;
          kairosAnimationStartTimerRef.current = window.setTimeout(() => {
            root.classList.add("kairos-global-event");
          }, 0);
          kairosAnimationTimerRef.current = window.setTimeout(() => {
            root.classList.remove("kairos-global-event");
            delete root.dataset.kairosEvent;
          }, KAIROS_GLOBAL_EVENT_MS);
        }
        const currentSession = canViewKairos ? payload.current_session : null;
        const nextSession = canViewKairos ? payload.next_session : null;
        if (currentSession?.name) {
          setMarketSession({
            type: "active",
            name: currentSession.name,
            opensAt: currentSession.opens_at,
            deadline: Date.parse(currentSession.closes_at),
            isWeekend: currentSession.is_weekend === true,
          });
        } else if (nextSession?.name) {
          setMarketSession({
            type: "next",
            name: nextSession.name,
            deadline: Date.parse(nextSession.opens_at),
            isWeekend: nextSession.is_weekend === true,
          });
        } else {
          setMarketSession(null);
        }
      } catch {
        if (!alive) return;
        setSystemStatus({
          connection: "offline",
          scanner: "offline",
        });
        setKairosReading(null);
        previousKairosSnapshotRef.current = null;
        setMarketSession(null);
      } finally {
        polling = false;
        if (alive && document.visibilityState === "visible") {
          timer = window.setTimeout(pollStatus, STATUS_POLL_MS);
        }
      }
    };
    const handleVisibilityChange = () => {
      window.clearTimeout(timer);
      if (document.visibilityState === "visible") pollStatus();
    };
    document.addEventListener("visibilitychange", handleVisibilityChange);
    if (document.visibilityState === "visible") pollStatus();
    return () => {
      alive = false;
      window.clearTimeout(timer);
      window.clearTimeout(kairosAnimationTimerRef.current);
      window.clearTimeout(kairosAnimationStartTimerRef.current);
      document.documentElement.classList.remove("kairos-global-event");
      delete document.documentElement.dataset.kairosEvent;
      previousKairosSnapshotRef.current = null;
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [canViewKairos, canViewSignals, t]);

  const updateTimeZone = (event) => {
    const nextTimeZone = event.target.value;
    setTimeZone(nextTimeZone);
    window.localStorage.setItem("timeZone", nextTimeZone);
  };

  const closeChart = () => setChartSymbol(null);

  const handleLanguageChange = async (event) => {
    const nextLanguage = event.target.value;
    setLanguagePreferenceError(false);
    await i18n.changeLanguage(nextLanguage);
    if (!user) return;
    try {
      await updateLanguagePreference(nextLanguage);
    } catch (error) {
      console.error("Could not save account language preference:", error);
      setLanguagePreferenceError(true);
    }
  };

  const toggleNotifications = () => {
    const opening = !notificationsOpen;
    setNotificationsOpen(opening);
    if (opening) {
      setNotificationHistory((current) =>
        current.map((event) =>
          canViewTrades || event.category === "kairos"
            ? { ...event, read: true }
            : event,
        ),
      );
    }
  };

  return (
    <header className="topbar platform-header">
      <Link
        className="brand"
        to="/"
        aria-label={t("brand.home")}
      >
        <span className="brand-icon">
          <Activity
            className={
              systemStatus.scanner === "scanning"
                ? "activity-wave-icon--live"
                : undefined
            }
            size={17}
            strokeWidth={2.4}
          />
        </span>
        <span className="brand-copy">
          <strong>CIPHER DESK</strong>
          <small>
            by <b>SIGLO CAPITAL</b>
          </small>
        </span>
        <span className="brand-account-badges">
          {planIdentity && PlanIcon && (
            <span
              className={`plan-identity-badge plan-identity-badge--${planIdentity.tone}${planChange ? " plan-identity-badge--changed" : ""}`}
              aria-label={t(planIdentity.labelKey)}
              title={t(planIdentity.labelKey)}
              data-testid="header-plan-badge"
            >
              <PlanIcon size={12} strokeWidth={2.2} aria-hidden="true" />
              <span className="plan-identity-name">
                {t(planIdentity.labelKey)}
              </span>
            </span>
          )}
          {isAdmin && (
            <span className="admin-mode-badge">
              {t("accountPage.adminMode")}
            </span>
          )}
        </span>
      </Link>
      <button
        className="platform-nav-trigger"
        type="button"
        onClick={() => setMobileNavOpen(true)}
        aria-label={t("navigation.open")}
        title={t("navigation.open")}
      >
        <Menu size={17} />
      </button>
      {canViewSignals && (
        <div
          className="header-system-status"
          aria-label={t("headerStatus.region")}
          aria-live="polite"
        >
        <span
          className={`header-status-item header-status-connection header-status-connection--${systemStatus.connection}`}
        >
          <i aria-hidden="true" />
          {t(`headerStatus.connection.${systemStatus.connection}`)}
        </span>
        <span
          className={`header-status-item header-status-scanner header-status-scanner--${systemStatus.scanner}`}
        >
          <Radio
            size={13}
            aria-hidden="true"
          />
          <i aria-hidden="true" />
          {t(`headerStatus.scanner.${systemStatus.scanner}`)}
        </span>
        {kairosReading && (
          <Link
            className={`header-status-item header-kairos header-kairos--${kairosReading.state}`}
            to="/scanner"
            aria-label={t("signalTide.gaugeLabel", {
              score: kairosReading.score,
              status: t(`signalTide.states.${kairosReading.state}`),
            })}
            title={t("signalTide.title")}
          >
            <Waves size={13} aria-hidden="true" />
            <svg viewBox="0 0 44 27" aria-hidden="true">
              <path className="header-kairos-track" d="M3 24 A19 19 0 0 1 41 24" />
              <path
                className="header-kairos-value"
                d="M3 24 A19 19 0 0 1 41 24"
                pathLength="100"
                strokeDasharray={`${kairosReading.score} 100`}
              />
            </svg>
            <span className="header-kairos-copy">
              <strong>{kairosReading.score}</strong>
              <small>{t(`signalTide.states.${kairosReading.state}`)}</small>
            </span>
          </Link>
        )}
        {marketSession && (
          <span
            className={`header-status-item header-market-session header-market-session--${marketSession.type}`}
            aria-live="off"
            aria-label={t(
              marketSession.type === "active"
                ? "sessionNotice.currentSession"
                : "sessionNotice.outsideSession",
            )}
          >
            <i aria-hidden="true" />
            <span className="header-market-session-copy">
              <small>
                {t(
                  marketSession.type === "active"
                    ? "sessionNotice.currentSession"
                    : "sessionNotice.outsideSession",
                )}
              </small>
              <strong>
                {t(
                  `sessionNotice.sessions.${marketSessionPresentation.name}`,
                )}
                {marketSession.isWeekend && (
                  <span className="header-market-session-weekend">
                    {" "}
                    {t("sessionNotice.weekendMarker")}
                  </span>
                )}
                {Number.isFinite(marketSession.deadline) && (
                  <em
                    className={getSessionCountdownClass(
                      marketSession.deadline - now,
                    )}
                  >
                    {marketSession.type === "active"
                      ? t("sessionNotice.endsIn")
                      : t("sessionNotice.opensIn", {
                          time: formatSessionCountdown(
                            marketSession.deadline - now,
                            language,
                          ),
                        })}
                    {marketSession.type === "active" &&
                      ` ${formatSessionCountdown(
                        marketSession.deadline - now,
                        language,
                      )}`}
                  </em>
                )}
              </strong>
              {marketSessionPresentation.parent && (
                <small>
                  {t("sessionNotice.withinSession", {
                    session: t(
                      `sessionNotice.sessions.${marketSessionPresentation.parent}`,
                    ),
                  })}
                </small>
              )}
              {parentSessionOpening && (
                <small
                  className={`header-market-session-next ${getSessionCountdownClass(
                    Date.parse(parentSessionOpening.opens_at) - now,
                  )}`}
                >
                  {t("sessionNotice.opensInSession", {
                    session: t(
                      `sessionNotice.sessions.${parentSessionOpening.name}`,
                    ),
                    time: formatSessionCountdown(
                      Date.parse(parentSessionOpening.opens_at) - now,
                      language,
                    ),
                  })}
                </small>
              )}
            </span>
          </span>
        )}
        </div>
      )}
      <div className="topbar-meta platform-header-meta">
        {canViewTrades && (
          <label className="timezone-select-label">
          <Clock3 size={14} />
          <span className="sr-only">{t("settingsPage.timezone")}</span>
          <select
            className="timezone-select"
            value={timeZone}
            onChange={updateTimeZone}
            aria-label={t("settingsPage.timezone")}
            title={`${timeZone} (${formatUtcOffset(timeZone)})`}
          >
            {!COMMON_TIME_ZONES.includes(timeZone) && (
              <option value={timeZone}>
                {formatTimeZoneOption(timeZone)}
              </option>
            )}
            {COMMON_TIME_ZONES.map((zone) => (
              <option key={zone} value={zone}>
                {formatTimeZoneOption(zone)}
              </option>
            ))}
          </select>
          </label>
        )}
        {canViewTrades && (
          <label className="currency-select-label">
          <Coins size={14} aria-hidden="true" />
          <span className="sr-only">{t("settingsPage.currency")}</span>
          <select
            className="currency-select"
            value={currency}
            onChange={(event) => setCurrency(event.target.value)}
            aria-label={t("settingsPage.currency")}
            title={t("settingsPage.currency")}
          >
            {["USDT", "COP", "MXN"].map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
          </label>
        )}
        <label className="language-select-label">
          <Languages size={14} />
          <span className="sr-only">{t("language.label")}</span>
          <select
            className="language-select"
            value={language}
            onChange={handleLanguageChange}
            aria-label={t("language.label")}
          >
            <option value="en">{t("language.english")}</option>
            <option value="es">{t("language.spanish")}</option>
          </select>
          {languagePreferenceError && (
            <small className="language-preference-error" role="status">
              {t("language.saveError")}
            </small>
          )}
        </label>
        <div className="palette-menu">
          <button
            className="palette-trigger"
            type="button"
            aria-label={`${t("theme.choosePalette")}: ${t(
              `theme.palettes.${palette}`,
            )}`}
            aria-expanded={paletteMenuOpen}
            aria-controls="platform-theme-palette"
            onClick={() => setPaletteMenuOpen((open) => !open)}
            title={t("theme.choosePalette")}
          >
            <Palette size={15} aria-hidden="true" />
            <i
              className="palette-current-swatch"
              style={{
                backgroundColor:
                  mode === "light"
                    ? currentPalette?.lightColor || currentPalette?.color
                    : currentPalette?.color,
              }}
              aria-hidden="true"
            />
          </button>
          <section
            className="palette-panel"
            id="platform-theme-palette"
            aria-label={t("theme.choosePalette")}
            hidden={!paletteMenuOpen}
          >
            <strong>{t("theme.choosePalette")}</strong>
            {availablePalettes.map(({ id, color, lightColor }) => (
              <button
                className={`palette-option${
                  palette === id ? " palette-option--selected" : ""
                }`}
                key={id}
                type="button"
                aria-pressed={palette === id}
                onClick={() => {
                  setPalette(id);
                  if (APP_PALETTES.find((option) => option.id === id)?.darkOnly) {
                    setMode("dark");
                  }
                  setPaletteMenuOpen(false);
                }}
              >
                <i
                  style={{
                    backgroundColor:
                      mode === "light" ? lightColor || color : color,
                  }}
                  aria-hidden="true"
                />
                {t(`theme.palettes.${id}`)}
              </button>
            ))}
          </section>
        </div>
        <button
          className="theme-toggle"
          type="button"
          disabled={darkModeOnly}
          onClick={() => {
            if (!darkModeOnly) setMode(mode === "dark" ? "light" : "dark");
          }}
          aria-label={
            darkModeOnly
              ? t("theme.darkModeOnly")
              : mode === "dark"
                ? t("theme.switchToLight")
                : t("theme.switchToDark")
          }
          title={
            darkModeOnly
              ? t("theme.darkModeOnly")
              : mode === "dark"
                ? t("theme.switchToLight")
                : t("theme.switchToDark")
          }
        >
          {mode === "dark" ? <Sun size={15} /> : <Moon size={15} />}
        </button>
        {canViewKairos && (
          <div className="notification-menu">
          <button
            className="notification-trigger"
            type="button"
            aria-label={
              unreadNotificationCount > 0
                ? t("notifications.unread", {
                    count: unreadNotificationCount,
                  })
                : t("notifications.open")
            }
            aria-expanded={notificationsOpen}
            aria-controls="platform-notification-history"
            onClick={toggleNotifications}
            title={
              unreadNotificationCount > 0
                ? t("notifications.unread", {
                    count: unreadNotificationCount,
                  })
                : t("notifications.open")
            }
          >
            <Bell size={15} />
            {unreadNotificationCount > 0 && (
              <span className="notification-count" aria-hidden="true">
                {unreadNotificationCount > 99
                  ? "99+"
                  : unreadNotificationCount}
              </span>
            )}
          </button>
          <section
            className="notification-panel"
            id="platform-notification-history"
            aria-label={t("notifications.title")}
            hidden={!notificationsOpen}
          >
            <div className="notification-panel-heading">
              <strong>{t("notifications.title")}</strong>
              {visibleNotificationHistory.length > 0 && (
                <button
                  className="notification-clear"
                  type="button"
                  onClick={() => setNotificationHistory([])}
                >
                  <Trash2 size={13} />
                  {t("notifications.clear")}
                </button>
              )}
            </div>
            {visibleNotificationHistory.length === 0 ? (
              <p className="notification-empty">{t("notifications.empty")}</p>
            ) : (
              <ol className="notification-list">
                {visibleNotificationHistory.map((event) => {
                  const isRecent = event.recent_age_bars != null;
                  const isKairosEvent = event.category === "kairos";
                  const isTradeEvent =
                    event.type === "opened" || event.type === "closed";
                  return (
                    <li
                      className={`notification-item${isKairosEvent ? ` notification-item--kairos notification-item--kairos-${event.type}` : ` notification-item--${String(event.side).toLowerCase()}`}`}
                      key={event.id}
                    >
                      {isTradeEvent || isKairosEvent ? (
                        <Activity size={14} />
                      ) : (
                        <Signal size={14} />
                      )}
                      <div className="notification-copy">
                        <strong>
                          {t(
                            isKairosEvent
                              ? `kairosToast.${event.type}Title`
                              : isTradeEvent
                              ? `tradeToast.${event.type}Title`
                              : isRecent
                                ? "signalToast.recentTitle"
                                : "signalToast.activeTitle",
                          )}
                        </strong>
                        <span>
                          {isKairosEvent
                            ? t("kairosToast.name")
                            : event.symbol.replace(":USDT", "")}
                        </span>
                        <small>
                          {isKairosEvent
                            ? t(`kairosToast.${event.type}Details`, {
                                score: event.score,
                              })
                            : isTradeEvent
                            ? t("tradeToast.details", { side: event.side })
                            : isRecent
                              ? t("signal.recent", {
                                  side: event.side,
                                  minutes: event.recent_age_bars * 5,
                                })
                              : t("signal.active", { side: event.side })}
                        </small>
                        {!isKairosEvent && (
                          <button
                            className="chart-button notification-chart-button"
                            type="button"
                            onClick={() => setChartSymbol(event.symbol)}
                            title={t("charts.view", {
                              symbol: event.symbol.replace(":USDT", ""),
                            })}
                            aria-label={t("charts.view", {
                              symbol: event.symbol.replace(":USDT", ""),
                            })}
                          >
                            <CandlestickChart size={15} />
                          </button>
                        )}
                        <time>
                          {formatTime(
                            Number(event.timestamp_ms),
                            language,
                            t,
                            timeZone,
                          )}
                        </time>
                      </div>
                    </li>
                  );
                })}
              </ol>
            )}
          </section>
          </div>
        )}
      </div>
      <TradingViewChartDialog
        symbol={chartSymbol}
        onClose={closeChart}
        timeZone={timeZone}
      />
    </header>
  );
}
