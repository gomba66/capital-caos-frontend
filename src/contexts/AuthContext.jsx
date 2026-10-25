import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./authState";

const SESSION_CHECK_INTERVAL_MS = 10 * 1000;

async function readResponse(response) {
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(payload.detail || `Request failed (${response.status})`);
  }
  return payload;
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [sessionExpired, setSessionExpired] = useState(false);
  const [planChange, setPlanChange] = useState(null);
  const sessionCheckInFlight = useRef(false);
  const planChangeSequence = useRef(0);
  const themePreferenceQueue = useRef(Promise.resolve());
  const notificationPreferenceQueue = useRef(Promise.resolve());
  const languagePreferenceQueue = useRef(Promise.resolve());
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;
  const currentUser = useRef(user);
  currentUser.current = user;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSessionExpired(false);
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (response.status === 401) {
        setUser(null);
        return null;
      }
      const currentUser = await readResponse(response);
      setUser(currentUser);
      return currentUser;
    } catch (requestError) {
      setUser(null);
      setError(requestError.message);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const checkSession = useCallback(async () => {
    const userId = currentUserId.current;
    if (!userId || sessionCheckInFlight.current) return;

    sessionCheckInFlight.current = true;
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "same-origin",
        cache: "no-store",
      });
      if (currentUserId.current !== userId) return;
      if (response.status === 401) {
        setSessionExpired(true);
        setUser(null);
        return;
      }
      const refreshedUser = await readResponse(response);
      const previousUser = currentUser.current;
      if (previousUser?.id !== userId) return;
      if (JSON.stringify(previousUser) === JSON.stringify(refreshedUser)) return;
      if (previousUser.plan_code !== refreshedUser.plan_code) {
        planChangeSequence.current += 1;
        setPlanChange({
          id: planChangeSequence.current,
          from: previousUser.plan_code,
          to: refreshedUser.plan_code,
        });
      }
      currentUser.current = refreshedUser;
      setUser(refreshedUser);
    } catch (requestError) {
      console.warn("Could not verify the current account session:", requestError);
    } finally {
      sessionCheckInFlight.current = false;
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!user) return undefined;

    const checkWhenVisible = () =>
      document.visibilityState === "visible" ? checkSession() : undefined;
    const interval = window.setInterval(
      checkWhenVisible,
      SESSION_CHECK_INTERVAL_MS,
    );
    window.addEventListener("focus", checkWhenVisible);
    document.addEventListener("visibilitychange", checkWhenVisible);

    return () => {
      window.clearInterval(interval);
      window.removeEventListener("focus", checkWhenVisible);
      document.removeEventListener("visibilitychange", checkWhenVisible);
    };
  }, [checkSession, user]);

  const login = useCallback(async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const loggedInUser = await readResponse(response);
    setError(null);
    setSessionExpired(false);
    setPlanChange(null);
    setUser(loggedInUser);
    return loggedInUser;
  }, []);

  const logout = useCallback(async () => {
    const response = await fetch("/api/auth/logout", {
      method: "POST",
      credentials: "same-origin",
    });
    if (!response.ok && response.status !== 401) {
      await readResponse(response);
    }
    setSessionExpired(false);
    setPlanChange(null);
    setUser(null);
  }, []);

  const dismissPlanChange = useCallback(() => setPlanChange(null), []);

  const updateThemePreferences = useCallback(
    ({ mode, palette }) => {
      const userId = user?.id;
      const save = async () => {
        if (!userId || currentUserId.current !== userId) {
          throw new Error(
            "Theme preference update was superseded by an account change",
          );
        }
        const response = await fetch("/api/auth/preferences", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mode, palette }),
        });
        const preferences = await readResponse(response);
        setUser((current) =>
          current?.id === userId
            ? {
                ...current,
                theme_mode: preferences.theme_mode,
                theme_palette: preferences.theme_palette,
              }
            : current,
        );
        return preferences;
      };
      const pending = themePreferenceQueue.current.then(save, save);
      themePreferenceQueue.current = pending.catch(() => {});
      return pending;
    },
    [user?.id],
  );

  const updateNotificationSoundPreferences = useCallback(
    (preferences) => {
      const userId = user?.id;
      const save = async () => {
        if (!userId || currentUserId.current !== userId) {
          throw new Error(
            "Notification preferences update was superseded by an account change",
          );
        }
        const response = await fetch("/api/auth/notification-preferences", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(preferences),
        });
        const savedPreferences = await readResponse(response);
        setUser((current) =>
          current?.id === userId
            ? { ...current, notification_sounds: savedPreferences }
            : current,
        );
        return savedPreferences;
      };
      const pending = notificationPreferenceQueue.current.then(save, save);
      notificationPreferenceQueue.current = pending.catch(() => {});
      return pending;
    },
    [user?.id],
  );

  const updateLanguagePreference = useCallback(
    (language) => {
      const userId = user?.id;
      const save = async () => {
        if (!userId || currentUserId.current !== userId) {
          throw new Error(
            "Language preference update was superseded by an account change",
          );
        }
        const response = await fetch("/api/auth/language-preference", {
          method: "PUT",
          credentials: "same-origin",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ language }),
        });
        const preference = await readResponse(response);
        setUser((current) =>
          current?.id === userId
            ? {
                ...current,
                language_preference: preference.language_preference,
              }
            : current,
        );
        return preference;
      };
      const pending = languagePreferenceQueue.current.then(save, save);
      languagePreferenceQueue.current = pending.catch(() => {});
      return pending;
    },
    [user?.id],
  );

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      sessionExpired,
      planChange,
      dismissPlanChange,
      login,
      logout,
      refresh,
      updateThemePreferences,
      updateNotificationSoundPreferences,
      updateLanguagePreference,
    }),
    [
      user,
      loading,
      error,
      sessionExpired,
      planChange,
      dismissPlanChange,
      login,
      logout,
      refresh,
      updateThemePreferences,
      updateNotificationSoundPreferences,
      updateLanguagePreference,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
