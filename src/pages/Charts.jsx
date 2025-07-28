import React, { useEffect, useState, useContext } from "react";
import { getOperations } from "../api/operations";
import { Box, CircularProgress, Typography } from "@mui/material";
import EquityChart from "../components/charts/EquityChart";
import PnLHistogram from "../components/charts/PnLHistogram";
import WinrateChart from "../components/charts/WinrateChart";
import LongShortWinLossChart from "../components/charts/LongShortWinLossChart";
import ProfitFactorChart from "../components/charts/ProfitFactorChart";
import WeeklyPerformanceChart from "../components/charts/WeeklyPerformanceChart";
import MonthlyPerformanceChart from "../components/charts/MonthlyPerformanceChart";
import WeeklyMonthlyPerformanceChart from "../components/charts/WeeklyMonthlyPerformanceChart";
import { TimeZoneContext } from "../App";

export default function Charts() {
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);
  const { timeZone } = useContext(TimeZoneContext);

  useEffect(() => {
    async function fetchOps() {
      setLoading(true);
      const opsData = await getOperations();
      setClosedTrades(opsData?.closed || []);
      setLoading(false);
    }
    fetchOps();
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

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Advanced Charts
      </Typography>

      {/* 1. Gráfica Principal (Equity) */}
      <EquityChart operations={closedTrades} showDrawdown={true} />

      {/* 2. Métricas Clave (2x2 grid) */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap={4}
        justifyContent="center"
        sx={{ mb: 4 }}
      >
        <ProfitFactorChart operations={closedTrades} />
        <WinrateChart operations={closedTrades} />
        <PnLHistogram operations={closedTrades} />
        <LongShortWinLossChart operations={closedTrades} />
      </Box>

      {/* 3. Análisis Temporal (3 en fila) */}
      <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
        <WeeklyPerformanceChart operations={closedTrades} timeZone={timeZone} />
        <MonthlyPerformanceChart
          operations={closedTrades}
          timeZone={timeZone}
        />
        <WeeklyMonthlyPerformanceChart
          operations={closedTrades}
          timeZone={timeZone}
        />
      </Box>
    </Box>
  );
}
