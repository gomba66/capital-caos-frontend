import React, { useState, useEffect } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Tooltip,
  Accordion,
  AccordionSummary,
  AccordionDetails,
} from "@mui/material";
import { DateTime } from "luxon";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { useTranslation } from "react-i18next";

function formatTime(time, timeZone) {
  if (!time) return "-";
  let dt;
  // Intentar ISO 8601 primero
  dt = DateTime.fromISO(time, { zone: "utc" });
  if (!dt.isValid) {
    // Intentar formato antiguo 'YYYY-MM-DD HH:MM:SS' asumiendo UTC
    dt = DateTime.fromFormat(time, "yyyy-MM-dd HH:mm:ss", { zone: "utc" });
  }
  if (!dt.isValid) return time;
  return dt.setZone(timeZone).toFormat("dd/MM/yy - h:mm:ss a");
}

function formatVolume(volume) {
  if (volume === undefined || volume === null || volume === "") return "-";
  const absVol = Math.abs(Number(volume));
  if (absVol >= 1_000_000_000) {
    return (volume / 1_000_000_000).toFixed(1) + "B";
  } else if (absVol >= 1_000_000) {
    return (volume / 1_000_000).toFixed(1) + "M";
  } else if (absVol >= 1_000) {
    return (volume / 1_000).toFixed(1) + "K";
  } else {
    return Number(volume).toFixed(1);
  }
}

export default function MomentumPairsTable({
  pairs,
  title,
  openTrades = [],
  timeZone,
}) {
  const { t } = useTranslation();
  const [cooldowns, setCooldowns] = useState([]);
  const [loadingCooldowns, setLoadingCooldowns] = useState(true); // eslint-disable-line no-unused-vars

  // Crear un mapa de símbolos que están en open trades para búsqueda rápida
  const openTradeMap = new Map(
    openTrades.map((trade) => [trade.symbol?.toUpperCase(), trade])
  );

  // Crear un mapa de símbolos en cooldown para búsqueda rápida
  const cooldownMap = new Map(
    cooldowns.map((cooldown) => [cooldown.symbol?.toUpperCase(), cooldown])
  );

  // Obtener cooldowns al montar el componente
  useEffect(() => {
    const fetchCooldowns = async () => {
      try {
        const response = await fetch("/api/cooldowns");
        if (response.ok) {
          const data = await response.json();
          setCooldowns(data.cooldowns || []);
        }
      } catch (error) {
        console.error("Error fetching cooldowns:", error);
      } finally {
        setLoadingCooldowns(false);
      }
    };

    fetchCooldowns();

    // Actualizar cada 30 segundos
    const interval = setInterval(fetchCooldowns, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <Accordion
      className="momentum-pairs"
      sx={{ mb: 2 }}
      defaultExpanded={false}
    >
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <TableContainer component={Paper} sx={{ overflowX: "auto" }}>
          <Table
            className="momentum-pairs-table"
            size="small"
            sx={{ minWidth: 500 }}
          >
            <TableHead>
              <TableRow>
                <TableCell>{t("momentum.symbol")}</TableCell>
                <TableCell>{t("momentum.scanner")}</TableCell>
                <TableCell>{t("momentum.change")}</TableCell>
                <TableCell>{t("momentum.volume")}</TableCell>
                <TableCell>{t("momentum.type")}</TableCell>
                <TableCell>{t("momentum.status")}</TableCell>
                <TableCell>{t("momentum.time")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pairs && pairs.length > 0 ? (
                pairs.map((pair, idx) => {
                  const openTrade = openTradeMap.get(
                    pair.symbol?.toUpperCase()
                  );
                  const isOpenTrade = !!openTrade;
                  return (
                    <TableRow
                      key={idx}
                      className={isOpenTrade ? "momentum-pair-open" : ""}
                    >
                      <TableCell className="momentum-pair-symbol">
                        {pair.symbol || "-"}
                        {isOpenTrade && (
                          <span className="momentum-open-tag">
                            {t("momentum.open")}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const scanner = pair.scanner || "unknown";
                          const _scannerType = pair.scanner_type || "";

                          // Mapear scanners a labels simples
                          const scannerLabels = {
                            explosive: "EXPLOSIVE",
                            performance_scanner: "PERFORMANCE",
                            unified: "UNIFIED",
                            original: "ORIGINAL",
                            aggressive: "AGGRESSIVE",
                            volume_momentum: "VOLUME",
                            breakout_momentum: "BREAKOUT",
                            weekly_performance: "WEEKLY",
                          };

                          const label =
                            scannerLabels[scanner] || scanner.toUpperCase();

                          return (
                            <span className="momentum-scanner-tag">
                              {label}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>
                        {pair.change_30m !== undefined
                          ? pair.change_30m
                          : pair.change_2m !== undefined
                          ? pair.change_2m
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {pair.volume !== undefined
                          ? formatVolume(pair.volume)
                          : "-"}
                      </TableCell>
                      <TableCell>
                        {pair.type ||
                          (pair.change_2m !== undefined ? "FAST" : "30m")}
                      </TableCell>
                      <TableCell>
                        {(() => {
                          const cooldown = cooldownMap.get(
                            pair.symbol?.toUpperCase()
                          );
                          if (cooldown) {
                            const timeRemaining = cooldown.time_remaining;
                            const [hours, minutes] = timeRemaining
                              .split(":")
                              .map(Number);
                            const totalMinutes = hours * 60 + minutes;

                            let color = "var(--amber)";

                            if (totalMinutes <= 30) {
                              color = "var(--red)";
                            }

                            return (
                              <Tooltip
                                title={t("momentum.cooldownTooltip", {
                                  time: timeRemaining,
                                })}
                                arrow
                                placement="top"
                              >
                                <span
                                  className="momentum-status"
                                  data-status="cooldown"
                                  style={{ color }}
                                >
                                  {t("momentum.cooldown")}
                                </span>
                              </Tooltip>
                            );
                          }
                          return (
                            <span
                              className="momentum-status"
                              data-status="ready"
                              style={{ color: "var(--green)" }}
                            >
                              {t("momentum.ready")}
                            </span>
                          );
                        })()}
                      </TableCell>
                      <TableCell>{formatTime(pair.time, timeZone)}</TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
                    {t("momentum.empty")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </AccordionDetails>
    </Accordion>
  );
}
