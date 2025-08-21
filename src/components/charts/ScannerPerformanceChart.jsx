import React, { useMemo } from "react";
import {
  Box,
  Typography,
  Paper,
  Grid,
  Chip,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  Timer,
  Speed,
  Assessment,
  Warning,
} from "@mui/icons-material";

const COLORS = {
  // Colores para wins/losses (exactamente igual que LongShortWinLossChart)
  win: "#2de2e6",
  loss: "#ff2e63",

  // Colores para diferentes scanners
  original: "#2de2e6",
  aggressive: "#ffe156",
  volume_momentum: "#ff6fff",
  breakout_momentum: "#ff2e63",
  ultra_optimized: "#3a86ff",
  weekly_performance: "#2de2a6",
};

// Estilos consistentes con otras gráficas
const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

const ScannerPerformanceChart = ({ operations = [] }) => {
  // Función para simplificar nombres de scanners
  const getSimplifiedScannerName = (scannerName) => {
    const nameMap = {
      original: "ORIGINAL",
      aggressive: "AGGRESSIVE",
      volume_momentum: "VOLUME",
      breakout_momentum: "BREAKOUT",
      ultra_optimized: "ULTRA",
      weekly_performance: "WEEKLY",
    };
    return nameMap[scannerName] || scannerName.toUpperCase();
  };

  const scannerData = useMemo(() => {
    if (!operations || operations.length === 0) return [];

    // Agrupar trades por scanner
    const scannerGroups = {};

    operations.forEach((trade) => {
      const scannerInfo = trade.scanner_info || {};
      const scanner = scannerInfo.scanner || "unknown";
      const scannerType = scannerInfo.scanner_type || "UNKNOWN";

      if (!scannerGroups[scanner]) {
        scannerGroups[scanner] = {
          scanner,
          scannerType,
          totalTrades: 0,
          wins: 0,
          losses: 0,
          totalPnL: 0,
          avgPnL: 0,
          totalTime: 0,
          avgTime: 0,
          longTrades: 0,
          shortTrades: 0,
          fastTrades: 0,
          breakoutTrades: 0,
          trades: [],
        };
      }

      const group = scannerGroups[scanner];
      group.totalTrades++;
      group.totalPnL += parseFloat(trade.pnl || 0);

      // Contar wins/losses
      if (parseFloat(trade.pnl || 0) > 0) {
        group.wins++;
      } else if (parseFloat(trade.pnl || 0) < 0) {
        group.losses++;
      }

      // Contar por tipo de trade
      const tradeType = trade.type || trade.side || "unknown";
      if (tradeType.toLowerCase().includes("long")) {
        group.longTrades++;
      } else if (tradeType.toLowerCase().includes("short")) {
        group.shortTrades++;
      }

      if (scannerType.toLowerCase().includes("fast")) {
        group.fastTrades++;
      } else if (scannerType.toLowerCase().includes("breakout")) {
        group.breakoutTrades++;
      }

      // Calcular tiempo en trade
      if (trade.openTime && trade.closeTime) {
        const openTime = new Date(trade.openTime);
        const closeTime = new Date(trade.closeTime);
        const timeInTrade = closeTime - openTime;
        group.totalTime += timeInTrade;
      }

      group.trades.push(trade);
    });

    // Calcular promedios y métricas
    Object.values(scannerGroups).forEach((group) => {
      group.avgPnL =
        group.totalTrades > 0 ? group.totalPnL / group.totalTrades : 0;
      group.avgTime =
        group.totalTrades > 0 ? group.totalTime / group.totalTrades : 0;
      group.winrate =
        group.totalTrades > 0 ? (group.wins / group.totalTrades) * 100 : 0;

      // Calcular profit factor correctamente
      if (group.losses > 0 && group.wins > 0) {
        const totalWins = group.trades
          .filter((t) => parseFloat(t.pnl || 0) > 0)
          .reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0);
        const totalLosses = Math.abs(
          group.trades
            .filter((t) => parseFloat(t.pnl || 0) < 0)
            .reduce((sum, t) => sum + parseFloat(t.pnl || 0), 0)
        );
        group.profitFactor = totalLosses > 0 ? totalWins / totalLosses : 0;
      } else {
        group.profitFactor = 0;
      }
    });

    return Object.values(scannerGroups).sort(
      (a, b) => b.totalTrades - a.totalTrades
    );
  }, [operations]);

  // Filtrar solo scanners que no sean "unknown" (trades sin scanner info)
  const validScannerData = useMemo(() => {
    return scannerData.filter((scanner) => scanner.scanner !== "unknown");
  }, [scannerData]);

  const chartData = useMemo(() => {
    return validScannerData.map((scanner) => ({
      name: scanner.scanner,
      totalTrades: scanner.totalTrades,
      wins: scanner.wins,
      losses: scanner.losses,
      avgPnL: scanner.avgPnL,
      winrate: scanner.winrate,
      profitFactor: scanner.profitFactor,
    }));
  }, [validScannerData]);

  const pieData = useMemo(() => {
    const totalTrades = validScannerData.reduce(
      (sum, scanner) => sum + scanner.totalTrades,
      0
    );
    return validScannerData.map((scanner) => ({
      name: scanner.scanner,
      value: scanner.totalTrades,
      percentage:
        totalTrades > 0
          ? ((scanner.totalTrades / totalTrades) * 100).toFixed(1)
          : 0,
    }));
  }, [validScannerData]);

  const formatTime = (milliseconds) => {
    if (!milliseconds || milliseconds <= 0) return "0m";

    const minutes = Math.floor(milliseconds / (1000 * 60));
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ${hours % 24}h`;
    if (hours > 0) return `${hours}h ${minutes % 60}m`;
    return `${minutes}m`;
  };

  const formatPnL = (pnl) => {
    if (pnl === 0) return "$0.00";
    const sign = pnl > 0 ? "+" : "";
    return `${sign}$${pnl.toFixed(2)}`;
  };

  if (!operations || operations.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No hay datos de operaciones para analizar
        </Typography>
      </Paper>
    );
  }

  if (validScannerData.length === 0) {
    return (
      <Paper sx={{ p: 3, textAlign: "center" }}>
        <Typography variant="h6" color="text.secondary">
          No hay información de scanner en las operaciones
        </Typography>
      </Paper>
    );
  }

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>
        📊 Rendimiento por Scanner
      </Typography>

      <Grid container spacing={3}>
        {/* Gráfico de barras - Wins vs Losses por Scanner */}
        <Grid item xs={12} md={9}>
          <Paper sx={{ p: 2, background: "#181c2f" }}>
            <Typography variant="subtitle1" gutterBottom>
              Wins vs Losses por Scanner
            </Typography>
            <ResponsiveContainer width="100%" minWidth={600} height={250}>
              <BarChart
                data={chartData}
                margin={{ top: 25, right: 30, left: 20, bottom: 45 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="name"
                  tick={{ ...axisStyle, fontSize: 11 }}
                  axisLine={{ stroke: "#2de2e6" }}
                  tickFormatter={(value) => getSimplifiedScannerName(value)}
                  angle={-15}
                  textAnchor="end"
                  height={40}
                />
                <YAxis
                  allowDecimals={false}
                  tick={axisStyle}
                  axisLine={{ stroke: "#2de2e6" }}
                />
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#2de2e6", fontWeight: 700 }}
                  itemStyle={{ color: "#fff" }}
                  cursor={false}
                  formatter={(value, name) => [
                    name === "wins" ? `${value} wins` : `${value} losses`,
                    name === "wins" ? "Wins" : "Losses",
                  ]}
                  labelFormatter={(label) => `Scanner: ${label}`}
                />
                <Legend
                  verticalAlign="top"
                  height={45}
                  wrapperStyle={{ color: "#fff" }}
                  formatter={(value, entry) => {
                    if (entry.dataKey === "wins") {
                      return <span style={{ color: COLORS.win }}>Wins</span>;
                    }
                    if (entry.dataKey === "losses") {
                      return <span style={{ color: COLORS.loss }}>Losses</span>;
                    }
                    return value;
                  }}
                />
                <Bar
                  dataKey="wins"
                  name="Wins"
                  fill={COLORS.win}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="wins"
                    position="top"
                    style={{ fill: "#fff", fontWeight: 700, fontSize: 12 }}
                  />
                </Bar>
                <Bar
                  dataKey="losses"
                  name="Losses"
                  fill={COLORS.loss}
                  radius={[4, 4, 0, 0]}
                >
                  <LabelList
                    dataKey="losses"
                    position="top"
                    style={{ fill: "#fff", fontWeight: 700, fontSize: 12 }}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Gráfico de pie - Distribución de trades por scanner */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, background: "#181c2f" }}>
            <Typography variant="subtitle1" gutterBottom>
              Distribución de Trades
            </Typography>
            <ResponsiveContainer width="100%" minWidth={220} height={250}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={90}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[entry.name] || COLORS.original}
                    />
                  ))}
                </Pie>
                <RechartsTooltip
                  contentStyle={tooltipStyle}
                  labelStyle={{ color: "#2de2e6", fontWeight: 700 }}
                  itemStyle={{ color: "#fff" }}
                  formatter={(value, name) => [
                    `${value} trades`,
                    getSimplifiedScannerName(name),
                  ]}
                  labelFormatter={(label) =>
                    `Scanner: ${getSimplifiedScannerName(label)}`
                  }
                />
                <Legend
                  verticalAlign="bottom"
                  height={50}
                  wrapperStyle={{ color: "#fff" }}
                  formatter={(value, entry) => (
                    <span
                      style={{
                        color: COLORS[entry.payload.name] || COLORS.original,
                        fontSize: "0.875rem",
                        fontWeight: 600,
                      }}
                    >
                      {getSimplifiedScannerName(value)}
                    </span>
                  )}
                />
              </PieChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        {/* Métricas detalladas por scanner */}
        <Grid item xs={12}>
          <Typography variant="subtitle1" gutterBottom sx={{ mb: 2 }}>
            📈 Métricas Detalladas por Scanner
          </Typography>
          <Grid
            container
            spacing={3}
            sx={{
              display: "flex",
              justifyContent: "space-between",
            }}
          >
            {validScannerData.map((scanner) => (
              <Grid
                item
                xs={12}
                md={6}
                key={scanner.scanner}
                sx={{
                  minWidth: 0,
                  flex: "1 1 0%",
                  maxWidth: "calc(50% - 12px)",
                }}
              >
                <Paper
                  sx={{
                    p: 3,
                    height: 200,
                    width: "100%",
                    minWidth: 0,
                    maxWidth: "100%",
                    flexShrink: 0,
                    border: `2px solid ${
                      scanner.winrate < 20
                        ? "#ff4444"
                        : COLORS[scanner.scanner] || COLORS.original
                    }`,
                    borderRadius: 2,
                    position: "relative",
                    boxShadow:
                      scanner.winrate < 20
                        ? "0 0 20px rgba(255, 68, 68, 0.3)"
                        : "none",
                  }}
                >
                  {/* Indicador de alerta para winrate bajo */}
                  {scanner.winrate < 20 && (
                    <Box
                      sx={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        zIndex: 1,
                      }}
                    >
                      <Tooltip title="Winrate muy bajo - requiere atención">
                        <Warning
                          sx={{
                            color: "#ff4444",
                            fontSize: "1.5rem",
                            filter:
                              "drop-shadow(0 0 8px rgba(255, 68, 68, 0.8))",
                          }}
                        />
                      </Tooltip>
                    </Box>
                  )}

                  <Box display="flex" alignItems="center" gap={1} mb={1}>
                    <Typography
                      variant="h6"
                      sx={{
                        fontWeight: "bold",
                        color: COLORS[scanner.scanner] || COLORS.original,
                        textShadow: "none",
                      }}
                    >
                      {scanner.scanner.toUpperCase()}
                    </Typography>
                    <Chip
                      label={scanner.scannerType}
                      size="small"
                      sx={{
                        background: `${
                          COLORS[scanner.scanner] || COLORS.original
                        }22`,
                        color: COLORS[scanner.scanner] || COLORS.original,
                        border: `1px solid ${
                          COLORS[scanner.scanner] || COLORS.original
                        }`,
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    />
                  </Box>

                  <Grid container spacing={1} sx={{ mb: 2 }}>
                    {/* Total Trades */}
                    <Grid item xs={6}>
                      <Box
                        textAlign="center"
                        sx={{ minWidth: 0, overflow: "hidden" }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: "#2de2e6",
                            fontWeight: 700,
                            textShadow: "none",
                            fontSize: "2rem",
                            lineHeight: 1,
                          }}
                        >
                          {scanner.totalTrades}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#bdbdbd" }}>
                          Total Trades
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Winrate */}
                    <Grid item xs={6}>
                      <Box
                        textAlign="center"
                        sx={{ minWidth: 0, overflow: "hidden" }}
                      >
                        <Typography
                          variant="h4"
                          sx={{
                            color: scanner.winrate < 20 ? "#ff4444" : "#ffffff",
                            fontWeight: 700,
                            textShadow: "none",
                            fontSize: "2rem",
                            lineHeight: 1,
                          }}
                        >
                          {scanner.winrate.toFixed(1)}%
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#bdbdbd" }}>
                          Winrate
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Wins vs Losses */}
                    <Grid item xs={12}>
                      <Box
                        display="flex"
                        justifyContent="space-between"
                        alignItems="center"
                        mt={1}
                        sx={{ mb: 2 }}
                      >
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <TrendingUp
                            sx={{ color: COLORS.win, fontSize: 16 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: COLORS.win, textShadow: "none" }}
                          >
                            {scanner.wins} wins
                          </Typography>
                        </Box>
                        <Box display="flex" alignItems="center" gap={0.5}>
                          <TrendingDown
                            sx={{ color: COLORS.loss, fontSize: 16 }}
                          />
                          <Typography
                            variant="body2"
                            sx={{ color: COLORS.loss, textShadow: "none" }}
                          >
                            {scanner.losses} losses
                          </Typography>
                        </Box>
                      </Box>
                    </Grid>

                    {/* PnL Promedio */}
                    <Grid item xs={6}>
                      <Box
                        textAlign="center"
                        sx={{ minWidth: 0, overflow: "hidden" }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color: scanner.avgPnL >= 0 ? "#2de2a6" : "#ff2e63",
                            fontWeight: 700,
                            textShadow: "none",
                            background: "transparent",
                            fontSize: "1.25rem",
                            lineHeight: 1,
                          }}
                        >
                          {formatPnL(scanner.avgPnL)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#bdbdbd" }}>
                          PnL Promedio
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Profit Factor */}
                    <Grid item xs={6}>
                      <Box
                        textAlign="center"
                        sx={{ minWidth: 0, overflow: "hidden" }}
                      >
                        <Typography
                          variant="h6"
                          sx={{
                            color:
                              scanner.profitFactor >= 1 ? "#2de2a6" : "#ff2e63",
                            fontWeight: 700,
                            textShadow: "none",
                            fontSize: "1.25rem",
                            lineHeight: 1,
                          }}
                        >
                          {scanner.profitFactor.toFixed(2)}
                        </Typography>
                        <Typography variant="caption" sx={{ color: "#bdbdbd" }}>
                          Profit Factor
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Tiempo Promedio */}
                    <Grid item xs={12}>
                      <Box
                        display="flex"
                        alignItems="center"
                        gap={0.5}
                        justifyContent="center"
                        mt={1}
                        sx={{ mb: 2 }}
                      >
                        <Timer sx={{ color: "#bdbdbd", fontSize: 16 }} />
                        <Typography
                          variant="body2"
                          sx={{ color: "#bdbdbd", textShadow: "none" }}
                        >
                          Tiempo promedio: {formatTime(scanner.avgTime)}
                        </Typography>
                      </Box>
                    </Grid>

                    {/* Tipos de Trade */}
                    <Grid item xs={12}>
                      <Box
                        display="flex"
                        flexWrap="wrap"
                        gap={0.5}
                        mt={1}
                        sx={{ mb: 1 }}
                      >
                        {scanner.longTrades > 0 && (
                          <Chip
                            label={`${scanner.longTrades} LONG`}
                            size="small"
                            sx={{
                              background: "#2de2a622",
                              color: "#2de2a6",
                              border: "1px solid #2de2a6",
                              fontWeight: 600,
                            }}
                          />
                        )}
                        {scanner.shortTrades > 0 && (
                          <Chip
                            label={`${scanner.shortTrades} SHORT`}
                            size="small"
                            sx={{
                              background: "#ff2e6322",
                              color: "#ff2e63",
                              border: "1px solid #ff2e63",
                              fontWeight: 600,
                            }}
                          />
                        )}
                        {scanner.fastTrades > 0 && (
                          <Chip
                            label={`${scanner.fastTrades} FAST`}
                            size="small"
                            sx={{
                              background: "#ff6fff22",
                              color: "#ff6fff",
                              border: "1px solid #ff6fff",
                              fontWeight: 600,
                            }}
                          />
                        )}
                        {scanner.breakoutTrades > 0 && (
                          <Chip
                            label={`${scanner.breakoutTrades} BREAKOUT`}
                            size="small"
                            sx={{
                              background: "#3a86ff22",
                              color: "#3a86ff",
                              border: "1px solid #3a86ff",
                              fontWeight: 600,
                            }}
                          />
                        )}
                      </Box>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Grid>
      </Grid>
    </Paper>
  );
};

export default ScannerPerformanceChart;
