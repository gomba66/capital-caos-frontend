import React, { useState } from "react";
import {
  IconButton,
  Collapse,
  Box,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
} from "@mui/material";
import { KeyboardArrowDown, KeyboardArrowUp } from "@mui/icons-material";
import { DateTime } from "luxon";

function formatAggregationTime(timestamp, timeZone) {
  if (!timestamp) return "-";
  try {
    const dt = DateTime.fromISO(timestamp, { zone: "utc" });
    if (!dt.isValid) return timestamp;
    return dt
      .setZone(timeZone)
      .toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
  } catch {
    return timestamp;
  }
}

function formatNumber(val, decimals = 4) {
  if (val === undefined || val === null || val === "") return "-";
  const num = Number(val);
  if (isNaN(num)) return val;
  return num.toFixed(decimals);
}

export default function AggregationsExpander({
  aggregations,
  timeZone,
  showButton = true,
}) {
  const [open, setOpen] = useState(false);

  if (!aggregations || aggregations.length === 0) {
    return null;
  }

  return (
    <>
      {showButton && (
        <IconButton
          size="small"
          onClick={() => setOpen(!open)}
          sx={{ color: "#2de2e6" }}
        >
          {open ? <KeyboardArrowUp /> : <KeyboardArrowDown />}
        </IconButton>
      )}
      <Collapse in={open} timeout="auto" unmountOnExit>
        <Box sx={{ margin: 1 }}>
          <Typography variant="subtitle2" sx={{ mb: 1, color: "#2de2e6" }}>
            📈 Aggregations ({aggregations.length})
          </Typography>
          <TableContainer component={Paper} sx={{ maxWidth: "100%" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell sx={{ color: "#2de2e6", fontWeight: 600 }}>
                    Time
                  </TableCell>
                  <TableCell sx={{ color: "#2de2e6", fontWeight: 600 }}>
                    Price
                  </TableCell>
                  <TableCell sx={{ color: "#2de2e6", fontWeight: 600 }}>
                    Size Added
                  </TableCell>
                  <TableCell sx={{ color: "#2de2e6", fontWeight: 600 }}>
                    New Avg Entry
                  </TableCell>
                  <TableCell sx={{ color: "#2de2e6", fontWeight: 600 }}>
                    Total Size
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {aggregations.map((agg, index) => (
                  <TableRow key={index}>
                    <TableCell>
                      <Typography variant="caption">
                        {formatAggregationTime(agg.timestamp, timeZone)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={formatNumber(agg.price)}
                        size="small"
                        sx={{
                          backgroundColor: "#1a1a1a",
                          color: "#2de2a6",
                          border: "1px solid #2de2a6",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Chip
                        label={`+${formatNumber(agg.size_added)}`}
                        size="small"
                        sx={{
                          backgroundColor: "#1a1a1a",
                          color: "#2de2e6",
                          border: "1px solid #2de2e6",
                        }}
                      />
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#2de2a6" }}>
                        {formatNumber(agg.new_avg_entry)}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ color: "#2de2e6" }}>
                        {formatNumber(agg.new_total_size)}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </Box>
      </Collapse>
    </>
  );
}
