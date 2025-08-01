// Comentario de prueba para flujo de PR y changelog
// Segundo comentario de prueba para validar pre-commit hook
// Tercer comentario para forzar nueva ejecución del workflow
import React, { useContext, useState } from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
  IconButton,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

import { Link, useLocation } from "react-router-dom";
import { TimeZoneContext, SidebarContext } from "../App";

const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { text: "Charts", icon: <BarChartIcon />, path: "/charts" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  const { timeZone } = useContext(TimeZoneContext);
  const { sidebarWidth, setSidebarWidth } = useContext(SidebarContext);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [collapsed, setCollapsed] = useState(false);

  const isCollapsed = isMobile || collapsed;
  const currentWidth = isCollapsed ? 80 : 220;

  // Actualizar el ancho del sidebar en el contexto
  React.useEffect(() => {
    setSidebarWidth(currentWidth);
  }, [currentWidth, setSidebarWidth]);
  return (
    <>
      <Drawer
        variant="permanent"
        open={true}
        sx={{
          width: currentWidth,
          flexShrink: 0,
          transition: "width 0.3s ease-in-out",
          "& .MuiDrawer-paper": {
            width: currentWidth,
            boxSizing: "border-box",
            background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
            borderRight: "2px solid #2de2e6",
            color: "#fff",
            transition: "width 0.3s ease-in-out",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2, pb: 0, textAlign: "center" }}>
          <Box
            component="img"
            src="/logo.jpg"
            alt="Capital Caos"
            sx={{
              height: isCollapsed ? 50 : 80,
              width: isCollapsed ? 50 : "auto",
              maxWidth: "100%",
              mb: 1,
              borderRadius: 1,
              boxShadow: "0 0 16px rgba(45, 226, 230, 0.3)",
              display: "block",
              margin: "0 auto 8px auto",
            }}
          />
          <Box
            sx={{
              overflow: "hidden",
              transition: "all 0.3s ease-in-out",
              opacity: isCollapsed ? 0 : 1,
              maxHeight: isCollapsed ? 0 : "auto",
              transform: isCollapsed ? "translateY(-10px)" : "translateY(0)",
            }}
          >
            <Typography
              variant="h6"
              color="#ffe156"
              sx={{
                letterSpacing: 2,
                fontWeight: 700,
                textShadow: "0 0 8px #ffe156",
                mb: 0.5,
                display: "block",
                textAlign: "center",
              }}
            >
              CAPITAL CAOS
            </Typography>
            <Typography
              variant="caption"
              color="#2de2e6"
              sx={{
                letterSpacing: 1,
                display: "block",
                textAlign: "center",
              }}
            >
              Trading Dashboard
            </Typography>
          </Box>
          <Tooltip
            title={isCollapsed ? timeZone : ""}
            placement="right"
            arrow
            sx={{
              "& .MuiTooltip-tooltip": {
                bgcolor: "rgba(24,28,47,0.95)",
                color: "#2de2e6",
                border: "1px solid #2de2e6",
                fontSize: 12,
                fontFamily: "monospace",
              },
            }}
          >
            <Box
              sx={{
                mt: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                bgcolor: "rgba(45,226,230,0.07)",
                borderRadius: isCollapsed ? 1 : 2,
                px: isCollapsed ? 0.5 : 1.2,
                py: isCollapsed ? 0.3 : 0.5,
                cursor: isCollapsed ? "help" : "default",
              }}
            >
              <AccessTimeIcon
                sx={{
                  fontSize: isCollapsed ? 14 : 17,
                  color: "#2de2e6",
                  mr: isCollapsed ? 0 : 0.7,
                  transition: "all 0.3s ease-in-out",
                }}
              />
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
                <Typography
                  variant="caption"
                  color="#2de2e6"
                  sx={{
                    fontWeight: 600,
                    fontFamily: "monospace",
                    fontSize: 13,
                    letterSpacing: 0.5,
                  }}
                >
                  {timeZone}
                </Typography>
              </Box>
            </Box>
          </Tooltip>
        </Box>
        <List sx={{ mt: isCollapsed ? 2 : 4 }}>
          {navItems.map((item) => (
            <Tooltip
              key={item.text}
              title={isCollapsed ? item.text : ""}
              placement="right"
              arrow
              sx={{
                "& .MuiTooltip-tooltip": {
                  bgcolor: "rgba(24,28,47,0.95)",
                  color: "#2de2e6",
                  border: "1px solid #2de2e6",
                  fontSize: 12,
                  fontWeight: 600,
                },
              }}
            >
              <ListItem
                button
                component={Link}
                to={item.path}
                selected={location.pathname === item.path}
                sx={{
                  mb: isCollapsed ? 0.5 : 1,
                  borderRadius: isCollapsed ? 1 : 2,
                  minHeight: 48,
                  justifyContent: isCollapsed ? "center" : "flex-start",
                  background:
                    location.pathname === item.path
                      ? "rgba(45,226,230,0.12)"
                      : "none",
                  "&:hover": {
                    background: "rgba(255,225,86,0.10)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: "#2de2e6",
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
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: 600,
                      letterSpacing: 1,
                    }}
                  />
                </Box>
              </ListItem>
            </Tooltip>
          ))}
        </List>

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
              sx={{
                color: "#2de2e6",
                bgcolor: "rgba(45,226,230,0.1)",
                border: "1px solid #2de2e6",
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  bgcolor: "rgba(45,226,230,0.2)",
                  transform: "scale(1.05)",
                },
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
