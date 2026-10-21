import { selectNewSignalNotifications } from "../signalNotifications";

describe("selectNewSignalNotifications", () => {
  const events = [
    { symbol: "BTCUSDT", side: "LONG" },
    { symbol: "ETHUSDT", side: "SHORT" },
  ];

  test("does not notify for symbols already in the listed pairs", () => {
    const selected = selectNewSignalNotifications(
      events,
      new Set(["BTCUSDT", "ETHUSDT"]),
      new Set(["BTCUSDT"]),
    );

    expect(selected).toEqual([events[1]]);
  });

  test("does not notify existing pairs on initial load", () => {
    const selected = selectNewSignalNotifications(
      events,
      new Set(["BTCUSDT", "ETHUSDT"]),
      null,
    );

    expect(selected).toEqual([]);
  });

  test("allows notification when a removed symbol reappears", () => {
    const selected = selectNewSignalNotifications(
      [events[0]],
      new Set(["BTCUSDT"]),
      new Set(),
    );

    expect(selected).toEqual([events[0]]);
  });
});
