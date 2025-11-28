import React from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Chip,
  Tooltip,
  LinearProgress,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { TrendingUp, Info } from "@mui/icons-material";

const RiskLevelsInfo = ({ systemInfo }) => {
  if (!systemInfo?.capital) {
    return null;
  }

  const { capital } = systemInfo;
  const {
    available_balance,
    current_risk_level,
    next_risk_level,
    risk_levels,
  } = capital;

  // Calcular progreso hacia el siguiente nivel
  const progressToNext = next_risk_level
    ? ((available_balance - current_risk_level) /
        (next_risk_level - current_risk_level)) *
      100
    : 100;

  return (
    <Accordion
      sx={{
        mb: 2,
        background: "rgba(24,28,47,0.95)",
        "&:before": { display: "none" },
      }}
    >
      <AccordionSummary
        expandIcon={<ExpandMoreIcon sx={{ color: "#2de2e6" }} />}
        sx={{
          "&:hover": {
            backgroundColor: "rgba(45, 226, 230, 0.05)",
          },
        }}
      >
        <Box display="flex" alignItems="center">
          <Info sx={{ color: "#2de2e6", mr: 1 }} />
          <Typography sx={{ color: "#2de2e6", fontWeight: 600 }}>
            Información Detallada - Risk Levels
          </Typography>
        </Box>
      </AccordionSummary>
      <AccordionDetails>
        <Box>
          {/* Información del nivel actual */}
          <Box mb={3}>
            <Typography variant="h6" sx={{ color: "#ffa726", mb: 2 }}>
              Nivel de Capital Actual
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: "rgba(255, 167, 38, 0.1)",
                border: "1px solid rgba(255, 167, 38, 0.3)",
              }}
            >
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                mb={2}
              >
                <Typography variant="body1">
                  <strong>Balance Real:</strong> ${available_balance}
                </Typography>
                <Chip
                  label={`Nivel: $${current_risk_level}`}
                  sx={{
                    backgroundColor: "#ffa72630",
                    color: "#ffa726",
                    fontWeight: 600,
                  }}
                />
              </Box>

              {next_risk_level && (
                <Box>
                  <Box display="flex" justifyContent="space-between" mb={1}>
                    <Typography variant="body2" color="secondary">
                      Progreso al siguiente nivel (${next_risk_level}):
                    </Typography>
                    <Typography variant="body2" sx={{ color: "#27ff7e" }}>
                      {progressToNext.toFixed(1)}%
                    </Typography>
                  </Box>
                  <LinearProgress
                    variant="determinate"
                    value={Math.min(progressToNext, 100)}
                    sx={{
                      height: 8,
                      borderRadius: 4,
                      backgroundColor: "#444",
                      "& .MuiLinearProgress-bar": {
                        backgroundColor: "#27ff7e",
                        borderRadius: 4,
                      },
                    }}
                  />
                  <Typography
                    variant="caption"
                    color="secondary"
                    sx={{ mt: 1, display: "block" }}
                  >
                    Faltan ${(next_risk_level - available_balance).toFixed(2)}{" "}
                    para el siguiente nivel
                  </Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* Explicación del sistema */}
          <Box mb={3}>
            <Typography variant="h6" sx={{ color: "#2de2e6", mb: 2 }}>
              ¿Cómo Funciona el Sistema?
            </Typography>
            <Typography variant="body2" color="secondary" paragraph>
              El sistema utiliza niveles de capital predefinidos (RISK_LEVELS)
              para calcular el riesgo y el tamaño de las posiciones. Tu balance
              real se "redondea hacia abajo" al nivel más cercano para hacer
              cálculos más conservadores.
            </Typography>
            <Box
              sx={{
                p: 2,
                borderRadius: 2,
                background: "rgba(45, 226, 230, 0.05)",
              }}
            >
              <Typography variant="body2" sx={{ color: "#2de2e6" }}>
                <strong>Ejemplo:</strong> Si tu balance es ${available_balance},
                el sistema usa ${current_risk_level}
                para todos los cálculos de riesgo y tamaño de posición.
              </Typography>
            </Box>
          </Box>

          {/* Niveles disponibles */}
          <Box>
            <Typography variant="h6" sx={{ color: "#27ff7e", mb: 2 }}>
              Niveles de Capital (Progresión 2.5x)
            </Typography>
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(80px, 1fr))",
                gap: 1,
                p: 2,
                borderRadius: 2,
                background: "rgba(39, 255, 126, 0.05)",
              }}
            >
              {risk_levels.map((level, index) => (
                <Tooltip
                  key={level}
                  title={
                    level === current_risk_level
                      ? "Nivel Actual"
                      : `Nivel ${index + 1}`
                  }
                  placement="top"
                >
                  <Chip
                    label={`$${level}`}
                    size="small"
                    variant={
                      level === current_risk_level ? "filled" : "outlined"
                    }
                    sx={{
                      fontSize: "0.75rem",
                      backgroundColor:
                        level === current_risk_level
                          ? "#27ff7e30"
                          : level <= available_balance
                          ? "rgba(45, 226, 230, 0.1)"
                          : "transparent",
                      color:
                        level === current_risk_level
                          ? "#27ff7e"
                          : level <= available_balance
                          ? "#2de2e6"
                          : "#666",
                      borderColor:
                        level === current_risk_level
                          ? "#27ff7e"
                          : level <= available_balance
                          ? "#2de2e6"
                          : "#444",
                      "&:hover": {
                        backgroundColor:
                          level === current_risk_level
                            ? "#27ff7e50"
                            : "rgba(45, 226, 230, 0.2)",
                      },
                    }}
                  />
                </Tooltip>
              ))}
              <Chip
                label="..."
                size="small"
                variant="outlined"
                sx={{
                  fontSize: "0.75rem",
                  color: "#666",
                  borderColor: "#444",
                }}
              />
            </Box>
            <Typography
              variant="caption"
              color="secondary"
              sx={{ mt: 1, display: "block" }}
            >
              Se muestran los primeros 10 niveles. La progresión continúa
              multiplicando por 2.5x hasta 10M USDT.
            </Typography>
          </Box>
        </Box>
      </AccordionDetails>
    </Accordion>
  );
};

export default RiskLevelsInfo;
