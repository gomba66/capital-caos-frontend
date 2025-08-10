import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";

/**
 * Muestra el winrate general, de longs y de shorts en tarjetas.
 * Solo usa datos del backend, no calcula en el frontend.
 * @param {Object} winrates - Winrates pre-calculados del backend.
 * @param {boolean} hideDescription - Si se debe ocultar la descripción.
 */
export default function WinrateChart({ winrates, hideDescription = false }) {
  // Solo usar winrates del backend, no calcular localmente
  const { total, long, short } = winrates || {};

  return (
    <Box mb={4} display="flex" justifyContent="center">
      <Box width={{ xs: "100%", sm: 280, md: 320 }}>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "#2de2e6",
            fontWeight: 700,
            textShadow: "0 0 8px #2de2e6",
            textAlign: "left",
          }}
        >
          Winrate
        </Typography>
        {!hideDescription && (
          <Typography
            variant="caption"
            color="secondary"
            sx={{
              mb: 2,
              display: "block",
              color: "#2de2e6",
              textAlign: "left",
            }}
          >
            Winrate is the percentage of profitable trades. A value above 50%
            indicates a profitable system.
          </Typography>
        )}
        <Paper
          sx={{
            p: 3,
            background: "rgba(24,28,47,0.95)",
            borderRadius: 4,
            boxShadow: "0 0 24px #2de2e633",
            transition: "box-shadow 0.3s ease",
            "&:hover": {
              boxShadow: "0 0 32px #2de2e666",
            },
          }}
        >
          <Grid container spacing={2} direction="column">
            {/* Fila 1: Winrate Total */}
            <Grid>
              <Box
                sx={{
                  background: "#2de2e6" + "22",
                  borderRadius: 3,
                  p: 2,
                  textAlign: "center",
                  transition: "all 0.3s ease",
                  "&:hover": {
                    background: "#2de2e6" + "33",
                    boxShadow: "0 8px 24px #2de2e644",
                  },
                }}
              >
                <Typography
                  variant="subtitle2"
                  sx={{
                    color: "#aaa",
                    letterSpacing: 1,
                    textTransform: "uppercase",
                    fontWeight: 600,
                    mb: 1,
                  }}
                >
                  Total
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    color: "#2de2e6",
                    fontWeight: 700,
                    textShadow: `0 0 12px #2de2e6`,
                    fontSize: "2.5rem",
                    lineHeight: 1.1,
                  }}
                >
                  {total !== null && total !== undefined ? `${total}%` : "-"}
                </Typography>
              </Box>
            </Grid>
            {/* Fila 2: Long y Short, 50% cada uno */}
            <Grid
              container
              spacing={1}
              direction="row"
              justifyContent="space-between"
            >
              <Grid sx={{ width: "47%" }}>
                <Box
                  sx={{
                    background: "#2de2a6" + "22",
                    borderRadius: 3,
                    p: 2,
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "#2de2a6" + "33",
                      boxShadow: "0 8px 24px #2de2a644",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#aaa",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Longs
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#2de2a6",
                      fontWeight: 700,
                      textShadow: `0 0 12px #2de2a6`,
                      fontSize: "2rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {long !== null && long !== undefined ? `${long}%` : "-"}
                  </Typography>
                </Box>
              </Grid>
              <Grid sx={{ width: "47%" }}>
                <Box
                  sx={{
                    background: "#ff2e63" + "22",
                    borderRadius: 3,
                    p: 2,
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "#ff2e63" + "33",
                      boxShadow: "0 8px 24px #ff2e6344",
                    },
                  }}
                >
                  <Typography
                    variant="subtitle2"
                    sx={{
                      color: "#aaa",
                      letterSpacing: 1,
                      textTransform: "uppercase",
                      fontWeight: 600,
                      mb: 1,
                    }}
                  >
                    Shorts
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#ff2e63",
                      fontWeight: 700,
                      textShadow: `0 0 12px #ff2e63`,
                      fontSize: "2rem",
                      lineHeight: 1.1,
                    }}
                  >
                    {short !== null && short !== undefined ? `${short}%` : "-"}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Grid>
        </Paper>
      </Box>
    </Box>
  );
}
