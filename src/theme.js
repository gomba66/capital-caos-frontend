import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    mode: "dark",
    background: {
      default: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
      paper: "#23243a",
    },
    primary: {
      main: "#ffe156",
      contrastText: "#181c2f",
    },
    secondary: {
      main: "#2de2e6",
    },
    info: {
      main: "#3a86ff",
    },
    warning: {
      main: "#ff6fff",
    },
    error: {
      main: "#ff2e63",
    },
    success: {
      main: "#7c3aed",
    },
    text: {
      primary: "#fff",
      secondary: "#bdbdbd",
    },
  },
  typography: {
    fontFamily: "Rajdhani, Orbitron, Roboto, Arial, sans-serif",
    h4: {
      color: "#ffe156",
      fontWeight: 700,
      letterSpacing: 2,
      textShadow: "0 0 8px #ffe156, 0 0 2px #fff",
    },
    h6: {
      color: "#2de2e6",
      fontWeight: 600,
      letterSpacing: 1,
      textShadow: "0 0 6px #2de2e6",
    },
    body1: {
      color: "#fff",
    },
    body2: {
      color: "#fff",
    },
    caption: {
      color: "#bdbdbd",
    },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
          minHeight: "100vh",
          padding: 0,
          margin: 0,
        },
        "#root": {
          padding: 0,
          margin: 0,
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: "linear-gradient(135deg, #23243a 80%, #1e1e2f 100%)",
          border: "1.5px solid #ffe156",
          boxShadow: "0 0 16px 2px #2de2e655",
          borderRadius: 18,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          background: "#23243a",
          borderRadius: 18,
          boxShadow: "0 0 16px 2px #3a86ff33",
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid #2de2e6",
          color: "#fff",
          fontSize: "1rem",
        },
        head: {
          color: "#2de2e6",
          fontWeight: 700,
          background: "rgba(45,226,230,0.08)",
          fontSize: "1.05rem",
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          background: "linear-gradient(90deg, #ffe156 60%, #2de2e6 100%)",
          color: "#181c2f",
          fontWeight: 700,
          boxShadow: "0 0 8px #ffe156",
          borderRadius: 10,
        },
      },
    },
    MuiCheckbox: {
      styleOverrides: {
        root: {
          color: "#3a86ff",
          "&.Mui-checked": {
            color: "#ffe156",
            textShadow: "0 0 6px #ffe156",
          },
        },
      },
    },
  },
});

export default theme;
