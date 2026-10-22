function toNumber(value, fallback = 0) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeSignalSide(value) {
    const text = String(value ?? "").trim().toUpperCase();
    return text === "SHORT" || text === "LONG" ? text : null;
}

function kthWeekdayOfMonth(year, month, weekday, occurrence) {
    const first = new Date(Date.UTC(year, month, 1));
    const offset = (weekday - first.getUTCDay() + 7) % 7;
    return new Date(Date.UTC(year, month, 1 + offset + (occurrence - 1) * 7));
}

function isUsDst(moment) {
    const year = moment.getUTCFullYear();
    const start = kthWeekdayOfMonth(year, 2, 0, 2);
    const end = kthWeekdayOfMonth(year, 10, 0, 1);
    return start <= moment && moment < end;
}

function isUkDst(moment) {
    const year = moment.getUTCFullYear();
    const start = kthWeekdayOfMonth(year, 2, 0, 2);
    const end = kthWeekdayOfMonth(year, 9, 0, 4);
    return start <= moment && moment < end;
}

function isSydneyDst(moment) {
    const year = moment.getUTCFullYear();
    const start = kthWeekdayOfMonth(year, 9, 0, 1);
    const end = kthWeekdayOfMonth(year, 2, 0, 1);
    return moment >= start || moment < end;
}

function shiftSession(startMinutes, endMinutes, dstEnabled) {
    if (!dstEnabled) return [startMinutes, endMinutes];
    return [startMinutes - 60, endMinutes - 60];
}

function activeSessionsForMoment(moment) {
    const utcMoment = new Date(moment);
    const configs = [
        { name: "new_york", start: 14 * 60 + 30, end: 21 * 60, isDst: isUsDst },
        { name: "asia", start: 22 * 60, end: 8 * 60, isDst: isSydneyDst },
        { name: "europe", start: 8 * 60, end: 9 * 60, isDst: isUkDst },
        { name: "us", start: 14 * 60, end: 15 * 60, isDst: isUsDst },
    ];

    return configs.flatMap(({ name, start, end, isDst }) => {
        return [-1, 0].flatMap((dayOffset) => {
            const sessionDay = new Date(Date.UTC(
                utcMoment.getUTCFullYear(),
                utcMoment.getUTCMonth(),
                utcMoment.getUTCDate() + dayOffset,
            ));
            const dst = isDst(sessionDay);
            const [startAdjusted, endAdjusted] = shiftSession(start, end, dst);
            const opening = new Date(Date.UTC(
                sessionDay.getUTCFullYear(),
                sessionDay.getUTCMonth(),
                sessionDay.getUTCDate(),
                Math.floor(startAdjusted / 60),
                startAdjusted % 60,
            ));
            const closingMinute = name === "asia" && dst ? end : endAdjusted;
            let closing = new Date(Date.UTC(
                sessionDay.getUTCFullYear(),
                sessionDay.getUTCMonth(),
                sessionDay.getUTCDate(),
                Math.floor(closingMinute / 60),
                closingMinute % 60,
            ));

            if (closing <= opening) {
                closing = new Date(closing.getTime() + 24 * 60 * 60 * 1000);
            }

            return opening <= utcMoment && utcMoment < closing
                ? [{ name, opening, closing }]
                : [];
        });
    });
}

function nextSessionForMoment(moment) {
    const now = new Date(moment);
    const candidates = [];
    const windows = [
        { name: "new_york", start: 14 * 60 + 30 },
        { name: "asia", start: 22 * 60 },
        { name: "europe", start: 8 * 60 },
        { name: "us", start: 14 * 60 },
    ];

    for (let dayOffset = 0; dayOffset < 10; dayOffset += 1) {
        const day = new Date(now.getTime());
        day.setUTCDate(day.getUTCDate() + dayOffset);
        const dayStart = new Date(Date.UTC(
            day.getUTCFullYear(),
            day.getUTCMonth(),
            day.getUTCDate(),
            0,
            0,
            0,
            0,
        ));

        for (const { name, start } of windows) {
            const opensAt = new Date(dayStart.getTime() + start * 60 * 1000);
            if (opensAt > now) {
                candidates.push({ name, opens_at: opensAt.toISOString() });
            }
        }
    }

    return candidates.sort((left, right) => new Date(left.opens_at) - new Date(right.opens_at))[0] || null;
}

export function normalizeCapitalCaosPayload(payload) {
    const rows = Array.isArray(payload?.momentum_pairs)
        ? payload.momentum_pairs
        : [];

    const normalizedRows = rows
        .filter((row) => row && typeof row.symbol === "string" && row.symbol.trim())
        .map((row, index) => {
            const symbol = row.symbol.trim();
            const bestSide = normalizeSignalSide(row.best_side || row.side) || "LONG";
            const price = toNumber(row.price ?? row.close, 0);
            const close = toNumber(row.close ?? row.price, price);
            const signalLongLight = Boolean(row.signal_long_light);
            const signalShortLight = Boolean(row.signal_short_light);
            const recentSignalSide = normalizeSignalSide(row.recent_signal_side);
            const timestamp = row.detected_at || row.scanned_at || row.time || new Date().toISOString();

            return {
                id: row.id ?? `${symbol}:${index}`,
                symbol,
                side: bestSide,
                best_side: bestSide,
                rank_score: toNumber(row.rank_score, 0),
                notes: row.notes || row.scanner || "SIGNAL",
                signal_type: row.notes || row.scanner || "SIGNAL",
                signal_long_light: signalLongLight,
                signal_short_light: signalShortLight,
                price_above_ema21_3m: Boolean(row.price_above_ema21_3m),
                heikin_ashi_3m_green: Boolean(row.heikin_ashi_3m_green),
                recent_signal_side: recentSignalSide,
                recent_signal_age_bars: row.recent_signal_age_bars ?? null,
                recent_signal_note: row.notes || row.scanner || "SIGNAL",
                close,
                price,
                scanner: row.scanner || row.scanner_type || "capital_caos",
                scanned_at: row.scanned_at || timestamp,
                detected_at: row.detected_at || timestamp,
                current_signal_time_ms: Date.parse(timestamp) || Date.now(),
                recent_signal_time_ms:
                    row.recent_signal_time_ms ??
                    (recentSignalSide && row.detected_at ? Date.parse(row.detected_at) : null),
                volume_24h_usdt: row.volume_24h_usdt ?? row.volume ?? null,
                short_observation: row.signal_short_light && !row.signal_long_light,
                ...row,
            };
        })
        .sort((left, right) => toNumber(right.rank_score) - toNumber(left.rank_score));

    const activeSignals = normalizedRows.filter(
        (row) => row.signal_long_light || row.signal_short_light,
    );
    const recentLongSignals = normalizedRows.filter(
        (row) => row.recent_signal_side === "LONG" && row.recent_signal_age_bars != null,
    );
    const detectedSignals = [];

    for (const row of activeSignals) {
        const sides = [];
        if (row.signal_long_light) sides.push("LONG");
        if (row.signal_short_light) sides.push("SHORT");
        for (const side of sides) {
            detectedSignals.push({
                id: `${row.symbol}:${side}:${row.current_signal_time_ms ?? Date.now()}`,
                symbol: row.symbol,
                side,
                signal_type: row.notes || "SIGNAL",
                timestamp_ms: row.current_signal_time_ms ?? Date.now(),
                recent_age_bars: null,
                rank_score: row.rank_score,
                close: row.close,
            });
        }
    }

    for (const row of recentLongSignals) {
        detectedSignals.push({
            id: `${row.symbol}:LONG:${row.recent_signal_time_ms ?? row.current_signal_time_ms ?? Date.now()}`,
            symbol: row.symbol,
            side: "LONG",
            signal_type: row.recent_signal_note || row.notes || "SIGNAL",
            timestamp_ms: row.recent_signal_time_ms ?? row.current_signal_time_ms ?? Date.now(),
            recent_age_bars: row.recent_signal_age_bars,
            rank_score: row.rank_score,
            close: row.close,
        });
    }

    const latestTimestamp = normalizedRows.reduce((latest, row) => {
        const next = Date.parse(row.detected_at || row.scanned_at || row.time || 0);
        return Number.isFinite(next) && next > latest ? next : latest;
    }, 0) || Date.now();

    const now = new Date();
    const currentSessions = activeSessionsForMoment(now);
    const validSessions = currentSessions.map(({ name }) => name);
    const currentSession = currentSessions.length
        ? [...currentSessions].sort((left, right) => left.opening - right.opening).at(-1)
        : null;
    const nextSession = nextSessionForMoment(now);

    const activity = [
        {
            id: 1,
            timestamp: new Date(latestTimestamp).toISOString(),
            level: "info",
            message: `Signal feed synced • ${normalizedRows.length} pairs loaded`,
        },
        {
            id: 2,
            timestamp: new Date().toISOString(),
            level: currentSessions.length ? "info" : "warning",
            message: currentSessions.length
                ? `Session active: ${validSessions.join(", ")}`
                : "Outside active trading session; waiting for the next market window",
        },
    ];

    return {
        scanning: true,
        valid_sessions: validSessions,
        current_session: currentSession
            ? {
                name: currentSession.name,
                opens_at: currentSession.opening.toISOString(),
                closes_at: currentSession.closing.toISOString(),
            }
            : null,
        next_session: nextSession
            ? {
                name: nextSession.name,
                opens_at: nextSession.opens_at,
            }
            : null,
        activity,
        recurring: [],
        history_count: Math.max(1, normalizedRows.length),
        last_scan: {
            timestamp: new Date(latestTimestamp).toISOString(),
            symbols_count: normalizedRows.length,
            valid_count: normalizedRows.length,
            detected_signals: detectedSignals,
            active_signals: activeSignals,
            recent_long_signals: recentLongSignals,
            short_observations: normalizedRows.filter((row) => row.short_observation),
            top: normalizedRows,
            long_top: normalizedRows.filter((row) => row.best_side === "LONG"),
            short_top: normalizedRows.filter((row) => row.best_side === "SHORT"),
        },
    };
}
