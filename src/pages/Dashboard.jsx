import React, { useEffect, useState } from "react";
import { getStats } from "../api/stats";
import { getOperations } from "../api/operations";
import { getOpenTrades } from "../api/openTrades";
import { getMomentumPairs } from "../api/momentumPairs";
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
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import OperationsTable from "../components/OperationsTable";
import MomentumPairsTable from "../components/MomentumPairsTable";
import EquityChart from "../components/charts/EquityChart";
import ProfitFactorChart from "../components/charts/ProfitFactorChart";

const statLabels = {
  winrate: "Winrate (%)",
  total_trades: "Total Trades",
  wins: "Wins",
  losses: "Losses",
  total_pnl: "Total PnL",
  average_pnl: "Average PnL",
  max_win_streak: "Max Win Streak",
  max_loss_streak: "Max Loss Streak",
};

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [openTrades, setOpenTrades] = useState([]);
  const [closedTrades, setClosedTrades] = useState([]);
  const [momentumPairs, setMomentumPairs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [prevOpenTrades, setPrevOpenTrades] = useState([]);
  const [refreshing, setRefreshing] = useState(false);

  // Fetch global (stats, closed, momentum)
  const fetchAll = async () => {
    setRefreshing(true);
    const [statsData, opsData, openData, momentumData] = await Promise.all([
      getStats(),
      getOperations(),
      getOpenTrades(),
      getMomentumPairs(),
    ]);
    setStats(statsData);
    setClosedTrades(opsData?.closed || []);
    setOpenTrades(openData?.open_trades || []);
    setMomentumPairs(momentumData?.momentum_pairs || []);
    setLastUpdate(new Date());
    setRefreshing(false);
    setPrevOpenTrades(openData?.open_trades || []);
  };

  // Primer fetch global al montar
  useEffect(() => {
    setLoading(true);
    fetchAll().then(() => setLoading(false));
    // eslint-disable-next-line
  }, []);

  // Auto-refresh solo de open trades cada 10s
  useEffect(() => {
    let isMounted = true;
    const fetchOpen = async () => {
      const openData = await getOpenTrades();
      if (!isMounted) return;
      const newOpen = openData?.open_trades || [];
      setOpenTrades(newOpen);
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
    // eslint-disable-next-line
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
      <Typography
        variant="caption"
        color="secondary"
        sx={{ mb: 2, display: "block" }}
      >
        Last update: {lastUpdate ? lastUpdate.toLocaleTimeString() : "-"}
        {refreshing && <span style={{ marginLeft: 8 }}>Actualizando...</span>}
      </Typography>
      <Grid container spacing={3} mb={4} justifyContent="center">
        {Object.entries(statLabels).map(([key, label]) => {
          // Colores para los valores destacados
          let valueColor = "#fff";
          let displayValue = stats[key] !== undefined ? stats[key] : "-";
          let textShadow = undefined;
          if (key === "winrate" || key === "wins") valueColor = "#2de2e6";
          if (key === "average_pnl") {
            valueColor = "#2de2e6";
            const avgPnl = Number(stats[key]);
            if (!isNaN(avgPnl)) {
              displayValue = `$${avgPnl.toFixed(2)}`;
            }
          }
          if (key === "losses" || key === "max_loss_streak")
            valueColor = "#ff2e63";
          if (key === "total_pnl") {
            const pnl = Number(stats[key]);
            if (!isNaN(pnl)) {
              valueColor = pnl > 0 ? "#27ff7e" : pnl < 0 ? "#ff2e63" : "#fff";
              textShadow = `0 0 12px ${valueColor}`;
              displayValue = `${pnl > 0 ? "+" : ""}$${pnl.toFixed(2)}`;
            } else {
              displayValue = "-";
              valueColor = "#fff";
            }
          } else {
            textShadow = `0 0 12px ${valueColor}`;
          }
          return (
            <Grid item xs={12} sm={6} md={4} lg={3} key={key}>
              <Box
                sx={{
                  background: "rgba(24,28,47,0.95)",
                  borderRadius: 3,
                  boxShadow: `0 0 16px ${valueColor}33`,
                  p: 3,
                  textAlign: "center",
                  minHeight: 110,
                  minWidth: 125,
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
      </Grid>
      <Grid
        container
        spacing={2}
        direction="row"
        justifyContent="space-between"
      >
        <Grid item sx={{ minWidth: "65%", maxWidth: "100%" }}>
          <EquityChart operations={closedTrades} showDrawdown={false} />
        </Grid>

        <Grid
          item
          sx={{
            minWidth: "30%",
            maxWidth: "100%",
          }}
        >
          <ProfitFactorChart operations={closedTrades} hideDescription />
        </Grid>
      </Grid>
      <OperationsTable operations={openTrades} title="Open Trades" />
      <Accordion sx={{ mb: 2 }}>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography>Show Closed Trades</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <OperationsTable operations={closedTrades} title="Closed Trades" />
        </AccordionDetails>
      </Accordion>
      <MomentumPairsTable
        pairs={momentumPairs}
        title="Momentum Pairs"
        openTrades={openTrades}
      />
    </Box>
  );
}
