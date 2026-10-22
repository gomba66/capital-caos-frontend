import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  FormControl,
  Link,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { Link as RouterLink } from "react-router-dom";
import { useAuth } from "../contexts/authState";
import { translateAuthError } from "../utils/authErrors";

export default function Login({ serviceError }) {
  const { t, i18n } = useTranslation();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login({ email, password });
    } catch (loginError) {
      setError(loginError.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Box
      component="main"
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        p: 2,
        bgcolor: "background.default",
      }}
    >
      <Paper
        component="form"
        onSubmit={submit}
        elevation={4}
        sx={{ width: "100%", maxWidth: 420, p: { xs: 3, sm: 4 } }}
      >
        <Box
          display="flex"
          alignItems="center"
          justifyContent="space-between"
          gap={2}
          mb={2}
        >
          <Typography variant="overline" color="primary">
            Capital Caos
          </Typography>
          <FormControl size="small" sx={{ minWidth: 130 }}>
            <InputLabel id="login-language-label">{t("language.label")}</InputLabel>
            <Select
              labelId="login-language-label"
              value={i18n.resolvedLanguage === "es" ? "es" : "en"}
              label={t("language.label")}
              onChange={(event) => i18n.changeLanguage(event.target.value)}
            >
              <MenuItem value="en">{t("language.english")}</MenuItem>
              <MenuItem value="es">{t("language.spanish")}</MenuItem>
            </Select>
          </FormControl>
        </Box>
        <Typography variant="h4" component="h1" gutterBottom>
          {t("auth.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("auth.description")}
        </Typography>
        {(error || serviceError) && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {translateAuthError(error || serviceError, t)}
          </Alert>
        )}
        <TextField
          fullWidth
          required
          autoFocus
          type="email"
          label={t("auth.email")}
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          required
          type="password"
          label={t("auth.password")}
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          sx={{ mb: 3 }}
        />
        <Button
          fullWidth
          type="submit"
          variant="contained"
          disabled={submitting}
          startIcon={submitting ? <CircularProgress size={18} /> : null}
        >
          {submitting ? t("auth.signingIn") : t("auth.signIn")}
        </Button>
        <Box sx={{ mt: 2, textAlign: "center" }}>
          <Link component={RouterLink} to="/status" variant="body2">
            {t("systemStatusPage.publicLink")}
          </Link>
        </Box>
      </Paper>
    </Box>
  );
}
