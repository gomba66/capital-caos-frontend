import React, { useEffect, useState, useContext } from "react";
import { getStats } from "../api/stats";
import { getOperations } from "../api/operations";
import { getOpenTrades } from "../api/openTrades";
import { getMomentumPairs } from "../api/momentumPairs";
import { getConfig } from "../api/config";
import { getCapital } from "../api/capital";
import {
  convertFromUSDT,
  formatCurrency,
  getCurrencySymbol,
} from "../utils/currencyConverter";
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Tooltip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import WarningIcon from "@mui/icons-material/Warning";
import OperationsTable from "../components/OperationsTable";
import MomentumPairsTable from "../components/MomentumPairsTable";
import EquityChart from "../components/charts/EquityChart";
import ProfitFactorChart from "../components/charts/ProfitFactorChart";
import WinrateChart from "../components/charts/WinrateChart";
import { DateTime } from "luxon";
import { TimeZoneContext } from "../contexts/AppContexts";

const statLabels = {
  total_pnl: "Total PnL",
  unrealized_pnl: "Unrealized PnL",
};

// const commonTimeZones = [
//   "UTC",
//   "America/Bogota",
//   "America/Mexico_City",
//   "America/New_York",
//   "Europe/Madrid",
//   "Europe/London",
//   "Asia/Tokyo",
//   "Asia/Shanghai",
//   "America/Argentina/Buenos_Aires",
// ];

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [momentumPairs, setMomentumPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [prevOpenTrades, setPrevOpenTrades] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [dbTradeCount, setDbTradeCount] = useState(null);
  const [config, setConfig] = useState(null);
  const [totalCapital, setTotalCapital] = useState(1);
  const [capitalCurrency, setCapitalCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });
  const [simplifiedView, setSimplifiedView] = useState(() => {
    const saved = localStorage.getItem("simplifiedView");
    return saved === "true";
  });
  const [closedTradesLimit, setClosedTradesLimit] = useState(() => {
    const saved = localStorage.getItem("closedTradesLimit");
    return saved === "all" ? null : parseInt(saved) || 50;
  });
  // const localZone = DateTime.local().zoneName;
  const { timeZone } = useContext(TimeZoneContext);

  // Fetch global (stats, closed, momentum)
  const fetchAll = async (limitOverride = undefined) => {
    setRefreshing(true);
    // Use limitOverride if provided, otherwise use state value
    const effectiveLimit =
      limitOverride !== undefined ? limitOverride : closedTradesLimit;
    const [
      statsData,
      opsData,
      openData,
      momentumData,
      configData,
      capitalUsdt,
    ] = await Promise.all([
      getStats(),
      getOperations(effectiveLimit),
      getOpenTrades(),
      getMomentumPairs(),
      getConfig(),
      getCapital(),
    ]);
    setStats(statsData);
    setClosedTrades(opsData?.closed || []);
    setOpenTrades(openData?.open_trades || []);
    setMomentumPairs(momentumData?.momentum_pairs || []);
    setDbTradeCount(configData?.database?.total || null);
    setConfig(configData);
    setTotalCapital(capitalUsdt);
    const selectedCurrency = localStorage.getItem("capitalCurrency") || "USDT";
    setCapitalCurrency(selectedCurrency);
    setLastUpdate(new Date());
    setRefreshing(false);
    setPrevOpenTrades(openData?.open_trades || []);
  };

  // Primer fetch global al montar
  useEffect(() => {
    setLoading(true);
    fetchAll().then(() => setLoading(false));
  }, []);

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
  }, []);

  // Auto-refresh solo de open trades cada 10s
  useEffect(() => {
    let isMounted = true;
    const fetchOpen = async () => {
      const [openData, configData, capitalUsdt] = await Promise.all([
        getOpenTrades(),
        getConfig(),
        getCapital(),
      ]);
      if (!isMounted) return;
      const newOpen = openData?.open_trades || [];
      setOpenTrades(newOpen);
      setDbTradeCount(configData?.database?.total || null);
      setConfig(configData);
      setTotalCapital(capitalUsdt);
      // Detectar si algún trade fue cerrado
      const prevIds = new Set(
        (prevOpenTrades || []).map((t) => t.symbol + t.side)
      );
      const newIds = new Set(newOpen.map((t) => t.symbol + t.side));
      // Si algún id de prevOpenTrades ya no está en newOpen, refrescar todo
      if ([...prevIds].some((id) => !newIds.has(id))) {
        fetchAll();
      } else {
        setPrevOpenTrades(newOpen);
      }
    };
    const id = setInterval(fetchOpen, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, [prevOpenTrades]);

  if (loading) {
    return (
      <Box
        display="flex"
        justifyContent="center"
        alignItems="center"
        minHeight="60vh"
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!stats) {
    return <Typography color="error">Failed to load stats.</Typography>;
  }

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "#2de2e6",
          fontWeight: 700,
          textShadow: "0 0 8px #2de2e6",
          letterSpacing: 1,
          fontSize: { xs: "1.5rem", sm: "2rem", md: "2.125rem" },
        }}
      >
        Trading Dashboard
      </Typography>
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
        <Typography
          variant="caption"
          color="secondary"
          sx={{ display: "block" }}
        >
          Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "-"}
          {refreshing && <span style={{ marginLeft: 8 }}>Actualizando...</span>}
        </Typography>
        <FormControlLabel
          control={
            <Switch
              checked={simplifiedView}
              onChange={(e) => {
                const newValue = e.target.checked;
                setSimplifiedView(newValue);
                localStorage.setItem("simplifiedView", String(newValue));
              }}
              sx={{
                "& .MuiSwitch-switchBase.Mui-checked": {
                  color: "#2de2e6",
                },
                "& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": {
                  backgroundColor: "#2de2e6",
                },
              }}
            />
          }
          label={
            <Typography variant="body2" sx={{ color: "#aaa" }}>
              Simplified View
            </Typography>
          }
        />
        <Box sx={{ ml: 3, display: "flex", alignItems: "center", gap: 1 }}>
          <Typography variant="body2" sx={{ color: "#aaa" }}>
            Closed Trades:
          </Typography>
          <select
            value={closedTradesLimit === null ? "all" : closedTradesLimit}
            onChange={(e) => {
              const newValue = e.target.value;
              const limit = newValue === "all" ? null : parseInt(newValue);
              setClosedTradesLimit(limit);
              localStorage.setItem("closedTradesLimit", newValue);
              // Pass the new limit directly to fetchAll to avoid stale state
              fetchAll(limit);
            }}
            style={{
              backgroundColor: "#1e1e1e",
              color: "#aaa",
              border: "1px solid #444",
              borderRadius: "4px",
              padding: "4px 8px",
              fontSize: "14px",
            }}
          >
            <option value="50">Recent 50</option>
            <option value="100">Recent 100</option>
            <option value="200">Recent 200</option>
            <option value="all">All</option>
          </select>
        </Box>
      </Box>

      {/* Eliminar el selector de zona horaria aquí */}
      <Grid
        container
        spacing={{ xs: 3, sm: 3, md: 2, lg: 3, xl: 3 }}
        mb={4}
        justifyContent="space-between"
        sx={{
          maxWidth: simplifiedView
            ? { xs: "100%", sm: "100%", md: 1400, lg: 1600, xl: 1800 }
            : { xs: "100%", sm: "100%", md: 1600, lg: 1800, xl: 2000 },
          mx: "auto",
        }}
      >
        {/* Capital Total Box */}
        <Grid
          sx={{
            width: simplifiedView
              ? {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                }
              : {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
          }}
        >
          <Box
            sx={{
              background: "rgba(24,28,47,0.95)",
              borderRadius: 3,
              boxShadow:
                totalCapital === null
                  ? "0 0 16px rgba(255, 193, 7, 0.2)"
                  : "0 0 16px rgba(255, 215, 0, 0.3)",
              p: 3,
              textAlign: "center",
              minHeight: 110,
              minWidth: 125,
              maxWidth: simplifiedView
                ? { xs: "100%", sm: 400, md: 450, lg: 500, xl: 550 }
                : { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
              width: "100%",
              mx: "auto",
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: "center",
              transition: "box-shadow 0.2s",
              boxSizing: "border-box",
              "&:hover": {
                boxShadow:
                  totalCapital === null
                    ? "0 0 32px rgba(255, 193, 7, 0.4)"
                    : "0 0 32px rgba(255, 215, 0, 0.5)",
              },
            }}
          >
            <Typography
              variant="subtitle2"
              sx={{
                color: "#aaa",
                letterSpacing: 1,
                textTransform: "uppercase",
                fontWeight: 600,
                mb: 1,
              }}
            >
              Total Capital
            </Typography>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="center"
              gap={0.5}
              sx={{
                flexWrap: "wrap",
                maxWidth: "100%",
                width: "100%",
                boxSizing: "border-box",
              }}
            >
              {totalCapital === null && (
                <Tooltip
                  title="No se pudo obtener el capital total de Binance. Verifique la conexión con la API."
                  arrow
                  placement="top"
                >
                  <WarningIcon
                    sx={{
                      color: "#ffc107",
                      fontSize: "1.2rem",
                      filter: "drop-shadow(0 0 8px #ffc107)",
                      cursor: "help",
                      flexShrink: 0,
                    }}
                  />
                </Tooltip>
              )}
              <Typography
                variant="h4"
                sx={{
                  color: totalCapital === null ? "#ffc107" : "#ffd700",
                  fontWeight: 700,
                  textShadow:
                    totalCapital === null
                      ? "0 0 12px #ffc107"
                      : "0 0 12px rgba(255, 215, 0, 0.8)",
                  fontSize: "2.2rem",
                  lineHeight: 1.1,
                  wordBreak: "break-word",
                  flexShrink: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                {totalCapital !== null
                  ? formatCurrency(
                      convertFromUSDT(totalCapital, capitalCurrency),
                      capitalCurrency
                    )
                  : formatCurrency(0, "USDT")}
              </Typography>
            </Box>
          </Box>
        </Grid>
        {Object.entries(statLabels).map(([key, label]) => {
          // Colores para los valores destacados
          let valueColor = "#fff";
          let displayValue = stats[key] !== undefined ? stats[key] : "-";
          let textShadow = undefined;

          // Lógica especial para unrealized_pnl
          if (key === "unrealized_pnl") {
            const unrealizedPnl = openTrades.reduce((total, trade) => {
              const profit = Number(trade.unrealizedProfit) || 0;
              return total + profit;
            }, 0);

            // Asegurar que sea un número válido
            const numericPnl = Number(unrealizedPnl);
            if (!isNaN(numericPnl)) {
              const convertedPnl = convertFromUSDT(numericPnl, capitalCurrency);
              const symbol = getCurrencySymbol(capitalCurrency);
              displayValue =
                numericPnl !== 0
                  ? `${convertedPnl > 0 ? "+" : ""}${formatCurrency(
                      convertedPnl,
                      capitalCurrency
                    )}`
                  : formatCurrency(0, capitalCurrency);
              valueColor =
                numericPnl > 0
                  ? "#27ff7e"
                  : numericPnl < 0
                  ? "#ff2e63"
                  : "#fff";
            } else {
              displayValue = formatCurrency(0, capitalCurrency);
              valueColor = "#fff";
            }
            textShadow = `0 0 12px ${valueColor}`;
          } else if (key === "total_pnl") {
            const pnl = Number(stats[key]);
            if (!isNaN(pnl)) {
              const convertedPnl = convertFromUSDT(pnl, capitalCurrency);
              valueColor = pnl > 0 ? "#27ff7e" : pnl < 0 ? "#ff2e63" : "#fff";
              textShadow = `0 0 12px ${valueColor}`;
              displayValue = `${convertedPnl > 0 ? "+" : ""}${formatCurrency(
                convertedPnl,
                capitalCurrency
              )}`;
            } else {
              displayValue = "-";
              valueColor = "#fff";
            }
          }
          return (
            <Grid
              sx={{
                width: simplifiedView
                  ? {
                      xs: "100%",
                      sm: "calc((100% - 24px) / 2)",
                      md: "calc((100% - 32px) / 3)",
                      lg: "calc((100% - 48px) / 3)",
                      xl: "calc((100% - 48px) / 3)",
                    }
                  : {
                      xs: "100%",
                      sm: "calc((100% - 24px) / 2)",
                      md: "calc((100% - 32px) / 3)",
                      lg: "calc((100% - 48px) / 3)",
                      xl: "calc((100% - 48px) / 3)",
                    },
              }}
              key={key}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: `0 0 16px ${valueColor}33`,
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: simplifiedView
                    ? { xs: "100%", sm: 400, md: 450, lg: 500, xl: 550 }
                    : { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  boxSizing: "border-box",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: `0 0 32px ${valueColor}99`,
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  {label}
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: valueColor,
                    fontWeight: 700,
                    textShadow,
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {displayValue}
                </Typography>
              </Box>
            </Grid>
          );
        })}

        {!simplifiedView && (
          <>
            {/* Wins Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(45, 226, 230, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(45, 226, 230, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Wins
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#2de2e6",
                    fontWeight: 700,
                    textShadow: "0 0 12px #2de2e6",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.wins || 0}
                </Typography>
              </Box>
            </Grid>

            {/* Losses Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(255, 46, 99, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(255, 46, 99, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Losses
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#ff2e63",
                    fontWeight: 700,
                    textShadow: "0 0 12px #ff2e63",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.losses || 0}
                </Typography>
              </Box>
            </Grid>

            {/* Average PnL Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(45, 226, 230, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(45, 226, 230, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Average PnL
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#2de2e6",
                    fontWeight: 700,
                    textShadow: "0 0 12px #2de2e6",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.average_pnl !== undefined
                    ? formatCurrency(
                        convertFromUSDT(
                          Number(stats.average_pnl),
                          capitalCurrency
                        ),
                        capitalCurrency
                      )
                    : formatCurrency(0, capitalCurrency)}
                </Typography>
              </Box>
            </Grid>

            {/* Max Win Streak Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(39, 255, 126, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(39, 255, 126, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Max Win Streak
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#27ff7e",
                    fontWeight: 700,
                    textShadow: "0 0 12px #27ff7e",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.max_win_streak || 0}
                </Typography>
              </Box>
            </Grid>

            {/* Max Loss Streak Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(255, 46, 99, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(255, 46, 99, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Max Loss Streak
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#ff2e63",
                    fontWeight: 700,
                    textShadow: "0 0 12px #ff2e63",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.max_loss_streak || 0}
                </Typography>
              </Box>
            </Grid>

            {/* Total Trades Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
                  xl: "calc((100% - 48px) / 3)",
                },
              }}
            >
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: "0 0 16px rgba(255, 167, 38, 0.2)",
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
                  maxWidth: { xs: "100%", sm: 320, md: 380, lg: 420, xl: 480 },
                  width: "100%",
                  mx: "auto",
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "center",
                  alignItems: "center",
                  transition: "box-shadow 0.2s",
                  "&:hover": {
                    boxShadow: "0 0 32px rgba(255, 167, 38, 0.4)",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Total Trades
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: "#ffa726",
                    fontWeight: 700,
                    textShadow: "0 0 12px #ffa726",
                    fontSize: "2.2rem",
                    lineHeight: 1.1,
                  }}
                >
                  {stats?.total_trades || 0}
                </Typography>
              </Box>
            </Grid>
          </>
        )}
      </Grid>

      {/* Charts Section - Responsive Layout */}
      <Grid
        container
        spacing={simplifiedView ? 0 : 9}
        mb={4}
        justifyContent={simplifiedView ? "flex-start" : "center"}
        sx={{
          maxWidth: simplifiedView ? "100%" : "auto",
          width: "100%",
          px: simplifiedView ? 0 : 0,
        }}
      >
        {/* Equity Chart - Full width on mobile/tablet, 48% on desktop (or full width in simplified view) */}
        <Grid
          item
          xs={12}
          md={simplifiedView ? 12 : 6}
          sx={{
            width: simplifiedView ? "100%" : "auto",
            maxWidth: simplifiedView ? "100%" : "none",
          }}
        >
          <EquityChart
            operations={closedTrades}
            showDrawdown={false}
            timeZone={timeZone}
            currency={capitalCurrency}
            simplifiedView={simplifiedView}
          />
        </Grid>

        {!simplifiedView && (
          <>
            {/* Profit Factor Chart - Full width on mobile, 24% on tablet/desktop */}
            <Grid item xs={12} sm={6} md={3}>
              <ProfitFactorChart operations={closedTrades} hideDescription />
            </Grid>

            {/* Winrate Chart - Full width on mobile, 24% on tablet/desktop */}
            <Grid item xs={12} sm={6} md={3}>
              <WinrateChart winrates={stats?.winrates} hideDescription />
            </Grid>
          </>
        )}
      </Grid>

      <OperationsTable
        operations={openTrades}
        title="Open Trades"
        timeZone={timeZone}
        binanceCount={openTrades.length}
        dbCount={dbTradeCount}
        simplifiedView={simplifiedView}
        config={config}
      />
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Show Closed Trades</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <OperationsTable
            operations={closedTrades}
            title="Closed Trades"
            timeZone={timeZone}
            simplifiedView={simplifiedView}
          />
        </AccordionDetails>
      </Accordion>
      {!simplifiedView && (
        <MomentumPairsTable
          pairs={momentumPairs}
          title="Momentum Pairs"
          openTrades={openTrades}
          timeZone={timeZone}
        />
      )}
    </Box>
  );
}
