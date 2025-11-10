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
} from "@mui/material";
import { TimeZoneContext } from "../contexts/AppContexts";
import { DateTime } from "luxon";
import {
  getBackendVersion,
  getFrontendVersion,
  getFrontendVersionDate,
} from "../api/version";
import { getConfig } from "../api/config";

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
    </Box>
  );
}
