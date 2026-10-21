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
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import AssessmentIcon from "@mui/icons-material/Assessment";
import RadarIcon from "@mui/icons-material/Radar";
import { Link, useLocation } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { SidebarContext } from "../contexts/AppContexts";
import { getBackendVersion } from "../api/version";

const navItems = [
  { label: "navigation.dashboard", icon: <DashboardIcon />, path: "/" },
  { label: "navigation.charts", icon: <BarChartIcon />, path: "/charts" },
  { label: "navigation.evaluations", icon: <AssessmentIcon />, path: "/evaluations" },
  { label: "navigation.scanner", icon: <RadarIcon />, path: "/#scanner" },
  { label: "navigation.settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const { setSidebarWidth, mobileNavOpen, setMobileNavOpen } =
    useContext(SidebarContext);
  const { t } = useTranslation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(true);
  const [backendVersion, setBackendVersion] = useState(null);
  const isCollapsed = !isMobile && collapsed;
  const currentWidth = isMobile ? 248 : isCollapsed ? 64 : 220;

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
                  selected={
                    item.path === "/#scanner"
                      ? location.pathname === "/" &&
                        location.hash === "#scanner"
                      : location.pathname === item.path
                  }
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

        {/* Versión del backend */}
        <Box
          sx={{
            position: "absolute",
            bottom: !isMobile ? 80 : 16,
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
