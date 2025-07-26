import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Dashboard from "./pages/Dashboard";
import Charts from "./pages/Charts";
import Settings from "./pages/Settings";
import Sidebar from "./components/Sidebar";
import { Box } from "@mui/material";

function App() {
  return (
    <Router>
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
    </Router>
  );
}

export default App;
