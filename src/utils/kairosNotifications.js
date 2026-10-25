import { getSignalTideReading } from "./signalTide";

function latestSampleTime(history, now) {
  return history.reduce((latest, sample) => {
    const timestamp = Date.parse(sample?.timestamp);
    return Number.isFinite(timestamp) && timestamp <= now
      ? Math.max(latest ?? timestamp, timestamp)
      : latest;
  }, null);
}

export function detectKairosEvents(
  previousSnapshot,
  activeCount,
  history,
  now = Date.now(),
) {
  const reading = getSignalTideReading(activeCount, history, now);
  if (!reading) {
    return { events: [], snapshot: previousSnapshot };
  }

  const lastSampleTime = latestSampleTime(history, now);
  const snapshot = { lastSampleTime, state: reading.state };
  if (!previousSnapshot) {
    return { events: [], snapshot };
  }

  const events = reading.indexTimeline
    .filter(
      (point) =>
        point.disturbance &&
        lastSampleTime != null &&
        point.time <= lastSampleTime &&
        (previousSnapshot.lastSampleTime == null ||
          point.time > previousSnapshot.lastSampleTime),
    )
    .map((point) => ({
      id: `kairos-peak:${point.time}`,
      type: "peak",
      score: point.score,
      timestamp_ms: point.time,
    }));

  if (reading.state === "surge" && previousSnapshot.state !== "surge") {
    events.unshift({
      id: `kairos-surge:${now}`,
      type: "surge",
      score: reading.score,
      timestamp_ms: now,
    });
  }

  return { events, snapshot };
}
