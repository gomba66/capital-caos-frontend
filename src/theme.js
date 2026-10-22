import { createTheme } from "@mui/material/styles";

const ADMIN_EXPERIMENT_PALETTES = [
  { id: "admin-cyberpunk", color: "#ff4fd8", lightColor: "#a8328f", lightPaper: "#fcfafc", darkPaper: "#211421" },
  { id: "admin-monochrome", color: "#c4ccd8", lightPaper: "#f1f2f4", darkPaper: "#181a1e", darkOnly: true },
  { id: "admin-deep-ocean", color: "#25c6da", lightPaper: "#edf7f8", darkPaper: "#0f1c21" },
  { id: "admin-lime", color: "#c1f26b", lightPaper: "#f4f8eb", darkPaper: "#1a1e12", darkOnly: true },
  { id: "admin-arctic", color: "#65d9ff", lightPaper: "#eff8fb", darkPaper: "#101b24", darkOnly: true },
];

export const APP_PALETTES = [
  { id: "classic", color: "#71d6ae" },
  { id: "ocean", color: "#58c7d3" },
  { id: "violet", color: "#b6a2ff" },
  { id: "admin-obsidian", color: "#45d6c0", adminOnly: true },
  ...ADMIN_EXPERIMENT_PALETTES.map(
    ({ id, color, lightColor, darkOnly }) => ({
      id,
      color,
      lightColor,
      adminOnly: true,
      darkOnly: darkOnly === true,
    }),
  ),
  { id: "admin-copper", color: "#d79462", adminOnly: true },
];

export function getPaletteDefinition(paletteId) {
  return APP_PALETTES.find(({ id }) => id === paletteId);
}

export function normalizePaletteMode(mode, paletteId) {
  return getPaletteDefinition(paletteId)?.darkOnly
    ? "dark"
    : mode === "light"
      ? "light"
      : "dark";
}

const adminExperimentById = new Map(
  ADMIN_EXPERIMENT_PALETTES.map((palette) => [palette.id, palette]),
);

function mixHexColors(color, target, targetWeight) {
  const channels = [1, 3, 5].map((offset) => {
    const sourceChannel = Number.parseInt(color.slice(offset, offset + 2), 16);
    const targetChannel = Number.parseInt(target.slice(offset, offset + 2), 16);
    return Math.round(
      sourceChannel * (1 - targetWeight) + targetChannel * targetWeight,
    )
      .toString(16)
      .padStart(2, "0");
  });
  return `#${channels.join("")}`;
}

function hexToRgba(color, opacity) {
  const channels = [1, 3, 5].map((offset) =>
    Number.parseInt(color.slice(offset, offset + 2), 16),
  );
  return `rgba(${channels.join(", ")}, ${opacity})`;
}

export function getAdminExperimentCssVariables(mode, paletteId) {
  const selected = adminExperimentById.get(paletteId);
  if (!selected) return {};

  const dark = mode === "dark";
  const accent = dark ? selected.color : selected.lightColor || selected.color;
  const paper = dark ? selected.darkPaper : selected.lightPaper;
  const surface = mixHexColors(paper, "#ffffff", dark ? 0.22 : 0.28);
  const ink = dark ? "#edf2f8" : "#202633";
  const muted = dark ? "#a3afc1" : "#748096";
  const line = mixHexColors(
    dark ? "#303846" : "#d9dee7",
    accent,
    dark ? 0.24 : 0.18,
  );
  const accentSoft = mixHexColors(surface, accent, 0.19);
  const accentFill = mixHexColors(paper, accent, 0.26);
  const secondary = dark ? "#edb46f" : "#a66b2c";
  const shadow = dark ? "rgba(0, 0, 0, 0.32)" : "rgba(20, 32, 26, 0.1)";

  return {
    "--ink": ink,
    "--muted": muted,
    "--line": line,
    "--paper": paper,
    "--white": surface,
    "--green": accent,
    "--green-soft": accentSoft,
    "--amber": secondary,
    "--amber-soft": dark ? "#403323" : "#f5eadb",
    "--surface-muted": mixHexColors(paper, ink, 0.18),
    "--surface-hover": mixHexColors(surface, accent, 0.1),
    "--line-soft": mixHexColors(line, paper, 0.3),
    "--text-secondary": mixHexColors(ink, muted, 0.18),
    "--text-subtle": muted,
    "--green-ink": accent,
    "--green-fill": accentFill,
    "--green-wash": accentSoft,
    "--amber-ink": secondary,
    "--coral": accent,
    "--neutral-fill": mixHexColors(paper, ink, 0.14),
    "--neutral-ink": muted,
    "--score-fill": accentSoft,
    "--score-ink": accent,
    "--strong-fill": accentSoft,
    "--strong-ink": accent,
    "--history-fill": accent,
    "--history-hot": secondary,
    "--surface-error": dark ? "#382522" : "#fbf0ec",
    "--error-border": dark ? "#73483e" : "#e7c9bf",
    "--error-ink": dark ? "#ffc0b4" : "#8f463a",
    "--brand-tile": surface,
    "--brand-mark": accent,
    "--grid-line": hexToRgba(accent, 0.05),
    "--grid-separator": line,
    "--grid-separator-soft": line,
    "--dot-idle": muted,
    "--dot-live": accent,
    "--focus-ring": hexToRgba(accent, 0.45),
    "--shadow": shadow,
    "--warm-brown": secondary,
    "--session-bg": accentSoft,
    "--session-line": accent,
    "--session-text": accent,
  };
}

const palettes = {
  classic: {
    light: {
      ink: "#17201d",
      muted: "#78817c",
      line: "#d9ded7",
      paper: "#f1f3ee",
      surface: "#fbfcf9",
      green: "#087e61",
      greenSoft: "#ddf1e9",
      amber: "#ad5c18",
      red: "#b8423b",
    },
    dark: {
      ink: "#e5ece7",
      muted: "#929f98",
      line: "#35433d",
      paper: "#141a17",
      surface: "#202925",
      green: "#71d6ae",
      greenSoft: "#1e3b30",
      amber: "#edb46f",
      red: "#ef8b7f",
    },
  },
  ocean: {
    light: {
      ink: "#14282f",
      muted: "#6d828a",
      line: "#ccdde2",
      paper: "#eef5f7",
      surface: "#fbfdfe",
      green: "#087e91",
      greenSoft: "#ddf2f4",
      amber: "#a56a26",
      red: "#b8423b",
    },
    dark: {
      ink: "#e4f2f4",
      muted: "#8fa8b0",
      line: "#31464d",
      paper: "#101b20",
      surface: "#1a2a30",
      green: "#58c7d3",
      greenSoft: "#1e3940",
      amber: "#edb46f",
      red: "#ef8b7f",
    },
  },
  violet: {
    light: {
      ink: "#252238",
      muted: "#79748c",
      line: "#d9d5e7",
      paper: "#f2f0f8",
      surface: "#fcfbff",
      green: "#6654b0",
      greenSoft: "#e9e5f8",
      amber: "#a66b2c",
      red: "#b8423b",
    },
    dark: {
      ink: "#e9e5f6",
      muted: "#a49cbb",
      line: "#403b54",
      paper: "#191724",
      surface: "#252236",
      green: "#b6a2ff",
      greenSoft: "#342d4e",
      amber: "#edb46f",
      red: "#ef8b7f",
    },
  },
  "admin-obsidian": {
    light: {
      ink: "#1b2b2e",
      muted: "#6c8585",
      line: "#cbdedc",
      paper: "#eef6f5",
      surface: "#fbfefd",
      green: "#167e75",
      greenSoft: "#d5efeb",
      amber: "#a66b2c",
      red: "#b8423b",
    },
    dark: {
      ink: "#e4f4f2",
      muted: "#91b2ae",
      line: "#304a49",
      paper: "#10191d",
      surface: "#19272b",
      green: "#45d6c0",
      greenSoft: "#203e3c",
      amber: "#e9b274",
      red: "#ff8b91",
    },
  },
  "admin-copper": {
    light: {
      ink: "#34271f",
      muted: "#8a7567",
      line: "#e4d3c6",
      paper: "#f7f1ec",
      surface: "#fefcfa",
      green: "#9c5e36",
      greenSoft: "#f2e1d4",
      amber: "#9c5e36",
      red: "#b8423b",
    },
    dark: {
      ink: "#f3e8df",
      muted: "#baa292",
      line: "#514036",
      paper: "#211b17",
      surface: "#302620",
      green: "#d79462",
      greenSoft: "#493426",
      amber: "#e5ad77",
      red: "#ff8b91",
    },
  },
};

for (const palette of ADMIN_EXPERIMENT_PALETTES) {
  const lightAccent = palette.lightColor || palette.color;
  const lightSurface = mixHexColors(palette.lightPaper, "#ffffff", 0.28);
  const darkSurface = mixHexColors(palette.darkPaper, "#ffffff", 0.22);
  palettes[palette.id] = {
    light: {
      ink: "#202633",
      muted: "#748096",
      line: mixHexColors("#d9dee7", lightAccent, 0.18),
      paper: palette.lightPaper,
      surface: lightSurface,
      green: lightAccent,
      greenSoft: mixHexColors(lightSurface, lightAccent, 0.19),
      amber: "#a66b2c",
      red: "#b8423b",
    },
    dark: {
      ink: "#edf2f8",
      muted: "#a3afc1",
      line: mixHexColors("#303846", palette.color, 0.24),
      paper: palette.darkPaper,
      surface: darkSurface,
      green: palette.color,
      greenSoft: mixHexColors(darkSurface, palette.color, 0.19),
      amber: "#edb46f",
      red: "#ff8b91",
    },
  };
}

export default function createAppTheme(mode = "dark", paletteId = "classic") {
  const selectedPalette = palettes[paletteId] || palettes.classic;
  const palette = selectedPalette[mode] || selectedPalette.light;

  return createTheme({
    palette: {
      mode: mode === "dark" ? "dark" : "light",
      primary: { main: palette.green },
      secondary: { main: palette.amber },
      success: { main: palette.green },
      warning: { main: palette.amber },
      error: { main: palette.red },
      background: {
        default: palette.paper,
        paper: palette.surface,
      },
      text: {
        primary: palette.ink,
        secondary: palette.muted,
      },
      divider: palette.line,
    },
    typography: {
      fontFamily: '"Manrope", "Avenir Next", sans-serif',
      h4: { color: palette.ink, fontWeight: 800, letterSpacing: "-0.04em" },
      h6: { color: palette.green, fontWeight: 700, letterSpacing: "-0.02em" },
      body1: { color: palette.ink },
      body2: { color: palette.ink },
      caption: { color: palette.muted },
      button: { fontWeight: 700, textTransform: "none" },
    },
    shape: { borderRadius: 2 },
    components: {
      MuiCssBaseline: {
        styleOverrides: {
          body: { minHeight: "100vh", margin: 0, overflowX: "hidden" },
          html: { minHeight: "100%", margin: 0, padding: 0 },
          "#root": { minHeight: "100vh", margin: 0, padding: 0 },
        },
      },
      MuiCard: {
        styleOverrides: {
          root: {
            background: palette.surface,
            border: `1px solid ${palette.line}`,
            boxShadow: "none",
            borderRadius: 2,
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            background: palette.surface,
            borderRadius: 2,
            boxShadow: "none",
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            borderBottom: `1px solid ${palette.line}`,
            color: palette.ink,
            fontSize: "0.875rem",
          },
          head: {
            color: palette.muted,
            fontWeight: 700,
            background: palette.paper,
            fontSize: "0.75rem",
          },
        },
      },
      MuiButton: {
        styleOverrides: {
          root: {
            fontWeight: 700,
            boxShadow: "none",
            borderRadius: 2,
            textTransform: "none",
          },
          contained: {
            background: palette.green,
            color: mode === "dark" ? "#141a17" : "#fbfcf9",
            "&:hover": {
              background: mode === "dark" ? "#9be7c4" : "#07694f",
              boxShadow: "none",
            },
          },
          outlined: {
            borderColor: palette.line,
            color: palette.ink,
            "&:hover": {
              borderColor: palette.green,
              background: palette.greenSoft,
            },
          },
          text: {
            color: palette.green,
            "&:hover": {
              background: palette.greenSoft,
            },
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: palette.muted,
            borderRadius: 1,
            "&.Mui-checked": { color: palette.green },
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            width: 38,
            height: 22,
            padding: 0,
            marginRight: 8,
            overflow: "visible",
          },
          switchBase: {
            padding: 3,
            color: palette.muted,
            "&.Mui-checked": {
              color: mode === "dark" ? palette.paper : palette.surface,
              transform: "translateX(16px)",
              "& + .MuiSwitch-track": {
                backgroundColor: palette.green,
                opacity: 1,
              },
            },
            "&.Mui-focusVisible .MuiSwitch-thumb": {
              outline: `2px solid ${palette.green}`,
              outlineOffset: 2,
            },
          },
          thumb: {
            width: 16,
            height: 16,
            borderRadius: 2,
            backgroundColor: palette.surface,
            boxShadow: "none",
          },
          track: {
            borderRadius: 1,
            backgroundColor: palette.line,
            opacity: 1,
            transition: "background-color 0.2s ease",
          },
        },
      },
    },
  });
}
