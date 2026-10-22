import { Box, Button, Paper, Typography } from "@mui/material";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";

export default function Upgrade() {
  const { t } = useTranslation();

  return (
    <Box sx={{ maxWidth: 760, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <Paper
        variant="outlined"
        sx={{
          p: { xs: 3, sm: 5 },
          border: "1px solid var(--line)",
          bgcolor: "var(--white)",
        }}
      >
        <Typography variant="overline" color="primary">
          {t("upgradePage.eyebrow")}
        </Typography>
        <Typography component="h1" variant="h4" gutterBottom>
          {t("upgradePage.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("upgradePage.description")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("upgradePage.paymentsUnavailable")}
        </Typography>
        <Button
          component={RouterLink}
          to="/"
          variant="outlined"
          startIcon={<ArrowBackIcon />}
        >
          {t("upgradePage.backToDashboard")}
        </Button>
      </Paper>
    </Box>
  );
}
