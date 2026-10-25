import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Typography,
} from "@mui/material";
import { useTranslation } from "react-i18next";
import { useAuth } from "../contexts/authState";
import {
  DEFAULT_NOTIFICATION_SOUNDS,
  NOTIFICATION_SOUND_OPTIONS,
  NOTIFICATION_SOUND_TYPES,
  normalizeNotificationSoundPreferences,
  playNotificationSound,
} from "../utils/notificationSounds";
import {
  getBrowserNotificationPermission,
  requestBrowserNotificationPermission,
} from "../utils/browserNotifications";

export default function NotificationSoundSettings() {
  const { t } = useTranslation();
  const { user, updateNotificationSoundPreferences } = useAuth();
  const [notificationSounds, setNotificationSounds] = useState(
    DEFAULT_NOTIFICATION_SOUNDS,
  );
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState(null);
  const [permissionError, setPermissionError] = useState(false);
  const [browserPermission, setBrowserPermission] = useState(
    getBrowserNotificationPermission,
  );

  useEffect(() => {
    setNotificationSounds(
      normalizeNotificationSoundPreferences(user?.notification_sounds),
    );
  }, [user?.id, user?.notification_sounds]);

  const savePreferences = async () => {
    setSaving(true);
    setMessage(null);
    try {
      await updateNotificationSoundPreferences(notificationSounds);
      setMessage({ severity: "success", text: t("notificationSounds.saved") });
    } catch (error) {
      setMessage({
        severity: "error",
        text: t("notificationSounds.saveError", { message: error.message }),
      });
    } finally {
      setSaving(false);
    }
  };

  const enableBrowserNotifications = async () => {
    setPermissionError(false);
    try {
      const permission = await requestBrowserNotificationPermission();
      setBrowserPermission(permission);
    } catch (error) {
      console.warn("Could not request browser notification permission:", error);
      setPermissionError(true);
    }
  };

  return (
    <Paper sx={{ maxWidth: 620, p: 3 }}>
      <Typography variant="h6" gutterBottom>
        {t("notificationSounds.title")}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        {t("notificationSounds.description")}
      </Typography>
      <Box sx={{ mb: 2 }}>
        <Button
          type="button"
          variant="outlined"
          onClick={enableBrowserNotifications}
          disabled={browserPermission === "granted" || browserPermission === "unsupported"}
        >
          {t(`notificationSounds.browserPermission.${browserPermission}`)}
        </Button>
        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 0.5 }}>
          {permissionError
            ? t("notificationSounds.browserPermission.error")
            : t("notificationSounds.browserPermission.help")}
        </Typography>
      </Box>
      <Box display="flex" flexDirection="column" gap={2}>
        {NOTIFICATION_SOUND_TYPES.map((type) => {
          const labelId = `notification-sound-${type}-label`;
          return (
            <Box
              key={type}
              display="flex"
              alignItems="center"
              gap={1.5}
              flexWrap="wrap"
            >
              <FormControl size="small" sx={{ flex: "1 1 240px" }}>
                <InputLabel id={labelId}>
                  {t(`notificationSounds.types.${type}`)}
                </InputLabel>
                <Select
                  labelId={labelId}
                  id={`notification-sound-${type}`}
                  value={notificationSounds[type]}
                  label={t(`notificationSounds.types.${type}`)}
                  onChange={(event) =>
                    setNotificationSounds((current) => ({
                      ...current,
                      [type]: event.target.value,
                    }))
                  }
                >
                  {NOTIFICATION_SOUND_OPTIONS.map(({ id, labelKey }) => (
                    <MenuItem key={id} value={id}>
                      {t(labelKey)}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <Button
                type="button"
                variant="outlined"
                disabled={notificationSounds[type] === "none"}
                onClick={() =>
                  playNotificationSound(notificationSounds[type])
                }
              >
                {t("notificationSounds.preview")}
              </Button>
            </Box>
          );
        })}
        {message && <Alert severity={message.severity}>{message.text}</Alert>}
        <Box>
          <Button
            variant="contained"
            onClick={savePreferences}
            disabled={!user || saving}
          >
            {saving
              ? t("notificationSounds.saving")
              : t("notificationSounds.save")}
          </Button>
        </Box>
      </Box>
    </Paper>
  );
}
