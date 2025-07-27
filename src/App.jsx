import React, { useState, useMemo } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { Box } from "@mui/material";
import { DateTime } from "luxon";

export const TimeZoneContext = React.createContext({
  timeZone: DateTime.local().zoneName,
  setTimeZone: () => {},
});

function App() {
  const localZone = DateTime.local().zoneName;
  const [timeZone, setTimeZone] = useState(() => {
    return localStorage.getItem("timeZone") || localZone;
  });
  const contextValue = useMemo(() => ({ timeZone, setTimeZone }), [timeZone]);

  return (
    <Router>
      <TimeZoneContext.Provider value={contextValue}>
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
            flex={1}
            minHeight="100vh"
            sx={{
              background: "linear-gradient(135deg, #181c2f 0%, #2a174e 100%)",
              backgroundAttachment: "fixed",
              backgroundSize: "cover",
            }}
          >
            <Routes>
              <Route path="/" element={<Dashboard />} />
              <Route path="/charts" element={<Charts />} />
              <Route path="/settings" element={<Settings />} />
            </Routes>
          </Box>
        </Box>
      </TimeZoneContext.Provider>
    </Router>
  );
}

export default App;
