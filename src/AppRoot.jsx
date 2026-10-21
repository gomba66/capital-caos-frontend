import { useLayoutEffect, useMemo, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import createAppTheme, { APP_PALETTES } from "./theme";
import { PlatformThemeContext } from "./contexts/AppContexts";
import NotificationProvider from "./contexts/NotificationProvider";

export default function AppRoot() {
  const [mode, setMode] = useState(
    () => (localStorage.getItem("market-watch-theme") === "light" ? "light" : "dark"),
  );
  const [palette, setPalette] = useState(() => {
    const storedPalette = localStorage.getItem("market-watch-palette");
    return APP_PALETTES.some(({ id }) => id === storedPalette)
      ? storedPalette
      : "classic";
  });
  const theme = useMemo(() => createAppTheme(mode, palette), [mode, palette]);

  useLayoutEffect(() => {
    document.documentElement.dataset.theme = mode;
    document.documentElement.dataset.palette = palette;
    localStorage.setItem("market-watch-theme", mode);
    localStorage.setItem("market-watch-palette", palette);
  }, [mode, palette]);

  useLayoutEffect(() => {
    const syncTheme = (event) => {
      setMode(event.detail === "dark" ? "dark" : "light");
    };
    window.addEventListener("cipherDeskThemeChange", syncTheme);
    return () => window.removeEventListener("cipherDeskThemeChange", syncTheme);
  }, []);

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <PlatformThemeContext.Provider
        value={{ mode, setMode, palette, setPalette }}
      >
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </PlatformThemeContext.Provider>
    </ThemeProvider>
  );
}
