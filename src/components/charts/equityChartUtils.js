export function getWheelZoomRange(range, anchorIndex, deltaY, dataLength) {
  const start = Math.max(0, Math.min(range.start, dataLength - 1));
  const end = Math.max(start, Math.min(range.end, dataLength - 1));
  const currentSpan = end - start + 1;
  if (dataLength < 2 || currentSpan < 2 || deltaY === 0) {
    return { start, end };
  }

  const anchor = Math.max(start, Math.min(anchorIndex, end));
  const anchorRatio = (anchor - start) / (currentSpan - 1);
  const zoomFactor = deltaY < 0 ? 0.8 : 1.25;
  const nextSpan = Math.max(
    2,
    Math.min(dataLength, Math.round(currentSpan * zoomFactor)),
  );
  if (nextSpan === currentSpan) {
    return { start, end };
  }

  const nextStart = Math.max(
    0,
    Math.min(
      dataLength - nextSpan,
      Math.round(anchor - anchorRatio * (nextSpan - 1)),
    ),
  );
  return { start: nextStart, end: nextStart + nextSpan - 1 };
}

export function panEquityRange(range, delta, dataLength) {
  const span = Math.max(1, Math.min(dataLength, range.end - range.start + 1));
  const start = Math.max(0, Math.min(dataLength - span, range.start + delta));
  return { start, end: start + span - 1 };
}

export function panEquityRangeByPixels(range, deltaX, plotWidth, dataLength) {
  if (plotWidth <= 0 || dataLength < 2) {
    return range;
  }

  const visibleCount = range.end - range.start + 1;
  const panSpan = Math.max(8, visibleCount - 1);
  const indexDelta = Math.round((deltaX * panSpan) / plotWidth);
  return panEquityRange(range, indexDelta, dataLength);
}

export function remapEquityRange(range, previousData, nextData) {
  if (!previousData.length || !nextData.length) {
    return { start: 0, end: Math.max(0, nextData.length - 1) };
  }

  const firstVisibleDate = previousData[range.start]?.date;
  const lastVisibleDate = previousData[range.end]?.date;
  if (!firstVisibleDate || !lastVisibleDate) {
    return { start: 0, end: nextData.length - 1 };
  }

  let start = nextData.findIndex((point) => point.date >= firstVisibleDate);
  if (start < 0) {
    start = nextData.length - 1;
  }

  let end = nextData.findIndex((point) => point.date > lastVisibleDate);
  end = end < 0 ? nextData.length - 1 : Math.max(start, end - 1);
  return { start, end };
}

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
