import React, { useEffect, useState, useContext } from "react";
import { getOperations } from "../api/operations";
import { getStats } from "../api/stats";
import { Box, CircularProgress, Typography } from "@mui/material";
import EquityChart from "../components/charts/EquityChart";
import PnLHistogram from "../components/charts/PnLHistogram";
import LongShortWinLossChart from "../components/charts/LongShortWinLossChart";
import TradePerformanceTable from "../components/charts/TradePerformanceTable";
import WeeklyPerformanceChart from "../components/charts/WeeklyPerformanceChart";
import MonthlyPerformanceChart from "../components/charts/MonthlyPerformanceChart";
import WeeklyMonthlyPerformanceChart from "../components/charts/WeeklyMonthlyPerformanceChart";
import SymbolPnLChart from "../components/charts/SymbolPnLChart";
import { TimeZoneContext, CurrencyContext } from "../contexts/AppContexts";
import { useTranslation } from "react-i18next";

export default function Charts() {
  const { t } = useTranslation();
  const [closedTrades, setClosedTrades] = useState([]);
  const [winrates, setWinrates] = useState(null);
  const [loading, setLoading] = useState(true);
  const { timeZone } = useContext(TimeZoneContext);
  const { currency } = useContext(CurrencyContext);

  useEffect(() => {
    async function fetchOps() {
      setLoading(true);
      // Obtener datos de ambos endpoints
      const [opsData, statsData] = await Promise.all([
        getOperations(),
        getStats(),
      ]);

      const closed = opsData?.closed || [];
      setClosedTrades(closed);

      // Usar winrates calculados en el backend (fuente única de verdad)
      setWinrates(statsData?.winrates || null);

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
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("chartsPage.advanced")}
      </Typography>

      {/* 1. Gráfica Principal (Equity) */}
      <EquityChart
        operations={closedTrades}
        showDrawdown={true}
        timeZone={timeZone}
        currency={currency}
      />

      {/* 2. Combined performance metrics */}
      <Box
        display="flex"
        flexWrap="wrap"
        gap={{ xs: 3, md: 5 }}
        alignItems="flex-start"
        justifyContent="space-between"
        sx={{ mb: 4 }}
      >
        <Box sx={{ width: { xs: "100%", md: "48%" }, minWidth: 0 }}>
          <TradePerformanceTable
            operations={closedTrades}
            winrates={winrates}
          />
        </Box>
        <Box
          sx={{
            width: { xs: "100%", md: "48%" },
            display: "flex",
            flexWrap: "wrap",
            gap: 2,
            alignItems: "flex-start",
            minWidth: 0,
          }}
        >
          <PnLHistogram operations={closedTrades} />
          <LongShortWinLossChart operations={closedTrades} />
        </Box>
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

      {/* 4. Análisis de Rendimiento por Símbolo */}
      <Box sx={{ mt: 4 }}>
        <SymbolPnLChart />
      </Box>
    </Box>
  );
}
