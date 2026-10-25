// Comentario de prueba para flujo de PR y changelog
// Segundo comentario de prueba para validar pre-commit hook
// Tercer comentario para forzar nueva ejecución del workflow
import React, { useContext, useState, useEffect } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
  ListItemButton,
  SvgIcon,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import AccountCircleIcon from "@mui/icons-material/AccountCircle";
import GroupIcon from "@mui/icons-material/Group";
import LogoutIcon from "@mui/icons-material/Logout";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RadarIcon from "@mui/icons-material/Radar";
import { Activity } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarContext } from "../contexts/AppContexts";
import { useAuth } from "../contexts/authState";
import { getBackendVersion } from "../api/version";

function AdminAstronautIcon() {
  return (
    <SvgIcon data-testid="admin-astronaut-icon" viewBox="0 0 24 24">
      <path
        d="M12 2.75a7.25 7.25 0 0 0-7.25 7.25v1.1a2 2 0 0 0 2 2h10.5a2 2 0 0 0 2-2V10A7.25 7.25 0 0 0 12 2.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinejoin="round"
      />
      <path
        d="M7 9.7a5 5 0 0 1 10 0v1.65H7V9.7Z"
        fill="none"
        stroke="var(--green)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <path
        d="M9.2 9.3a2.8 2.8 0 0 1 5.6 0v1.35H9.2V9.3Zm-6.45 11c.4-3.3 2.7-5.55 6-6.15m6.5 0c3.3.6 5.6 2.85 6 6.15H2.75Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </SvgIcon>
  );
}

export default function Sidebar() {
  const location = useLocation();
  const { user, logout } = useAuth();
  const { setSidebarWidth, mobileNavOpen, setMobileNavOpen } =
    useContext(SidebarContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(true);
  const [backendVersion, setBackendVersion] = useState(null);
  const [logoutError, setLogoutError] = useState("");
  const isCollapsed = !isMobile && collapsed;
  const currentWidth = isMobile ? 248 : isCollapsed ? 64 : 220;
  const canViewSignals =
    user?.role === "admin" || user?.features?.includes("signals") === true;
  const canViewTrades =
    user?.role === "admin" || user?.features?.includes("bot_trades") === true;
  const navItems = [
    ...(canViewTrades
      ? [
          {
            label: "navigation.botDashboard",
            icon: <DashboardIcon />,
            path: "/dashboard",
          },
        ]
      : []),
    ...(canViewTrades
      ? [
          { label: "navigation.charts", icon: <BarChartIcon />, path: "/charts" },
        ]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            label: "navigation.systemStatus",
            icon: <Activity />,
            path: "/system-status",
          },
          {
            label: "navigation.evaluations",
            icon: <AssessmentIcon />,
            path: "/evaluations",
          },
        ]
      : []),
    ...(canViewSignals
      ? [{ label: "navigation.scanner", icon: <RadarIcon />, path: "/scanner" }]
      : []),
    ...(user?.role === "admin"
      ? [
          {
            label: "navigation.users",
            icon: <GroupIcon />,
            path: "/admin/users",
          },
        ]
      : []),
    {
      label: "navigation.accountSettings",
      icon:
        user?.role === "admin" ? (
          <AdminAstronautIcon />
        ) : (
          <AccountCircleIcon />
        ),
      path: "/account",
    },
  ];

  React.useEffect(() => {
    setSidebarWidth(isMobile ? 0 : currentWidth);
  }, [currentWidth, isMobile, setSidebarWidth]);

  // Obtener la versión del backend
  useEffect(() => {
    const fetchVersion = async () => {
      const versionInfo = await getBackendVersion();
      if (versionInfo) {
        setBackendVersion(versionInfo.version);
      }
    };
    fetchVersion();
  }, []);

  return (
    <>
      <Drawer
        className="app-sidebar"
        variant={isMobile ? "temporary" : "permanent"}
        open={isMobile ? mobileNavOpen : true}
        onClose={() => setMobileNavOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          width: isMobile ? 0 : currentWidth,
          flexShrink: 0,
          transition: "width 0.3s ease-in-out",
          "& .MuiDrawer-paper": {
            width: currentWidth,
            boxSizing: "border-box",
            transition: "width 0.3s ease-in-out",
          },
        }}
      >
        <List className="app-sidebar-nav" sx={{ mt: 2 }}>
          {navItems.map((item) => (
            <Tooltip
              key={item.label}
              title={isCollapsed ? t(item.label) : ""}
              placement="right"
              arrow
              sx={{
                "& .MuiTooltip-tooltip": {
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
            >
              <ListItem disablePadding>
                <ListItemButton
                  component={Link}
                  className="app-sidebar-link"
                  to={item.path}
                  onClick={() => isMobile && setMobileNavOpen(false)}
                  selected={location.pathname === item.path}
                  sx={{
                    mb: isCollapsed ? 0.5 : 1,
                    minHeight: 48,
                    justifyContent: isCollapsed ? "center" : "flex-start",
                  }}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: isCollapsed ? "auto" : 36,
                      margin: 0,
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <Box
                    sx={{
                      overflow: "hidden",
                      transition: "all 0.3s ease-in-out",
                      opacity: isCollapsed ? 0 : 1,
                      maxWidth: isCollapsed ? 0 : "auto",
                      transform: isCollapsed
                        ? "translateX(-10px)"
                        : "translateX(0)",
                    }}
                  >
                    <ListItemText
                      primary={t(item.label)}
                      primaryTypographyProps={{
                        fontWeight: 600,
                        letterSpacing: 1,
                      }}
                    />
                  </Box>
                </ListItemButton>
              </ListItem>
            </Tooltip>
          ))}
        </List>

        <Box
          sx={{
            position: "absolute",
            bottom: !isMobile ? 56 : 8,
            left: 0,
            right: 0,
            px: 1,
          }}
        >
          <Tooltip
            title={isCollapsed ? t("navigation.logout") : ""}
            placement="right"
            arrow
          >
            <ListItem disablePadding>
              <ListItemButton
                onClick={async () => {
                  setLogoutError("");
                  try {
                    await logout();
                  } catch (error) {
                    setLogoutError(error.message);
                  }
                }}
                aria-label={t("navigation.logout")}
                sx={{
                  minHeight: 44,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                }}
              >
                <ListItemIcon
                  sx={{ minWidth: isCollapsed ? "auto" : 36, margin: 0 }}
                >
                  <LogoutIcon />
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText primary={t("navigation.logout")} />
                )}
              </ListItemButton>
            </ListItem>
          </Tooltip>
          {logoutError && (
            <Typography variant="caption" color="error" role="alert">
              {logoutError}
            </Typography>
          )}
        </Box>

        {/* Versión del backend */}
        <Box
          sx={{
            position: "absolute",
            bottom: !isMobile ? 110 : 64,
            left: 0,
            right: 0,
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            px: 2,
          }}
        >
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              fontFamily: "monospace",
              fontSize: 11,
              opacity: 1,
              letterSpacing: 0.5,
              textAlign: "center",
              fontWeight: 500,
            }}
          >
            {backendVersion || "..."}
          </Typography>
        </Box>

        {/* Botón de colapsar - solo en desktop */}
        {!isMobile && (
          <Box
            sx={{
              position: "absolute",
              bottom: 16,
              left: 0,
              right: 0,
              display: "flex",
              justifyContent: "center",
            }}
          >
            <IconButton
              onClick={() => setCollapsed(!collapsed)}
              aria-label={t(
                isCollapsed ? "navigation.expand" : "navigation.collapse",
              )}
              title={t(
                isCollapsed ? "navigation.expand" : "navigation.collapse",
              )}
              sx={{
                transition: "all 0.3s ease-in-out",
              }}
            >
              {collapsed ? <ChevronRightIcon /> : <ChevronLeftIcon />}
            </IconButton>
          </Box>
        )}
      </Drawer>
    </>
  );
}
