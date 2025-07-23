import React from "react";
import { Box, Paper, Typography, Grid } from "@mui/material";
import { calculateProfitFactors } from "../../utils/formatting";

/**
 * Muestra el profit factor general, de longs y de shorts en tarjetas.
 * @param {Array} operations - Lista de operaciones cerradas.
 */
export default function ProfitFactorChart({
  operations,
  hideDescription = false,
}) {
  const { total, long, short } = calculateProfitFactors(operations);

  return (
    <Box
      width={{ xs: "100%", sm: 350, md: 360 }}
      mb={4}
      display="flex"
      justifyContent="center"
    >
      <Box>
        <Typography
          variant="h6"
          gutterBottom
          sx={{
            color: "#2de2e6",
            fontWeight: 700,
            textShadow: "0 0 8px #2de2e6",
          }}
        >
          Profit Factor
        </Typography>
        {!hideDescription && (
          <Typography
            variant="caption"
            color="secondary"
            sx={{ mb: 2, display: "block", color: "#2de2e6" }}
          >
            Profit factor is the ratio between gross profits and gross losses. A
            value greater than 1 indicates a profitable system.
          </Typography>
        )}
        <Paper
          sx={{
            p: 3,
            background: "#181c2f",
            borderRadius: 4,
            boxShadow: "0 0 24px #2de2e633",
          }}
        >
          <Grid container spacing={1} direction="column">
            {/* Fila 1: Profit Factor Total */}
            <Grid item>
              <Box
                sx={{
                  background: "#2de2e6" + "22",
                  borderRadius: 2,
                  p: 2,
                  textAlign: "center",
                }}
              >
                <Typography variant="subtitle2" color="textSecondary">
                  Profit Factor (Total)
                </Typography>
                <Typography
                  variant="h3"
                  sx={{
                    color: "#2de2e6",
                    fontWeight: 700,
                    textShadow: `0 0 8px #2de2e6`,
                  }}
                >
                  {total !== null ? total : "-"}
                </Typography>
              </Box>
            </Grid>
            {/* Fila 2: Long y Short, 50% cada uno */}
            <Grid
              container
              spacing={1}
              direction="row"
              alignItems="center"
              justifyContent="space-between"
            >
              <Grid item xs={6} sx={{ width: "48.5%" }}>
                <Box
                  sx={{
                    background: "#2de2a6" + "22",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Profit Factor (Longs)
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#2de2a6",
                      fontWeight: 700,
                      textShadow: `0 0 8px #2de2a6`,
                    }}
                  >
                    {long !== null ? long : "-"}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={6} sx={{ width: "48.5%" }}>
                <Box
                  sx={{
                    background: "#ff2e63" + "22",
                    borderRadius: 2,
                    p: 2,
                    textAlign: "center",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "center",
                  }}
                >
                  <Typography variant="subtitle2" color="textSecondary">
                    Profit Factor (Shorts)
                  </Typography>
                  <Typography
                    variant="h4"
                    sx={{
                      color: "#ff2e63",
                      fontWeight: 700,
                      textShadow: `0 0 8px #ff2e63`,
                    }}
                  >
                    {short !== null ? short : "-"}
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
