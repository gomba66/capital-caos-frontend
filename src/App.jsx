import React, {
  useState,
  useMemo,
  useEffect,
  useContext,
} from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  Link,
  useNavigate,
} from "react-router-dom";
import Home from "./pages/Home";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Evaluations from "./pages/Evaluations";
import Account from "./pages/Account";
import AdminUsers from "./pages/AdminUsers";
import SystemStatus from "./pages/SystemStatus";
import Upgrade from "./pages/Upgrade";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import Sidebar from "./components/Sidebar";
import PlatformHeader from "./components/PlatformHeader";
import {
  Box,
  Button,
  CircularProgress,
  Alert,
  AlertTitle,
  Paper,
  Snackbar,
  Typography,
  useTheme,
  useMediaQuery,
} from "@mui/material";
import { DateTime } from "luxon";
import {
  SidebarContext,
  TimeZoneContext,
  CurrencyContext,
  PlatformThemeContext,
} from "./contexts/AppContexts";
import { AuthProvider } from "./contexts/AuthContext";
import { useAuth } from "./contexts/authState";
import { Trans, useTranslation } from "react-i18next";
import { getBackendVersion } from "./api/version";
import { initializeExchangeRates } from "./utils/currencyConverter";
import AppErrorBoundary from "./components/AppErrorBoundary";
import {
  normalizeThemePreferences,
  readThemePreferences,
  saveThemePreferences,
} from "./utils/themePreferences";
import { PLAN_IDENTITIES } from "./utils/planIdentity";

const PLAN_ORDER = ["no_access", "signals", "whatsapp", "complete"];

function PlanChangeIdentity({ plan, tone }) {
  const PlanIcon = plan.icon;
  const { t } = useTranslation();

  return (
    <span className={`plan-change-plan plan-change-plan--${tone}`}>
      <PlanIcon size={13} strokeWidth={2.2} aria-hidden="true" />
      <strong>{t(plan.labelKey)}</strong>
    </span>
  );
}

function AccessPending() {
  const { t } = useTranslation();
  return (
    <Box sx={{ maxWidth: 720, mx: "auto", p: { xs: 2, sm: 4 } }}>
      <Paper
        sx={{
          p: { xs: 3, sm: 5 },
          border: "1px solid",
          borderColor: "divider",
        }}
      >
        <Typography variant="overline" color="primary">
          {t("accessPending.eyebrow")}
        </Typography>
        <Typography variant="h4" gutterBottom>
          {t("accessPending.title")}
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 3 }}>
          {t("accessPending.message")}
        </Typography>
        <Button component={Link} to="/account" variant="contained">
          {t("navigation.account")}
        </Button>
      </Paper>
    </Box>
  );
}

function AppContent() {
  const {
    user,
    loading,
    error: authError,
    sessionExpired,
    planChange,
    dismissPlanChange,
    updateThemePreferences,
  } = useAuth();
  const navigate = useNavigate();
  const { i18n, t } = useTranslation();
  const { mode, setMode, palette, setPalette } =
    useContext(PlatformThemeContext);
  const themeRole = user?.role || "guest";
  const themeUserId = user?.id || user?.email || null;
  const themePreferenceOwner = `${themeRole}:${themeUserId || "default"}`;
  const [loadedThemePreferenceOwner, setLoadedThemePreferenceOwner] =
    useState(null);
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
  const isAdmin = user?.role === "admin";
  const canViewSignals =
    isAdmin || user?.features?.includes("signals") === true;
  const canViewTrades =
    isAdmin || user?.features?.includes("bot_trades") === true;
  const planChangeFrom = planChange
    ? PLAN_IDENTITIES[planChange.from]
    : null;
  const planChangeTo = planChange ? PLAN_IDENTITIES[planChange.to] : null;
  const planChangeDirection =
    planChange &&
    PLAN_ORDER.indexOf(planChange.to) > PLAN_ORDER.indexOf(planChange.from)
      ? "upgrade"
      : "downgrade";

  useEffect(() => {
    if (sessionExpired) navigate("/login", { replace: true });
  }, [navigate, sessionExpired]);

  useEffect(() => {
    if (loading || !user?.language_preference) return;
    if (i18n.resolvedLanguage !== user.language_preference) {
      i18n.changeLanguage(user.language_preference).catch((error) => {
        console.error("Could not apply account language preference:", error);
      });
    }
  }, [i18n, loading, user?.id, user?.language_preference]);

  useEffect(() => {
    if (loading) return;
    const preferences =
      user?.theme_mode && user?.theme_palette
        ? normalizeThemePreferences(themeRole, {
            mode: user.theme_mode,
            palette: user.theme_palette,
          })
        : readThemePreferences(themeRole, themeUserId);
    setMode(preferences.mode);
    setPalette(preferences.palette);
    setLoadedThemePreferenceOwner(themePreferenceOwner);
  }, [
    loading,
    themeRole,
    themeUserId,
    themePreferenceOwner,
    user?.theme_mode,
    user?.theme_palette,
    setMode,
    setPalette,
  ]);

  useEffect(() => {
    if (loadedThemePreferenceOwner !== themePreferenceOwner) return;
    saveThemePreferences(themeRole, themeUserId, { mode, palette });
  }, [
    themeRole,
    themeUserId,
    themePreferenceOwner,
    loadedThemePreferenceOwner,
    mode,
    palette,
  ]);

  useEffect(() => {
    if (
      loading ||
      !user ||
      loadedThemePreferenceOwner !== themePreferenceOwner
    ) {
      return;
    }
    const preferences = normalizeThemePreferences(themeRole, { mode, palette });
    if (
      user.theme_mode === preferences.mode &&
      user.theme_palette === preferences.palette
    ) {
      return;
    }
    updateThemePreferences(preferences).catch((error) => {
      console.error("Could not save account theme preferences:", error);
    });
  }, [
    loading,
    user,
    themeRole,
    themePreferenceOwner,
    loadedThemePreferenceOwner,
    mode,
    palette,
    updateThemePreferences,
  ]);

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

  if (loading) {
    return (
      <Box
        minHeight="100vh"
        display="grid"
        sx={{ placeItems: "center", bgcolor: "background.default" }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (!user) {
    return (
      <Routes key={`${user.id}:${user.role}:${user.plan_code}`}>
        <Route path="/" element={<Landing />} />
        <Route
          path="/login"
          element={
            <Login serviceError={authError} sessionExpired={sessionExpired} />
          }
        />
        <Route path="/status" element={<SystemStatus publicView />} />
        <Route path="/upgrade" element={<Upgrade />} />
        <Route
          path="*"
          element={
            <Login serviceError={authError} sessionExpired={sessionExpired} />
          }
        />
      </Routes>
    );
  }

  return (
    <CurrencyContext.Provider value={currencyContextValue}>
      <TimeZoneContext.Provider value={contextValue}>
        <SidebarContext.Provider value={sidebarContextValue}>
          <Box
            display="flex"
            minHeight="100vh"
            sx={{
              backgroundColor:
                palette === "cipher" ? "transparent" : "background.default",
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
                backgroundColor:
                  palette === "cipher" ? "transparent" : "background.default",
                transition: "left 0.3s ease-in-out",
              }}
            >
              <PlatformHeader />
              <AppErrorBoundary>
                <Routes>
                  <Route path="/login" element={<Navigate to="/" replace />} />
                  <Route path="/status" element={<SystemStatus publicView />} />
                  <Route path="/upgrade" element={<Upgrade />} />
                  <Route
                    path="/"
                    element={
                      canViewSignals ? (
                        <Navigate to="/scanner" replace />
                      ) : canViewTrades ? (
                        <Navigate to="/dashboard" replace />
                      ) : (
                        <AccessPending />
                      )
                    }
                  />
                  <Route
                    path="/dashboard"
                    element={
                      canViewTrades ? (
                        <Dashboard />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route
                    path="/scanner"
                    element={
                      canViewSignals ? (
                        <Home />
                      ) : (
                        <Navigate to="/" replace />
                      )
                    }
                  />
                  <Route
                    path="/charts"
                    element={
                      canViewTrades ? <Charts /> : <Navigate to="/" replace />
                    }
                  />
                  <Route
                    path="/evaluations"
                    element={
                      isAdmin ? <Evaluations /> : <Navigate to="/" replace />
                    }
                  />
                  <Route
                    path="/settings"
                    element={<Navigate to="/account?tab=system" replace />}
                  />
                  <Route
                    path="/system-status"
                    element={
                      isAdmin ? <SystemStatus /> : <Navigate to="/" replace />
                    }
                  />
                  <Route
                    path="/admin/users"
                    element={
                      isAdmin ? <AdminUsers /> : <Navigate to="/" replace />
                    }
                  />
                  <Route path="/account" element={<Account />} />
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </AppErrorBoundary>
            </Box>
            {planChange && planChangeFrom && planChangeTo && (
              <Snackbar
                key={planChange.id}
                open
                autoHideDuration={null}
                anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
                onClose={dismissPlanChange}
              >
                <Alert
                  className={`plan-change-alert plan-change-alert--${planChangeDirection}`}
                  severity="info"
                  variant="filled"
                  onClose={dismissPlanChange}
                >
                  <AlertTitle>
                    {planChangeDirection === "upgrade"
                      ? t("planChange.upgradeTitle")
                      : t("planChange.downgradeTitle")}
                  </AlertTitle>
                  <Trans
                    i18nKey="planChange.message"
                    components={{
                      from: (
                        <PlanChangeIdentity
                          plan={planChangeFrom}
                          tone={planChangeFrom.tone}
                        />
                      ),
                      to: (
                        <PlanChangeIdentity
                          plan={planChangeTo}
                          tone={planChangeTo.tone}
                        />
                      ),
                    }}
                  />
                </Alert>
              </Snackbar>
            )}
          </Box>
        </SidebarContext.Provider>
      </TimeZoneContext.Provider>
    </CurrencyContext.Provider>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
