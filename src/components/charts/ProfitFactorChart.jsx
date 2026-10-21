import React from "react";
import { Box, Typography } from "@mui/material";
import { calculateProfitFactors } from "../../utils/formatting";
import { useTranslation } from "react-i18next";

export default function ProfitFactorChart({
  operations,
  hideDescription = false,
}) {
  const { t } = useTranslation();
  const { total, long, short } = calculateProfitFactors(operations);

  return (
    <Box mb={4} width={{ xs: "100%", sm: 280, md: 320 }}>
      <Typography
        variant="h6"
        gutterBottom
        sx={{ color: "text.primary", textAlign: "left" }}
      >
        {t("analyticsCharts.profitFactor")}
      </Typography>
      {!hideDescription && (
        <Typography
          variant="caption"
          color="text.secondary"
          sx={{ mb: 2, display: "block", textAlign: "left" }}
        >
          {t("analyticsCharts.profitFactorDescription")}
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
            {total !== null ? total : "-"}
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
              {long !== null ? long : "-"}
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
              {short !== null ? short : "-"}
            </Typography>
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
