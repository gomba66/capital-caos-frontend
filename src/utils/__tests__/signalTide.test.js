import { describe, expect, it } from "vitest";
import {
  getSignalTideReading,
  SIGNAL_TIDE_MIN_ACTIVE,
} from "../signalTide";

const now = Date.parse("2026-10-22T20:00:00Z");

function sample(hoursAgo, activeCount) {
  return {
    timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
    active_count: activeCount,
  };
}

function samples(hoursAndCounts) {
  return hoursAndCounts.map(([hoursAgo, activeCount]) =>
    sample(hoursAgo, activeCount),
  );
}

describe("Cipher Kairos reading", () => {
  it("marks the pool quiet below the active-signal entry floor", () => {
    const reading = getSignalTideReading(19, [], now);

    expect(reading.activeCount).toBe(SIGNAL_TIDE_MIN_ACTIVE - 1);
    expect(reading.score).toBe(33);
    expect(reading.state).toBe("quiet");
    expect(reading.change1h).toBeNull();
  });

  it("uses the 1h and 6h windows to show signal-pool momentum", () => {
    const reading = getSignalTideReading(
      30,
      samples([
        [11.5, 0],
        [10.5, 0],
        [9.5, 0],
        [8.5, 0],
        [7.5, 0],
        [6.5, 0],
        [5.5, 5],
        [4.5, 5],
        [3.5, 5],
        [2.5, 5],
        [1.9, 5],
        [1.6, 5],
        [1.3, 5],
        [0.8, 10],
        [0.6, 14],
        [0.4, 18],
        [0.2, 23],
        [0.1, 28],
      ]),
      now,
    );

    expect(reading.change1h).toBeGreaterThan(0);
    expect(reading.change6h).toBeGreaterThan(0);
    expect(reading.risingTransitions).toBe(4);
    expect(reading.score).toBeGreaterThanOrEqual(75);
    expect(reading.state).toBe("surge");
    expect(reading.hasOneHourComparison).toBe(true);
    expect(reading.hasSixHourComparison).toBe(true);
    expect(reading.indexTimeline.some((point) => point.disturbance)).toBe(true);
  });

  it("keeps a stable pool at the trade floor in steady flow", () => {
    const reading = getSignalTideReading(
      20,
      samples([
        [11.5, 20],
        [10.5, 20],
        [9.5, 20],
        [8.5, 20],
        [7.5, 20],
        [6.5, 20],
        [5.5, 20],
        [4.5, 20],
        [3.5, 20],
        [2.5, 20],
        [1.8, 20],
        [1.5, 20],
        [1.3, 20],
        [0.8, 20],
        [0.6, 20],
        [0.4, 20],
        [0.2, 20],
      ]),
      now,
    );

    expect(reading.score).toBe(35);
    expect(reading.state).toBe("steady");
    expect(reading.change1h).toBe(0);
    expect(reading.change6h).toBe(0);
    expect(reading.indexTimeline.some((point) => point.disturbance)).toBe(false);
  });

  it("does not compare against stale snapshots outside each window tolerance", () => {
    const reading = getSignalTideReading(25, [sample(2, 10)], now);

    expect(reading.change1h).toBeNull();
    expect(reading.change6h).toBeNull();
    expect(reading.hasOneHourComparison).toBe(false);
    expect(reading.hasSixHourComparison).toBe(false);
  });

  it("compares one snapshot from each hourly window when scans are sparse", () => {
    const reading = getSignalTideReading(
      25,
      samples([
        [1.5, 20],
        [0.5, 25],
      ]),
      now,
    );

    expect(reading.change1h).toBe(5);
    expect(reading.hasOneHourComparison).toBe(true);
    expect(reading.risingTransitions).toBe(0);
    expect(reading.hourlyTransitions).toBe(0);
  });

  it("keeps hourly momentum collecting when the previous hour has no snapshot", () => {
    const reading = getSignalTideReading(
      25,
      samples([
        [0.5, 20],
        [0.25, 25],
      ]),
      now,
    );

    expect(reading.change1h).toBeNull();
    expect(reading.hasOneHourComparison).toBe(false);
  });

  it("keeps a rising pool below the entry floor in the quiet score range", () => {
    const reading = getSignalTideReading(
      19,
      [sample(6, 0), sample(1, 0), sample(0.1, 18)],
      now,
    );

    expect(reading.score).toBe(33);
    expect(reading.state).toBe("quiet");
  });

  it("requires repeated increases before calling a one-hour jump a signal surge", () => {
    const reading = getSignalTideReading(
      30,
      samples([
        [1.9, 5],
        [1.6, 5],
        [1.3, 5],
        [0.8, 5],
        [0.6, 5],
        [0.4, 5],
        [0.2, 5],
        [0.1, 25],
      ]),
      now,
    );

    expect(reading.risingTransitions).toBe(1);
    expect(reading.state).not.toBe("surge");
  });

  it("waits for enough scan history before recommending a rising state", () => {
    const reading = getSignalTideReading(25, [sample(0.1, 25)], now);

    expect(reading.state).toBe("warming");
  });

  it("rejects missing counts and malformed history", () => {
    expect(getSignalTideReading(null, [], now)).toBeNull();
    expect(getSignalTideReading(25, {}, now)).toBeNull();
  });
});
