export function tradingViewTicker(symbol) {
  const compactSymbol = symbol.replaceAll("/", "").split(":")[0];
  const quote = [
    "USDT",
    "USDC",
    "BUSD",
    "FDUSD",
    "USD",
    "BTC",
    "ETH",
    "BNB",
    "EUR",
  ].find((currency) => compactSymbol.endsWith(currency));
  const pair = quote
    ? compactSymbol
    : `${compactSymbol.replace(/USDT$/, "")}USDT`;
  return `BINANCE:${pair}.P`;
}
