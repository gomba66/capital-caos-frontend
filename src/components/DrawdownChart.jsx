import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Typography, Box, Paper } from "@mui/material";

function buildDrawdownData(operations) {
  let equity = 0;
  let peak = 0;
  return (operations || [])
    .filter((op) => op.closed_at || op.closeTime)
    .sort(
      (a, b) =>
        new Date(a.closed_at || a.closeTime) -
        new Date(b.closed_at || b.closeTime)
    )
    .map((op) => {
      equity += Number(op.pnl || 0);
      peak = Math.max(peak, equity);
      const drawdown = peak > 0 ? ((equity - peak) / peak) * 100 : 0;
      return {
        date: op.closed_at || op.closeTime,
        drawdown: Number(drawdown.toFixed(2)),
        equity: Number(equity.toFixed(4)),
      };
    });
}

export default function DrawdownChart({ operations }) {
  const data = buildDrawdownData(operations);
  if (!data.length) {
    return <Typography>No closed trades to display drawdown.</Typography>;
  }
  return (
    <Box mb={4}>
      <Typography variant="h6" gutterBottom>
        Drawdown (%)
      </Typography>
      <Paper sx={{ p: 2 }}>
        <ResponsiveContainer width="100%" height={250}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              minTickGap={20}
            />
            <YAxis domain={["auto", 0]} />
            <Tooltip
              formatter={(value, name) => [
                value,
                name === "drawdown" ? "Drawdown (%)" : "Equity",
              ]}
              labelFormatter={(d) => `Date: ${new Date(d).toLocaleString()}`}
              cursor={false}
            />
            <Line
              type="monotone"
              dataKey="drawdown"
              stroke="#d32f2f"
              strokeWidth={2}
              dot={false}
              name="Drawdown"
            />
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
