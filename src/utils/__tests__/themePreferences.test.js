import { describe, expect, test } from "vitest";
import {
  normalizeThemePreferences,
  readThemePreferences,
  saveThemePreferences,
} from "../themePreferences";
import {
  APP_PALETTES,
  getAdminExperimentCssVariables,
  normalizePaletteMode,
} from "../../theme";

function createStorage(values = {}) {
  const store = new Map(Object.entries(values));
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => store.set(key, value),
  };
}

describe("theme preferences", () => {
  test("registers only the requested themes", () => {
    expect(APP_PALETTES.map(({ id }) => id)).toEqual([
      "classic",
      "ocean",
      "violet",
      "admin-obsidian",
      "admin-cyberpunk",
      "admin-monochrome",
      "admin-deep-ocean",
      "admin-lime",
      "admin-arctic",
      "admin-copper",
    ]);
    expect(
      APP_PALETTES.filter(({ id }) => id.startsWith("admin-")),
    ).toHaveLength(7);
    expect(APP_PALETTES.some(({ id }) => id === "graphite")).toBe(false);
  });

  test("creates theme variables for experimental palettes and none for regular palettes", () => {
    expect(
      getAdminExperimentCssVariables("dark", "admin-arctic")["--green"],
    ).toBe("#65d9ff");
    expect(getAdminExperimentCssVariables("light", "classic")).toEqual({});
  });

  test("uses a softer Cyberpunk accent in light mode", () => {
    expect(
      getAdminExperimentCssVariables("light", "admin-cyberpunk")["--green"],
    ).toBe("#a8328f");
  });

  test.each(["admin-monochrome", "admin-lime", "admin-arctic"])(
    "only permits dark mode for %s",
    (palette) => {
      expect(normalizePaletteMode("light", palette)).toBe("dark");
      expect(normalizePaletteMode("dark", palette)).toBe("dark");
    },
  );

  test("normalizes account preferences for the current role", () => {
    expect(
      normalizeThemePreferences("member", {
        mode: "light",
        palette: "admin-copper",
      }),
    ).toEqual({ mode: "light", palette: "classic" });
    expect(
      normalizeThemePreferences("admin", {
        mode: "light",
        palette: "admin-arctic",
      }),
    ).toEqual({ mode: "dark", palette: "admin-arctic" });
  });

  test("keeps the administrator's existing default palette", () => {
    expect(readThemePreferences("admin", 1, createStorage())).toEqual({
      mode: "dark",
      palette: "admin-copper",
    });
  });

  test.each(["admin-monochrome", "admin-lime", "admin-arctic"])(
    "forces dark mode for %s",
    (palette) => {
      const storage = createStorage({
        "market-watch-theme:admin:1": "light",
        "market-watch-palette:admin:1": palette,
      });

      expect(readThemePreferences("admin", 1, storage)).toEqual({
        mode: "dark",
        palette,
      });
      saveThemePreferences("admin", 1, { mode: "light", palette }, storage);
      expect(storage.getItem("market-watch-theme:admin:1")).toBe("dark");
    },
  );

  test("replaces a removed palette from saved preferences", () => {
    const storage = createStorage({
      "market-watch-theme:admin:1": "dark",
      "market-watch-palette:admin:1": "graphite",
    });

    expect(readThemePreferences("admin", 1, storage)).toEqual({
      mode: "dark",
      palette: "admin-copper",
    });
  });

  test("keeps the existing user-selected theme as the member fallback", () => {
    const storage = createStorage({
      "market-watch-theme": "light",
      "market-watch-palette": "ocean",
    });

    expect(readThemePreferences("member", 2, storage)).toEqual({
      mode: "light",
      palette: "ocean",
    });
  });

  test("persists preferences separately for each account", () => {
    const storage = createStorage();
    saveThemePreferences("admin", 1, { mode: "light", palette: "violet" }, storage);
    saveThemePreferences("member", 2, { mode: "dark", palette: "ocean" }, storage);

    expect(readThemePreferences("admin", 1, storage)).toEqual({
      mode: "light",
      palette: "violet",
    });
    expect(readThemePreferences("member", 2, storage)).toEqual({
      mode: "dark",
      palette: "ocean",
    });
  });

  test.each(APP_PALETTES.filter(({ adminOnly }) => adminOnly).map(({ id }) => id))(
    "does not allow members to load or save %s",
    (adminPalette) => {
    const storage = createStorage({
      "market-watch-theme:member:2": "dark",
      "market-watch-palette:member:2": adminPalette,
    });

    expect(readThemePreferences("member", 2, storage)).toEqual({
      mode: "dark",
      palette: "classic",
    });
    saveThemePreferences(
      "member",
      2,
      { mode: "dark", palette: adminPalette },
      storage,
    );
    expect(storage.getItem("market-watch-palette:member:2")).toBe("classic");
    },
  );
});
