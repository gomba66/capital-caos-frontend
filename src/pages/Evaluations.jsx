import React, { useEffect, useState, useCallback } from "react";
import {
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
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TextField,
  CircularProgress,
  Tooltip,
  Grid,
  Card,
  CardContent,
  TablePagination,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import IconButton from "@mui/material/IconButton";
import { getEvaluations, getEvaluationStats } from "../api/evaluations";
import { DateTime } from "luxon";

const CONDITION_LABELS = {
  vector_zone:        "Vector zone",
  in_lower_vwap_band: "Lower VWAP band",
  below_daily_vwap:   "Below daily VWAP",
  ha_green:           "HA green",
  wt_oversold:        "WT oversold",
  pvsra_gate:         "PVSRA gate",
  trend:              "EMA trend",
  confirmation:       "EMA confirmation",
  ema400_cloud:       "EMA400 cloud",
  ha_red:             "HA red",
  rsi_above_50:       "RSI > 50",
  resistance_touch:   "Resistance touch",
  in_upper_vwap_band: "Upper VWAP band",
  above_daily_vwap:   "Above daily VWAP",
  wt_overbought:      "WT overbought",
};

function ConditionDots({ conditions }) {
  if (!conditions) return null;
  return (
    <Box display="flex" flexWrap="wrap" gap={0.5}>
      {Object.entries(conditions).map(([key, val]) => (
        <Tooltip key={key} title={CONDITION_LABELS[key] || key} arrow>
          <Box
            sx={{
              width: 12,
              height: 12,
              borderRadius: "50%",
              bgcolor: val === true ? "#4caf50" : val === false ? "#f44336" : "#555",
              cursor: "default",
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

function StatCard({ label, value, color }) {
  return (
    <Card sx={{ bgcolor: "#1e1e3a", border: "1px solid #333" }}>
      <CardContent sx={{ py: 1.5, px: 2, "&:last-child": { pb: 1.5 } }}>
        <Typography variant="caption" color="text.secondary">{label}</Typography>
        <Typography variant="h5" sx={{ color: color || "white", fontWeight: 700 }}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}

export default function Evaluations() {
  const [rows, setRows]           = useState([]);
  const [total, setTotal]         = useState(0);
  const [stats, setStats]         = useState(null);
  const [loading, setLoading]     = useState(false);
  const [page, setPage]           = useState(0);
  const [rowsPerPage]             = useState(50);
  const [side, setSide]           = useState("");
  const [result, setResult]       = useState("");
  const [symbol, setSymbol]       = useState("");
  const [hours, setHours]         = useState(24);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const resultParam = result === "true" ? true : result === "false" ? false : undefined;
    const [evalData, statsData] = await Promise.all([
      getEvaluations({
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        side: side || undefined,
        result: resultParam,
        symbol: symbol || undefined,
        hours,
      }),
      getEvaluationStats({ side: side || undefined, hours }),
    ]);
    setRows(evalData.evaluations || []);
    setTotal(evalData.total || 0);
    setStats(statsData);
    setLoading(false);
  }, [page, rowsPerPage, side, result, symbol, hours]);

  useEffect(() => { fetchData(); }, [fetchData]);
  useEffect(() => { setPage(0); }, [side, result, symbol, hours]);

  return (
    <Box p={3}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={2}>
        <Typography variant="h5" fontWeight={700}>
          Condition evaluations
        </Typography>
        <IconButton onClick={fetchData} disabled={loading} sx={{ color: "white" }}>
          <RefreshIcon />
        </IconButton>
      </Box>

      {/* Stats row */}
      {stats && (
        <Grid container spacing={2} mb={3}>
          <Grid item xs={6} sm={3}>
            <StatCard label="Total evaluations" value={stats.total} />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Passed" value={stats.passed} color="#4caf50" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Failed" value={stats.failed} color="#f44336" />
          </Grid>
          <Grid item xs={6} sm={3}>
            <StatCard label="Pass rate" value={`${stats.pass_rate}%`} color="#ffb300" />
          </Grid>
        </Grid>
      )}

      {/* Top failing conditions */}
      {stats?.condition_failures?.length > 0 && (
        <Box mb={3}>
          <Typography variant="subtitle2" color="text.secondary" mb={1}>
            Most blocking conditions
          </Typography>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {stats.condition_failures.slice(0, 8).map((f) => (
              <Chip
                key={f.condition}
                label={`${CONDITION_LABELS[f.condition] || f.condition}: ${f.failures}`}
                size="small"
                sx={{ bgcolor: "#3a1a1a", color: "#ff8080", borderColor: "#f44336", border: "1px solid" }}
              />
            ))}
          </Box>
        </Box>
      )}

      {/* Filters */}
      <Box display="flex" gap={2} flexWrap="wrap" mb={2} alignItems="center">
        <TextField
          label="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value.toUpperCase())}
          size="small"
          sx={{ width: 140, input: { color: "white" }, label: { color: "#aaa" } }}
          InputProps={{ sx: { bgcolor: "#1e1e3a" } }}
        />
        <ToggleButtonGroup
          value={side}
          exclusive
          onChange={(_, v) => setSide(v ?? "")}
          size="small"
          sx={{ "& .MuiToggleButton-root": { color: "#aaa", borderColor: "#444" },
                "& .Mui-selected": { color: "white", bgcolor: "#2a2a5a !important" } }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="LONG">LONG</ToggleButton>
          <ToggleButton value="SHORT">SHORT</ToggleButton>
        </ToggleButtonGroup>
        <ToggleButtonGroup
          value={result}
          exclusive
          onChange={(_, v) => setResult(v ?? "")}
          size="small"
          sx={{ "& .MuiToggleButton-root": { color: "#aaa", borderColor: "#444" },
                "& .Mui-selected": { color: "white", bgcolor: "#2a2a5a !important" } }}
        >
          <ToggleButton value="">All</ToggleButton>
          <ToggleButton value="true">✅ Passed</ToggleButton>
          <ToggleButton value="false">❌ Failed</ToggleButton>
        </ToggleButtonGroup>
        <FormControl size="small" sx={{ minWidth: 110 }}>
          <InputLabel sx={{ color: "#aaa" }}>Period</InputLabel>
          <Select
            value={hours}
            onChange={(e) => setHours(e.target.value)}
            label="Period"
            sx={{ color: "white", bgcolor: "#1e1e3a", "& .MuiOutlinedInput-notchedOutline": { borderColor: "#444" } }}
          >
            {[1, 4, 12, 24, 48, 72, 168].map((h) => (
              <MenuItem key={h} value={h}>{h}h</MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      {/* Table */}
      {loading ? (
        <Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
      ) : (
        <TableContainer component={Paper} sx={{ bgcolor: "#12122a", borderRadius: 2 }}>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ "& th": { borderColor: "#333", color: "#aaa", fontWeight: 700 } }}>
                <TableCell>Symbol</TableCell>
                <TableCell>Side</TableCell>
                <TableCell>Result</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Conditions</TableCell>
                <TableCell>First failure</TableCell>
                <TableCell>Scanner</TableCell>
                <TableCell>Time</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rows.map((row) => (
                <TableRow
                  key={row.id}
                  sx={{
                    "& td": { borderColor: "#222", color: "white" },
                    "&:hover": { bgcolor: "#1e1e3a" },
                  }}
                >
                  <TableCell sx={{ fontWeight: 700 }}>{row.symbol}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.side}
                      size="small"
                      sx={{
                        bgcolor: row.side === "LONG" ? "#1a3a1a" : "#3a1a1a",
                        color: row.side === "LONG" ? "#4caf50" : "#f44336",
                        fontWeight: 700,
                        fontSize: "0.7rem",
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {row.result ? (
                      <CheckCircleIcon sx={{ color: "#4caf50", fontSize: 18 }} />
                    ) : (
                      <CancelIcon sx={{ color: "#f44336", fontSize: 18 }} />
                    )}
                  </TableCell>
                  <TableCell sx={{ fontFamily: "monospace" }}>
                    {row.price != null ? row.price.toFixed(4) : "—"}
                  </TableCell>
                  <TableCell><ConditionDots conditions={row.conditions} /></TableCell>
                  <TableCell sx={{ color: "#ff8080", fontSize: "0.75rem" }}>
                    {row.first_failed ? (CONDITION_LABELS[row.first_failed] || row.first_failed) : "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", color: "#aaa" }}>
                    {row.scanner || "—"}
                  </TableCell>
                  <TableCell sx={{ fontSize: "0.75rem", color: "#888", whiteSpace: "nowrap" }}>
                    {row.evaluated_at
                      ? DateTime.fromISO(row.evaluated_at).toRelative()
                      : "—"}
                  </TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ color: "#666", py: 4 }}>
                    No evaluations in this period
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[50]}
            sx={{ color: "#aaa", borderTop: "1px solid #333" }}
          />
        </TableContainer>
      )}
    </Box>
  );
}
