import React, { useState, useEffect } from "react";
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
import {
  Paper,
  Typography,
  Box,
  CircularProgress,
  ToggleButtonGroup,
  ToggleButton,
  TextField,
  MenuItem,
} from "@mui/material";
import { useSymbolStatistics } from "../../hooks/useSymbolStatistics";
import { convertFromUSDT, formatCurrency } from "../../utils/currencyConverter";

/**
 * SymbolPnLChart - Displays historical total PnL per symbol
 * Shows symbols that have been traded historically with their cumulative PnL
 */
export default function SymbolPnLChart() {
  const { data: symbolStats, loading, error } = useSymbolStatistics();
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });
  const [sortOrder, setSortOrder] = useState("reliability"); // "desc", "asc", or "reliability"
  const [displayCount, setDisplayCount] = useState(20); // Number of symbols to show

  // Escuchar cambios en la moneda desde localStorage
  useEffect(() => {
    const handleStorageChange = () => {
      const newCurrency = localStorage.getItem("capitalCurrency") || "USDT";
      setCurrency(newCurrency);
    };

    const handleCurrencyChange = () => {
      handleStorageChange();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("currencyChange", handleCurrencyChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("currencyChange", handleCurrencyChange);
    };
  }, []);

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

  // Sort by total PnL based on selected order
  const sortedStats = [...symbolStats].sort((a, b) => {
    if (sortOrder === "reliability") {
      // Reliability score: considers trade count, win rate, and total PnL
      // Formula: (total_trades^0.5) * win_rate * total_pnl / 100
      // This gives more weight to symbols with more trades and higher win rates
      const scoreA =
        (Math.sqrt(a.total_trades) * a.win_rate * Math.abs(a.total_pnl)) / 100;
      const scoreB =
        (Math.sqrt(b.total_trades) * b.win_rate * Math.abs(b.total_pnl)) / 100;
      return scoreB - scoreA;
    } else if (sortOrder === "desc") {
      return b.total_pnl - a.total_pnl;
    } else {
      return a.total_pnl - b.total_pnl;
    }
  });

  // Display selected number of symbols
  const displayStats = sortedStats.slice(0, displayCount);

  // Prepare data for recharts with currency conversion
  const chartData = displayStats.map((stat) => {
    // Determine best direction
    const longPnl = stat.long_pnl || 0;
    const shortPnl = stat.short_pnl || 0;
    const bestDirection =
      longPnl > shortPnl ? "LONG" : shortPnl > longPnl ? "SHORT" : "BOTH";

    return {
      symbol: stat.symbol,
      totalPnL: convertFromUSDT(stat.total_pnl, currency),
      totalPnLUSDT: stat.total_pnl, // Keep original for tooltip
      winRate: stat.win_rate,
      totalTrades: stat.total_trades,
      winCount: stat.win_count,
      lossCount: stat.loss_count,
      avgPnL: convertFromUSDT(stat.avg_pnl, currency),
      avgPnLUSDT: stat.avg_pnl,
      longCount: stat.long_count || 0,
      shortCount: stat.short_count || 0,
      longPnL: convertFromUSDT(longPnl, currency),
      shortPnL: convertFromUSDT(shortPnl, currency),
      bestDirection: bestDirection,
    };
  });

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
            Total PnL: {data.totalPnLUSDT < 0 ? "-" : ""}
            {formatCurrency(Math.abs(data.totalPnL), currency)}
            {currency !== "USDT" && (
              <span style={{ color: "#aaa", marginLeft: 4 }}>({currency})</span>
            )}
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
            Total Trades: {data.totalTrades} ({data.longCount} L /{" "}
            {data.shortCount} S)
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Best Direction:{" "}
            <span style={{ color: "#2de2e6" }}>{data.bestDirection}</span>
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Long PnL: {formatCurrency(Math.abs(data.longPnL), currency)} | Short
            PnL: {formatCurrency(Math.abs(data.shortPnL), currency)}
          </Typography>
          <Typography
            variant="caption"
            sx={{ color: "#aaa", display: "block" }}
          >
            Avg PnL: {data.avgPnLUSDT < 0 ? "-" : ""}
            {formatCurrency(Math.abs(data.avgPnL), currency)}
            {currency !== "USDT" && (
              <span style={{ color: "#aaa", marginLeft: 4 }}>({currency})</span>
            )}
          </Typography>
        </Paper>
      );
    }
    return null;
  };

  // Calculate summary statistics with currency conversion
  const totalSymbols = symbolStats.length;
  const profitableSymbols = symbolStats.filter((s) => s.total_pnl > 0).length;
  const losingSymbols = symbolStats.filter((s) => s.total_pnl < 0).length;
  const totalPnL = symbolStats.reduce((sum, s) => sum + s.total_pnl, 0);
  const totalPnLConverted = convertFromUSDT(totalPnL, currency);

  return (
    <Paper sx={{ p: 3, backgroundColor: "#1a1a2e", minHeight: 400 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        mb={2}
      >
        <Typography variant="h6" sx={{ color: "#fff" }}>
          Historical PnL by Symbol
        </Typography>
        <Box display="flex" gap={2} alignItems="center">
          {/* Sort Order Toggle */}
          <ToggleButtonGroup
            value={sortOrder}
            exclusive
            onChange={(e, newOrder) => {
              if (newOrder !== null) setSortOrder(newOrder);
            }}
            size="small"
            sx={{
              "& .MuiToggleButton-root": {
                color: "#aaa",
                borderColor: "#2de2e6",
                backgroundColor: "transparent",
                "&:hover": {
                  backgroundColor: "rgba(45, 226, 230, 0.08)",
                  borderColor: "#2de2e6",
                },
                "&.Mui-selected": {
                  backgroundColor: "rgba(45, 226, 230, 0.2)",
                  color: "#2de2e6",
                  borderColor: "#2de2e6",
                  "&:hover": {
                    backgroundColor: "rgba(45, 226, 230, 0.3)",
                  },
                },
              },
            }}
          >
            <ToggleButton value="reliability">By Reliability</ToggleButton>
            <ToggleButton value="desc">Best PnL</ToggleButton>
            <ToggleButton value="asc">Worst PnL</ToggleButton>
          </ToggleButtonGroup>

          {/* Display Count Selector */}
          <TextField
            select
            value={displayCount}
            onChange={(e) => setDisplayCount(Number(e.target.value))}
            size="small"
            sx={{
              minWidth: 100,
              "& .MuiOutlinedInput-root": {
                color: "#fff",
                "& fieldset": {
                  borderColor: "#2de2e6",
                },
                "&:hover fieldset": {
                  borderColor: "#2de2e6",
                },
                "&.Mui-focused fieldset": {
                  borderColor: "#2de2e6",
                },
              },
              "& .MuiInputLabel-root": {
                color: "#aaa",
              },
            }}
          >
            <MenuItem value={10}>Top 10</MenuItem>
            <MenuItem value={20}>Top 20</MenuItem>
            <MenuItem value={50}>Top 50</MenuItem>
            <MenuItem value={100}>Top 100</MenuItem>
            <MenuItem value={symbolStats.length}>
              All ({symbolStats.length})
            </MenuItem>
          </TextField>
        </Box>
      </Box>

      {/* Summary Statistics */}
      <Box display="flex" gap={3} mb={3}>
        <Box display="flex" gap={3}>
          <Box
            textAlign="center"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "transparent",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Total Symbols
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#2de2e6", textShadow: "none" }}
            >
              {totalSymbols}
            </Typography>
          </Box>
          <Box
            textAlign="center"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "transparent",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Profitable
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#2de2a6", textShadow: "none" }}
            >
              {profitableSymbols}
            </Typography>
          </Box>
          <Box
            textAlign="center"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "transparent",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Losing
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "#ff2e63", textShadow: "none" }}
            >
              {losingSymbols}
            </Typography>
          </Box>
          <Box
            textAlign="center"
            sx={{
              px: 2,
              py: 1,
              backgroundColor: "transparent",
              borderRadius: 1,
            }}
          >
            <Typography variant="caption" sx={{ color: "#aaa" }}>
              Total PnL
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color:
                  totalPnL > 0 ? "#2de2a6" : totalPnL < 0 ? "#ff2e63" : "#aaa",
                textShadow: "none",
              }}
            >
              {totalPnL > 0 ? "+" : totalPnL < 0 ? "-" : ""}
              {formatCurrency(Math.abs(totalPnLConverted), currency)}
              {currency !== "USDT" && (
                <span
                  style={{ color: "#aaa", fontSize: "0.8em", marginLeft: 4 }}
                >
                  ({currency})
                </span>
              )}
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
              value: `PnL (${currency})`,
              angle: -90,
              position: "insideLeft",
              fill: "#aaa",
            }}
          />
          <Tooltip content={<CustomTooltip />} cursor={false} />
          <Bar
            dataKey="totalPnL"
            radius={[4, 4, 0, 0]}
            activeBar={{
              style: {
                filter:
                  "drop-shadow(0 0 16px #fff) drop-shadow(0 0 12px currentColor)",
                opacity: 1,
              },
            }}
          >
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
