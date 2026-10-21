import React, { useState, useMemo, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Charts from "./pages/Charts";
import Settings from "./pages/Settings";
import Evaluations from "./pages/Evaluations";
import Sidebar from "./components/Sidebar";
import PlatformHeader from "./components/PlatformHeader";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { DateTime } from "luxon";
import { SidebarContext, TimeZoneContext, CurrencyContext } from "./contexts/AppContexts";
import { getBackendVersion } from "./api/version";
import { initializeExchangeRates } from "./utils/currencyConverter";
import AppErrorBoundary from "./components/AppErrorBoundary";

function App() {
  const localZone = DateTime.local().zoneName;
  const [timeZone, setTimeZone] = useState(() => {
    return localStorage.getItem("timeZone") || localZone;
  });
  const [currency, setCurrency] = useState(() => {
    return localStorage.getItem("capitalCurrency") || "USDT";
  });
  const [sidebarWidth, setSidebarWidth] = useState(64);
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const contextValue = useMemo(() => ({ timeZone, setTimeZone }), [timeZone]);
  const currencyContextValue = useMemo(() => ({ currency, setCurrency }), [currency]);
  const sidebarContextValue = useMemo(
    () => ({
      sidebarWidth,
      setSidebarWidth,
      mobileNavOpen,
      setMobileNavOpen,
    }),
    [sidebarWidth, mobileNavOpen],
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  // Sincronizar currency con localStorage
  useEffect(() => {
    localStorage.setItem("capitalCurrency", currency);
    // Disparar evento personalizado para sincronizar entre pestañas/componentes
    window.dispatchEvent(new CustomEvent("currencyChange", { detail: currency }));
  }, [currency]);

  // Inicializar tasas de cambio al cargar la aplicación
  useEffect(() => {
    initializeExchangeRates().catch((error) => {
      console.warn("Error initializing exchange rates:", error);
    });
  }, []);

  // Actualizar el título de la página con la versión del backend
  useEffect(() => {
    const updateTitle = async () => {
      const versionInfo = await getBackendVersion();
      if (versionInfo && versionInfo.version) {
        document.title = `Capital Caos - ${versionInfo.version}`;
      } else {
        document.title = "Capital Caos";
      }
    };
    updateTitle();
  }, []);

  return (
    <Router>
      <CurrencyContext.Provider value={currencyContextValue}>
        <TimeZoneContext.Provider value={contextValue}>
          <SidebarContext.Provider value={sidebarContextValue}>
            <Box
              display="flex"
              minHeight="100vh"
              sx={{
                backgroundColor: "background.default",
              }}
            >
              <Sidebar />
              <Box
                component="main"
                sx={{
                  position: isMobile ? "relative" : "absolute",
                  left: isMobile ? 0 : `${sidebarWidth}px`,
                  right: 0,
                  top: 0,
                  minHeight: "100vh",
                  minWidth: 0,
                  width: isMobile ? 0 : "auto",
                  flex: isMobile ? "1 1 0%" : "none",
                  backgroundColor: "background.default",
                  transition: "left 0.3s ease-in-out",
                }}
              >
                <PlatformHeader />
                <AppErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/charts" element={<Charts />} />
                    <Route path="/evaluations" element={<Evaluations />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route
                      path="/scanner"
                      element={<Navigate to="/#scanner" replace />}
                    />
                    <Route path="*" element={<Navigate to="/" replace />} />
                  </Routes>
                </AppErrorBoundary>
              </Box>
            </Box>
          </SidebarContext.Provider>
        </TimeZoneContext.Provider>
      </CurrencyContext.Provider>
    </Router>
  );
}

export default App;
