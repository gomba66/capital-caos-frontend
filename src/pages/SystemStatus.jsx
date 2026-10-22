import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  Grid,
  Paper,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import { Activity, Database, Server, Terminal } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getSystemStatus } from "../api/systemStatus";

const TERMINAL_IDS = [
  "main_loop",
  "auto_trader",
  "scanner_service",
  "telegram_bot",
];
const PUBLIC_SERVICE_IDS = [
  "trading_engine",
  "trade_evaluation",
  "market_scanner",
  "notifications",
];

const STATUS_TONES = {
  healthy: "success",
  operational: "success",
  running: "success",
  active: "success",
  scanning: "success",
  registered: "success",
  degraded: "warning",
  paused: "warning",
  waiting: "warning",
  stopped: "error",
  unavailable: "error",
  missing: "error",
  unknown: "default",
};

function StatusChip({ status, t }) {
  const normalizedStatus = status || "unknown";
  return (
    <Chip
      size="small"
      color={STATUS_TONES[normalizedStatus] || "default"}
      label={t(`systemStatusPage.status.${normalizedStatus}`)}
      sx={{ textTransform: "uppercase", fontWeight: 700, letterSpacing: 0.3 }}
    />
  );
}

function StatusCard({ title, status, icon: Icon, children, t }) {
  return (
    <Paper
      variant="outlined"
      sx={{
        height: "100%",
        p: 2,
        borderRadius: 0,
        borderColor: "var(--line)",
        bgcolor: "var(--white)",
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 1,
          mb: 1.5,
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          {React.createElement(Icon, { size: 17, "aria-hidden": "true" })}
          <Typography variant="subtitle1" fontWeight={700}>
            {title}
          </Typography>
        </Box>
        <StatusChip status={status} t={t} />
      </Box>
      {children}
    </Paper>
  );
}

function LoadingCards({ count = 4 }) {
  return Array.from({ length: count }, (_, index) => (
    <Grid key={index} size={{ xs: 12, sm: 6, lg: 3 }}>
      <Paper variant="outlined" sx={{ p: 2, height: 112, borderRadius: 0 }}>
        <Skeleton width="68%" />
        <Skeleton width="42%" height={34} sx={{ mt: 1 }} />
      </Paper>
    </Grid>
  ));
}

function formatDuration(seconds, t) {
  if (seconds == null) return "—";
  const totalMinutes = Math.floor(seconds / 60);
  const days = Math.floor(totalMinutes / 1440);
  const hours = Math.floor((totalMinutes % 1440) / 60);
  const minutes = totalMinutes % 60;
  return t("systemStatusPage.duration", { days, hours, minutes });
}

export default function SystemStatus({ publicView = false }) {
  const { t } = useTranslation();
  const [report, setReport] = useState(null);
  const [apiReachable, setApiReachable] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const mountedRef = useRef(false);

  const refreshStatus = useCallback(async () => {
    if (mountedRef.current) setRefreshing(true);
    try {
      const nextReport = await getSystemStatus({ publicView });
      if (!mountedRef.current) return;
      setReport(nextReport);
      setApiReachable(true);
      setError(null);
    } catch (requestError) {
      console.error("Could not load application system status:", requestError);
      if (!mountedRef.current) return;
      setApiReachable(false);
      setError(requestError);
    } finally {
      if (mountedRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  }, [publicView]);

  useEffect(() => {
    mountedRef.current = true;
    void refreshStatus();
    const intervalId = window.setInterval(() => {
      void refreshStatus();
    }, 15000);
    return () => {
      mountedRef.current = false;
      window.clearInterval(intervalId);
    };
  }, [refreshStatus]);

  const terminalById = new Map(
    (report?.services || []).map((service) => [service.id, service]),
  );
  const apiStatus = apiReachable
    ? report?.api?.status || "healthy"
    : apiReachable === false
      ? "unavailable"
      : "unknown";
  const statusLabels = (status) =>
    t(`systemStatusPage.status.${status || "unknown"}`);
  const checkedAt = report?.checked_at
    ? new Date(report.checked_at).toLocaleString()
    : null;

  return (
    <Box className="dashboard-page" sx={{ pb: 5 }}>
      <section className="page-intro" id="top">
        <div>
          <p className="eyebrow">
            {t(
              publicView
                ? "systemStatusPage.publicEyebrow"
                : "systemStatusPage.eyebrow",
            )}
          </p>
          <Typography component="h1" variant="h4">
            {t("systemStatusPage.title")}
          </Typography>
          <p className="intro-note">
            {t(
              publicView
                ? "systemStatusPage.publicDescription"
                : "systemStatusPage.description",
            )}
          </p>
        </div>
        <Button
          variant="outlined"
          startIcon={
            refreshing ? (
              <CircularProgress size={16} color="inherit" />
            ) : (
              <RefreshIcon />
            )
          }
          onClick={() => void refreshStatus()}
          disabled={refreshing}
        >
          {t("systemStatusPage.refresh")}
        </Button>
      </section>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t(
            report
              ? "systemStatusPage.refreshError"
              : "systemStatusPage.apiError",
          )}
        </Alert>
      )}

      {report?.history?.available === false && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          {t("systemStatusPage.historyUnavailable")}
        </Alert>
      )}

      {loading ? (
        <Grid container spacing={2} aria-busy="true">
          <LoadingCards count={publicView ? 6 : 7} />
        </Grid>
      ) : (
        <>
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid size={{ xs: 12, sm: 6, lg: publicView ? 6 : 4 }}>
              <StatusCard
                title={t("systemStatusPage.api")}
                status={apiStatus}
                icon={Server}
                t={t}
              >
                <Typography variant="body2" color="text.secondary">
                  {!publicView && report?.api?.version
                    ? t("systemStatusPage.version", {
                        version: report.api.version,
                      })
                    : t("systemStatusPage.apiDescription")}
                </Typography>
                {report?.api?.uptime_seconds != null && (
                  <Typography variant="caption" color="text.secondary">
                    {t("systemStatusPage.uptime", {
                      duration: formatDuration(report.api.uptime_seconds, t),
                    })}
                  </Typography>
                )}
                <Typography
                  component="div"
                  variant="caption"
                  color="text.secondary"
                >
                  {t("systemStatusPage.apiHistoryNote")}
                </Typography>
              </StatusCard>
            </Grid>
            {!publicView && (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }}>
                <StatusCard
                  title={t("systemStatusPage.database")}
                  status={report?.database?.status}
                  icon={Database}
                  t={t}
                >
                  <Typography variant="body2" color="text.secondary">
                    {t("systemStatusPage.databaseDescription")}
                  </Typography>
                </StatusCard>
              </Grid>
            )}
            <Grid size={{ xs: 12, sm: 6, lg: publicView ? 6 : 4 }}>
              <StatusCard
                title={t("systemStatusPage.overall")}
                status={report?.status}
                icon={Activity}
                t={t}
              >
                <Typography variant="body2" color="text.secondary">
                  {t("systemStatusPage.checkedAt", {
                    time: checkedAt || "—",
                  })}
                </Typography>
              </StatusCard>
            </Grid>
          </Grid>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {t(
                publicView
                  ? "systemStatusPage.servicesTitle"
                  : "systemStatusPage.terminalsTitle",
              )}
            </Typography>
            <Grid container spacing={2}>
              {(publicView ? PUBLIC_SERVICE_IDS : TERMINAL_IDS).map(
                (serviceId) => {
                  const service = terminalById.get(serviceId);
                  const serviceLabelKey = publicView
                    ? "systemStatusPage.services"
                    : "systemStatusPage.terminals";
                  return (
                    <Grid key={serviceId} size={{ xs: 12, sm: 6, lg: 3 }}>
                      <StatusCard
                        title={t(`${serviceLabelKey}.${serviceId}`)}
                        status={service?.status}
                        icon={Terminal}
                        t={t}
                      >
                        {service?.activity && (
                          <Typography variant="caption" color="text.secondary">
                            {t("systemStatusPage.activity", {
                              status: statusLabels(service.activity),
                            })}
                          </Typography>
                        )}
                        <Typography variant="body2" sx={{ mt: 1 }}>
                          {t("systemStatusPage.uptimePercent", {
                            percent:
                              service?.uptime_percent == null
                                ? "—"
                                : `${service.uptime_percent}%`,
                            days: report?.history?.retention_days,
                          })}
                        </Typography>
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                        >
                          {t("systemStatusPage.uptimeDuration", {
                            duration: formatDuration(
                              service?.uptime_seconds,
                              t,
                            ),
                          })}
                        </Typography>
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                        >
                          {t("systemStatusPage.observedDuration", {
                            duration: formatDuration(
                              service?.observed_seconds,
                              t,
                            ),
                          })}
                        </Typography>
                        <Typography
                          component="div"
                          variant="caption"
                          color="text.secondary"
                        >
                          {t("systemStatusPage.downtimeDuration", {
                            duration: formatDuration(
                              service?.downtime_seconds,
                              t,
                            ),
                          })}
                        </Typography>
                      </StatusCard>
                    </Grid>
                  );
                },
              )}
            </Grid>
          </Box>

          <Box component="section" sx={{ mb: 4 }}>
            <Typography variant="h6" sx={{ mb: 1.5 }}>
              {t("systemStatusPage.incidentsTitle", {
                days: report?.history?.retention_days,
              })}
            </Typography>
            <TableContainer
              component={Paper}
              variant="outlined"
              sx={{ borderRadius: 0 }}
            >
              <Table
                size="small"
                aria-label={t("systemStatusPage.incidentsTitle", {
                  days: report?.history?.retention_days,
                })}
              >
                <TableHead>
                  <TableRow>
                    <TableCell>{t("systemStatusPage.service")}</TableCell>
                    <TableCell>
                      {t("systemStatusPage.incidentStarted")}
                    </TableCell>
                    <TableCell>
                      {t("systemStatusPage.incidentEnded")}
                    </TableCell>
                    <TableCell align="right">
                      {t("systemStatusPage.durationLabel")}
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {(report?.incidents || []).length ? (
                    report.incidents.map((incident) => (
                      <TableRow
                        key={`${incident.service_id}:${incident.started_at}`}
                      >
                        <TableCell>
                          {t(
                            `${
                              publicView
                                ? "systemStatusPage.services"
                                : "systemStatusPage.terminals"
                            }.${incident.service_id}`,
                          )}
                        </TableCell>
                        <TableCell>
                          {new Date(incident.started_at).toLocaleString()}
                        </TableCell>
                        <TableCell>
                          {incident.ongoing
                            ? t("systemStatusPage.ongoing")
                            : new Date(incident.ended_at).toLocaleString()}
                        </TableCell>
                        <TableCell align="right">
                          {formatDuration(incident.duration_seconds, t)}
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={4} align="center">
                        {t("systemStatusPage.noIncidents", {
                          days: report?.history?.retention_days,
                        })}
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </Box>

          {!publicView && (
            <Box component="section">
              <Typography variant="h6">
                {t("systemStatusPage.endpointsTitle")}
              </Typography>
              <Typography
                variant="body2"
                color="text.secondary"
                sx={{ mb: 1.5 }}
              >
                {t("systemStatusPage.endpointsDescription")}
              </Typography>
              <TableContainer
                component={Paper}
                variant="outlined"
                sx={{ borderRadius: 0 }}
              >
                <Table
                  size="small"
                  aria-label={t("systemStatusPage.endpointsTitle")}
                >
                  <TableHead>
                    <TableRow>
                      <TableCell>{t("systemStatusPage.method")}</TableCell>
                      <TableCell>{t("systemStatusPage.path")}</TableCell>
                      <TableCell align="right">
                        {t("systemStatusPage.endpointStatus")}
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(report?.endpoints || []).map((endpoint) => (
                      <TableRow key={`${endpoint.method}:${endpoint.path}`}>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {endpoint.method}
                        </TableCell>
                        <TableCell sx={{ fontFamily: "monospace" }}>
                          {endpoint.path}
                        </TableCell>
                        <TableCell align="right">
                          <StatusChip status={endpoint.status} t={t} />
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}
    </Box>
  );
}
