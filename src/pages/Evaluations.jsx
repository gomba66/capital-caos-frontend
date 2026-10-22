import React, { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import RefreshIcon from "@mui/icons-material/Refresh";
import { DateTime } from "luxon";
import { useTranslation } from "react-i18next";
import {
  getEvaluationConditions,
  getEvaluations,
  getEvaluationStats,
} from "../api/evaluations";

function ConditionDots({ conditions, labels }) {
  if (!conditions) return null;
  return (
    <Box display="flex" flexWrap="wrap" gap={0.75} minWidth={70}>
      {Object.entries(conditions).map(([conditionId, value]) => (
        <Tooltip
          key={conditionId}
          title={labels[conditionId] || conditionId}
          arrow
        >
          <Box
            component="span"
            aria-label={`${labels[conditionId] || conditionId}: ${value}`}
            sx={{
              width: 9,
              height: 9,
              borderRadius: "50%",
              bgcolor:
                value === true
                  ? "var(--green)"
                  : value === false
                    ? "var(--red)"
                    : "var(--muted)",
              border: "1px solid var(--line)",
              cursor: "default",
            }}
          />
        </Tooltip>
      ))}
    </Box>
  );
}

function StatItem({ label, value, tone }) {
  return (
    <div className="stat-item">
      <span className="stat-label">{label}</span>
      <strong style={tone ? { color: `var(--${tone})` } : undefined}>
        {value}
      </strong>
    </div>
  );
}

export default function Evaluations() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage || i18n.language;
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [stats, setStats] = useState(null);
  const [conditionLabels, setConditionLabels] = useState({});
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 50;
  const [side, setSide] = useState("");
  const [result, setResult] = useState("");
  const [symbol, setSymbol] = useState("");
  const [hours, setHours] = useState(24);
  const [loadError, setLoadError] = useState(false);
  const [conditionError, setConditionError] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setLoadError(false);
    const resultParam =
      result === "true" ? true : result === "false" ? false : undefined;
    try {
      const [evaluationData, statsData] = await Promise.all([
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
      setRows(evaluationData.evaluations);
      setTotal(evaluationData.total);
      setStats(statsData);
    } catch (error) {
      console.error("Could not load condition evaluations:", error);
      setLoadError(true);
    } finally {
      setLoading(false);
    }
  }, [hours, page, result, side, symbol]);

  useEffect(() => {
    void fetchData();
  }, [fetchData]);

  useEffect(() => {
    let cancelled = false;
    getEvaluationConditions(language)
      .then((data) => {
        if (!cancelled) {
          setConditionLabels(
            Object.fromEntries(
              data.conditions.map(({ id, label }) => [id, label]),
            ),
          );
          setConditionError(false);
        }
      })
      .catch((error) => {
        console.error("Could not load private evaluation condition labels:", error);
        if (!cancelled) setConditionError(true);
      });
    return () => {
      cancelled = true;
    };
  }, [language]);

  useEffect(() => {
    setPage(0);
  }, [hours, result, side, symbol]);

  const periodOptions = [1, 4, 12, 24, 48, 72, 168];
  const cellSx = {
    borderColor: "var(--line-soft)",
    color: "var(--ink)",
    whiteSpace: "nowrap",
  };

  return (
    <Box className="dashboard-page" sx={{ pb: 5 }}>
      <section className="page-intro" id="top">
        <div>
          <p className="eyebrow">{t("evaluationsPage.eyebrow")}</p>
          <Typography component="h1" variant="h4">
            {t("evaluationsPage.title")}
          </Typography>
          <p className="intro-note">{t("evaluationsPage.description")}</p>
        </div>
        <Tooltip title={t("evaluationsPage.refresh")}>
          <span>
            <IconButton
              aria-label={t("evaluationsPage.refresh")}
              onClick={() => void fetchData()}
              disabled={loading}
              sx={{
                border: "1px solid var(--line)",
                borderRadius: 0,
                color: "var(--ink)",
                bgcolor: "var(--white)",
                "&:hover": { color: "var(--green)", borderColor: "var(--green)" },
              }}
            >
              {loading ? <CircularProgress size={19} /> : <RefreshIcon />}
            </IconButton>
          </span>
        </Tooltip>
      </section>

      {(loadError || conditionError) && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {t("evaluationsPage.loadError")}
        </Alert>
      )}

      {stats && (
        <section className="stats-strip" aria-label={t("evaluationsPage.title")}>
          <StatItem label={t("evaluationsPage.total")} value={stats.total} />
          <StatItem
            label={t("evaluationsPage.passed")}
            value={stats.passed}
            tone="green"
          />
          <StatItem
            label={t("evaluationsPage.failed")}
            value={stats.failed}
            tone="red"
          />
          <StatItem
            label={t("evaluationsPage.passRate")}
            value={`${stats.pass_rate}%`}
            tone="amber"
          />
        </section>
      )}

      {stats?.condition_failures?.length > 0 && (
        <Box className="dashboard-section">
          <div className="section-heading">
            <div className="section-title-group">
              <span className="section-index">01</span>
              <h2>{t("evaluationsPage.topFailures")}</h2>
            </div>
          </div>
          <Box display="flex" flexWrap="wrap" gap={1}>
            {stats.condition_failures.slice(0, 8).map((failure) => (
              <Box
                key={failure.condition}
                sx={{
                  px: 1.25,
                  py: 0.75,
                  border: "1px solid var(--error-border)",
                  color: "var(--error-ink)",
                  bgcolor: "var(--surface-error)",
                  fontFamily: "var(--mono)",
                  fontSize: 12,
                }}
              >
                {conditionLabels[failure.condition] || failure.condition}
                <strong style={{ marginLeft: 8 }}>{failure.failures}</strong>
              </Box>
            ))}
          </Box>
        </Box>
      )}

      <Box className="dashboard-section">
        <div className="section-heading">
          <div className="section-title-group">
            <span className="section-index">02</span>
            <div>
              <h2>{t("evaluationsPage.tableTitle")}</h2>
              <p>
                {t("evaluationsPage.tableDescription", { count: total })}
              </p>
            </div>
          </div>
          <Box
            display="flex"
            alignItems="center"
            justifyContent="flex-end"
            gap={1}
            flexWrap="wrap"
          >
            <TextField
              label={t("evaluationsPage.symbol")}
              value={symbol}
              onChange={(event) => setSymbol(event.target.value.toUpperCase())}
              size="small"
              sx={{ width: 145 }}
            />
            <ToggleButtonGroup
              value={side}
              exclusive
              onChange={(_, value) => setSide(value ?? "")}
              size="small"
              aria-label={t("evaluationsPage.side")}
            >
              <ToggleButton value="">{t("evaluationsPage.allSides")}</ToggleButton>
              <ToggleButton value="LONG">{t("evaluationsPage.long")}</ToggleButton>
              <ToggleButton value="SHORT">{t("evaluationsPage.short")}</ToggleButton>
            </ToggleButtonGroup>
            <ToggleButtonGroup
              value={result}
              exclusive
              onChange={(_, value) => setResult(value ?? "")}
              size="small"
              aria-label={t("evaluationsPage.result")}
            >
              <ToggleButton value="">
                {t("evaluationsPage.allResults")}
              </ToggleButton>
              <ToggleButton value="true">
                {t("evaluationsPage.passedFilter")}
              </ToggleButton>
              <ToggleButton value="false">
                {t("evaluationsPage.failedFilter")}
              </ToggleButton>
            </ToggleButtonGroup>
            <FormControl size="small" sx={{ minWidth: 110 }}>
              <InputLabel>{t("evaluationsPage.period")}</InputLabel>
              <Select
                value={hours}
                label={t("evaluationsPage.period")}
                onChange={(event) => setHours(event.target.value)}
              >
                {periodOptions.map((period) => (
                  <MenuItem key={period} value={period}>
                    {t("evaluationsPage.periodLabel", { value: period })}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </div>

        <TableContainer
          component={Paper}
          sx={{
            border: "1px solid var(--line)",
            borderRadius: 0,
            bgcolor: "var(--white)",
            boxShadow: "none",
          }}
        >
          <Table size="small" sx={{ minWidth: 900 }}>
            <TableHead>
              <TableRow sx={{ bgcolor: "var(--surface-muted)" }}>
                {[
                  "symbol",
                  "side",
                  "result",
                  "price",
                  "conditions",
                  "firstFailure",
                  "scanner",
                  "time",
                ].map((column) => (
                  <TableCell
                    key={column}
                    sx={{
                      ...cellSx,
                      color: "var(--muted)",
                      fontFamily: "var(--mono)",
                      fontSize: 10,
                      fontWeight: 700,
                      letterSpacing: "0.04em",
                      textTransform: "uppercase",
                    }}
                  >
                    {t(`evaluationsPage.${column}`)}
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={8} align="center" sx={{ py: 7 }}>
                    <CircularProgress size={24} />
                  </TableCell>
                </TableRow>
              ) : (
                <>
                  {rows.map((row) => (
                    <TableRow
                      key={row.id}
                      hover
                      sx={{
                        "&:hover": { bgcolor: "var(--surface-hover) !important" },
                      }}
                    >
                      <TableCell sx={{ ...cellSx, fontWeight: 700 }}>
                        {row.symbol}
                      </TableCell>
                      <TableCell sx={cellSx}>{row.side}</TableCell>
                      <TableCell sx={cellSx}>
                        {row.result ? (
                          <CheckCircleIcon
                            aria-label={t("evaluationsPage.passedFilter")}
                            sx={{ color: "var(--green)", fontSize: 18 }}
                          />
                        ) : (
                          <CancelIcon
                            aria-label={t("evaluationsPage.failedFilter")}
                            sx={{ color: "var(--red)", fontSize: 18 }}
                          />
                        )}
                      </TableCell>
                      <TableCell sx={{ ...cellSx, fontFamily: "var(--mono)" }}>
                        {row.price != null ? row.price.toFixed(4) : "—"}
                      </TableCell>
                      <TableCell sx={cellSx}>
                        <ConditionDots
                          conditions={row.conditions}
                          labels={conditionLabels}
                        />
                      </TableCell>
                      <TableCell sx={{ ...cellSx, color: "var(--error-ink)" }}>
                        {row.first_failed
                          ? conditionLabels[row.first_failed] || row.first_failed
                          : "—"}
                      </TableCell>
                      <TableCell sx={cellSx}>{row.scanner || "—"}</TableCell>
                      <TableCell sx={{ ...cellSx, fontFamily: "var(--mono)" }}>
                        {row.evaluated_at
                          ? DateTime.fromISO(row.evaluated_at)
                              .setLocale(language)
                              .toRelative()
                          : "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                  {rows.length === 0 && (
                    <TableRow>
                      <TableCell
                        colSpan={8}
                        align="center"
                        sx={{ ...cellSx, py: 5 }}
                      >
                        {t("evaluationsPage.noResults")}
                      </TableCell>
                    </TableRow>
                  )}
                </>
              )}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={total}
            page={page}
            onPageChange={(_, nextPage) => setPage(nextPage)}
            rowsPerPage={rowsPerPage}
            rowsPerPageOptions={[rowsPerPage]}
            labelDisplayedRows={({ from, to, count }) =>
              t("evaluationsPage.displayedRows", { from, to, count })
            }
            sx={{
              color: "var(--muted)",
              borderTop: "1px solid var(--line)",
              "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows":
                { fontFamily: "var(--mono)", fontSize: 11 },
            }}
          />
        </TableContainer>
      </Box>
    </Box>
  );
}
