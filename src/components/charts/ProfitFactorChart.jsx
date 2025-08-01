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
      // width="100%"
      mb={4}
      display="flex"
      justifyContent="center"
    >
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
          Profit Factor
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
            Profit factor is the ratio between gross profits and gross losses. A
            value greater than 1 indicates a profitable system.
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
            {/* Fila 1: Profit Factor Total */}
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
                  {total !== null ? total : "-"}
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
                    {long !== null ? long : "-"}
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
