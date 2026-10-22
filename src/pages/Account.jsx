import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Divider,
  IconButton,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/authState";
import { translateAuthError } from "../utils/authErrors";

export default function Account() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [showProfileDetails, setShowProfileDetails] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [message, setMessage] = useState(null);
  const [saving, setSaving] = useState(false);

  const changePassword = async (event) => {
    event.preventDefault();
    setMessage(null);
    if (newPassword !== confirmation) {
      setMessage({
        severity: "error",
        text: t("accountPage.passwordMismatch"),
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/auth/password", {
        method: "POST",
        credentials: "same-origin",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.detail || "");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmation("");
      setMessage({ severity: "success", text: t("accountPage.passwordUpdated") });
    } catch (error) {
      setMessage({
        severity: "error",
        text: translateAuthError(error.message, t),
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Typography variant="h4" gutterBottom>
        {t("accountPage.title")}
      </Typography>
      <Paper sx={{ maxWidth: 620, p: 3, mb: 3 }}>
        <Box display="flex" justifyContent="space-between" alignItems="flex-start">
          <Box
            sx={{
              filter: showProfileDetails ? "none" : "blur(5px)",
              transition: "filter 160ms ease",
            }}
            data-testid="account-profile-details"
          >
            <Typography variant="h6">
              {user?.display_name || user?.email}
            </Typography>
            <Typography color="text.secondary">{user?.email}</Typography>
          </Box>
          <IconButton
            size="small"
            onClick={() => setShowProfileDetails((visible) => !visible)}
            aria-label={t(
              showProfileDetails
                ? "accountPage.hideDetails"
                : "accountPage.showDetails",
            )}
            title={t(
              showProfileDetails
                ? "accountPage.hideDetails"
                : "accountPage.showDetails",
            )}
          >
            {showProfileDetails ? <VisibilityOffIcon /> : <VisibilityIcon />}
          </IconButton>
        </Box>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2">
          {t("accountPage.currentPlan", {
            plan: t(`usersPage.${user?.plan_code}Plan`),
          })}
        </Typography>
      </Paper>
      <Paper
        component="form"
        onSubmit={changePassword}
        sx={{ maxWidth: 620, p: 3 }}
      >
        <Typography variant="h6" gutterBottom>
          {t("accountPage.changePassword")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {t("accountPage.passwordHelp")}
        </Typography>
        {message && (
          <Alert severity={message.severity} sx={{ mb: 2 }}>
            {message.text}
          </Alert>
        )}
        <TextField
          fullWidth
          required
          type="password"
          label={t("accountPage.currentPassword")}
          autoComplete="current-password"
          value={currentPassword}
          onChange={(event) => setCurrentPassword(event.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          required
          type="password"
          label={t("accountPage.newPassword")}
          autoComplete="new-password"
          inputProps={{ minLength: 12 }}
          value={newPassword}
          onChange={(event) => setNewPassword(event.target.value)}
          sx={{ mb: 2 }}
        />
        <TextField
          fullWidth
          required
          type="password"
          label={t("accountPage.confirmPassword")}
          autoComplete="new-password"
          inputProps={{ minLength: 12 }}
          value={confirmation}
          onChange={(event) => setConfirmation(event.target.value)}
          sx={{ mb: 2 }}
        />
        <Button type="submit" variant="contained" disabled={saving}>
          {saving ? t("accountPage.saving") : t("accountPage.savePassword")}
        </Button>
      </Paper>
    </Box>
  );
}
