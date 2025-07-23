import React, { useState } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  ReferenceLine,
  Area,
  Dot,
} from "recharts";
import {
  Typography,
  Box,
  Paper,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from "@mui/material";

function buildEquityDrawdownData(operations) {
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
        equity: Number(equity.toFixed(4)),
        drawdown: Number(drawdown.toFixed(2)),
        pnl: Number(op.pnl || 0),
        symbol: op.symbol,
      };
    });
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

export default function EquityChart({ operations, showDrawdown = true }) {
  const data = buildEquityDrawdownData(operations);
  const [showEquity, setShowEquity] = useState(true);
  const [showDrawdownState, setShowDrawdown] = useState(true);
  const effectiveShowDrawdown = showDrawdown && showDrawdownState;

  // Determinar color de la ReferenceLine según el último equity
  const lastEquity = data.length ? data[data.length - 1].equity : 0;
  const refLineColor = lastEquity >= 0 ? "#2de2e6" : "#ff2e63";

  if (!data.length) {
    return <Typography>No closed trades to display equity curve.</Typography>;
  }

  return (
    <Box mb={4} width="100%" minWidth={0}>
      <Typography variant="h6" gutterBottom>
        Equity Curve{showDrawdown ? " & Drawdown" : ""}
      </Typography>
      {showDrawdown && (
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block" }}
        >
          This chart shows your cumulative profit and loss (Equity) over time,
          and the drawdown percentage (maximum drop from a peak). Use the
          checkboxes to show/hide each line.
        </Typography>
      )}
      {showDrawdown && (
        <FormGroup row sx={{ mb: 1 }}>
          <FormControlLabel
            control={
              <Checkbox
                checked={showEquity}
                onChange={() => setShowEquity((v) => !v)}
              />
            }
            label="Show Equity"
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showDrawdownState}
                onChange={() => setShowDrawdown((v) => !v)}
              />
            }
            label="Show Drawdown"
          />
        </FormGroup>
      )}
      <Paper sx={{ p: 2, width: "100%" }}>
        <ResponsiveContainer width="100%" height={320}>
          <LineChart
            data={data}
            margin={{ top: 20, right: 40, left: 0, bottom: 0 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#444" />
            <XAxis
              dataKey="date"
              tickFormatter={(d) => new Date(d).toLocaleDateString()}
              minTickGap={20}
              tick={axisStyle}
              axisLine={{ stroke: "#2de2e6" }}
            />
            <YAxis
              yAxisId="left"
              label={{
                value: "Equity",
                angle: -90,
                position: "insideLeft",
                fill: "#fff",
              }}
              tick={axisStyle}
              axisLine={{ stroke: "#2de2e6" }}
            />
            {showDrawdown && (
              <YAxis
                yAxisId="right"
                orientation="right"
                label={{
                  value: "Drawdown (%)",
                  angle: 90,
                  position: "insideRight",
                  fill: "#fff",
                }}
                domain={["auto", 0]}
                tick={axisStyle}
                axisLine={{ stroke: "#ff2e63" }}
              />
            )}
            {/* Línea horizontal en y=0, color dinámico, sin label */}
            <ReferenceLine
              y={0}
              yAxisId="left"
              stroke={refLineColor}
              strokeDasharray="4 2"
              ifOverflow="visible"
            />
            <Tooltip
              contentStyle={tooltipStyle}
              labelStyle={{ color: "#2de2e6", fontWeight: 700 }}
              itemStyle={{ color: "#fff" }}
              formatter={(value, name) => [
                value,
                name === "equity" ? "Equity" : "Drawdown (%)",
              ]}
              labelFormatter={(d) => `Date: ${new Date(d).toLocaleString()}`}
              cursor={false}
            />
            <Legend
              verticalAlign="top"
              height={36}
              wrapperStyle={{ color: "#fff" }}
            />
            {/* Línea de equity única, siempre cyan */}
            {showEquity && (
              <Line
                yAxisId="left"
                type="monotone"
                dataKey="equity"
                stroke="#2de2e6"
                strokeWidth={3}
                dot={false}
                name="Equity"
                isAnimationActive={false}
              />
            )}
            {effectiveShowDrawdown && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="drawdown"
                stroke="#ff2e63"
                strokeWidth={2}
                dot={false}
                name="Drawdown (%)"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </Paper>
    </Box>
  );
}
