import React, {
  useCallback,
  useEffect,
  useRef,
  useState,
  useContext,
} from "react";
import { getChartData, getClosedTradesPage } from "../api/chartData";
import { getOpenTrades } from "../api/openTrades";
import { getMomentumPairs } from "../api/momentumPairs";
import { getConfig } from "../api/config";
import { getCapital } from "../api/capital";
import { getCommissionRate } from "../api/paperBroker";
import {
  Box,
  Grid,
  Typography,
  Alert,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Tooltip,
  FormControlLabel,
  Switch,
  Skeleton,
  TablePagination,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import InfoIcon from "@mui/icons-material/Info";
import { RefreshCw, WifiOff } from "lucide-react";
import OperationsTable from "../components/OperationsTable";
import StickyTradeSummary from "../components/StickyTradeSummary";
import MomentumPairsTable from "../components/MomentumPairsTable";
import DashboardMetrics from "../components/DashboardMetrics";
import EquityChart from "../components/charts/EquityChart";
import TradePerformanceTable from "../components/charts/TradePerformanceTable";
import { TimeZoneContext, CurrencyContext } from "../contexts/AppContexts";
import { useTranslation } from "react-i18next";
import { convertFromUSDT, formatCurrency } from "../utils/currencyConverter";

export default function Dashboard({ interactiveSection }) {
  const { t, i18n } = useTranslation();
  const [stats, setStats] = useState(null);
  const [chartData, setChartData] = useState(null);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [closedTradesPage, setClosedTradesPage] = useState(0);
  const [closedTradesTotal, setClosedTradesTotal] = useState(0);
  const [momentumPairs, setMomentumPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [refreshing, setRefreshing] = useState(false);
  const [dbTradeCount, setDbTradeCount] = useState(null);
  const [config, setConfig] = useState(null);
  const [totalCapital, setTotalCapital] = useState(null);
  const [includeFeesInCapital, setIncludeFeesInCapital] = useState(() => {
    const saved = localStorage.getItem("includeFeesInCapital");
    return saved !== null ? saved === "true" : false;
  });
  const [totalFees, setTotalFees] = useState(0);
  const [brokerMode, setBrokerMode] = useState(null);
  const [apiUnavailable, setApiUnavailable] = useState(false);
  const [openTradesExpanded, setOpenTradesExpanded] = useState(false);
  const [openTradesSticky, setOpenTradesSticky] = useState(false);
  const openTradesSummaryRef = useRef(null);
  const closedTradesRequestRef = useRef(0);
  const closedTradesPageRef = useRef(closedTradesPage);
  const { timeZone } = useContext(TimeZoneContext);
  const { currency: capitalCurrency, setCurrency: setCapitalCurrency } =
    useContext(CurrencyContext);
  const openTradeSummary = openTrades.reduce(
    (summary, trade) => {
      const side = String(trade.side || trade.positionSide || "").toLowerCase();
      const positionAmount = Number(trade.positionAmt);
      if (side.includes("long") || (!side.includes("short") && positionAmount > 0)) {
        summary.long += 1;
      } else if (side.includes("short") || positionAmount < 0) {
        summary.short += 1;
      }
      summary.unrealizedPnl +=
        Number(trade.unrealizedProfit ?? trade.unRealizedProfit) || 0;
      return summary;
    },
    { long: 0, short: 0, unrealizedPnl: 0 },
  );
  const openTradePnlSign =
    openTradeSummary.unrealizedPnl > 0
      ? "+"
      : openTradeSummary.unrealizedPnl < 0
        ? "-"
        : "";
  const openTradePnl = `${openTradePnlSign}${formatCurrency(
    convertFromUSDT(Math.abs(openTradeSummary.unrealizedPnl), capitalCurrency),
    capitalCurrency,
  )}`;
  const openTradePnlLabel = t("dashboard.openTradePnl", {
    amount: "__OPEN_TRADE_PNL__",
  });
  const [openTradePnlPrefix, openTradePnlSuffix] =
    openTradePnlLabel.split("__OPEN_TRADE_PNL__");

  const clearDashboardData = useCallback(() => {
    setStats(null);
    setChartData(null);
    setOpenTrades([]);
    setClosedTrades([]);
    setClosedTradesTotal(0);
    setMomentumPairs([]);
    setDbTradeCount(null);
    setConfig(null);
    setTotalCapital(null);
    setTotalFees(0);
    setBrokerMode(null);
    setLastUpdate(null);
  }, []);

  // Fetch global (stats, closed, momentum)
  const fetchAll = useCallback(async () => {
    setRefreshing(true);
    try {
      const [
        chartDataResponse,
        closedPage,
        openData,
        momentumData,
        configData,
        capitalUsdt,
        commissionData,
      ] = await Promise.all([
        getChartData(timeZone),
        getClosedTradesPage(closedTradesPageRef.current + 1),
        getOpenTrades(),
        getMomentumPairs(),
        getConfig(),
        getCapital(),
        getCommissionRate(),
      ]);
      setChartData(chartDataResponse || null);
      setStats(chartDataResponse?.stats || null);
      setClosedTrades(closedPage?.trades || []);
      setClosedTradesTotal(closedPage?.total || 0);
      setOpenTrades(openData?.open_trades || []);
      setMomentumPairs(momentumData?.momentum_pairs || []);
      setDbTradeCount(configData?.database?.total || null);
      setConfig(configData || null);
      setTotalCapital(capitalUsdt ?? null);
      setBrokerMode(commissionData?.broker_mode || null);

      if (chartDataResponse) {
        setTotalFees(chartDataResponse.total_fees || 0);
      } else {
        setTotalFees(0);
      }

      const selectedCurrency = localStorage.getItem("capitalCurrency") || "USDT";
      setCapitalCurrency(selectedCurrency);
      setLastUpdate(new Date());
      setApiUnavailable(
        !chartDataResponse ||
          !closedPage ||
          !openData ||
          !momentumData ||
          !configData ||
          capitalUsdt == null ||
          !commissionData,
      );
    } catch (error) {
      console.error("Dashboard data refresh failed:", error);
      clearDashboardData();
      setApiUnavailable(true);
    } finally {
      setRefreshing(false);
    }
  }, [clearDashboardData, setCapitalCurrency, timeZone]);

  // Primer fetch global al montar
  useEffect(() => {
    setLoading(true);
    fetchAll().finally(() => setLoading(false));
  }, [fetchAll]);

  // Listener para cambios en la moneda del capital
  useEffect(() => {
    const handleStorageChange = (e) => {
      if (e.key === "capitalCurrency") {
        const newCurrency = e.newValue || "USDT";
        setCapitalCurrency(newCurrency);
      }
    };

    window.addEventListener("storage", handleStorageChange);
    // También escuchar cambios en la misma ventana usando un evento personalizado
    const handleCurrencyChange = (e) => {
      const newCurrency = e.detail || "USDT";
      setCapitalCurrency(newCurrency);
    };

    window.addEventListener("currencyChange", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChange", handleCurrencyChange);
    };
  }, [setCapitalCurrency]);

  // Auto-refresh de open trades cada 10s
  useEffect(() => {
    let isMounted = true;

    const fetchOpen = async () => {
      try {
        const [openData, configData, capitalUsdt, commissionData] =
          await Promise.all([
            getOpenTrades(),
            getConfig(),
            getCapital(),
            getCommissionRate(),
          ]);
        if (!isMounted) return;

          const apiOffline =
            !openData && !configData && capitalUsdt == null && !commissionData;
          if (apiOffline) {
            clearDashboardData();
          } else {
            setOpenTrades(openData?.open_trades || []);
            setDbTradeCount(configData?.database?.total || null);
            setConfig(configData || null);
            setTotalCapital(capitalUsdt ?? null);
            setBrokerMode(commissionData?.broker_mode || null);
          }
          setApiUnavailable(
            !openData ||
            !configData ||
            capitalUsdt == null ||
            !commissionData,
        );
      } catch (error) {
        console.error("Open trade refresh failed:", error);
        if (isMounted) {
          clearDashboardData();
          setApiUnavailable(true);
        }
      }
    };

    const id = setInterval(fetchOpen, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [clearDashboardData]);

  // Reintenta pronto si stats/closed trades no están disponibles; reduce tráfico cuando todo carga.
  useEffect(() => {
    let isMounted = true;
    let refreshTimer;

    const fetchClosedTrades = async () => {
      let nextRefreshDelay = 5000;
      try {
        const [chartDataResponse, closedPage, commissionData] = await Promise.all([
          getChartData(timeZone),
          getClosedTradesPage(closedTradesPage + 1),
          getCommissionRate(),
        ]);
        if (!isMounted) return;

        const refreshComplete = Boolean(
          chartDataResponse && closedPage && commissionData,
        );
        if (refreshComplete) nextRefreshDelay = 60000;

        const apiOffline =
          !chartDataResponse && !closedPage && !commissionData;
        if (apiOffline) {
          clearDashboardData();
        } else {
          setChartData(chartDataResponse || null);
          setStats(chartDataResponse?.stats || null);
          setClosedTrades(closedPage?.trades || []);
          setClosedTradesTotal(closedPage?.total || 0);
          setBrokerMode(commissionData?.broker_mode || null);
        }

        if (chartDataResponse) {
          setTotalFees(chartDataResponse.total_fees || 0);
        } else if (!apiOffline) {
          setTotalFees(0);
        }

        if (!apiOffline) setLastUpdate(new Date());
        setApiUnavailable(
          !chartDataResponse || !closedPage || !commissionData,
        );
      } catch (error) {
        console.error("Closed trade refresh failed:", error);
        if (isMounted) {
          clearDashboardData();
          setApiUnavailable(true);
        }
      } finally {
        if (isMounted) {
          refreshTimer = setTimeout(fetchClosedTrades, nextRefreshDelay);
        }
      }
    };

    refreshTimer = setTimeout(fetchClosedTrades, 10000);
    return () => {
      isMounted = false;
      clearTimeout(refreshTimer);
    };
  }, [clearDashboardData, closedTradesPage, timeZone]);

  const handleClosedTradesPageChange = async (_event, newPage) => {
    const previousPage = closedTradesPageRef.current;
    closedTradesPageRef.current = newPage;
    setClosedTradesPage(newPage);
    const requestId = ++closedTradesRequestRef.current;
    const response = await getClosedTradesPage(newPage + 1);
    if (requestId !== closedTradesRequestRef.current) return;
    if (!response) {
      closedTradesPageRef.current = previousPage;
      setClosedTradesPage(previousPage);
      setApiUnavailable(true);
      return;
    }
    setClosedTrades(response.trades || []);
    setClosedTradesTotal(response.total || 0);
  };

  return (
    <Box className="dashboard-page" py={{ xs: 2, sm: 3, md: 4 }}>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          flexWrap: "wrap",
          gap: 2,
        }}
      >
        <Box>
          <Typography
            variant="caption"
            color="secondary"
            sx={{ display: "block" }}
          >
            {t("dashboard.lastUpdate")}:{" "}
            {lastUpdate
              ? lastUpdate.toLocaleTimeString(i18n.resolvedLanguage)
              : "-"}
            {refreshing && (
              <span style={{ marginLeft: 8 }}>{t("dashboard.updating")}</span>
            )}
          </Typography>
        </Box>
        {brokerMode === "paper" && (
          <Tooltip title={t("dashboard.feesTooltip")}>
            <FormControlLabel
              control={
                <Switch
                  checked={includeFeesInCapital}
                  onChange={(e) => {
                    const newValue = e.target.checked;
                    setIncludeFeesInCapital(newValue);
                    localStorage.setItem(
                      "includeFeesInCapital",
                      String(newValue),
                    );
                  }}
                />
              }
              label={
                <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                  <Typography variant="body2" sx={{ color: "text.secondary" }}>
                    {t("dashboard.includeFees")}
                  </Typography>
                  <InfoIcon sx={{ fontSize: "1rem", color: "var(--muted)" }} />
                </Box>
              }
            />
          </Tooltip>
        )}
      </Box>

      {!loading && !stats && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("dashboard.statsError")}
        </Alert>
      )}
      {!loading && apiUnavailable && (
        <div className="api-notice" role="status">
          <WifiOff size={16} />
          <span>{t("dashboard.apiUnavailable")}</span>
          <RefreshCw size={14} className="notice-icon" />
        </div>
      )}

      <DashboardMetrics
        totalCapital={totalCapital}
        stats={stats}
        openTrades={openTrades}
        currency={capitalCurrency}
        brokerMode={brokerMode}
        includeFees={includeFeesInCapital}
        totalFees={totalFees}
        apiUnavailable={apiUnavailable}
        loading={loading}
      />

      <Box className="dashboard-section dashboard-performance">
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 8 }} sx={{ minWidth: 0 }}>
            <EquityChart
              seriesData={chartData?.equity}
              loading={loading}
              showDrawdown={false}
              timeZone={timeZone}
              currency={capitalCurrency}
              height={400}
            />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }} sx={{ minWidth: 0 }}>
            <TradePerformanceTable
              performanceSummary={chartData?.performance}
              winrates={stats?.winrates}
              stats={stats}
              currency={capitalCurrency}
              hideDescription
              loading={loading}
            />
          </Grid>
        </Grid>
      </Box>

      <Box className="dashboard-section dashboard-open-positions">
        <Accordion
          className="operations-table__open-trades-accordion"
          expanded={openTradesExpanded}
          onChange={(_, expanded) => setOpenTradesExpanded(expanded)}
        >
          <AccordionSummary
            ref={openTradesSummaryRef}
            className={
              openTradesSticky ? "trade-summary-source--disabled" : undefined
            }
            aria-disabled={openTradesSticky || undefined}
            tabIndex={openTradesSticky ? -1 : undefined}
            expandIcon={<ExpandMoreIcon />}
            aria-label={t("dashboard.openTrades")}
            aria-describedby="open-trades-summary"
          >
            <Box className="dashboard-open-summary">
              <Typography>{t("dashboard.openTrades")}</Typography>
              <Box className="dashboard-open-summary-details">
                {loading ? (
                  <Box
                    role="status"
                    aria-label={t("dashboard.loading")}
                    sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
                  >
                    {[44, 38, 42, 88].map((width) => (
                      <Skeleton
                        key={width}
                        variant="text"
                        width={width}
                        aria-hidden="true"
                      />
                    ))}
                  </Box>
                ) : (
                  <>
                    <span>
                      {t("dashboard.openTradeCount", { count: openTrades.length })}
                    </span>
                    <span>{t("dashboard.openTradeLong", { count: openTradeSummary.long })}</span>
                    <span>{t("dashboard.openTradeShort", { count: openTradeSummary.short })}</span>
                    <span
                      className={[
                        "dashboard-open-pnl",
                        openTradeSummary.unrealizedPnl > 0 && "performance-win",
                        openTradeSummary.unrealizedPnl < 0 && "performance-loss",
                      ]
                        .filter(Boolean)
                        .join(" ")}
                    >
                      {openTradePnlPrefix}
                      <span
                        key={`${openTradeSummary.unrealizedPnl}-${capitalCurrency}`}
                        className="dashboard-value-update"
                      >
                        {openTradePnl}
                      </span>
                      {openTradePnlSuffix}
                    </span>
                  </>
                )}
              </Box>
              <Typography
                id="open-trades-summary"
                component="span"
                className="sr-only"
              >
                {t("dashboard.openTradesSummary", {
                  count: openTrades.length,
                  long: openTradeSummary.long,
                  short: openTradeSummary.short,
                  pnl: openTradePnl,
                })}
              </Typography>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <OperationsTable
              operations={openTrades}
              timeZone={timeZone}
              isOpenTrades
              binanceCount={openTrades.length}
              dbCount={dbTradeCount}
              config={config}
              dataLoading={loading}
            />
          </AccordionDetails>
        </Accordion>
        <StickyTradeSummary
          anchorRef={openTradesSummaryRef}
          expanded={openTradesExpanded}
          label={t("dashboard.openTradesSummary", {
            count: openTrades.length,
            long: openTradeSummary.long,
            short: openTradeSummary.short,
            pnl: openTradePnl,
          })}
          onVisibilityChange={setOpenTradesSticky}
        >
          <Box className="dashboard-open-summary-details">
            {loading ? (
              <Box
                role="status"
                aria-label={t("dashboard.loading")}
                sx={{ display: "inline-flex", alignItems: "center", gap: 1 }}
              >
                {[44, 38, 42, 88].map((width) => (
                  <Skeleton
                    key={width}
                    variant="text"
                    width={width}
                    aria-hidden="true"
                  />
                ))}
              </Box>
            ) : (
              <>
                <span>{t("dashboard.openTradeCount", { count: openTrades.length })}</span>
                <span>{t("dashboard.openTradeLong", { count: openTradeSummary.long })}</span>
                <span>{t("dashboard.openTradeShort", { count: openTradeSummary.short })}</span>
                <span
                  className={[
                    "dashboard-open-pnl",
                    openTradeSummary.unrealizedPnl > 0 && "performance-win",
                    openTradeSummary.unrealizedPnl < 0 && "performance-loss",
                  ]
                    .filter(Boolean)
                    .join(" ")}
                >
                  {openTradePnlPrefix}
                  <span
                    key={`${openTradeSummary.unrealizedPnl}-${capitalCurrency}`}
                    className="dashboard-value-update"
                  >
                    {openTradePnl}
                  </span>
                  {openTradePnlSuffix}
                </span>
              </>
            )}
          </Box>
        </StickyTradeSummary>
      </Box>

      {interactiveSection}

      <Box className="dashboard-section dashboard-history">
        <Accordion sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>{t("dashboard.history")}</Typography>
          </AccordionSummary>
          <AccordionDetails>
            <OperationsTable
              operations={closedTrades}
              title={t("dashboard.closedTrades")}
              timeZone={timeZone}
              dataLoading={loading}
            />
            {closedTradesTotal > 0 && (
              <TablePagination
                component="div"
                count={closedTradesTotal}
                page={closedTradesPage}
                rowsPerPage={50}
                rowsPerPageOptions={[50]}
                onPageChange={handleClosedTradesPageChange}
              />
            )}
          </AccordionDetails>
        </Accordion>
        <MomentumPairsTable
          pairs={momentumPairs}
          title={t("dashboard.momentumPairs")}
          openTrades={openTrades}
          timeZone={timeZone}
        />
      </Box>
    </Box>
  );
}
