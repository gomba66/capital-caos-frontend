import React, {
  useEffect,
  useRef,
  useState,
  useContext,
  useCallback,
} from "react";
import {
  createChart,
  ColorType,
  CandlestickSeries,
  LineSeries,
  AreaSeries,
  HistogramSeries,
  BaselineSeries,
} from "lightweight-charts";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  CircularProgress,
  Button,
} from "@mui/material";
// import { getTradeDetails } from "../../api/operations";
import { getPriceHistory } from "../../api/priceHistory";
import { TimeZoneContext } from "../../contexts/AppContexts";

/**
 * Trading chart component using Lightweight Charts
 * Displays candlestick charts with operation markers
 */
const TradingChart = ({ symbol = "BTCUSDT", height = 400 }) => {
  const chartContainerRef = useRef(null);
  const chartRef = useRef(null);
  const candlestickSeriesRef = useRef(null);
  const entryLineRef = useRef(null);
  const stopLossLineRef = useRef(null);
  const takeProfitLineRef = useRef(null);
  const entryStopAreaRef = useRef(null);
  const entryTpAreaRef = useRef(null);
  const upperAreaRef = useRef(null);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tradeData, setTradeData] = useState(null);
  // const [interval, setInterval] = useState("1m");
  const [timeframe, setTimeframe] = useState("1m"); // Separate timeframe from real-time interval
  const [priceData, setPriceData] = useState(null);
  const [isRealTimeEnabled, setIsRealTimeEnabled] = useState(false);
  const realTimeIntervalRef = useRef(null);

  // Function to automatically determine precision based on price value
  const getAutoPrecision = (price) => {
    if (price >= 1000) return 2; // For high prices (BTC, ETH, etc.)
    if (price >= 100) return 3; // For medium prices
    if (price >= 10) return 4; // For low prices
    if (price >= 1) return 5; // For very low prices
    return 6; // For extremely low prices
  };

  // Function to format prices with automatic precision
  const formatPriceAuto = useCallback((price) => {
    const autoPrecision = getAutoPrecision(price);
    return price.toFixed(autoPrecision);
  }, []);

  // Use global timezone context
  const { timeZone } = useContext(TimeZoneContext);

  // Effect to update chart when global timezone changes
  useEffect(() => {
    if (chartRef.current) {
      chartRef.current.applyOptions({
        timeScale: {
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: timeZone,
            });
          },
        },
        localization: {
          timeFormatter: (time) => {
            const date = new Date(time * 1000);
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: timeZone,
            });

            return formattedTime;
          },
        },
      });
    }
  }, [timeZone]); // Runs when timezone changes from context

  // Effect to add trade lines when tradeData changes and priceData is available
  useEffect(() => {
    if (tradeData && priceData && priceData.data && priceData.data.length > 0) {
      // Use setTimeout to ensure addTradeLines is defined
      setTimeout(() => {
        if (addTradeLines) {
          addTradeLines(tradeData, priceData);
        }
      }, 0);
    }
  }, [tradeData, priceData]);

  // Function to determine price precision based on symbol
  const getPricePrecision = (symbol) => {
    // Determine precision based on typical asset price
    if (symbol.includes("USDT")) {
      // For assets with low prices (less than $1), use 4-6 decimals
      if (symbol.includes("HOME") || symbol.includes("ESPORTS")) {
        return 4; // 0.0001
      }
      // For assets with medium prices ($1-$100), use 2-4 decimals
      return 2; // 0.01
    }
    return 2; // Default precision
  };

  // Function to determine operation side
  const determinePositionSide = (trade) => {
    const positionAmt = parseFloat(trade.positionAmt);
    const positionSide = trade.positionSide;

    // If positionAmt is negative, it's SHORT
    if (positionAmt < 0) {
      return "SHORT";
    }
    // If positionAmt is positive, it's LONG
    else if (positionAmt > 0) {
      return "LONG";
    }
    // If positionAmt is 0, use positionSide as fallback
    else {
      return positionSide || "LONG";
    }
  };

  // Create chart only once
  useEffect(() => {
    // Use setTimeout to ensure DOM is ready
    const timer = setTimeout(() => {
      if (!chartContainerRef.current) {
        return;
      }
      // Create the chart
      const chart = createChart(chartContainerRef.current, {
        width: chartContainerRef.current.clientWidth,
        height: height,
        layout: {
          background: { type: ColorType.Solid, color: "#000000" },
          textColor: "#d1d4dc",
        },
        grid: {
          vertLines: { visible: false },
          horzLines: { visible: false },
        },
        crosshair: {
          mode: 0,
        },
        rightPriceScale: {
          borderColor: "#2B2B43",
        },
        timeScale: {
          borderColor: "#2B2B43",
          timeVisible: true,
          secondsVisible: false,
          timeUnit: "minute",
          tickMarkFormatter: (time) => {
            const date = new Date(time * 1000);
            return date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: timeZone,
            });
          },
        },
        localization: {
          timeFormatter: (time) => {
            const date = new Date(time * 1000);
            const formattedTime = date.toLocaleTimeString("en-US", {
              hour: "2-digit",
              minute: "2-digit",
              hour12: true,
              timeZone: timeZone,
            });

            return formattedTime;
          },
        },
      });

      chartRef.current = chart;

      // Configure horizontal axis label when mouse passes over
      chart.timeScale().applyOptions({
        timeFormatter: (time) => {
          const date = new Date(time * 1000);
          const formattedTime = date.toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
            timeZone: timeZone,
          });
          return formattedTime;
        },
      });

      // Subscribe to crosshair movement to format tooltip
      //   chart.subscribeCrosshairMove((param) => {
      //     if (param.time) {
      //       const date = new Date(param.time * 1000);
      //       const formattedTime = date.toLocaleTimeString("en-US", {
      //         hour: "2-digit",
      //         minute: "2-digit",
      //         hour12: true,
      //         timeZone: timeZone,
      //       });

      //       // Intentar actualizar el tooltip manualmente
      //       if (param.seriesData && Object.keys(param.seriesData).length > 0) {
      //         // El tooltip se actualiza automáticamente, pero podemos verificar el formato
      //       }
      //     }
      //   });

      // Create candlestick series (new API v5.x)
      const candlestickSeries = chart.addSeries(CandlestickSeries, {
        upColor: "#26a69a",
        downColor: "#ef5350",
        borderDownColor: "#ef5350",
        borderUpColor: "#26a69a",
        wickDownColor: "#ef5350",
        wickUpColor: "#26a69a",
        priceLineVisible: false,
        lastValueVisible: false,
        priceFormat: {
          type: "price",
          precision: 6,
          minMove: 0.000001,
        },
      });

      candlestickSeriesRef.current = candlestickSeries;

      // Click handling will be configured in a separate useEffect

      // Responsive
      const handleResize = () => {
        if (chartContainerRef.current) {
          chart.applyOptions({
            width: chartContainerRef.current.clientWidth,
          });
        }
      };

      window.addEventListener("resize", handleResize);

      // Clear timer if component unmounts
      return () => {
        window.removeEventListener("resize", handleResize);
        // Clear lines
        if (entryLineRef.current) {
          chart.removeSeries(entryLineRef.current);
        }

        if (stopLossLineRef.current) {
          chart.removeSeries(stopLossLineRef.current);
        }
        if (takeProfitLineRef.current) {
          chart.removeSeries(takeProfitLineRef.current);
        }
        if (entryStopAreaRef.current) {
          if (Array.isArray(entryStopAreaRef.current)) {
            // If it's an array of lines, remove each one
            entryStopAreaRef.current.forEach((line) => {
              chart.removeSeries(line);
            });
          } else {
            // If it's a single series
            chart.removeSeries(entryStopAreaRef.current);
          }
        }
        if (upperAreaRef.current) {
          chart.removeSeries(upperAreaRef.current);
        }
        chart.remove();
      };
    }, 100); // Small delay to ensure DOM is ready

    return () => clearTimeout(timer);
  }, [height, timeZone]);

  const loadPriceData = async (symbol, interval) => {
      try {
        setLoading(true);
        setError(null);

        const data = await getPriceHistory(symbol, interval, 200);

        if (
          data &&
          data.data &&
          Array.isArray(data.data) &&
          data.data.length > 0
        ) {
          if (candlestickSeriesRef.current) {
            setPriceData(data);
            candlestickSeriesRef.current.setData(data.data);
          } else {
            setPriceData(data);
          }
        } else {
          const errorMsg = !data
            ? "No data received from server"
            : !data.data
            ? "Server response without data"
            : !Array.isArray(data.data)
            ? "Invalid data format"
            : "No historical data available";

          setError(errorMsg);
          console.error("❌ Data validation failed:", {
            hasData: !!data,
            hasDataArray: !!(data && data.data),
            isArray: !!(data && Array.isArray(data.data)),
            dataLength: data?.data?.length,
            hasChart: !!candlestickSeriesRef.current,
          });
        }
      } catch (err) {
        const errorMsg =
          "Error loading price data: " + (err.message || "Unknown error");
        setError(errorMsg);
        console.error("❌ Exception loading price data:", err);
      } finally {
        setLoading(false);
      }
    };

  const loadTradeData = async (symbol) => {
      try {
        // Load real data from open operations
        const response = await fetch("/api/open_trades");
        const tradesData = await response.json();

        // Find specific operation for this symbol
        const trade = tradesData.open_trades?.find((t) => t.symbol === symbol);

        if (trade) {
          // Map operation data
          const tradeData = {
            symbol: trade.symbol,
            side: determinePositionSide(trade), // Determine based on positionAmt and positionSide
            entry_price: parseFloat(trade.entryPrice),
            current_price: parseFloat(trade.breakEvenPrice), // Use breakEvenPrice as approximation
            stop_loss: trade.take_profit_target?.initial_stop
              ? parseFloat(trade.take_profit_target.initial_stop)
              : null,
            take_profit: trade.take_profit_target?.tp_price
              ? parseFloat(trade.take_profit_target.tp_price)
              : null,
            take_profit_value_usd: trade.take_profit_target?.value_usd
              ? parseFloat(trade.take_profit_target.value_usd)
              : null,
            stop_loss_ratio: trade.take_profit_target?.ratio
              ? parseFloat(trade.take_profit_target.ratio)
              : null,
            current_pnl_usd: trade.unrealizedProfit
              ? parseFloat(trade.unrealizedProfit)
              : null,
            entry_time: trade.updateTime ? trade.updateTime : Date.now(),
            unrealized_pnl: parseFloat(trade.unrealizedProfit),
            // Determine precision based on symbol
            precision: getPricePrecision(trade.symbol),
          };

          setTradeData(tradeData);

          // Add trade lines if priceData is available - will be handled by useEffect
        } else {
          // Example data if no real operation
          const mockTradeData = {
            symbol: symbol,
            side: "LONG",
            entry_price: 45000,
            current_price: 46000,
            stop_loss: 44000,
            take_profit: 47000,
            take_profit_value_usd: 2000, // Example value in USD
            stop_loss_ratio: 3, // Example ratio (3:1)
            current_pnl_usd: 250.5, // Current PnL example in USD
            entry_time: Date.now() - 24 * 60 * 60 * 1000, // 1 day ago
          };

          setTradeData(mockTradeData);

          // Add trade lines if priceData is available - will be handled by useEffect
        }
      } catch (err) {
        console.error("Error loading trade data:", err);
        // Don't show error if no active operation
      }
    };

  const addTradeLines = (tradeData, priceData) => {
      if (!candlestickSeriesRef.current || !tradeData) return;

      // Update current_price with closing price of most recent candle
      if (priceData && priceData.data && priceData.data.length > 0) {
        const latestCandle = priceData.data[priceData.data.length - 1];
        tradeData.current_price = latestCandle.close;
      }

      // Clear previous lines
      if (entryLineRef.current) {
        chartRef.current.removeSeries(entryLineRef.current);
        entryLineRef.current = null;
      }

      if (stopLossLineRef.current) {
        chartRef.current.removeSeries(stopLossLineRef.current);
        stopLossLineRef.current = null;
      }
      if (takeProfitLineRef.current) {
        chartRef.current.removeSeries(takeProfitLineRef.current);
        takeProfitLineRef.current = null;
      }
      if (entryStopAreaRef.current) {
        if (Array.isArray(entryStopAreaRef.current)) {
          // If it's an array of lines, remove each one
          entryStopAreaRef.current.forEach((line) => {
            chartRef.current.removeSeries(line);
          });
        } else {
          // If it's a single series
          chartRef.current.removeSeries(entryStopAreaRef.current);
        }
        entryStopAreaRef.current = null;
      }
      if (entryTpAreaRef.current) {
        if (Array.isArray(entryTpAreaRef.current)) {
          // If it's an array of lines, remove each one
          entryTpAreaRef.current.forEach((line) => {
            chartRef.current.removeSeries(line);
          });
        } else {
          // If it's a single series
          chartRef.current.removeSeries(entryTpAreaRef.current);
        }
        entryTpAreaRef.current = null;
      }
      if (upperAreaRef.current) {
        chartRef.current.removeSeries(upperAreaRef.current);
        upperAreaRef.current = null;
      }

      // Get precision for formatting prices
      const precision = tradeData.precision || 2;
      // const formatPrice = (price) => price.toFixed(precision);

      // Calculate time range based on candles and entry date
      let startTime, endTime;

      if (priceData && priceData.data && priceData.data.length > 0) {
        // Find entry candle index (closest to entry date)
        // entry_time can be in milliseconds or seconds, we need to normalize it
        let entryTimestamp = tradeData.entry_time;

        // If timestamp is very large (> year 2100), assume it's in milliseconds
        if (entryTimestamp > 4102444800) {
          // 2100-01-01 in seconds
          entryTimestamp = Math.floor(entryTimestamp / 1000);
        }

        let entryCandleIndex = 0;
        let minDiff = Infinity;

        priceData.data.forEach((candle, index) => {
          const candleTime = candle.time;
          const diff = Math.abs(candleTime - entryTimestamp);
          if (diff < minDiff) {
            minDiff = diff;
            entryCandleIndex = index;
          }
        });

        // Calculate start: 2 candles before entry
        const startIndex = Math.max(0, entryCandleIndex - 2);
        startTime = priceData.data[startIndex].time;

        // Calculate end: 2 candles after the most recent candle
        const lastCandleIndex = priceData.data.length - 1;
        const endIndex = Math.min(
          lastCandleIndex + 2,
          priceData.data.length - 1
        );
        endTime = priceData.data[endIndex].time;

        // If we want to extend beyond available data, calculate future time
        if (endIndex === lastCandleIndex && priceData.data.length > 1) {
          // Calculate interval between candles to extend 2 more candles
          const timeInterval = priceData.data[1].time - priceData.data[0].time;
          endTime = priceData.data[lastCandleIndex].time + timeInterval * 2;
        }
      } else {
        // Fallback if no candle data
        const timeRange = chartRef.current.timeScale().getVisibleRange();
        startTime =
          timeRange?.from || Math.floor(Date.now() / 1000) - 24 * 60 * 60;
        endTime = timeRange?.to || Math.floor(Date.now() / 1000) + 24 * 60 * 60;
      }

      // Create data for lines (points at start and end of visible range)
      const createLineData = (price) => [
        { time: startTime, value: price },
        { time: endTime, value: price },
      ];

      // Entry line
      if (tradeData.entry_price) {
        // Calculate PnL for entry line tooltip
        const pnlUsd = tradeData.current_pnl_usd;
        const isProfit = pnlUsd > 0;
        const pnlSign = isProfit ? "+" : "";
        const pnlColor = isProfit ? "#4caf50" : "#f44336";

        const entryTitle = `PnL: ${
          pnlUsd ? `${pnlSign}$${pnlUsd.toFixed(2)}` : "N/A"
        }`;

        entryLineRef.current = chartRef.current.addSeries(LineSeries, {
          color: pnlColor, // Use color based on PnL
          lineWidth: 2,
          lineStyle: 0, // Solid
          title: entryTitle,
          priceLineVisible: false,
          lastValueVisible: true, // Show last value
          crosshairMarkerVisible: true, // Show crosshair marker
          priceFormat: {
            type: "price",
            precision: 6,
            minMove: 0.000001,
          },
        });
        entryLineRef.current.setData(createLineData(tradeData.entry_price));
      }

      // Stop loss line
      if (tradeData.stop_loss) {
        // Calculate total loss using value_usd / ratio if available
        let totalLossFormatted;
        if (tradeData.take_profit_value_usd && tradeData.stop_loss_ratio) {
          const totalLoss =
            tradeData.take_profit_value_usd / tradeData.stop_loss_ratio;
          totalLossFormatted = totalLoss.toFixed(2);
        } else {
          // Fallback: calculate price difference
          const totalLoss = Math.abs(
            tradeData.entry_price - tradeData.stop_loss
          );
          totalLossFormatted = totalLoss.toFixed(precision);
        }

        stopLossLineRef.current = chartRef.current.addSeries(LineSeries, {
          color: "#f44336",
          lineWidth: 2,
          lineStyle: 1, // Punteada
          title: `SL $${totalLossFormatted}`,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false, // Disable crosshair marker
          priceFormat: {
            type: "price",
            precision: 6,
            minMove: 0.000001,
          },
        });
        stopLossLineRef.current.setData(createLineData(tradeData.stop_loss));
      }

      // Línea de take profit
      if (tradeData.take_profit) {
        // Use USD value of take profit if available, otherwise calculate difference
        let totalRewardFormatted;
        if (tradeData.take_profit_value_usd) {
          totalRewardFormatted = tradeData.take_profit_value_usd.toFixed(2);
        } else {
          // Fallback: calculate price difference
          const totalReward = Math.abs(
            tradeData.entry_price - tradeData.take_profit
          );
          totalRewardFormatted = totalReward.toFixed(precision);
        }

        takeProfitLineRef.current = chartRef.current.addSeries(LineSeries, {
          color: "#4caf50",
          lineWidth: 2,
          lineStyle: 1, // Punteada
          title: `TP $${totalRewardFormatted}`,
          priceLineVisible: false,
          lastValueVisible: false,
          crosshairMarkerVisible: false, // Disable crosshair marker
          priceFormat: {
            type: "price",
            precision: 6,
            minMove: 0.000001,
          },
        });
        takeProfitLineRef.current.setData(
          createLineData(tradeData.take_profit)
        );
      }

      // Create colored area between entry and stop loss
      if (tradeData.entry_price && tradeData.stop_loss) {
        // Red color for area in both cases (LONG and SHORT)
        const areaColor = "rgba(244, 67, 54, 0.1)"; // Light red for both cases

        // Determine which price is higher to create area correctly
        // const higherPrice = Math.max(tradeData.entry_price, tradeData.stop_loss);
        const lowerPrice = Math.min(tradeData.entry_price, tradeData.stop_loss);

        // Create colored area using multiple lines very close together
        // Calculate how many lines we need based on price difference
        const areaHeight = Math.abs(
          tradeData.entry_price - tradeData.stop_loss
        );
        const numLines = Math.max(Math.floor(areaHeight * 5000), 200); // Many more lines for solid area
        const stepSize = areaHeight / numLines;

        // Create multiple lines to fill the area
        const lines = [];
        for (let i = 0; i <= numLines; i++) {
          const currentPrice = lowerPrice + stepSize * i;

          // Check if this line is between entry price and current price
          const entryPrice = tradeData.entry_price;
          const currentMarketPrice = tradeData.current_price || entryPrice;
          // Simplify logic: lines between min and max of entry/current
          const minPrice = Math.min(entryPrice, currentMarketPrice);
          const maxPrice = Math.max(entryPrice, currentMarketPrice);
          const isInCurrentZone =
            currentPrice >= minPrice && currentPrice <= maxPrice;

          // Use higher opacity for lines between entry and current price (covered zone)
          const lineOpacity = isInCurrentZone ? "0.3" : "0.1";

          const lineData = [
            { time: startTime, value: currentPrice },
            { time: endTime, value: currentPrice },
          ];

          const line = chartRef.current.addSeries(LineSeries, {
            color: areaColor.replace("0.1", lineOpacity), // Variable opacity based on zone
            lineWidth: 1, // Thin lines
            lineStyle: 0, // Solid
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false, // Disable crosshair marker
            priceFormat: {
              type: "price",
              precision: 6,
              minMove: 0.000001,
            },
          });

          line.setData(lineData);
          lines.push(line);
        }

        // Save reference to all lines to clean them later
        entryStopAreaRef.current = lines;
        upperAreaRef.current = null;
      }

      // Create colored area between entry and take profit
      if (tradeData.entry_price && tradeData.take_profit) {
        // Green color for take profit area
        const tpAreaColor = "rgba(76, 175, 80, 0.1)"; // Light green for gains

        // Determine which price is higher to create area correctly
        // const higherPrice = Math.max(
        //   tradeData.entry_price,
        //   tradeData.take_profit
        // );
        const lowerPrice = Math.min(
          tradeData.entry_price,
          tradeData.take_profit
        );

        // Create colored area using multiple lines very close together
        const areaHeight = Math.abs(
          tradeData.entry_price - tradeData.take_profit
        );
        const numLines = Math.max(Math.floor(areaHeight * 5000), 200); // Many lines for solid area
        const stepSize = areaHeight / numLines;

        // Create multiple lines to fill the area
        const lines = [];
        for (let i = 0; i <= numLines; i++) {
          const currentPrice = lowerPrice + stepSize * i;

          // Check if this line is between entry price and current price
          const entryPrice = tradeData.entry_price;
          const currentMarketPrice = tradeData.current_price || entryPrice;
          // Simplify logic: lines between min and max of entry/current
          const minPrice = Math.min(entryPrice, currentMarketPrice);
          const maxPrice = Math.max(entryPrice, currentMarketPrice);
          const isInCurrentZone =
            currentPrice >= minPrice && currentPrice <= maxPrice;

          // Use higher opacity for lines between entry and current price (covered zone)
          const lineOpacity = isInCurrentZone ? "0.3" : "0.1";

          // Debug: log para las primeras líneas

          const lineData = [
            { time: startTime, value: currentPrice },
            { time: endTime, value: currentPrice },
          ];

          const line = chartRef.current.addSeries(LineSeries, {
            color: tpAreaColor.replace("0.1", lineOpacity), // Variable opacity based on zone
            lineWidth: 1, // Thin lines
            lineStyle: 0, // Solid
            priceLineVisible: false,
            lastValueVisible: false,
            crosshairMarkerVisible: false, // Disable crosshair marker
            priceFormat: {
              type: "price",
              precision: 6,
              minMove: 0.000001,
            },
          });

          line.setData(lineData);
          lines.push(line);
        }

        // Save lines to clean them later
        entryTpAreaRef.current = lines;
      }
          };

  // Load data when chart is ready and we have a symbol
  useEffect(() => {
    // Only load if we have symbol and chart is ready
    if (!symbol) {
      return;
    }

    if (!chartRef.current || !candlestickSeriesRef.current) {
      return;
    }

    // Call functions directly without dependencies
    loadPriceData(symbol, timeframe);
    loadTradeData(symbol);
  }, [symbol, timeframe]);

  const handleIntervalChange = (newTimeframe) => {
    setTimeframe(newTimeframe);
    setInterval(newTimeframe); // Keep synchronized
  };

  // Function to update entry line PnL
  const updateEntryMarkerPnL = useCallback(
    (/* newCurrentPrice */) => {
      if (!entryLineRef.current || !tradeData?.entry_price) return;

      // Use PnL that comes directly from API
      const pnlUsd = tradeData.current_pnl_usd;
      const isProfit = pnlUsd > 0;
      const pnlSign = isProfit ? "+" : "";
      const pnlColor = isProfit ? "#4caf50" : "#f44336";

      // Update entry line title with new PnL
      const entryTitle = `ENTRY ${formatPriceAuto(tradeData.entry_price)}\n${
        pnlUsd ? `${pnlSign}$${pnlUsd.toFixed(2)}` : "N/A"
      }`;

      // Update line color and title
      entryLineRef.current.applyOptions({
        color: pnlColor,
        title: entryTitle,
      });
    },
    [tradeData, formatPriceAuto]
  );

  // Function to update only the last candle without reloading everything
  const updateLastCandle = useCallback(async () => {
    if (!symbol || !timeframe || !priceData?.data?.length) {
      return;
    }

    try {
      const data = await getPriceHistory(symbol, timeframe, 2);

      if (data && data.data && data.data.length > 0) {
        const newCandle = data.data[data.data.length - 1]; // Last candle
        const currentData = [...priceData.data];
        const oldLastCandle = currentData[currentData.length - 1];

        // Only update if it really changed
        if (
          oldLastCandle.close !== newCandle.close ||
          oldLastCandle.time !== newCandle.time
        ) {
          // Only update chart directly
          if (candlestickSeriesRef.current) {
            candlestickSeriesRef.current.update(newCandle);
          }

          // Update current_price in tradeData if changed
          if (tradeData && tradeData.current_price !== newCandle.close) {
            setTradeData((prev) => ({
              ...prev,
              current_price: newCandle.close,
            }));

            // Update entry marker PnL
            updateEntryMarkerPnL(newCandle.close);
          }
        }
      }
    } catch (err) {
      console.error("❌ Error updating last candle:", err);
    }
  }, [symbol, timeframe, priceData, tradeData, updateEntryMarkerPnL]);

  // Simple function to toggle state
  const toggleRealTime = () => {
    setIsRealTimeEnabled((prev) => !prev);
  };

  // useEffect to handle interval based on state
  useEffect(() => {
    // Clear existing interval
    if (realTimeIntervalRef.current) {
      window.clearInterval(realTimeIntervalRef.current);
      realTimeIntervalRef.current = null;
    }

    if (isRealTimeEnabled && symbol && timeframe && priceData?.data?.length) {
      // First immediate update
      updateLastCandle();

      // Set up interval
      try {
        realTimeIntervalRef.current = window.setInterval(() => {
          updateLastCandle();
        }, 7000);
      } catch (error) {
        console.error("❌ Error creating interval:", error);
        realTimeIntervalRef.current = null;
      }
    }

    // Cleanup function
    return () => {
      if (realTimeIntervalRef.current) {
        window.clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
    };
  }, [
    isRealTimeEnabled,
    symbol,
    timeframe,
    priceData?.data?.length,
    updateLastCandle,
  ]); // Add missing dependencies

  // Clear interval when unmounting component
  useEffect(() => {
    return () => {
      if (realTimeIntervalRef.current) {
        clearInterval(realTimeIntervalRef.current);
      }
    };
  }, []);

  // Stop real time when symbol or timeframe changes
  useEffect(() => {
    if (isRealTimeEnabled) {
      // Only stop if symbol or timeframe really changed, not the interval
      if (realTimeIntervalRef.current) {
        window.clearInterval(realTimeIntervalRef.current);
        realTimeIntervalRef.current = null;
      }
      setIsRealTimeEnabled(false);
    }
  }, [symbol, timeframe, isRealTimeEnabled]); // Add missing dependency

  const handleRefresh = () => {
    loadPriceData(symbol, timeframe);
    loadTradeData(symbol);
  };

  if (error) {
    return (
      <Card>
        <CardContent>
          <Typography color="error" align="center">
            {error}
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardContent>
        <Box
          display="flex"
          justifyContent="space-between"
          alignItems="center"
          mb={2}
        >
          <Typography variant="h6">Trading Chart - {symbol}</Typography>
          <Box display="flex" gap={1}>
            <FormControl size="small">
              <InputLabel>Interval</InputLabel>
              <Select
                value={timeframe}
                label="Interval"
                onChange={(e) => handleIntervalChange(e.target.value)}
                sx={{
                  minWidth: 100,
                  "& .MuiOutlinedInput-root": {
                    border: "none !important",
                    borderRadius: 3,
                    color: "#2de2e6 !important",
                    backgroundColor: "rgba(45, 226, 230, 0.08) !important",
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
                      backgroundColor: "rgba(45, 226, 230, 0.12) !important",
                      background: "rgba(45, 226, 230, 0.12) !important",
                      boxShadow: "none !important",
                    },
                    "&.Mui-focused": {
                      backgroundColor: "rgba(45, 226, 230, 0.12) !important",
                      background: "rgba(45, 226, 230, 0.12) !important",
                      boxShadow: "none !important",
                    },
                  },
                  "& .MuiSelect-icon": {
                    color: "#2de2e6",
                  },
                  "& .MuiInputLabel-root": {
                    color: "#2de2e6",
                    fontWeight: 600,
                    "&.Mui-focused": {
                      color: "#2de2e6",
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
                <MenuItem value="1m">1m</MenuItem>
                <MenuItem value="3m">3m</MenuItem>
                <MenuItem value="5m">5m</MenuItem>
                <MenuItem value="15m">15m</MenuItem>
                <MenuItem value="1h">1h</MenuItem>
                <MenuItem value="4h">4h</MenuItem>
                <MenuItem value="1d">1d</MenuItem>
              </Select>
            </FormControl>

            <Button
              variant="outlined"
              size="small"
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

            <Button
              variant={isRealTimeEnabled ? "contained" : "outlined"}
              size="small"
              onClick={toggleRealTime}
              disabled={loading || !priceData?.data?.length}
              sx={{
                ...(isRealTimeEnabled
                  ? {
                      background: "rgba(255, 152, 0, 0.25) !important",
                      border: "none !important",
                      color: "#ff9800 !important",
                      fontWeight: 600,
                      borderRadius: 3,
                      px: 2.5,
                      py: 1,
                      textTransform: "none",
                      fontSize: "0.875rem",
                      boxShadow: "none !important",
                      "&:hover": {
                        background: "rgba(255, 152, 0, 0.35) !important",
                        boxShadow: "none !important",
                      },
                    }
                  : {
                      border: "none !important",
                      color: "#ff9800 !important",
                      backgroundColor: "rgba(255, 152, 0, 0.15) !important",
                      background: "rgba(255, 152, 0, 0.15) !important",
                      fontWeight: 600,
                      borderRadius: 3,
                      px: 2.5,
                      py: 1,
                      textTransform: "none",
                      fontSize: "0.875rem",
                      boxShadow: "none !important",
                      "&:hover": {
                        border: "none !important",
                        backgroundColor: "rgba(255, 152, 0, 0.25) !important",
                        background: "rgba(255, 152, 0, 0.25) !important",
                        boxShadow: "none !important",
                      },
                    }),
                "&:disabled": {
                  border: "none !important",
                  color: "#666 !important",
                  backgroundColor: "rgba(102, 102, 102, 0.1) !important",
                  background: "rgba(102, 102, 102, 0.1) !important",
                },
              }}
            >
              {isRealTimeEnabled ? "⏸️ Stop" : "▶️ Real Time"}
            </Button>

            {isRealTimeEnabled && (
              <Typography
                variant="caption"
                sx={{
                  alignSelf: "center",
                  color: "#ff9800",
                  fontWeight: 600,
                  fontSize: "0.75rem",
                  backgroundColor: "rgba(255, 152, 0, 0.15)",
                  borderRadius: 2,
                  px: 1.5,
                  py: 0.5,
                  animation: "pulse 2s infinite",
                  "@keyframes pulse": {
                    "0%": {
                      opacity: 1,
                    },
                    "50%": {
                      opacity: 0.7,
                    },
                    "100%": {
                      opacity: 1,
                    },
                  },
                }}
              >
                🔴 LIVE
              </Typography>
            )}
          </Box>
        </Box>

        {tradeData && (
          <Box
            mb={2}
            p={2}
            sx={{
              background:
                "linear-gradient(135deg, rgba(45, 226, 230, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
              borderRadius: 2,
              border: "1px solid rgba(45, 226, 230, 0.2)",
              boxShadow: "0 0 8px rgba(45, 226, 230, 0.1)",
            }}
          >
            <Typography variant="body2" color="textSecondary">
              <strong>Operation:</strong> {tradeData.side || "LONG"} |{" "}
              <strong>Entry:</strong> $
              {tradeData.entry_price?.toFixed(tradeData.precision || 2) ||
                "N/A"}{" "}
              | <strong>Current Price:</strong> $
              {tradeData.current_price?.toFixed(tradeData.precision || 2) ||
                "N/A"}{" "}
              | <strong>PnL:</strong> $
              {tradeData.unrealized_pnl?.toFixed(2) || "N/A"}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                display: "block",
                mt: 1,
                color: "#bdbdbd",
                fontSize: "0.75rem",
                fontStyle: "italic",
              }}
            >
              📊 Lines: Blue (Entry) | Red (Stop Loss) | Green (Take Profit) |
              Red area (Entry-Stop) | Green area (Entry-TP)
            </Typography>
          </Box>
        )}

        {loading && (
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            height={50}
            mb={2}
            sx={{
              background:
                "linear-gradient(135deg, rgba(45, 226, 230, 0.05) 0%, rgba(124, 58, 237, 0.05) 100%)",
              borderRadius: 2,
              border: "1px solid rgba(45, 226, 230, 0.2)",
            }}
          >
            <CircularProgress
              size={30}
              sx={{
                color: "#2de2e6",
              }}
            />
            <Typography
              variant="body2"
              ml={2}
              sx={{
                color: "#2de2e6",
                fontWeight: 600,
              }}
            >
              Loading data...
            </Typography>
          </Box>
        )}

        <div
          ref={chartContainerRef}
          style={{ width: "100%", height: height }}
        />
      </CardContent>
    </Card>
  );
};

export default TradingChart;
