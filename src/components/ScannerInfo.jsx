import React from "react";
import { Box, Typography, Tooltip, Chip } from "@mui/material";
import { Info } from "@mui/icons-material";

const ScannerInfo = ({ scannerInfo, compact = false }) => {
  if (!scannerInfo || !scannerInfo.scanner) {
    return <span style={{ color: "#888" }}>-</span>;
  }

  const { scanner, scanner_type: _scanner_type, momentum_data } = scannerInfo;

  if (compact) {
    return (
      <Chip
        label={scanner.toUpperCase()}
        size="small"
        sx={{
          backgroundColor: "#2de2e6",
          color: "#000",
          fontWeight: 600,
          fontSize: "0.75rem",
        }}
      />
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" gap={1} mb={0.5}>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 600,
            color: "#2de2e6",
            textTransform: "uppercase",
          }}
        >
          {scanner}
        </Typography>
        <Tooltip title="Scanner que detectó este trade">
          <Info fontSize="small" sx={{ color: "#666", cursor: "help" }} />
        </Tooltip>
      </Box>

      {momentum_data && Object.keys(momentum_data).length > 0 && (
        <Box mt={0.5}>
          {momentum_data.change_5m && (
            <Typography
              variant="caption"
              sx={{ color: "#666", display: "block" }}
            >
              Cambio 5m: {momentum_data.change_5m}%
            </Typography>
          )}
          {momentum_data.volume && (
            <Typography
              variant="caption"
              sx={{ color: "#666", display: "block" }}
            >
              Volumen: {Number(momentum_data.volume).toLocaleString()}
            </Typography>
          )}
          {momentum_data.change_30m && (
            <Typography
              variant="caption"
              sx={{ color: "#666", display: "block" }}
            >
              Cambio 30m: {momentum_data.change_30m}%
            </Typography>
          )}
        </Box>
      )}
    </Box>
  );
};

export default ScannerInfo;
