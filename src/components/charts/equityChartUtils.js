export function buildEquityDrawdownData(operations, startingPoint) {
  let equity = 0;

  const filteredOps = (operations || [])
    .filter((op) => op.closed_at || op.closeTime)
    .sort(
      (a, b) =>
        new Date(a.closed_at || a.closeTime) -
        new Date(b.closed_at || b.closeTime)
    );

  if (filteredOps.length === 0) {
    return [
      {
        date: new Date().toISOString(),
        equity: 0,
        drawdown: 0,
        pnl: 0,
        symbol: startingPoint,
      },
    ];
  }

  const firstTrade = filteredOps[0];
  const initialPoint = {
    date: new Date(
      new Date(firstTrade.closed_at || firstTrade.closeTime).getTime() - 60000
    ).toISOString(),
    equity: 0,
    drawdown: 0,
    pnl: 0,
    symbol: startingPoint,
  };

  let peak = 0;

  const equityData = filteredOps.map((op) => {
    equity += Number(op.pnl || 0);
    if (equity > peak) {
      peak = equity;
    }
    const drawdown = equity - peak;

    return {
      date: op.closed_at || op.closeTime,
      equity: Number(equity.toFixed(4)),
      drawdown: Number(drawdown.toFixed(4)),
      pnl: Number(op.pnl || 0),
      symbol: op.symbol,
    };
  });

  return [initialPoint, ...equityData];
}
