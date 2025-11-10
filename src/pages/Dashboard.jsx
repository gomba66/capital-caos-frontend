import React, { useEffect, useState, useContext } from "react";
import { getStats } from "../api/stats";
import { getOperations } from "../api/operations";
import { getOpenTrades } from "../api/openTrades";
import { getMomentumPairs } from "../api/momentumPairs";
import { getConfig } from "../api/config";
import { getCapital } from "../api/capital";
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
  const [totalCapital, setTotalCapital] = useState(1);
  const [simplifiedView, setSimplifiedView] = useState(true);
  // const localZone = DateTime.local().zoneName;
  const { timeZone } = useContext(TimeZoneContext);

  // Fetch global (stats, closed, momentum)
  const fetchAll = async () => {
    setRefreshing(true);
    const [statsData, opsData, openData, momentumData, configData, capital] =
      await Promise.all([
        getStats(),
        getOperations(),
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
    setTotalCapital(capital);
    setLastUpdate(new Date());
    setRefreshing(false);
    setPrevOpenTrades(openData?.open_trades || []);
  };

  // Primer fetch global al montar
  useEffect(() => {
    setLoading(true);
    fetchAll().then(() => setLoading(false));
  }, []);

  // Auto-refresh solo de open trades cada 10s
  useEffect(() => {
    let isMounted = true;
    const fetchOpen = async () => {
      const [openData, configData, capital] = await Promise.all([
        getOpenTrades(),
        getConfig(),
        getCapital(),
      ]);
      if (!isMounted) return;
      const newOpen = openData?.open_trades || [];
      setOpenTrades(newOpen);
      setDbTradeCount(configData?.database?.total || null);
      setTotalCapital(capital);
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
              onChange={(e) => setSimplifiedView(e.target.checked)}
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
      </Box>

      {/* Eliminar el selector de zona horaria aquí */}
      <Grid
        container
        spacing={{ xs: 3, sm: 3, md: 2, lg: 2 }}
        mb={4}
        justifyContent="space-between"
        sx={{
          maxWidth: simplifiedView ? 1200 : 1520,
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
                  lg: "calc((100% - 32px) / 3)",
                }
              : {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 32px) / 3)",
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
                  : "0 0 16px #2de2e633",
              p: 3,
              textAlign: "center",
              minHeight: 110,
              minWidth: 125,
              maxWidth: simplifiedView ? 400 : 320,
              width: simplifiedView ? "100%" : "100%",
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
                    : "0 0 32px #2de2e699",
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
                  color: totalCapital === null ? "#ffc107" : "#2de2e6",
                  fontWeight: 700,
                  textShadow:
                    totalCapital === null
                      ? "0 0 12px #ffc107"
                      : "0 0 12px #2de2e6",
                  fontSize: "2.2rem",
                  lineHeight: 1.1,
                  wordBreak: "break-word",
                  flexShrink: 1,
                  textAlign: "center",
                  whiteSpace: "nowrap",
                }}
              >
                ${totalCapital !== null ? totalCapital.toFixed(2) : "0.00"}
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
              displayValue =
                numericPnl !== 0
                  ? `${numericPnl > 0 ? "+" : ""}$${numericPnl.toFixed(2)}`
                  : "$0.00";
              valueColor =
                numericPnl > 0
                  ? "#27ff7e"
                  : numericPnl < 0
                  ? "#ff2e63"
                  : "#fff";
            } else {
              displayValue = "$0.00";
              valueColor = "#fff";
            }
            textShadow = `0 0 12px ${valueColor}`;
          } else if (key === "total_pnl") {
            const pnl = Number(stats[key]);
            if (!isNaN(pnl)) {
              valueColor = pnl > 0 ? "#27ff7e" : pnl < 0 ? "#ff2e63" : "#fff";
              textShadow = `0 0 12px ${valueColor}`;
              displayValue = `${pnl > 0 ? "+" : ""}$${pnl.toFixed(2)}`;
            } else {
              displayValue = "-";
              valueColor = "#fff";
            }
          }
          return (
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 48px) / 3)",
                  lg: "calc((100% - 48px) / 3)",
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
                  maxWidth: simplifiedView ? 400 : 320,
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
            {/* Wins / Losses Combined Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 32px) / 3)",
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
                  maxWidth: 320,
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
                  Wins / Losses
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#2de2e6",
                      fontWeight: 700,
                      textShadow: "0 0 12px #2de2e6",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.wins || 0}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666", fontWeight: 400 }}
                  >
                    /
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#ff2e63",
                      fontWeight: 700,
                      textShadow: "0 0 12px #ff2e63",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.losses || 0}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Max Win Streak / Max Loss Streak Combined Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 32px) / 3)",
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
                  maxWidth: 320,
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
                  Max Streaks
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#27ff7e",
                      fontWeight: 700,
                      textShadow: "0 0 12px #27ff7e",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.max_win_streak || 0}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666", fontWeight: 400 }}
                  >
                    /
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#ff2e63",
                      fontWeight: 700,
                      textShadow: "0 0 12px #ff2e63",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.max_loss_streak || 0}
                  </Typography>
                </Box>
              </Box>
            </Grid>

            {/* Total Trades / Average PnL Combined Box */}
            <Grid
              sx={{
                width: {
                  xs: "100%",
                  sm: "calc((100% - 24px) / 2)",
                  md: "calc((100% - 32px) / 3)",
                  lg: "calc((100% - 32px) / 3)",
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
                  maxWidth: 320,
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
                  Trades / Avg PnL
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#ffa726",
                      fontWeight: 700,
                      textShadow: "0 0 12px #ffa726",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.total_trades || 0}
                  </Typography>
                  <Typography
                    variant="h6"
                    sx={{ color: "#666", fontWeight: 400 }}
                  >
                    /
                  </Typography>
                  <Typography
                    variant="h5"
                    sx={{
                      color: "#2de2e6",
                      fontWeight: 700,
                      textShadow: "0 0 12px #2de2e6",
                      fontSize: "1.8rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {stats?.average_pnl !== undefined
                      ? `$${Number(stats.average_pnl).toFixed(2)}`
                      : "$0.00"}
                  </Typography>
                </Box>
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
