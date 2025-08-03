import React, { useContext } from "react";
import {
  Typography,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from "@mui/material";
import { TimeZoneContext } from "../contexts/AppContexts";
import { DateTime } from "luxon";

const commonTimeZones = [
  "UTC",
  "America/Bogota",
  "America/Mexico_City",
  "America/New_York",
  "Europe/Madrid",
  "Europe/London",
  "Asia/Tokyo",
  "Asia/Shanghai",
  "America/Argentina/Buenos_Aires",
];

export default function Settings() {
  const { timeZone, setTimeZone } = useContext(TimeZoneContext);
  const handleZoneChange = (e) => {
    setTimeZone(e.target.value);
    localStorage.setItem("timeZone", e.target.value);
  };
  return (
    <Box p={4}>
      <Typography variant="h4" gutterBottom>
        Settings
      </Typography>
      <FormControl
        sx={{ minWidth: 260, mt: 3 }}
        size="small"
        variant="outlined"
      >
        <InputLabel id="tz-select-label">Time zone</InputLabel>
        <Select
          labelId="tz-select-label"
          id="tz-select"
          value={timeZone}
          label="Time zone"
          onChange={handleZoneChange}
          MenuProps={{
            PaperProps: {
              style: {
                maxHeight: 300,
              },
            },
          }}
        >
          {[timeZone, ...commonTimeZones.filter((z) => z !== timeZone)].map(
            (tz) => (
              <MenuItem key={tz} value={tz}>
                {tz}
              </MenuItem>
            )
          )}
        </Select>
      </FormControl>
    </Box>
  );
}
