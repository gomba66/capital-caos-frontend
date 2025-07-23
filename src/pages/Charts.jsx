import React, { useEffect, useState } from "react";
import { getOperations } from "../api/operations";
import { Box, CircularProgress, Typography } from "@mui/material";
import EquityChart from "../components/charts/EquityChart";
import PnLHistogram from "../components/charts/PnLHistogram";
import WinrateChart from "../components/charts/WinrateChart";
import LongShortWinLossChart from "../components/charts/LongShortWinLossChart";
import ProfitFactorChart from "../components/charts/ProfitFactorChart";

export default function Charts() {
  const [closedTrades, setClosedTrades] = useState([]);
  const [loading, setLoading] = useState(true);

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
      <EquityChart operations={closedTrades} showDrawdown={true} />

      <Box display="flex" flexWrap="wrap" gap={4} justifyContent="center">
        <ProfitFactorChart operations={closedTrades} />
        <PnLHistogram operations={closedTrades} />
        <WinrateChart operations={closedTrades} />
        <LongShortWinLossChart operations={closedTrades} />
      </Box>
    </Box>
  );
}
