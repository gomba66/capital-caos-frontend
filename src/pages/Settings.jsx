import React, { useContext, useEffect, useState } from "react";
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Divider,
  Paper,
  TextField,
  Button,
  Alert,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import InfoIcon from "@mui/icons-material/Info";
import { TimeZoneContext } from "../contexts/AppContexts";
import { DateTime } from "luxon";
import {
  getBackendVersion,
  getFrontendVersion,
  getFrontendVersionDate,
} from "../api/version";
import { getConfig } from "../api/config";
import {
  getCommissionRate,
  setCommissionRate,
} from "../api/paperBroker";

const commonTimeZones = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "America/Argentina/Buenos_Aires",
];

const commonCurrencies = ["USDT", "COP", "MXN"];

export default function Settings() {
  const { timeZone, setTimeZone } = useContext(TimeZoneContext);
  const [backendVersionInfo, setBackendVersionInfo] = useState(null);
  const [config, setConfig] = useState(null);
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });
  const [commissionRate, setCommissionRateState] = useState(null);
  const [newCommissionRate, setNewCommissionRate] = useState("");
  const [commissionLoading, setCommissionLoading] = useState(false);
  const [commissionMessage, setCommissionMessage] = useState(null);
  const [commissionDialogOpen, setCommissionDialogOpen] = useState(false);
  const [recalculateChecked, setRecalculateChecked] = useState(true);
  const [brokerMode, setBrokerMode] = useState(null);

  const frontendVersion = getFrontendVersion();
  const frontendVersionDate = getFrontendVersionDate();

  useEffect(() => {
    const fetchBackendVersion = async () => {
      const versionInfo = await getBackendVersion();
      setBackendVersionInfo(versionInfo);
    };
    fetchBackendVersion();

    const fetchConfig = async () => {
      const configData = await getConfig();
      setConfig(configData);
    };
    fetchConfig();

    const fetchCommissionRate = async () => {
      const rateData = await getCommissionRate();
      if (rateData) {
        setCommissionRateState(rateData);
        setBrokerMode(rateData.broker_mode);
        setNewCommissionRate(rateData.commission_rate_bps.toString());
      }
    };
    fetchCommissionRate();
  }, []);

  const handleZoneChange = (e) => {
    setTimeZone(e.target.value);
    localStorage.setItem("timeZone", e.target.value);
  };

  const handleCurrencyChange = (e) => {
    const newCurrency = e.target.value;
    setCurrency(newCurrency);
    localStorage.setItem("capitalCurrency", newCurrency);
    // Disparar evento personalizado para actualizar Dashboard en la misma ventana
    window.dispatchEvent(
      new CustomEvent("currencyChange", { detail: newCurrency })
    );
  };

  const handleUpdateCommission = async () => {
    const rateBps = parseFloat(newCommissionRate);
    if (isNaN(rateBps) || rateBps < 0 || rateBps > 1000) {
      setCommissionMessage({
        type: "error",
        text: "Commission rate must be between 0 and 1000 bps",
      });
      return;
    }

    setCommissionLoading(true);
    setCommissionMessage(null);

    try {
      const result = await setCommissionRate(rateBps, recalculateChecked);
      if (result && result.success) {
        setCommissionMessage({
          type: "success",
          text: `Commission rate updated: ${result.old_rate_bps}bps → ${result.new_rate_bps}bps${
            result.recalculation
              ? ` | ${result.recalculation.total_updated} trades recalculated`
              : ""
          }`,
        });
        setCommissionRateState(result);
        setCommissionDialogOpen(false);
      } else {
        setCommissionMessage({
          type: "error",
          text: result?.error || "Failed to update commission rate",
        });
      }
    } catch (error) {
      setCommissionMessage({
        type: "error",
        text: `Error: ${error.message}`,
      });
    } finally {
      setCommissionLoading(false);
    }
  };

  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <FormControl
        sx={{ minWidth: 260, mt: 3 }}
        size="small"
        variant="outlined"
      >
        <InputLabel id="tz-select-label">Time zone</InputLabel>
        <Select
          labelId="tz-select-label"
          id="tz-select"
          value={timeZone}
          label="Time zone"
          onChange={handleZoneChange}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          }}
        >
          {[timeZone, ...commonTimeZones.filter((z) => z !== timeZone)].map(
            (tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>

      <FormControl
        sx={{ minWidth: 260, mt: 3, ml: 2 }}
        size="small"
        variant="outlined"
      >
        <InputLabel id="currency-select-label">Capital Currency</InputLabel>
        <Select
          labelId="currency-select-label"
          id="currency-select"
          value={currency}
          label="Capital Currency"
          onChange={handleCurrencyChange}
        >
          {commonCurrencies.map((curr) => (
            <MenuItem key={curr} value={curr}>
              {curr}
            </MenuItem>
          ))}
        </Select>
      </FormControl>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        Version Information
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            maxWidth: 300,
            width: "100%",
          }}
        >
          <Box display="flex" flexDirection="column" gap={1.5}>
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  Backend:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {backendVersionInfo?.version || "Loading..."}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: "right", opacity: 0.7 }}
              >
                {backendVersionInfo?.date &&
                backendVersionInfo.date !== "unknown"
                  ? DateTime.fromISO(backendVersionInfo.date).toLocaleString(
                      DateTime.DATE_MED
                    )
                  : backendVersionInfo
                  ? "Unknown date"
                  : "..."}
              </Typography>
            </Box>
            <Divider
              sx={{
                my: 0.5,
                borderColor: "rgba(255, 255, 255, 0.1)",
              }}
            />
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  Frontend:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {frontendVersion}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: "right", opacity: 0.7 }}
              >
                {frontendVersionDate !== "unknown"
                  ? DateTime.fromISO(frontendVersionDate).toLocaleString(
                      DateTime.DATE_MED
                    )
                  : "Unknown date"}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        System Configuration
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "rgba(255, 255, 255, 0.05)",
            maxWidth: 400,
            width: "100%",
          }}
        >
          {config ? (
            <Box display="flex" flexDirection="column" gap={2}>
              {/* Trade Limits */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Trade Limits
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Max Long:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_long_trades}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Max Short:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_short_trades}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Max Total:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_open_trades}
                  </Typography>
                </Box>
              </Box>

              <Divider
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />

              {/* Risk Configuration */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Risk Configuration
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Long Risk:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(config.limits.long_risk_pct * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    Short Risk:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(config.limits.short_risk_pct * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>

              <Divider
                sx={{
                  borderColor: "rgba(255, 255, 255, 0.1)",
                }}
              />

              {/* Open Trades Comparison */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  Open Trades
                </Typography>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Database Total:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.database.total}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Database Long:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.database.long}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Database Short:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.database.short}
                    </Typography>
                  </Box>
                </Box>
                <Box
                  display="flex"
                  flexDirection="column"
                  gap={0.5}
                  sx={{ mt: 1 }}
                >
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Binance Total:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.binance.total}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Binance Long:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.binance.long}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      Binance Short:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.binance.short}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary">
              Loading configuration...
            </Typography>
          )}
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {brokerMode === "paper" && (
        <>
          <Typography variant="h6" gutterBottom>
            Paper Broker Commission
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: "rgba(255, 255, 255, 0.05)",
                maxWidth: 400,
                width: "100%",
              }}
            >
              {commissionRate ? (
                <Box display="flex" flexDirection="column" gap={2}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box display="flex" flexDirection="column" gap={0.5} flex={1}>
                      <Box display="flex" justifyContent="space-between">
                        <Typography variant="body2" color="text.secondary">
                          Current Rate:
                        </Typography>
                        <Typography variant="body2" fontWeight="bold">
                          {commissionRate.commission_rate_bps} bps (
                          {(
                            commissionRate.commission_rate_bps / 100
                          ).toFixed(2)}
                          %)
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        Broker Mode:{" "}
                        <span style={{ fontWeight: "bold", color: "#ffd700" }}>
                          {commissionRate.broker_mode}
                        </span>
                      </Typography>
                    </Box>
                    <Tooltip title="Commission is applied to entry and exit. 5 bps = 0.05%">
                      <InfoIcon sx={{ fontSize: "1.2rem", color: "#2de2e6" }} />
                    </Tooltip>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => setCommissionDialogOpen(true)}
                    sx={{
                      backgroundColor: "#2de2e6",
                      color: "#000",
                      fontWeight: "bold",
                      "&:hover": {
                        backgroundColor: "#1da9af",
                      },
                    }}
                  >
                    Update Commission
                  </Button>

                  {commissionMessage && (
                    <Alert
                      severity={commissionMessage.type}
                      onClose={() => setCommissionMessage(null)}
                    >
                      {commissionMessage.text}
                    </Alert>
                  )}
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  Loading commission rate...
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Commission Update Dialog */}
          <Dialog open={commissionDialogOpen} onClose={() => setCommissionDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>Update Commission Rate</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Enter commission rate in basis points (0-1000).
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Example: 5 bps = 0.05% commission on entry and exit
              </Typography>
              <TextField
                label="Commission Rate (bps)"
                type="number"
                value={newCommissionRate}
                onChange={(e) => setNewCommissionRate(e.target.value)}
                inputProps={{ min: "0", max: "1000", step: "0.1" }}
                fullWidth
                size="small"
              />
              <Box display="flex" alignItems="center" gap={1}>
                <input
                  type="checkbox"
                  checked={recalculateChecked}
                  onChange={(e) => setRecalculateChecked(e.target.checked)}
                  id="recalculate-checkbox"
                />
                <label htmlFor="recalculate-checkbox">
                  <Typography variant="body2" color="text.secondary">
                    Recalculate all historical trades
                  </Typography>
                </label>
              </Box>
              {commissionMessage && (
                <Alert severity={commissionMessage.type}>{commissionMessage.text}</Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCommissionDialogOpen(false)}>Cancel</Button>
              <Button
                onClick={handleUpdateCommission}
                disabled={commissionLoading}
                variant="contained"
                sx={{
                  backgroundColor: "#2de2e6",
                  color: "#000",
                  fontWeight: "bold",
                  "&:hover": {
                    backgroundColor: "#1da9af",
                  },
                }}
              >
                {commissionLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} /> Updating...
                  </>
                ) : (
                  "Update"
                )}
              </Button>
            </DialogActions>
          </Dialog>

          <Divider sx={{ my: 4 }} />
        </>
      )}
    </Box>
  );
}
