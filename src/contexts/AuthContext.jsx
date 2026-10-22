import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AuthContext } from "./authState";

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
  const themePreferenceQueue = useRef(Promise.resolve());
  const currentUserId = useRef(user?.id);
  currentUserId.current = user?.id;

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
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

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = useCallback(async (credentials) => {
    const response = await fetch("/api/auth/login", {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(credentials),
    });
    const loggedInUser = await readResponse(response);
    setError(null);
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
    setUser(null);
  }, []);

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

  const value = useMemo(
    () => ({
      user,
      loading,
      error,
      login,
      logout,
      refresh,
      updateThemePreferences,
    }),
    [user, loading, error, login, logout, refresh, updateThemePreferences],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
