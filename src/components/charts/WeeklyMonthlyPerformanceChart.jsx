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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
} from "@mui/material";
import CustomSwitch from "../CustomSwitch";
import { DateTime } from "luxon";

function buildWeeklyMonthlyPerformanceData(
  operations,
  filterType = "all",
  selectedMonth = null,
  selectedYear = null,
  timeZone = "UTC"
) {
  if (!operations || operations.length === 0) {
    return [];
  }

  const weeksOfMonth = ["W1", "W2", "W3", "W4", "W5"];

  // Initialize data for each week
  const weeklyData = weeksOfMonth.map((week, index) => ({
    week: week,
    weekIndex: index,
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

  // Process operations and group by week of month
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
      const month = closeDate.month - 1; // 1 = January, convert to 0 = January
      const year = closeDate.year;
      const dayOfMonth = closeDate.day;

      // Filter by selected month and year if specified
      if (selectedMonth !== null && month !== selectedMonth) return;
      if (selectedYear !== null && year !== selectedYear) return;

      // Calculate which week of the month (1-5)
      let weekOfMonth;
      if (dayOfMonth <= 7) weekOfMonth = 0; // Week 1
      else if (dayOfMonth <= 14) weekOfMonth = 1; // Week 2
      else if (dayOfMonth <= 21) weekOfMonth = 2; // Week 3
      else if (dayOfMonth <= 28) weekOfMonth = 3; // Week 4
      else weekOfMonth = 4; // Week 5

      weeklyData[weekOfMonth].pnl += parseFloat(op.pnl || 0);
      weeklyData[weekOfMonth].trades += 1;

      if (op.result === "win") {
        weeklyData[weekOfMonth].wins += 1;
      } else if (op.result === "loss") {
        weeklyData[weekOfMonth].losses += 1;
      }
    }
  });

  // Calculate win rate for each week
  weeklyData.forEach((week) => {
    if (week.trades > 0) {
      week.winRate = ((week.wins / week.trades) * 100).toFixed(1);
    } else {
      week.winRate = 0;
    }
  });

  // Return all weeks, even those without operations
  return weeklyData;
}

const axisStyle = { fill: "#fff", fontWeight: 600 };
const tooltipStyle = {
  backgroundColor: "#23243a",
  border: "1px solid #2de2e6",
  color: "#fff",
};

const CustomTooltip = ({
  active,
  payload,
  label,
  filterType,
  selectedMonth,
  selectedYear,
}) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    let filterText = "All operations";
    if (filterType === "long") filterText = "Longs only";
    if (filterType === "short") filterText = "Shorts only";

    const months = [
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

    return (
      <div style={tooltipStyle}>
        <p style={{ color: "#2de2e6", fontWeight: 700, margin: "0 0 8px 0" }}>
          {label}
        </p>
        <p style={{ color: "#666", margin: "0 0 8px 0", fontSize: "12px" }}>
          {months[selectedMonth]} {selectedYear} - {filterText}
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

export default function WeeklyMonthlyPerformanceChart({
  operations,
  timeZone = "UTC",
}) {
  const [filterValue, setFilterValue] = useState(0); // 0: General, 1: Longs, 2: Shorts

  // Get current month and year for default selection
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth();
  const currentYear = currentDate.getFullYear();

  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [showDateSelectors, setShowDateSelectors] = useState(false);

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
  const data = buildWeeklyMonthlyPerformanceData(
    operations,
    filterType,
    selectedMonth,
    selectedYear,
    timeZone
  );

  // Check if there are any operations at all
  const hasAnyOperations = operations && operations.length > 0;
  if (!hasAnyOperations) {
    return (
      <Typography>
        No closed trades to display weekly monthly performance.
      </Typography>
    );
  }

  // Check if there's data for the selected period
  const hasData = data.length > 0;

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
          Weekly Monthly Performance
        </Typography>
        <Typography
          variant="caption"
          color="secondary"
          sx={{ mb: 1, display: "block", height: 40, lineHeight: "20px" }}
        >
          This chart shows total PnL by week of the month. Use it to identify
          weekly patterns within months.
        </Typography>

        <Box
          sx={{
            mb: 3,
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
            justifyContent: "space-evenly",
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
                checked={showDateSelectors}
                onChange={(e) => setShowDateSelectors(e.target.checked)}
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
                Date
              </Typography>
            }
          />
          {/* Month and Year Selectors - conditionally shown */}
          {showDateSelectors && (
            <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: "#fff" }} shrink={true}>
                  Month
                </InputLabel>
                <Select
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                  label="Month"
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#2de2e6",
                    },
                  }}
                >
                  <MenuItem value={0}>January</MenuItem>
                  <MenuItem value={1}>February</MenuItem>
                  <MenuItem value={2}>March</MenuItem>
                  <MenuItem value={3}>April</MenuItem>
                  <MenuItem value={4}>May</MenuItem>
                  <MenuItem value={5}>June</MenuItem>
                  <MenuItem value={6}>July</MenuItem>
                  <MenuItem value={7}>August</MenuItem>
                  <MenuItem value={8}>September</MenuItem>
                  <MenuItem value={9}>October</MenuItem>
                  <MenuItem value={10}>November</MenuItem>
                  <MenuItem value={11}>December</MenuItem>
                </Select>
              </FormControl>

              <FormControl sx={{ minWidth: 120 }}>
                <InputLabel sx={{ color: "#fff" }} shrink={true}>
                  Year
                </InputLabel>
                <Select
                  value={selectedYear}
                  onChange={(e) => setSelectedYear(e.target.value)}
                  label="Year"
                  sx={{
                    color: "#fff",
                    "& .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "&:hover .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
                      borderColor: "#2de2e6",
                    },
                    "& .MuiSvgIcon-root": {
                      color: "#2de2e6",
                    },
                  }}
                >
                  {Array.from({ length: 5 }, (_, i) => currentYear - 2 + i).map(
                    (year) => (
                      <MenuItem key={year} value={year}>
                        {year}
                      </MenuItem>
                    )
                  )}
                </Select>
              </FormControl>
            </Box>
          )}
          {/* Checkbox to show/hide date selectors */}
        </Box>
        <Paper sx={{ p: 2, background: "#181c2f" }}>
          {hasData ? (
            <ResponsiveContainer width="100%" minWidth={350} height={300}>
              <BarChart
                data={data}
                margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#444" />
                <XAxis
                  dataKey="week"
                  tick={axisStyle}
                  axisLine={{ stroke: "#2de2e6" }}
                />
                <YAxis
                  tick={axisStyle}
                  axisLine={{ stroke: "#2de2e6" }}
                  tickFormatter={(value) => `$${value.toFixed(0)}`}
                />
                <Tooltip
                  content={
                    <CustomTooltip
                      filterType={filterType}
                      selectedMonth={selectedMonth}
                      selectedYear={selectedYear}
                    />
                  }
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
                        filter: `drop-shadow(0 0 8px ${getBarColor(
                          entry.pnl
                        )})`,
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
          ) : (
            <Box
              sx={{
                height: 300,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "#666",
                fontSize: "16px",
                textAlign: "center",
                padding: "20px",
              }}
            >
              <Typography variant="body1" color="text.secondary">
                No closed trades to display weekly monthly performance for the
                selected period.
              </Typography>
            </Box>
          )}
        </Paper>
      </Box>
    </Box>
  );
}
