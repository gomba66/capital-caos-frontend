import { afterEach, describe, expect, it, vi } from "vitest";
import { normalizeCapitalCaosPayload } from "../legacyDashboardAdapter";

describe("normalizeCapitalCaosPayload session state", () => {
    afterEach(() => {
        vi.useRealTimers();
    });

    it("keeps the Asia session active after midnight UTC during Sydney DST", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-10-21T00:25:00.000Z"));

        const dashboard = normalizeCapitalCaosPayload({ momentum_pairs: [] });

        expect(dashboard.valid_sessions).toContain("asia");
        expect(dashboard.current_session).toEqual({
            name: "asia",
            opens_at: "2026-10-20T21:00:00.000Z",
            closes_at: "2026-10-21T08:00:00.000Z",
        });
    });

    it("keeps the Asia session active after midnight UTC outside Sydney DST", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-06T07:25:00.000Z"));

        const dashboard = normalizeCapitalCaosPayload({ momentum_pairs: [] });

        expect(dashboard.valid_sessions).toContain("asia");
        expect(dashboard.current_session).toEqual({
            name: "asia",
            opens_at: "2026-01-05T21:00:00.000Z",
            closes_at: "2026-01-06T08:00:00.000Z",
        });
    });

    it("preserves the server-provided off-session trade threshold", () => {
        const dashboard = normalizeCapitalCaosPayload({
            momentum_pairs: [],
            trade_session_active: false,
            trade_signal_threshold: 40,
        });

        expect(dashboard.trade_session_active).toBe(false);
        expect(dashboard.trade_signal_threshold).toBe(40);
    });

    it("preserves an explicitly marked weekend session from the server", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-10T15:00:00.000Z"));

        const dashboard = normalizeCapitalCaosPayload({
            momentum_pairs: [],
            trade_session_active: true,
            trade_signal_threshold: 40,
            current_session: {
                name: "new_york",
                opens_at: "2026-01-10T14:30:00.000Z",
                closes_at: "2026-01-10T21:00:00.000Z",
                is_weekend: true,
            },
        });

        expect(dashboard.current_session).toEqual({
            name: "new_york",
            opens_at: "2026-01-10T14:30:00.000Z",
            closes_at: "2026-01-10T21:00:00.000Z",
            is_weekend: true,
        });
        expect(dashboard.valid_sessions).toContain("new_york");
    });

    it("preserves the next weekend session from the server", () => {
        vi.useFakeTimers();
        vi.setSystemTime(new Date("2026-01-10T09:00:00.000Z"));

        const dashboard = normalizeCapitalCaosPayload({
            momentum_pairs: [],
            next_session: {
                name: "new_york",
                opens_at: "2026-01-10T14:30:00.000Z",
                is_weekend: true,
            },
        });

        expect(dashboard.next_session).toEqual({
            name: "new_york",
            opens_at: "2026-01-10T14:30:00.000Z",
            is_weekend: true,
        });
    });
});
