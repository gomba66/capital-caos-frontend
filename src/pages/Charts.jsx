import React, { useEffect, useState, useContext } from "react";
import { getChartData } from "../api/chartData";
import { Alert, Box, CircularProgress, Typography } from "@mui/material";
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
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const { timeZone } = useContext(TimeZoneContext);
  const { currency } = useContext(CurrencyContext);

  useEffect(() => {
    let active = true;
    async function fetchChartData() {
      setLoading(true);
      const response = await getChartData(timeZone);
      if (active) {
        setChartData(response);
        setError(!response);
        setLoading(false);
      }
    }
    fetchChartData();
    return () => {
      active = false;
    };
  }, [timeZone]);

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
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("dashboard.apiUnavailable")}
        </Alert>
      )}

      {/* 1. Gráfica Principal (Equity) */}
      <EquityChart
        seriesData={chartData?.equity}
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
            performanceSummary={chartData?.performance}
            winrates={chartData?.stats?.winrates}
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
          <PnLHistogram summaryData={chartData?.pnlHistogram} />
          <LongShortWinLossChart
            summaryData={chartData?.longShortWinLoss}
          />
        </Box>
      </Box>

      {/* 3. Análisis Temporal (3 en fila) */}
      <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
        <WeeklyPerformanceChart
          summaryData={chartData?.weeklyPerformance}
          hasTrades={chartData?.hasTrades}
          timeZone={timeZone}
        />
        <MonthlyPerformanceChart
          summaryData={chartData?.monthlyPerformance}
          hasTrades={chartData?.hasTrades}
          timeZone={timeZone}
        />
        <WeeklyMonthlyPerformanceChart
          summaryData={chartData?.weeklyMonthlyPerformance}
          hasTrades={chartData?.hasTrades}
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
