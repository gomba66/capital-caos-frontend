import React, { useState, useMemo, createContext, useContext } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { Box, useTheme, useMediaQuery } from "@mui/material";
import { DateTime } from "luxon";

export const SidebarContext = createContext({
  sidebarWidth: 220,
  setSidebarWidth: () => {},
});
// test comment
export const TimeZoneContext = React.createContext({
  timeZone: DateTime.local().zoneName,
  setTimeZone: () => {},
});

function App() {
  const localZone = DateTime.local().zoneName;
  const [timeZone, setTimeZone] = useState(() => {
    return localStorage.getItem("timeZone") || localZone;
  });
  const [sidebarWidth, setSidebarWidth] = useState(220);
  const contextValue = useMemo(() => ({ timeZone, setTimeZone }), [timeZone]);
  const sidebarContextValue = useMemo(
    () => ({ sidebarWidth, setSidebarWidth }),
    [sidebarWidth]
  );
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  return (
    <Router>
      <TimeZoneContext.Provider value={contextValue}>
        <SidebarContext.Provider value={sidebarContextValue}>
          <Box
            display="flex"
            minHeight="100vh"
            sx={{
              background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
            }}
          >
            <Sidebar />
            <Box
              component="main"
              sx={{
                position: isMobile ? "relative" : "absolute",
                left: isMobile ? "80px" : `${sidebarWidth}px`,
                right: 0,
                top: 0,
                minHeight: "100vh",
                background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
                backgroundAttachment: "fixed",
                backgroundSize: "cover",
                transition: "left 0.3s ease-in-out",
              }}
            >
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/charts" element={<Charts />} />
                <Route path="/settings" element={<Settings />} />
              </Routes>
            </Box>
          </Box>
        </SidebarContext.Provider>
      </TimeZoneContext.Provider>
    </Router>
  );
}

export default App;
