import { useCallback, useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Switch,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VisibilityOffIcon from "@mui/icons-material/VisibilityOff";
import { useAuth } from "../contexts/authState";
import { translateAuthError } from "../utils/authErrors";

async function adminRequest(url, options) {
  const response = await fetch(url, {
    credentials: "same-origin",
    ...options,
    headers: {
      ...(options?.body ? { "Content-Type": "application/json" } : {}),
      ...options?.headers,
    },
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(payload.detail || `Error ${response.status}`);
  return payload;
}

export default function AdminUsers() {
  const { t, i18n } = useTranslation();
  const { user: currentUser } = useAuth();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [form, setForm] = useState({
    email: "",
    display_name: "",
    password: "",
    plan_code: "no_access",
  });
  const [resetUser, setResetUser] = useState(null);
  const [resetPassword, setResetPassword] = useState("");
  const [resetError, setResetError] = useState("");
  const [showMemberDetails, setShowMemberDetails] = useState(false);
  const [visibleAdminDetails, setVisibleAdminDetails] = useState({});

  const loadUsers = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const payload = await adminRequest("/api/admin/users");
      setUsers(payload.users);
    } catch (requestError) {
      setError(translateAuthError(requestError.message, t));
    } finally {
      setLoading(false);
    }
  }, [t]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const updateUser = async (user, changes) => {
    setError("");
    setNotice("");
    try {
      await adminRequest(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        body: JSON.stringify(changes),
      });
      setNotice(t("usersPage.userUpdated", { email: user.email }));
      await loadUsers();
    } catch (requestError) {
      setError(translateAuthError(requestError.message, t));
    }
  };

  const createUser = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    try {
      await adminRequest("/api/admin/users", {
        method: "POST",
        body: JSON.stringify(form),
      });
      setDialogOpen(false);
      setForm({
        email: "",
        display_name: "",
        password: "",
        plan_code: "no_access",
      });
      setNotice(t("usersPage.accountCreated"));
      await loadUsers();
    } catch (requestError) {
      setError(translateAuthError(requestError.message, t));
    } finally {
      setSaving(false);
    }
  };

  const savePasswordReset = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setResetError("");
    try {
      await adminRequest(`/api/admin/users/${resetUser.id}`, {
        method: "PATCH",
        body: JSON.stringify({ password: resetPassword }),
      });
      setResetUser(null);
      setResetPassword("");
      setNotice(
        t("usersPage.passwordResetDone", { email: resetUser.email }),
      );
    } catch (requestError) {
      setResetError(translateAuthError(requestError.message, t));
    } finally {
      setSaving(false);
    }
  };

  return (
    <Box p={{ xs: 2, sm: 3, md: 4 }}>
      <Box
        display="flex"
        justifyContent="space-between"
        alignItems="center"
        gap={2}
        flexWrap="wrap"
        mb={3}
      >
        <Box>
          <Typography variant="h4">{t("usersPage.title")}</Typography>
          <Typography color="text.secondary">
            {t("usersPage.description")}
          </Typography>
        </Box>
        <Box display="flex" gap={1} flexWrap="wrap">
          <Button
            variant="outlined"
            startIcon={
              showMemberDetails ? <VisibilityOffIcon /> : <VisibilityIcon />
            }
            onClick={() => setShowMemberDetails((visible) => !visible)}
          >
            {t(
              showMemberDetails
                ? "usersPage.hideMemberEmails"
                : "usersPage.showMemberEmails",
            )}
          </Button>
          <Button variant="contained" onClick={() => setDialogOpen(true)}>
            {t("usersPage.createUser")}
          </Button>
        </Box>
      </Box>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}
      {notice && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {notice}
        </Alert>
      )}
      <Paper sx={{ overflowX: "auto" }}>
        {loading ? (
          <Box display="flex" justifyContent="center" p={5}>
            <CircularProgress />
          </Box>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>{t("usersPage.account")}</TableCell>
                <TableCell>{t("usersPage.role")}</TableCell>
                <TableCell>{t("usersPage.plan")}</TableCell>
                <TableCell align="center">{t("usersPage.active")}</TableCell>
                <TableCell>{t("usersPage.created")}</TableCell>
                <TableCell>{t("usersPage.actions")}</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box
                        sx={{
                          filter:
                            user.role === "admin"
                              ? visibleAdminDetails[user.id]
                                ? "none"
                                : "blur(5px)"
                              : showMemberDetails
                                ? "none"
                                : "blur(5px)",
                          transition: "filter 160ms ease",
                        }}
                        data-testid={`user-details-${user.id}`}
                      >
                        <Typography fontWeight={600}>
                          {user.display_name || user.email}
                        </Typography>
                        {user.display_name && (
                          <Typography variant="caption" color="text.secondary">
                            {user.email}
                          </Typography>
                        )}
                      </Box>
                      {user.role === "admin" && (
                        <IconButton
                          size="small"
                          onClick={() =>
                            setVisibleAdminDetails((visible) => ({
                              ...visible,
                              [user.id]: !visible[user.id],
                            }))
                          }
                          aria-label={t(
                            visibleAdminDetails[user.id]
                              ? "usersPage.hideAdminDetails"
                              : "usersPage.showAdminDetails",
                            { email: user.email },
                          )}
                          title={t(
                            visibleAdminDetails[user.id]
                              ? "usersPage.hideAdminDetails"
                              : "usersPage.showAdminDetails",
                          )}
                        >
                          {visibleAdminDetails[user.id] ? (
                            <VisibilityOffIcon fontSize="small" />
                          ) : (
                            <VisibilityIcon fontSize="small" />
                          )}
                        </IconButton>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell>
                    {t(
                      user.role === "admin"
                        ? "usersPage.admin"
                        : "usersPage.member",
                    )}
                  </TableCell>
                  <TableCell>
                    <FormControl size="small" sx={{ minWidth: 180 }}>
                      <InputLabel id={`plan-${user.id}`}>
                        {t("usersPage.plan")}
                      </InputLabel>
                      <Select
                        labelId={`plan-${user.id}`}
                        value={user.plan_code}
                        label={t("usersPage.plan")}
                        onChange={(event) =>
                          updateUser(user, { plan_code: event.target.value })
                        }
                      >
                        {["no_access", "signals", "whatsapp", "complete"].map((planCode) => (
                          <MenuItem key={planCode} value={planCode}>
                            {t(`usersPage.${planCode}Plan`)}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </TableCell>
                  <TableCell align="center">
                    <Switch
                      checked={user.is_active}
                      inputProps={{
                        "aria-label": t("usersPage.accountActive", {
                          email: user.email,
                        }),
                      }}
                      onChange={(event) =>
                        updateUser(user, { is_active: event.target.checked })
                      }
                    />
                  </TableCell>
                  <TableCell>
                    {user.created_at
                      ? new Date(user.created_at).toLocaleDateString(
                          i18n.resolvedLanguage,
                        )
                      : "—"}
                  </TableCell>
                  <TableCell>
                    {user.id !== currentUser?.id && (
                      <Button
                        size="small"
                        onClick={() => setResetUser(user)}
                      >
                        {t("usersPage.changePassword")}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    {t("usersPage.noUsers")}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => !saving && setDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <Box component="form" onSubmit={createUser}>
          <DialogTitle>{t("usersPage.createAccount")}</DialogTitle>
          <DialogContent sx={{ display: "grid", gap: 2, pt: "12px !important" }}>
            <TextField
              required
              type="email"
              label={t("usersPage.email")}
              autoComplete="off"
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
            />
            <TextField
              label={t("usersPage.displayName")}
              value={form.display_name}
              onChange={(event) =>
                setForm({ ...form, display_name: event.target.value })
              }
            />
            <TextField
              required
              type="password"
              label={t("usersPage.initialPassword")}
              autoComplete="new-password"
              inputProps={{ minLength: 12 }}
              value={form.password}
              onChange={(event) =>
                setForm({ ...form, password: event.target.value })
              }
            />
            <FormControl>
              <InputLabel id="new-user-plan">
                {t("usersPage.plan")}
              </InputLabel>
              <Select
                labelId="new-user-plan"
                label={t("usersPage.plan")}
                value={form.plan_code}
                onChange={(event) =>
                  setForm({ ...form, plan_code: event.target.value })
                }
              >
                {["no_access", "signals", "whatsapp", "complete"].map((planCode) => (
                  <MenuItem key={planCode} value={planCode}>
                    {t(`usersPage.${planCode}Plan`)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setDialogOpen(false)} disabled={saving}>
              {t("usersPage.cancel")}
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? t("usersPage.creating") : t("usersPage.create")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      <Dialog
        open={Boolean(resetUser)}
        onClose={() => {
          if (!saving) {
            setResetUser(null);
            setResetError("");
          }
        }}
        fullWidth
        maxWidth="xs"
      >
        <Box component="form" onSubmit={savePasswordReset}>
          <DialogTitle>{t("usersPage.resetPassword")}</DialogTitle>
          <DialogContent sx={{ pt: "12px !important" }}>
            <Typography color="text.secondary" sx={{ mb: 2 }}>
              {t("usersPage.resetPasswordHelp")}
            </Typography>
            {resetError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {resetError}
              </Alert>
            )}
            <TextField
              autoFocus
              fullWidth
              required
              type="password"
              label={t("usersPage.newPassword")}
              autoComplete="new-password"
              inputProps={{ minLength: 12 }}
              value={resetPassword}
              onChange={(event) => setResetPassword(event.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button
              onClick={() => {
                setResetUser(null);
                setResetError("");
              }}
              disabled={saving}
            >
              {t("usersPage.cancel")}
            </Button>
            <Button type="submit" variant="contained" disabled={saving}>
              {saving ? t("usersPage.resetting") : t("usersPage.reset")}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
