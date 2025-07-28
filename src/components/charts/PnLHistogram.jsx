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
  const min = Math.floor(Math.min(...pnls));
  const max = Math.ceil(Math.max(...pnls));
  const bins = [];
  for (let b = min; b < max; b += binSize) {
    bins.push({
      range: `${b} to ${b + binSize}`,
      count: 0,
      isPositive: b + binSize > 0,
    });
  }
  pnls.forEach((pnl) => {
    const idx = Math.floor((pnl - min) / binSize);
    if (bins[idx]) bins[idx].count += 1;
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
          Distribution of trades by PnL ranges. Cyan = profits, fuchsia =
          losses.
        </Typography>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={220} height={250}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="range"
                angle={-30}
                textAnchor="end"
                interval={0}
                height={60}
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
