import React, { useState, useEffect, useCallback } from "react";
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Alert,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useParams, useNavigate } from "react-router-dom";
import TradingChart from "../components/charts/TradingChart";
import { getOpenTrades } from "../api/openTrades";

/**
 * Main page for visualizing trading charts
 * Allows selecting symbols and viewing operations in real time
 */
const TradingChartPage = () => {
  const { symbol: urlSymbol } = useParams();
  const navigate = useNavigate();

  const [selectedSymbol, setSelectedSymbol] = useState("");
  const [availableSymbols, setAvailableSymbols] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    loadAvailableSymbols();
  }, [loadAvailableSymbols]);

  const loadAvailableSymbols = useCallback(async () => {
    try {
      setLoading(true);

      const trades = await getOpenTrades();

      if (trades && trades.open_trades) {
        const symbols = trades.open_trades.map((trade) => trade.symbol);

        setAvailableSymbols(symbols);

        // If there's a symbol in the URL and it's available, use it
        if (urlSymbol && symbols.includes(urlSymbol)) {
          setSelectedSymbol(urlSymbol);
        }
        // If there's no symbol in URL or it's not available, select the first one
        else if (symbols.length > 0) {
          setSelectedSymbol(symbols[0]);
        }
      }
    } catch (err) {
      setError("Error loading available operations");
      console.error("Error loading symbols:", err);
    } finally {
      setLoading(false);
    }
  }, [urlSymbol]);

  const handleSymbolChange = (event) => {
    const newSymbol = event.target.value;

    setSelectedSymbol(newSymbol);

    // Update URL to reflect selected symbol
    navigate(`/trading-chart/${newSymbol}`, { replace: true });
  };

  const handleRefresh = () => {
    loadAvailableSymbols();
  };

  return (
    <Container maxWidth="xl">
      <Box py={3}>
        <Alert
          severity="warning"
          sx={{
            mb: 3,
            backgroundColor: "rgba(255, 152, 0, 0.1)",
            border: "1px solid rgba(255, 152, 0, 0.3)",
            "& .MuiAlert-icon": {
              color: "#ff9800",
            },
            "& .MuiAlert-message": {
              color: "#ff9800",
              fontWeight: 600,
            },
          }}
        >
          🚧 This page is currently in development/testing phase. Features may
          be incomplete or unstable.
        </Alert>

        <Typography variant="h4" gutterBottom>
          Trading Chart
        </Typography>

        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Grid container spacing={2} alignItems="center">
              <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <Typography variant="h6" gutterBottom>
                  Select Operation
                </Typography>
                <Box display="flex" gap={2} alignItems="center">
                  <FormControl sx={{ minWidth: 150 }} disabled={loading}>
                    <InputLabel>Symbol</InputLabel>
                    <Select
                      value={selectedSymbol}
                      label="Symbol"
                      onChange={handleSymbolChange}
                      sx={{
                        "& .MuiOutlinedInput-root": {
                          border: "none !important",
                          borderRadius: 3,
                          color: "#2de2e6 !important",
                          backgroundColor:
                            "rgba(45, 226, 230, 0.08) !important",
                          background: "rgba(45, 226, 230, 0.08) !important",
                          fontWeight: 600,
                          "& fieldset": {
                            border: "none !important",
                          },
                          "&:hover fieldset": {
                            border: "none !important",
                          },
                          "&.Mui-focused fieldset": {
                            border: "none !important",
                          },
                          "&:hover": {
                            backgroundColor:
                              "rgba(45, 226, 230, 0.12) !important",
                            background: "rgba(45, 226, 230, 0.12) !important",
                            boxShadow: "none !important",
                          },
                          "&.Mui-focused": {
                            backgroundColor:
                              "rgba(45, 226, 230, 0.12) !important",
                            background: "rgba(45, 226, 230, 0.12) !important",
                            boxShadow: "none !important",
                          },
                        },
                        "& .MuiSelect-icon": {
                          color: "#2de2e6 !important",
                        },
                        "& .MuiInputLabel-root": {
                          color: "#2de2e6 !important",
                          fontWeight: 600,
                          "&.Mui-focused": {
                            color: "#2de2e6 !important",
                          },
                        },
                      }}
                      MenuProps={{
                        PaperProps: {
                          sx: {
                            backgroundColor: "#23243a",
                            border: "1.5px solid #2de2e6",
                            borderRadius: 2,
                            boxShadow: "0 0 16px rgba(45, 226, 230, 0.3)",
                            "& .MuiMenuItem-root": {
                              color: "#fff",
                              fontWeight: 500,
                              "&:hover": {
                                backgroundColor: "rgba(45, 226, 230, 0.1)",
                              },
                              "&.Mui-selected": {
                                backgroundColor: "rgba(45, 226, 230, 0.2)",
                                color: "#2de2e6",
                                fontWeight: 600,
                              },
                            },
                          },
                        },
                      }}
                    >
                      {availableSymbols.map((symbol) => (
                        <MenuItem key={symbol} value={symbol}>
                          {symbol}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>

                  <Button
                    variant="outlined"
                    onClick={handleRefresh}
                    disabled={loading}
                    sx={{
                      border: "none !important",
                      color: "#2de2e6 !important",
                      backgroundColor: "rgba(45, 226, 230, 0.08) !important",
                      background: "rgba(45, 226, 230, 0.08) !important",
                      fontWeight: 600,
                      borderRadius: 3,
                      px: 2.5,
                      py: 1,
                      textTransform: "none",
                      fontSize: "0.875rem",
                      boxShadow: "none !important",
                      "&:hover": {
                        border: "none !important",
                        backgroundColor: "rgba(45, 226, 230, 0.12) !important",
                        background: "rgba(45, 226, 230, 0.12) !important",
                        boxShadow: "none !important",
                      },
                      "&:disabled": {
                        border: "none !important",
                        color: "#666 !important",
                        backgroundColor: "rgba(102, 102, 102, 0.1) !important",
                        background: "rgba(102, 102, 102, 0.1) !important",
                      },
                    }}
                  >
                    {loading ? <CircularProgress size={20} /> : "Refresh"}
                  </Button>
                </Box>
              </Grid>

              <Grid sx={{ gridColumn: { xs: "span 12", md: "span 6" } }}>
                <Typography variant="body2" color="textSecondary">
                  {availableSymbols.length > 0
                    ? `${availableSymbols.length} active operation(s)`
                    : "No active operations"}
                </Typography>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {selectedSymbol && (
          <>
            <TradingChart symbol={selectedSymbol} height={600} />
          </>
        )}

        {!selectedSymbol && !loading && (
          <Card>
            <CardContent>
              <Typography variant="body1" align="center" color="textSecondary">
                Select a symbol to view the trading chart
              </Typography>
            </CardContent>
          </Card>
        )}
      </Box>
    </Container>
  );
};

export default TradingChartPage;
