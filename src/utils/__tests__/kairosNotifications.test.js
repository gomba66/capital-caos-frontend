import { describe, expect, it } from "vitest";
import { detectKairosEvents } from "../kairosNotifications";

const now = Date.parse("2026-10-24T18:00:00Z");

function sample(hoursAgo, activeCount) {
  return {
    timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
    active_count: activeCount,
  };
}

function risingHistory() {
  return [
    ...[11.5, 10.5, 9.5, 8.5, 7.5, 6.5].map((hoursAgo) =>
      sample(hoursAgo, 0),
    ),
    ...[5.5, 4.5, 3.5, 2.5].map((hoursAgo) => sample(hoursAgo, 2)),
    sample(1.9, 10),
    sample(1.6, 10),
    sample(1.3, 10),
    sample(0.8, 15),
    sample(0.6, 20),
    sample(0.4, 25),
    sample(0.2, 28),
  ];
}

describe("detectKairosEvents", () => {
  it("does not notify for historical peaks on the initial snapshot", () => {
    const history = risingHistory();

    const result = detectKairosEvents(null, 30, history, now);

    expect(result.events).toEqual([]);
    expect(result.snapshot.lastSampleTime).toBe(Date.parse(history.at(-1).timestamp));
  });

  it("notifies once for a new peak sample and does not repeat it on polling", () => {
    const history = risingHistory();
    const previousSnapshot = {
      lastSampleTime: Date.parse(history.at(-2).timestamp),
      state: "steady",
    };

    const firstPoll = detectKairosEvents(previousSnapshot, 30, history, now);

    expect(firstPoll.events).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ type: "peak", score: expect.any(Number) }),
      ]),
    );

    const nextPoll = detectKairosEvents(firstPoll.snapshot, 30, history, now + 5000);
    expect(nextPoll.events).toEqual([]);
  });

  it("notifies when Kairos newly enters Signal Convergence", () => {
    const history = risingHistory();
    const previousSnapshot = {
      lastSampleTime: Date.parse(history.at(-1).timestamp),
      state: "steady",
    };

    const result = detectKairosEvents(previousSnapshot, 30, history, now);

    expect(result.events[0]).toEqual(
      expect.objectContaining({ type: "surge", score: expect.any(Number) }),
    );
  });
});
