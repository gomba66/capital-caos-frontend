import React from "react";
import { Box, Typography } from "@mui/material";
import { useTranslation } from "react-i18next";

export default function WinrateChart({ winrates, hideDescription = false }) {
  const { t } = useTranslation();
  const { total, long, short } = winrates || {};

  const formatRate = (value) =>
    value !== null && value !== undefined ? `${Math.round(value)}%` : "-";

  return (
    <Box mb={4} width={{ xs: "100%", sm: 280, md: 320 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: "text.primary", textAlign: "left" }}
      >
        {t("analyticsCharts.winrate")}
      </Typography>
      {!hideDescription && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block", textAlign: "left" }}
        >
          {t("analyticsCharts.winrateDescription")}
        </Typography>
      )}
      <Box sx={{ borderTop: "1px solid", borderColor: "divider" }}>
        <Box
          sx={{
            py: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
          >
            {t("performance.total")}
          </Typography>
          <Typography
            variant="h3"
            color="success.main"
            sx={{ fontWeight: 700, fontSize: "2.5rem", lineHeight: 1.1 }}
          >
            {formatRate(total)}
          </Typography>
        </Box>
        <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr" }}>
          <Box
            sx={{
              py: 2,
              pr: 2,
              borderRight: "1px solid",
              borderColor: "divider",
            }}
          >
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {t("performance.longs")}
            </Typography>
            <Typography variant="h4" color="success.main" sx={{ fontWeight: 700 }}>
              {formatRate(long)}
            </Typography>
          </Box>
          <Box sx={{ py: 2, pl: 2 }}>
            <Typography
              variant="caption"
              color="text.secondary"
              sx={{ textTransform: "uppercase", letterSpacing: "0.08em" }}
            >
              {t("performance.shorts")}
            </Typography>
            <Typography variant="h4" color="error.main" sx={{ fontWeight: 700 }}>
              {formatRate(short)}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
