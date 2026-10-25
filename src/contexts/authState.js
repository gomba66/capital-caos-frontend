import { createContext, useContext } from "react";

export const AuthContext = createContext({
  user: null,
  loading: true,
  error: null,
  sessionExpired: false,
  planChange: null,
  dismissPlanChange: () => {},
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
