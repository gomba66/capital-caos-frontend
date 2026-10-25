import {
  getClosedMarketPeriodKey,
  getUpcomingParentSessionOpening,
  getSessionCountdownClass,
  getSessionPresentation,
  isParentSessionOpening,
} from "../sessionPresentation";

describe("getClosedMarketPeriodKey", () => {
  test("uses the next market opening as the closed-market period key", () => {
    expect(
      getClosedMarketPeriodKey({
        opens_at: "2026-10-26T13:30:00-04:00",
      }),
    ).toBe("2026-10-26T17:30:00.000Z");
  });

  test("returns null when the next opening is unavailable or invalid", () => {
    expect(getClosedMarketPeriodKey(null)).toBeNull();
    expect(getClosedMarketPeriodKey({ opens_at: "invalid" })).toBeNull();
  });
});

describe("getSessionPresentation", () => {
  test.each([
    ["us", { name: "us_brinks", parent: "new_york" }],
    ["US", { name: "us_brinks", parent: "new_york" }],
    ["US Brinks", { name: "us_brinks", parent: "new_york" }],
    ["us_brinks", { name: "us_brinks", parent: "new_york" }],
    ["europe", { name: "eu_brinks", parent: "asia" }],
    ["Europe", { name: "eu_brinks", parent: "asia" }],
    ["eu_brinks", { name: "eu_brinks", parent: "asia" }],
  ])("keeps %s visible with its parent session", (name, presentation) => {
    expect(getSessionPresentation(name)).toEqual(presentation);
  });

  describe("getSessionCountdownClass", () => {
    test.each([
      [10 * 60 * 1000, ""],
      [5 * 60 * 1000, "session-countdown--urgent"],
      [60 * 1000, "session-countdown--critical"],
    ])("returns the matching urgency for %s milliseconds", (time, expected) => {
      expect(getSessionCountdownClass(time)).toBe(expected);
    });
  });

  test("keeps the main session name without adding a parent", () => {
    expect(getSessionPresentation("asia")).toEqual({
      name: "asia",
      parent: null,
    });
    expect(getSessionPresentation("new_york")).toEqual({
      name: "new_york",
      parent: null,
    });
  });

});

describe("isParentSessionOpening", () => {
  test.each([
    ["US Brinks", "New York", true],
    ["EU Brinks", "Asia", true],
    ["US Brinks", "Asia", false],
    ["New York", "New York", false],
  ])(
    "returns %s -> %s as %s",
    (currentSession, nextSession, expected) => {
      expect(isParentSessionOpening(currentSession, nextSession)).toBe(
        expected,
      );
    },
  );
});

describe("getUpcomingParentSessionOpening", () => {
  const currentSession = {
    name: "us",
    opens_at: "2026-10-21T13:00:00.000Z",
    closes_at: "2026-10-21T14:00:00.000Z",
  };

  test("returns New York's opening while US Brinks is active before it", () => {
    expect(
      getUpcomingParentSessionOpening(
        currentSession,
        Date.parse("2026-10-21T13:25:00.000Z"),
      ),
    ).toEqual({
      name: "new_york",
      opens_at: "2026-10-21T13:30:00.000Z",
    });
  });

  test("does not return New York after its opening", () => {
    expect(
      getUpcomingParentSessionOpening(
        currentSession,
        Date.parse("2026-10-21T13:30:00.000Z"),
      ),
    ).toBeNull();
  });

  test("does not create a parent opening for other sessions", () => {
    expect(
      getUpcomingParentSessionOpening(
        { ...currentSession, name: "asia" },
        Date.parse("2026-10-21T13:25:00.000Z"),
      ),
    ).toBeNull();
  });
});
