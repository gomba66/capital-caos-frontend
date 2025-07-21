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

  // Auto-refresh cada 10 segundos
  useEffect(() => {
    let isMounted = true;
    async function fetchAll() {
      setLoading(true);
      const [statsData, opsData, openData, momentumData] = await Promise.all([
        getStats(),
        getOperations(),
        getOpenTrades(),
        getMomentumPairs(),
      ]);
      if (!isMounted) return;
      setStats(statsData);
      setClosedTrades(opsData?.closed || []);
      setOpenTrades(openData?.open_trades || []);
      setMomentumPairs(momentumData?.momentum_pairs || []);
      setLastUpdate(new Date());
      setLoading(false);
    }
    fetchAll();
    const id = setInterval(fetchAll, 10000);
    return () => {
      isMounted = false;
      clearInterval(id);
    };
  }, []);

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
