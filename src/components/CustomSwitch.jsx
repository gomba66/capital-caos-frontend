import React from "react";
import { Box, Typography } from "@mui/material";

const CustomSwitch = ({ value, onChange, options }) => {
  const getBackgroundColor = (currentValue) => {
    switch (currentValue) {
      case 0:
        return "#2de2e6" + 90; // Cyan for General (same as Profit Factor Total)
      case 1:
        return "#2de2a6"; // Green for Longs (same as Profit Factor Longs)
      case 2:
        return "#ff2e63"; // Red for Shorts (same as Profit Factor Shorts)
      default:
        return "#2de2e6";
    }
  };

  const handleClick = (clickedIndex) => {
    onChange(clickedIndex);
  };

  return (
    <Box
      sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}
    >
      <Box
        sx={{
          position: "relative",
          width: 300,
          height: 50,
          backgroundColor: getBackgroundColor(value),
          borderRadius: "12px",
          cursor: "pointer",
          overflow: "hidden",
          transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
          boxShadow: `0 4px 15px ${getBackgroundColor(value)}40`,
          "&:hover": {
            boxShadow: `0 6px 20px ${getBackgroundColor(value)}60`,
          },
        }}
      >
        {/* Background text labels */}
        {options.map((option, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: 0,
              left: `${(index / options.length) * 100}%`,
              width: `${100 / options.length}%`,
              height: "100%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1,
            }}
          >
            <Typography
              sx={{
                fontSize: "14px",
                fontWeight: 500,
                textAlign: "center",
                letterSpacing: "0.5px",
              }}
            >
              {option}
            </Typography>
          </Box>
        ))}

        {/* Clickable areas */}
        {options.map((option, index) => (
          <Box
            key={index}
            sx={{
              position: "absolute",
              top: 0,
              left: `${(index / options.length) * 100}%`,
              width: `${100 / options.length}%`,
              height: "100%",
              cursor: "pointer",
              transition: "all 0.3s ease",
              zIndex: 3,
            }}
            onClick={() => handleClick(index)}
          />
        ))}

        {/* Sliding indicator with text */}
        <Box
          sx={{
            position: "absolute",
            width: "calc(33.33%)",
            height: "calc(100%)",
            background: getBackgroundColor(value),
            borderRadius: "12px",
            transition: "all 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
            transform: `translateX(${(value / (options.length - 1)) * 200}px)`,
            boxShadow: "0 2px 8px rgba(0,0,0,0.3)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2,
            backdropFilter: "blur(4px)",
          }}
        >
          <Typography
            sx={{
              color: "#fff",
              fontSize: "14px",
              fontWeight: 700,
              textAlign: "center",
              letterSpacing: "0.5px",
            }}
          >
            {options[value]}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};

export default CustomSwitch;
