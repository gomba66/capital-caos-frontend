import {
  APP_PALETTES,
  getPaletteDefinition,
  normalizePaletteMode,
} from "../theme";

const LEGACY_THEME_KEY = "market-watch-theme";
const LEGACY_PALETTE_KEY = "market-watch-palette";

function isAvailablePalette(palette, role) {
  const selectedPalette = APP_PALETTES.find(({ id }) => id === palette);
  return Boolean(selectedPalette && (!selectedPalette.adminOnly || role === "admin"));
}

function fallbackPalette(role) {
  return role === "admin" ? "admin-copper" : "classic";
}

function normalizePalette(palette, role) {
  const selectedPalette = isAvailablePalette(palette, role)
    ? getPaletteDefinition(palette)
    : null;
  return selectedPalette ? selectedPalette.id : fallbackPalette(role);
}

export function normalizeThemePreferences(role, { mode, palette }) {
  const selectedPalette = normalizePalette(palette, role);
  return {
    mode: normalizePaletteMode(mode === "light" ? "light" : "dark", selectedPalette),
    palette: selectedPalette,
  };
}

function preferenceKeys(role, userId) {
  const scope = userId ? `${role}:${userId}` : role;
  return {
    theme: `market-watch-theme:${scope}`,
    palette: `market-watch-palette:${scope}`,
  };
}

export function readThemePreferences(
  role,
  userId,
  storage = window.localStorage,
) {
  const keys = preferenceKeys(role, userId);
  const savedMode = storage.getItem(keys.theme);
  const savedPalette = storage.getItem(keys.palette);

  if (savedMode || savedPalette) {
    return normalizeThemePreferences(role, {
      mode: savedMode,
      palette: savedPalette,
    });
  }

  if (role === "admin") return { mode: "dark", palette: "admin-copper" };

  const palette = normalizePalette(storage.getItem(LEGACY_PALETTE_KEY), role);
  return {
    mode: normalizePaletteMode(
      storage.getItem(LEGACY_THEME_KEY) === "light" ? "light" : "dark",
      palette,
    ),
    palette,
  };
}

export function saveThemePreferences(
  role,
  userId,
  { mode, palette },
  storage = window.localStorage,
) {
  const keys = preferenceKeys(role, userId);
  const preferences = normalizeThemePreferences(role, { mode, palette });
  storage.setItem(keys.theme, preferences.mode);
  storage.setItem(keys.palette, preferences.palette);
}
