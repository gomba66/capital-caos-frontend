import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LabelList,
  Cell,
} from "recharts";
import { Typography, Box, Paper } from "@mui/material";

function buildWinrateData(operations) {
  const wins = (operations || []).filter((op) => op.result === "win").length;
  const losses = (operations || []).filter((op) => op.result === "loss").length;
  return [
    { label: "Wins", value: wins, color: "#2de2e6" },
    { label: "Losses", value: losses, color: "#ff2e63" },
  ];
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

export default function WinrateChart({ operations }) {
  const data = buildWinrateData(operations);

  if (!data[0].value && !data[1].value) {
    return <Typography>No closed trades to display winrate.</Typography>;
  }

  return (
    <Box mb={4} display="flex" justifyContent="center">
      <Box width={{ xs: "100%", sm: 280, md: 320 }}>
        <Typography variant="h6" gutterBottom>
          Winrate
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block" }}
        >
          This chart shows the number of winning and losing trades. Use it to
          quickly see your win/loss ratio.
        </Typography>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={220} height={250}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="label"
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
                dataKey="value"
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
                    fill={entry.color}
                    style={{ filter: `drop-shadow(0 0 8px ${entry.color})` }}
                  />
                ))}
                <LabelList
                  dataKey="value"
                  position="top"
                  style={{ fill: "#fff", fontWeight: 700 }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
