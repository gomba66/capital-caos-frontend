import React from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
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
  return dt
    .setZone(timeZone)
    .toLocaleString(DateTime.DATETIME_MED_WITH_SECONDS);
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
  // Crear un mapa de símbolos que están en open trades para búsqueda rápida
  const openTradeMap = new Map(
    openTrades.map((trade) => [trade.symbol?.toUpperCase(), trade])
  );

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
              <TableCell>Change %</TableCell>
              <TableCell>Volume</TableCell>
              <TableCell>Type</TableCell>
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
                    <TableCell>{formatTime(pair.time, timeZone)}</TableCell>
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell colSpan={5} align="center">
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
