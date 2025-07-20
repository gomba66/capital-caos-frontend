import React from "react";
import {
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
  Box,
} from "@mui/material";
import DashboardIcon from "@mui/icons-material/Dashboard";
import BarChartIcon from "@mui/icons-material/BarChart";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link, useLocation } from "react-router-dom";

const drawerWidth = 220;

const navItems = [
  { text: "Dashboard", icon: <DashboardIcon />, path: "/" },
  { text: "Charts", icon: <BarChartIcon />, path: "/charts" },
  { text: "Settings", icon: <SettingsIcon />, path: "/settings" },
];

export default function Sidebar() {
  const location = useLocation();
  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        "& .MuiDrawer-paper": {
          width: drawerWidth,
          boxSizing: "border-box",
          background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
          borderRight: "2px solid #2de2e6",
          color: "#fff",
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
            height: 80,
            width: "auto",
            maxWidth: "100%",
            mb: 1,
            borderRadius: 1,
            boxShadow: "0 0 16px rgba(45, 226, 230, 0.3)",
            display: "block",
            margin: "0 auto 8px auto",
          }}
        />
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
      <List sx={{ mt: 4 }}>
        {navItems.map((item) => (
          <ListItem
            button
            key={item.text}
            component={Link}
            to={item.path}
            selected={location.pathname === item.path}
            sx={{
              mb: 1,
              borderRadius: 2,
              background:
                location.pathname === item.path
                  ? "rgba(45,226,230,0.12)"
                  : "none",
              "&:hover": {
                background: "rgba(255,225,86,0.10)",
              },
            }}
          >
            <ListItemIcon sx={{ color: "#2de2e6", minWidth: 36 }}>
              {item.icon}
            </ListItemIcon>
            <ListItemText
              primary={item.text}
              primaryTypographyProps={{ fontWeight: 600, letterSpacing: 1 }}
            />
          </ListItem>
        ))}
      </List>
    </Drawer>
  );
}
