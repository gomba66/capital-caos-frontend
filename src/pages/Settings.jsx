import React, { useEffect, useState } from "react";
import {
  Typography,
  Box,
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
import { useTranslation } from "react-i18next";

export default function Settings() {
  const { t, i18n } = useTranslation();
  const [backendVersionInfo, setBackendVersionInfo] = useState(null);
  const [config, setConfig] = useState(null);
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

  const handleUpdateCommission = async () => {
    const rateBps = parseFloat(newCommissionRate);
    if (isNaN(rateBps) || rateBps < 0 || rateBps > 1000) {
      setCommissionMessage({
        type: "error",
        text: t("settingsPage.rateRangeError"),
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
          text: `${t("settingsPage.rateUpdated", {
            oldRate: result.old_rate_bps,
            newRate: result.new_rate_bps,
          })}${
            result.recalculation
              ? ` | ${t("settingsPage.tradesRecalculated", {
                  count: result.recalculation.total_updated,
                })}`
              : ""
          }`,
        });
        setCommissionRateState(result);
        setCommissionDialogOpen(false);
      } else {
        setCommissionMessage({
          type: "error",
          text: result?.error || t("settingsPage.updateFailed"),
        });
      }
    } catch (error) {
      setCommissionMessage({
        type: "error",
        text: t("settingsPage.error", { message: error.message }),
      });
    } finally {
      setCommissionLoading(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("settingsPage.title")}
      </Typography>
      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        {t("settingsPage.versions")}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "background.paper",
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
                  {t("settingsPage.backend")}:
                </Typography>
                <Typography variant="body2" fontWeight="bold">
                  {backendVersionInfo?.version || t("common.loading")}
                </Typography>
              </Box>
              <Typography
                variant="caption"
                color="text.secondary"
                sx={{ textAlign: "right", opacity: 0.7 }}
              >
                {backendVersionInfo?.date &&
                backendVersionInfo.date !== "unknown"
                  ? DateTime.fromISO(backendVersionInfo.date)
                      .setLocale(i18n.resolvedLanguage)
                      .toLocaleString(DateTime.DATE_MED)
                  : backendVersionInfo
                  ? t("settingsPage.unknownDate")
                  : "..."}
              </Typography>
            </Box>
            <Divider
              sx={{
                my: 0.5,
                borderColor: "divider",
              }}
            />
            <Box display="flex" flexDirection="column" gap={0.5}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
              >
                <Typography variant="body2" color="text.secondary">
                  {t("settingsPage.frontend")}:
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
                  ? DateTime.fromISO(frontendVersionDate)
                      .setLocale(i18n.resolvedLanguage)
                      .toLocaleString(DateTime.DATE_MED)
                  : t("settingsPage.unknownDate")}
              </Typography>
            </Box>
          </Box>
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      <Typography variant="h6" gutterBottom>
        {t("settingsPage.system")}
      </Typography>
      <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
        <Paper
          elevation={2}
          sx={{
            p: 2,
            backgroundColor: "background.paper",
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
                  {t("settingsPage.tradeLimits")}
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("settingsPage.maxLong")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_long_trades}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("settingsPage.maxShort")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_short_trades}
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("settingsPage.maxTotal")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {config.limits.max_open_trades}
                  </Typography>
                </Box>
              </Box>

              <Divider
                sx={{
                    borderColor: "divider",
                }}
              />

              {/* Risk Configuration */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {t("settingsPage.risk")}
                </Typography>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("settingsPage.longRisk")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(config.limits.long_risk_pct * 100).toFixed(1)}%
                  </Typography>
                </Box>
                <Box display="flex" justifyContent="space-between">
                  <Typography variant="body2" color="text.secondary">
                    {t("settingsPage.shortRisk")}:
                  </Typography>
                  <Typography variant="body2" fontWeight="bold">
                    {(config.limits.short_risk_pct * 100).toFixed(1)}%
                  </Typography>
                </Box>
              </Box>

              <Divider
                sx={{
                    borderColor: "divider",
                }}
              />

              {/* Open Trades Comparison */}
              <Box display="flex" flexDirection="column" gap={1}>
                <Typography
                  variant="subtitle2"
                  color="text.secondary"
                  sx={{ mb: 0.5 }}
                >
                  {t("settingsPage.openTrades")}
                </Typography>
                <Box display="flex" flexDirection="column" gap={0.5}>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("settingsPage.databaseTotal")}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.database.total}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("settingsPage.databaseLong")}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.database.long}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("settingsPage.databaseShort")}:
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
                      {t("settingsPage.exchangeTotal")}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.binance.total}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("settingsPage.exchangeLong")}:
                    </Typography>
                    <Typography variant="body2" fontWeight="bold">
                      {config.binance.long}
                    </Typography>
                  </Box>
                  <Box display="flex" justifyContent="space-between">
                    <Typography variant="body2" color="text.secondary">
                      {t("settingsPage.exchangeShort")}:
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
              {t("settingsPage.loadingConfig")}
            </Typography>
          )}
        </Paper>
      </Box>

      <Divider sx={{ my: 4 }} />

      {brokerMode === "paper" && (
        <>
          <Typography variant="h6" gutterBottom>
            {t("settingsPage.brokerCommission")}
          </Typography>
          <Box sx={{ display: "flex", justifyContent: "flex-start", mt: 2 }}>
            <Paper
              elevation={2}
              sx={{
                p: 2,
                backgroundColor: "background.paper",
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
                          {t("settingsPage.currentRate")}:
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
                        {t("settingsPage.brokerMode")}:{" "}
                        <span style={{ fontWeight: "bold", color: "var(--amber)" }}>
                          {commissionRate.broker_mode}
                        </span>
                      </Typography>
                    </Box>
                    <Tooltip title={t("settingsPage.commissionTooltip")}>
                      <InfoIcon sx={{ fontSize: "1.2rem", color: "primary.main" }} />
                    </Tooltip>
                  </Box>

                  <Button
                    variant="contained"
                    color="primary"
                    size="small"
                    onClick={() => setCommissionDialogOpen(true)}
                  >
                    {t("settingsPage.updateRate")}
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
                  {t("settingsPage.commissionLoading")}
                </Typography>
              )}
            </Paper>
          </Box>

          {/* Commission Update Dialog */}
          <Dialog open={commissionDialogOpen} onClose={() => setCommissionDialogOpen(false)} maxWidth="sm" fullWidth>
            <DialogTitle>{t("settingsPage.updateCommission")}</DialogTitle>
            <DialogContent sx={{ display: "flex", flexDirection: "column", gap: 2, pt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                {t("settingsPage.commissionDescription")}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {t("settingsPage.commissionExample")}
              </Typography>
              <TextField
                label={t("settingsPage.rateBps")}
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
                    {t("settingsPage.recalculateAll")}
                  </Typography>
                </label>
              </Box>
              {commissionMessage && (
                <Alert severity={commissionMessage.type}>{commissionMessage.text}</Alert>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setCommissionDialogOpen(false)}>
                {t("settingsPage.cancel")}
              </Button>
              <Button
                onClick={handleUpdateCommission}
                disabled={commissionLoading}
                variant="contained"
              >
                {commissionLoading ? (
                  <>
                    <CircularProgress size={20} sx={{ mr: 1 }} />
                    {t("settingsPage.updating")}
                  </>
                ) : (
                  t("settingsPage.update")
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
