import { createTheme } from "@mui/material/styles";

export const APP_PALETTES = [
  { id: "classic", color: "#71d6ae" },
  { id: "ocean", color: "#58c7d3" },
  { id: "graphite", color: "#e6b15d" },
  { id: "violet", color: "#b6a2ff" },
];

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
  graphite: {
    light: {
      ink: "#29241e",
      muted: "#82776a",
      line: "#ded6c9",
      paper: "#f4f0e9",
      surface: "#fdfbf7",
      green: "#a96c22",
      greenSoft: "#f5ead8",
      amber: "#a96c22",
      red: "#b8423b",
    },
    dark: {
      ink: "#eee7dc",
      muted: "#a69a88",
      line: "#494238",
      paper: "#1b1a18",
      surface: "#292722",
      green: "#e6b15d",
      greenSoft: "#403524",
      amber: "#e6b15d",
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
};

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
