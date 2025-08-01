import React, { useState } from "react";
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
import CustomSwitch from "../CustomSwitch";
import { DateTime } from "luxon";

function buildWeeklyPerformanceData(
  operations,
  filterType = "all",
  timeZone = "UTC"
) {
  if (!operations || operations.length === 0) {
    return [];
  }

  const daysOfWeek = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  // Inicializar datos para cada día de la semana
  const weeklyData = daysOfWeek.map((day, index) => ({
    day: day,
    dayIndex: index,
    pnl: 0,
    trades: 0,
    wins: 0,
    losses: 0,
    winRate: 0,
  }));

  // Filter operations by type if necessary
  let filteredOperations = operations;
  if (filterType === "long") {
    filteredOperations = operations.filter((op) => op.side === "long");
  } else if (filterType === "short") {
    filteredOperations = operations.filter((op) => op.side === "short");
  }
  // If filterType is "all" or both are unchecked, show all operations

  // Process operations and group by day of the week
  filteredOperations.forEach((op) => {
    if (op.closed_at) {
      // Convert to timezone-aware date
      let dt = DateTime.fromISO(op.closed_at, { zone: "utc" });
      if (!dt.isValid) {
        dt = DateTime.fromFormat(op.closed_at, "yyyy-MM-dd HH:mm:ss", {
          zone: "utc",
        });
      }
      if (!dt.isValid) return;

      // Convert to user's timezone
      const closeDate = dt.setZone(timeZone);
      const dayIndex = closeDate.weekday - 1; // 1 = Monday, convert to 0 = Monday

      weeklyData[dayIndex].pnl += parseFloat(op.pnl || 0);
      weeklyData[dayIndex].trades += 1;

      if (op.result === "win") {
        weeklyData[dayIndex].wins += 1;
      } else if (op.result === "loss") {
        weeklyData[dayIndex].losses += 1;
      }
    }
  });

  // Calculate win rate for each day
  weeklyData.forEach((day) => {
    if (day.trades > 0) {
      day.winRate = ((day.wins / day.trades) * 100).toFixed(1);
    } else {
      day.winRate = 0;
    }
  });

  // Return all days, even those without operations
  return weeklyData;
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

const CustomTooltip = ({ active, payload, label, filterType }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let filterText = "All operations";
    if (filterType === "long") filterText = "Longs only";
    if (filterType === "short") filterText = "Shorts only";

    return (
      <div style={tooltipStyle}>
        <p style={{ color: "#2de2e6", fontWeight: 700, margin: "0 0 8px 0" }}>
          {label}
        </p>
        <p style={{ color: "#666", margin: "0 0 8px 0", fontSize: "12px" }}>
          {filterText}
        </p>
        <p style={{ color: "#fff", margin: "4px 0" }}>
          PnL: ${data.pnl.toFixed(2)}
        </p>
        <p style={{ color: "#fff", margin: "4px 0" }}>Trades: {data.trades}</p>
        <p style={{ color: "#fff", margin: "4px 0" }}>
          Wins: {data.wins} | Losses: {data.losses}
        </p>
        <p style={{ color: "#fff", margin: "4px 0" }}>
          Win Rate: {data.winRate}%
        </p>
      </div>
    );
  }
  return null;
};

export default function WeeklyPerformanceChart({
  operations,
  timeZone = "UTC",
}) {
  const [filterValue, setFilterValue] = useState(0); // 0: General, 1: Longs, 2: Shorts

  // Determine which filter to apply based on slider value
  const getFilterType = () => {
    switch (filterValue) {
      case 0:
        return "all"; // General
      case 1:
        return "long"; // Longs
      case 2:
        return "short"; // Shorts
      default:
        return "all";
    }
  };

  const filterType = getFilterType();
  const data = buildWeeklyPerformanceData(operations, filterType, timeZone);

  // Check if there are any operations at all
  const hasAnyOperations = operations && operations.length > 0;
  if (!hasAnyOperations) {
    return (
      <Typography>No closed trades to display weekly performance.</Typography>
    );
  }

  // Determine colors based on PnL
  const getBarColor = (pnl) => {
    if (pnl > 0) return "#2de2e6"; // Green for profits
    if (pnl < 0) return "#ff2e63"; // Red for losses
    return "#666"; // Gray for neutral
  };

  return (
    <Box mb={4} display="flex" justifyContent="center">
      <Box width={{ xs: "100%", sm: 400, md: 450 }}>
        <Typography variant="h6" gutterBottom>
          Weekly Performance by Day
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block", height: 40, lineHeight: "20px" }}
        >
          This chart shows total PnL by day of the week. Use it to identify
          which days are more profitable.
        </Typography>

        <Box
          sx={{
            mb: 3,
            display: "flex",
            justifyContent: "space-evenly",
            flexDirection: "row",
          }}
        >
          <CustomSwitch
            value={filterValue}
            onChange={setFilterValue}
            options={["General", "Longs", "Shorts"]}
          />
        </Box>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={350} height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="day"
                tick={axisStyle}
                axisLine={{ stroke: "#2de2e6" }}
              />
              <YAxis
                tick={axisStyle}
                axisLine={{ stroke: "#2de2e6" }}
                tickFormatter={(value) => `$${value.toFixed(0)}`}
              />
              <Tooltip
                content={<CustomTooltip filterType={filterType} />}
                cursor={false}
              />
              <Bar
                dataKey="pnl"
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
                    fill={getBarColor(entry.pnl)}
                    style={{
                      filter: `drop-shadow(0 0 8px ${getBarColor(entry.pnl)})`,
                    }}
                  />
                ))}
                <LabelList
                  dataKey="pnl"
                  position="top"
                  style={{ fill: "#fff", fontWeight: 700, fontSize: "12px" }}
                  formatter={(value) => `$${parseFloat(value).toFixed(0)}`}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
}
