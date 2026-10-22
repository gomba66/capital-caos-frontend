import { useLayoutEffect, useMemo, useRef, useState } from "react";
import { CssBaseline, ThemeProvider } from "@mui/material";
import App from "./App";
import createAppTheme, {
  APP_PALETTES,
  getAdminExperimentCssVariables,
  normalizePaletteMode,
} from "./theme";
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
  const appliedPaletteVariables = useRef([]);
  const effectiveMode = normalizePaletteMode(mode, palette);
  const theme = useMemo(
    () => createAppTheme(effectiveMode, palette),
    [effectiveMode, palette],
  );

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.dataset.theme = effectiveMode;
    root.dataset.palette = palette;
    appliedPaletteVariables.current.forEach((name) =>
      root.style.removeProperty(name),
    );
    const variables = getAdminExperimentCssVariables(effectiveMode, palette);
    Object.entries(variables).forEach(([name, value]) =>
      root.style.setProperty(name, value),
    );
    appliedPaletteVariables.current = Object.keys(variables);
  }, [effectiveMode, palette]);

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
        value={{ mode: effectiveMode, setMode, palette, setPalette }}
      >
        <NotificationProvider>
          <App />
        </NotificationProvider>
      </PlatformThemeContext.Provider>
    </ThemeProvider>
  );
}
