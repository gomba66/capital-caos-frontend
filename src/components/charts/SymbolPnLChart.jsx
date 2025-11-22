import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Paper, Typography, Box, CircularProgress } from "@mui/material";
import { useSymbolStatistics } from "../../hooks/useSymbolStatistics";

/**
 * SymbolPnLChart - Displays historical total PnL per symbol
 * Shows symbols that have been traded historically with their cumulative PnL
 */
export default function SymbolPnLChart() {
  const { data: symbolStats, loading, error } = useSymbolStatistics();

  // Si está cargando, mostrar loader
  if (loading) {
    return (
      <Paper sx={{ p: 3, backgroundColor: "#1a1a2e", minHeight: 400 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight={350}
        >
          <CircularProgress />
        </Box>
      </Paper>
    );
  }

  // Si hay error o no hay datos, mostrar mensaje informativo sin romper el UI
  if (error || !symbolStats || symbolStats.length === 0) {
    return (
      <Paper sx={{ p: 3, backgroundColor: "#1a1a2e", minHeight: 400 }}>
        <Typography variant="h6" gutterBottom sx={{ color: "#fff" }}>
          Historical PnL by Symbol
        </Typography>
        <Typography align="center" sx={{ color: "#aaa", mt: 4 }}>
          {error
            ? "Symbol statistics endpoint not available yet"
            : "No historical trading data available"}
        </Typography>
        <Typography
          align="center"
          sx={{ color: "#666", mt: 2, fontSize: "0.85rem" }}
        >
          This feature will be available once the backend is deployed
        </Typography>
      </Paper>
    );
  }

  // Sort by total PnL descending to show best performers first
  const sortedStats = [...symbolStats].sort(
    (a, b) => b.total_pnl - a.total_pnl
  );

  // Limit to top 20 symbols for better visualization
  const displayStats = sortedStats.slice(0, 20);

  // Prepare data for recharts
  const chartData = displayStats.map((stat) => ({
    symbol: stat.symbol,
    totalPnL: stat.total_pnl,
    winRate: stat.win_rate,
    totalTrades: stat.total_trades,
    winCount: stat.win_count,
    lossCount: stat.loss_count,
    avgPnL: stat.avg_pnl,
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Paper
          sx={{
            p: 1.5,
            backgroundColor: "rgba(0, 0, 0, 0.9)",
            border: "1px solid #2de2e6",
          }}
        >
          <Typography
            variant="body2"
            sx={{ color: "#2de2e6", fontWeight: 600 }}
          >
            {data.symbol}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#fff", display: "block" }}
          >
            Total PnL: {data.totalPnL.toFixed(2)} USDT
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Win Rate: {data.winRate.toFixed(1)}%
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Total Trades: {data.totalTrades}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Wins: {data.winCount} | Losses: {data.lossCount}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Avg PnL: {data.avgPnL.toFixed(2)} USDT
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Calculate summary statistics
  const totalSymbols = symbolStats.length;
  const profitableSymbols = symbolStats.filter((s) => s.total_pnl > 0).length;
  const losingSymbols = symbolStats.filter((s) => s.total_pnl < 0).length;
  const totalPnL = symbolStats.reduce((sum, s) => sum + s.total_pnl, 0);

  return (
    <Paper sx={{ p: 3, backgroundColor: "#1a1a2e", minHeight: 400 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ color: "#fff" }}>
          Historical PnL by Symbol (Top 20)
        </Typography>
        <Box display="flex" gap={3}>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Total Symbols
            </Typography>
            <Typography variant="h6" sx={{ color: "#2de2e6" }}>
              {totalSymbols}
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Profitable
            </Typography>
            <Typography variant="h6" sx={{ color: "#2de2a6" }}>
              {profitableSymbols}
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Losing
            </Typography>
            <Typography variant="h6" sx={{ color: "#ff2e63" }}>
              {losingSymbols}
            </Typography>
          </Box>
          <Box textAlign="center">
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Total PnL
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color:
                  totalPnL > 0 ? "#2de2a6" : totalPnL < 0 ? "#ff2e63" : "#aaa",
              }}
            >
              {totalPnL > 0 ? "+" : ""}
              {totalPnL.toFixed(2)} USDT
            </Typography>
          </Box>
        </Box>
      </Box>

      <ResponsiveContainer width="100%" height={400}>
        <BarChart
          data={chartData}
          margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
        >
          <CartesianGrid
            strokeDasharray="3 3"
            stroke="rgba(255, 255, 255, 0.05)"
          />
          <XAxis
            dataKey="symbol"
            angle={-45}
            textAnchor="end"
            height={80}
            tick={{ fill: "#aaa", fontSize: 11 }}
          />
          <YAxis
            tick={{ fill: "#aaa" }}
            label={{
              value: "PnL (USDT)",
              angle: -90,
              position: "insideLeft",
              fill: "#aaa",
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Bar dataKey="totalPnL" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell
                key={`cell-${index}`}
                fill={entry.totalPnL > 0 ? "#2de2a6" : "#ff2e63"}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>

      {sortedStats.length > 20 && (
        <Typography
          variant="caption"
          sx={{ color: "#aaa", mt: 2, display: "block" }}
        >
          Showing top 20 of {totalSymbols} symbols
        </Typography>
      )}
    </Paper>
  );
}
