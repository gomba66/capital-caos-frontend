import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  login: async () => {},
  logout: async () => {},
  refresh: async () => {},
  updateThemePreferences: async () => {},
  updateNotificationSoundPreferences: async () => {},
  updateLanguagePreference: async () => {},
});

export function useAuth() {
  return useContext(AuthContext);
}
