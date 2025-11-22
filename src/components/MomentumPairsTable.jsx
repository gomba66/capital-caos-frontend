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
} from "@mui/material";
import { DateTime } from "luxon";

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
    <>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>
      <TableContainer component={Paper} sx={{ mb: 4, overflowX: "auto" }}>
        <Table size="small" sx={{ minWidth: 500 }}>
          <TableHead>
            <TableRow>
              <TableCell>Symbol</TableCell>
              <TableCell>Scanner</TableCell>
              <TableCell>Change %</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Time</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pairs && pairs.length > 0 ? (
              pairs.map((pair, idx) => {
                const openTrade = openTradeMap.get(pair.symbol?.toUpperCase());
                const isOpenTrade = !!openTrade;
                return (
                  <TableRow
                    key={idx}
                    sx={{
                      backgroundColor: isOpenTrade
                        ? "rgba(255, 225, 86, 0.15)"
                        : "transparent",
                      "&:hover": {
                        backgroundColor: isOpenTrade
                          ? "rgba(255, 225, 86, 0.25)"
                          : "rgba(45, 226, 230, 0.1)",
                      },
                      borderLeft: isOpenTrade ? "4px solid #ffe156" : "none",
                    }}
                  >
                    <TableCell
                      sx={{
                        fontWeight: isOpenTrade ? 700 : 400,
                        color: isOpenTrade ? "#ffe156" : "inherit",
                      }}
                    >
                      {pair.symbol + " " || "-"}
                      {isOpenTrade && (
                        <>
                          🔥
                          {openTrade.positionSide
                            ?.toLowerCase()
                            .includes("long") && " 📈"}
                          {openTrade.positionSide
                            ?.toLowerCase()
                            .includes("short") && " 📉"}
                        </>
                      )}
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const scanner = pair.scanner || "unknown";
                        const scannerType = pair.scanner_type || "";
                        
                        // Mapear scanners a emojis y colores
                        const scannerConfig = {
                          explosive: { emoji: "💥", color: "#ff6b6b", label: "Explosive" },
                          performance_scanner: { emoji: "📊", color: "#4ecdc4", label: "Performance" },
                          unified: { emoji: "🔄", color: "#95e1d3", label: "Unified" },
                          original: { emoji: "⚡", color: "#f38181", label: "Original" },
                          aggressive: { emoji: "🔥", color: "#ff9f43", label: "Aggressive" },
                          volume_momentum: { emoji: "📈", color: "#54a0ff", label: "Volume" },
                          breakout_momentum: { emoji: "🚀", color: "#00d2d3", label: "Breakout" },
                          weekly_performance: { emoji: "📅", color: "#a29bfe", label: "Weekly" },
                        };
                        
                        const config = scannerConfig[scanner] || { 
                          emoji: "❓", 
                          color: "#888", 
                          label: scanner 
                        };
                        
                        return (
                          <Tooltip
                            title={`${config.label}${scannerType ? ` - ${scannerType}` : ""}`}
                            arrow
                            placement="top"
                          >
                            <span style={{ 
                              color: config.color, 
                              fontWeight: 600,
                              cursor: "help",
                              display: "flex",
                              alignItems: "center",
                              gap: "4px"
                            }}>
                              <span style={{ fontSize: "16px" }}>{config.emoji}</span>
                              <span style={{ fontSize: "11px" }}>{config.label}</span>
                            </span>
                          </Tooltip>
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

                          let emoji = "⏳";
                          let color = "#ff9800"; // naranja por defecto

                          if (totalMinutes <= 30) {
                            emoji = "🔴"; // rojo para < 30 min
                            color = "#f44336";
                          } else if (totalMinutes <= 60) {
                            emoji = "🟡"; // amarillo para < 1 hora
                            color = "#ffeb3b";
                          }

                          return (
                            <Tooltip
                              title={`En cooldown - Tiempo restante: ${timeRemaining}`}
                              arrow
                              placement="top"
                            >
                              <span style={{ color, fontSize: "16px" }}>
                                {emoji}
                              </span>
                            </Tooltip>
                          );
                        }
                        return (
                          <span style={{ color: "#4caf50", fontSize: "16px" }}>
                            ✅
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
                  No momentum pairs found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </>
  );
}
