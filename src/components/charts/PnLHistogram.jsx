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
import { Typography, Box, Paper } from "@mui/material";

function buildHistogramData(operations, binSize = 5) {
  const pnls = (operations || [])
    .map((op) => Number(op.pnl || 0))
    .filter((x) => !isNaN(x));
  if (!pnls.length) return [];

  // Calcular estadísticas para determinar el rango apropiado
  const min = Math.min(...pnls);
  const max = Math.max(...pnls);
  const range = max - min;

  // Si el rango es muy grande, usar percentiles para limitar los bins
  let effectiveMin = min;
  let effectiveMax = max;

  if (range > 1000) {
    // Usar percentiles para evitar demasiados bins
    const sortedPnls = pnls.sort((a, b) => a - b);
    const p10 = sortedPnls[Math.floor(sortedPnls.length * 0.1)];
    const p90 = sortedPnls[Math.floor(sortedPnls.length * 0.9)];
    effectiveMin = Math.floor(p10);
    effectiveMax = Math.ceil(p90);
  }

  // Limitar a máximo 50 bins para evitar problemas de rendimiento
  const maxBins = 50;
  const adjustedBinSize = Math.max(
    binSize,
    Math.ceil((effectiveMax - effectiveMin) / maxBins)
  );

  const bins = [];
  for (let b = effectiveMin; b < effectiveMax; b += adjustedBinSize) {
    // Formatear labels según el tamaño de los números
    const formatNumber = (num) => {
      const absNum = Math.abs(num);
      if (absNum >= 1_000_000_000) {
        return "$" + (num / 1_000_000_000).toFixed(1) + "B"; // Billones
      } else if (absNum >= 1_000_000) {
        return "$" + (num / 1_000_000).toFixed(1) + "M"; // Millones
      } else if (absNum >= 1_000) {
        return "$" + (num / 1_000).toFixed(1) + "K"; // Miles
      } else {
        return "$" + num.toFixed(1); // Con 1 decimal para números pequeños
      }
    };

    bins.push({
      range: `${b} to ${b + adjustedBinSize}`,
      rangeShort: `${formatNumber(b)}-${formatNumber(b + adjustedBinSize)}`,
      count: 0,
      totalPnL: 0, // Para calcular el promedio del bin
      isPositive: b + adjustedBinSize > 0,
    });
  }

  // Asignar trades a bins
  pnls.forEach((pnl) => {
    const idx = Math.floor((pnl - effectiveMin) / adjustedBinSize);
    if (idx >= 0 && idx < bins.length) {
      bins[idx].count += 1;
      bins[idx].totalPnL += pnl;
    }
  });

  // Calcular si cada bin es positivo basado en el promedio de PnL
  bins.forEach((bin) => {
    if (bin.count > 0) {
      bin.isPositive = bin.totalPnL / bin.count > 0;
    }
  });

  return bins;
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

export default function PnLHistogram({ operations }) {
  const data = buildHistogramData(operations, 5);
  if (!data.length) {
    return <Typography>No closed trades to display PnL histogram.</Typography>;
  }
  return (
    <Box mb={4} display="flex" justifyContent="center">
      <Box width={{ xs: "100%", sm: 280, md: 320 }}>
        <Typography variant="h6" gutterBottom>
          PnL Distribution
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{
            mb: 1,
            display: "block",
            height: 40,
            lineHeight: "20px",
          }}
        >
          Distribution of trades by PnL ranges. Cyan = profits, red = losses.
        </Typography>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={220} height={250}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="rangeShort"
                angle={-45}
                textAnchor="end"
                interval="preserveStartEnd"
                height={80}
                tick={axisStyle}
                axisLine={{ stroke: "#2de2e6" }}
              />
              <YAxis
                allowDecimals={false}
                tick={axisStyle}
                axisLine={{ stroke: "#2de2e6" }}
              />
              <Tooltip
                contentStyle={tooltipStyle}
                labelStyle={{ color: "#2de2e6", fontWeight: 700 }}
                itemStyle={{ color: "#fff" }}
                cursor={false}
              />
              <Bar
                dataKey="count"
                name="Trades"
                radius={[6, 6, 0, 0]}
                activeBar={{
                  style: {
                    filter:
                      "drop-shadow(0 0 16px #fff) drop-shadow(0 0 12px currentColor)",
                    opacity: 1,
                  },
                }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-${idx}`}
                    fill={entry.isPositive ? "#2de2e6" : "#ff2e63"}
                    style={{
                      filter: `drop-shadow(0 0 8px ${
                        entry.isPositive ? "#2de2e6" : "#ff2e63"
                      })`,
                    }}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
