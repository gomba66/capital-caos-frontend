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
    <Box p={4}>
      <Typography
        variant="h4"
        gutterBottom
        sx={{
          color: "#2de2e6",
          fontWeight: 700,
          textShadow: "0 0 8px #2de2e6",
          letterSpacing: 1,
        }}
      >
        Trading Dashboard
      </Typography>
      <Typography
        variant="caption"
        color="secondary"
        sx={{ mb: 2, display: "block" }}
      >
        Última actualización:{" "}
        {lastUpdate ? lastUpdate.toLocaleTimeString() : "-"}
        {refreshing && <span style={{ marginLeft: 8 }}>Actualizando...</span>}
      </Typography>
      <Grid container spacing={3} mb={4}>
        {Object.entries(statLabels).map(([key, label]) => (
          <Grid item xs={12} sm={6} md={3} key={key}>
            <Card>
              <CardContent>
                <Typography variant="subtitle2" color="textSecondary">
                  {label}
                </Typography>
                <Typography variant="h5">
                  {stats[key] !== undefined ? stats[key] : "-"}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
      <EquityChart operations={closedTrades} showDrawdown={false} />
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
