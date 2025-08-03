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
import {
  Typography,
  Box,
  Paper,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CustomSwitch from "../CustomSwitch";
import { DateTime } from "luxon";

function buildMonthlyPerformanceData(
  operations,
  filterType = "all",
  timeZone = "UTC",
  showAllMonths = false
) {
  if (!operations || operations.length === 0) {
    return [];
  }

  // Get current date in user's timezone
  const now = DateTime.now().setZone(timeZone);
  const currentMonth = now.month - 1; // 0-based index
  const currentYear = now.year;

  let monthsToShow = [];
  let monthLabels = [];

  if (showAllMonths) {
    // Show all 12 months with single letter labels of current year using FIRST LETTER OF MONTH
    monthsToShow = Array.from({ length: 12 }, (_, i) => i);
    monthLabels = monthsToShow.map((monthIndex) => {
      const allMonthNames = [
        "Jan",
        "Feb",
        "Mar",
        "Apr",
        "May",
        "Jun",
        "Jul",
        "Aug",
        "Sep",
        "Oct",
        "Nov",
        "Dec",
      ];
      const month = DateTime.fromObject({
        year: currentYear,
        month: monthIndex + 1,
      }).toFormat("MMM");

      return month.charAt(0) + allMonthNames.indexOf(month).toString();
    });
  } else {
    // Show 3 months before, current, and 1 month after (5 months total)
    const startMonth = Math.max(0, currentMonth - 3);
    const endMonth = Math.min(11, currentMonth + 1);

    for (let i = startMonth; i <= endMonth; i++) {
      monthsToShow.push(i);
    }

    // Full names for focused view
    const allMonthNames = [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ];
    monthLabels = allMonthNames.slice(startMonth, endMonth + 1);
  }

  // Initialize data for selected months
  const monthlyData = monthsToShow.map((monthIndex, arrayIndex) => ({
    month: monthLabels[arrayIndex],
    monthIndex: monthIndex,
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

  // Process operations and group by month
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
      const monthIndex = closeDate.month - 1; // 1 = January, convert to 0 = January

      // Find the corresponding data entry for this month
      const dataEntry = monthlyData.find(
        (entry) => entry.monthIndex === monthIndex
      );
      if (dataEntry) {
        dataEntry.pnl += parseFloat(op.pnl || 0);
        dataEntry.trades += 1;

        if (op.result === "win") {
          dataEntry.wins += 1;
        } else if (op.result === "loss") {
          dataEntry.losses += 1;
        }
      }
    }
  });

  // Calculate win rate for each month
  monthlyData.forEach((month) => {
    if (month.trades > 0) {
      month.winRate = ((month.wins / month.trades) * 100).toFixed(1);
    } else {
      month.winRate = 0;
    }
  });

  // Return all months, even those without operations
  return monthlyData;
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

const CustomTooltip = ({ active, payload, /* label, */ filterType }) => {
  if (active && payload && payload.length && payload[0] && payload[0].payload) {
    const data = payload[0].payload;
    let filterText = "All operations";
    if (filterType === "long") filterText = "Longs only";
    if (filterType === "short") filterText = "Shorts only";

    const allMonthNamesComplete = [
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December",
    ];

    // Get month name from monthIndex for consistency
    const monthName = allMonthNamesComplete[data.monthIndex];

    return (
      <div style={tooltipStyle}>
        <p style={{ color: "#2de2e6", fontWeight: 700, margin: "0 0 8px 0" }}>
          {monthName}
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

export default function MonthlyPerformanceChart({
  operations,
  timeZone = "UTC",
}) {
  const [filterValue, setFilterValue] = useState(0); // 0: General, 1: Longs, 2: Shorts
  const [showAllMonths, setShowAllMonths] = useState(false);

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
  const data = buildMonthlyPerformanceData(
    operations,
    filterType,
    timeZone,
    showAllMonths
  );

  // Check if there are any operations at all
  const hasAnyOperations = operations && operations.length > 0;
  if (!hasAnyOperations) {
    return (
      <Typography>No closed trades to display monthly performance.</Typography>
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
          Monthly Performance
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block", height: 40, lineHeight: "20px" }}
        >
          This chart shows total PnL by month of the year. Use it to identify
          seasonal patterns.
        </Typography>

        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            justifyContent: "space-evenly",
            gap: 2,
          }}
        >
          <CustomSwitch
            value={filterValue}
            onChange={setFilterValue}
            options={["General", "Longs", "Shorts"]}
          />
          <FormControlLabel
            control={
              <Checkbox
                checked={showAllMonths}
                onChange={(e) => setShowAllMonths(e.target.checked)}
                sx={{
                  color: "#2de2e6",
                  "&.Mui-checked": {
                    color: "#2de2e6",
                  },
                }}
              />
            }
            label={
              <Typography sx={{ color: "#fff", fontSize: "14px" }}>
                All Months
              </Typography>
            }
          />
        </Box>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          <ResponsiveContainer width="100%" minWidth={350} height={300}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 10, left: 5, bottom: 20 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#444" />
              <XAxis
                dataKey="month"
                tickFormatter={(value) => {
                  if (showAllMonths) {
                    return value[0];
                  } else {
                    return value;
                  }
                }}
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
