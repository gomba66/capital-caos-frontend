function tradeKey(trade) {
  const symbol = typeof trade?.symbol === "string" ? trade.symbol : "";
  const side = String(trade?.side || trade?.positionSide || "").toUpperCase();
  return symbol && side ? `${symbol}:${side}` : null;
}

export function detectTradeLifecycleEvents(previousTrades, currentTrades) {
  if (!Array.isArray(previousTrades) || !Array.isArray(currentTrades)) return [];

  const previousByKey = new Map(
    previousTrades
      .map((trade) => [tradeKey(trade), trade])
      .filter(([key]) => key !== null),
  );
  const currentByKey = new Map(
    currentTrades
      .map((trade) => [tradeKey(trade), trade])
      .filter(([key]) => key !== null),
  );
  const timestamp = Date.now();
  const events = [];

  for (const [key, trade] of currentByKey) {
    if (!previousByKey.has(key)) {
      events.push({
        id: `trade-opened:${key}:${timestamp}`,
        type: "opened",
        symbol: trade.symbol,
        side: trade.side || trade.positionSide,
        timestamp_ms: timestamp,
      });
    }
  }

  for (const [key, trade] of previousByKey) {
    if (!currentByKey.has(key)) {
      events.push({
        id: `trade-closed:${key}:${timestamp}`,
        type: "closed",
        symbol: trade.symbol,
        side: trade.side || trade.positionSide,
        timestamp_ms: timestamp,
      });
    }
  }

  return events;
}
