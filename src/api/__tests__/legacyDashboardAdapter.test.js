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
});
