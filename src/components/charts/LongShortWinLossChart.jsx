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

/**
 * Construye los datos para la gráfica de win/loss por tipo de operación (long/short).
 * @param {Array} operations - Lista de operaciones cerradas.
 * @returns {Array} Datos para la gráfica.
 */
function buildLongShortWinLossData(operations) {
  const longs = (operations || []).filter((op) =>
    (op.side || op.positionSide || "").toLowerCase().includes("long")
  );
  const shorts = (operations || []).filter((op) =>
    (op.side || op.positionSide || "").toLowerCase().includes("short")
  );
  return [
    {
      type: "Long",
      win: longs.filter((op) => op.result === "win" || Number(op.pnl) > 0)
        .length,
      loss: longs.filter((op) => op.result === "loss" || Number(op.pnl) < 0)
        .length,
      color: "#2de2a6",
    },
    {
      type: "Short",
      win: shorts.filter((op) => op.result === "win" || Number(op.pnl) > 0)
        .length,
      loss: shorts.filter((op) => op.result === "loss" || Number(op.pnl) < 0)
        .length,
      color: "#ff2e63",
    },
  ];
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

/**
 * Gráfica de barras que muestra el número de operaciones ganadoras y perdedoras por tipo (Long/Short).
 * @param {Array} operations - Lista de operaciones cerradas.
 */
export default function LongShortWinLossChart({ operations }) {
  const data = buildLongShortWinLossData(operations);
  const hasData = data.some((d) => d.win > 0 || d.loss > 0);

  if (!hasData) {
    return (
      <Typography>No closed trades to display long/short win/loss.</Typography>
    );
  }

  return (
    <Box mb={4} display="flex" justifyContent="center">
      <Box width={{ xs: "100%", sm: 280, md: 320 }}>
        <Typography variant="h6" gutterBottom>
          Long vs Short Win/Loss
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block" }}
        >
          This chart shows the number of winning and losing trades, separated by
          trade type (Long/Short).
        </Typography>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={220} height={250}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 0, bottom: 0 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="type"
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
                formatter={(value, name) => {
                  if (name && name.toLowerCase().includes("win")) {
                    return [value, "Wins"];
                  }
                  if (name && name.toLowerCase().includes("loss")) {
                    return [value, "Losses"];
                  }
                  return [value, name];
                }}
                itemSorter={(item) => (item.dataKey === "win" ? -1 : 1)}
              />
              {/* Barra de ganadas */}
              <Bar
                dataKey="win"
                name="Wins"
                radius={[6, 6, 0, 0]}
                activeBar={{
                  style: {
                    filter:
                      "drop-shadow(0 0 16px #fff) drop-shadow(0 0 12px #2de2e6)",
                    opacity: 1,
                  },
                }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-win-${idx}`}
                    fill="#2de2e6"
                    style={{ filter: `drop-shadow(0 0 8px #2de2e6)` }}
                  />
                ))}
                <LabelList
                  dataKey="win"
                  position="top"
                  style={{ fill: "#fff", fontWeight: 700 }}
                />
              </Bar>
              {/* Barra de perdidas */}
              <Bar
                dataKey="loss"
                name="Losses"
                radius={[6, 6, 0, 0]}
                activeBar={{
                  style: {
                    filter:
                      "drop-shadow(0 0 16px #fff) drop-shadow(0 0 12px #ff2e63)",
                    opacity: 1,
                  },
                }}
              >
                {data.map((entry, idx) => (
                  <Cell
                    key={`cell-loss-${idx}`}
                    fill="#ff2e63"
                    style={{ filter: `drop-shadow(0 0 8px #ff2e63)` }}
                  />
                ))}
                <LabelList
                  dataKey="loss"
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
