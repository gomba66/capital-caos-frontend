/**
 * Calcula el profit factor general, de longs y de shorts.
 * Profit Factor = Suma de ganancias / Suma de pérdidas (en valor absoluto)
 * Si no hay pérdidas, retorna null para evitar división por cero.
 * @param {Array} operations - Lista de operaciones cerradas.
 * @returns {{total: number|null, long: number|null, short: number|null}}
 */
export function calculateProfitFactors(operations) {
  let grossProfit = 0,
    grossLoss = 0;
  let grossProfitLong = 0,
    grossLossLong = 0;
  let grossProfitShort = 0,
    grossLossShort = 0;

  (operations || []).forEach((op) => {
    const pnl = Number(op.pnl || 0);
    const side = (op.side || op.positionSide || "").toLowerCase();
    if (pnl > 0) {
      grossProfit += pnl;
      if (side.includes("long")) grossProfitLong += pnl;
      if (side.includes("short")) grossProfitShort += pnl;
    } else if (pnl < 0) {
      grossLoss += Math.abs(pnl);
      if (side.includes("long")) grossLossLong += Math.abs(pnl);
      if (side.includes("short")) grossLossShort += Math.abs(pnl);
    }
  });

  return {
    total: grossLoss > 0 ? +(grossProfit / grossLoss).toFixed(2) : null,
    long:
      grossLossLong > 0 ? +(grossProfitLong / grossLossLong).toFixed(2) : null,
    short:
      grossLossShort > 0
        ? +(grossProfitShort / grossLossShort).toFixed(2)
        : null,
  };
}

/**
 * Calcula el winrate general, de longs y de shorts.
 * Winrate = (Número de trades ganadores / Total de trades) * 100
 * @param {Array} operations - Lista de operaciones cerradas.
 * @returns {{total: number|null, long: number|null, short: number|null}}
 */
export function calculateWinrates(operations) {
  let totalTrades = 0,
    totalWins = 0;
  let longTrades = 0,
    longWins = 0;
  let shortTrades = 0,
    shortWins = 0;

  (operations || []).forEach((op) => {
    const pnl = Number(op.pnl || 0);
    const side = (op.side || op.positionSide || "").toLowerCase();
    
    totalTrades++;
    if (pnl > 0) totalWins++;
    
    if (side.includes("long")) {
      longTrades++;
      if (pnl > 0) longWins++;
    } else if (side.includes("short")) {
      shortTrades++;
      if (pnl > 0) shortWins++;
    }
  });

  return {
    total: totalTrades > 0 ? +((totalWins / totalTrades) * 100).toFixed(1) : null,
    long: longTrades > 0 ? +((longWins / longTrades) * 100).toFixed(1) : null,
    short: shortTrades > 0 ? +((shortWins / shortTrades) * 100).toFixed(1) : null,
  };
}
