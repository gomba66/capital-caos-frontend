export const SIGNAL_TIDE_MIN_ACTIVE = 20;

const HOUR_MS = 60 * 60 * 1000;
const HISTORY_WINDOW_MS = 24 * HOUR_MS;
const MIN_HOURLY_SAMPLES = 1;
const MIN_SIX_HOUR_SAMPLES = 6;
const DISTURBANCE_SCORE_FLOOR = 60;
const DISTURBANCE_SCORE_JUMP = 20;

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function average(samples) {
  return samples.reduce((total, sample) => total + sample.count, 0) / samples.length;
}

function samplesBetween(samples, start, end, includeEnd = false) {
  return samples.filter(
    (sample) =>
      sample.time >= start &&
      (includeEnd ? sample.time <= end : sample.time < end),
  );
}

function calculateReading(count, samples, now) {
  const currentHour = samplesBetween(samples, now - HOUR_MS, now, true);
  const previousHour = samplesBetween(samples, now - 2 * HOUR_MS, now - HOUR_MS);
  const currentSixHours = samplesBetween(samples, now - 6 * HOUR_MS, now, true);
  const previousSixHours = samplesBetween(
    samples,
    now - 12 * HOUR_MS,
    now - 6 * HOUR_MS,
  );
  const hasOneHourComparison =
    currentHour.length >= MIN_HOURLY_SAMPLES &&
    previousHour.length >= MIN_HOURLY_SAMPLES;
  const hasSixHourComparison =
    currentSixHours.length >= MIN_SIX_HOUR_SAMPLES &&
    previousSixHours.length >= MIN_SIX_HOUR_SAMPLES;
  const change1h = hasOneHourComparison
    ? Math.round(average(currentHour) - average(previousHour))
    : null;
  const change6h = hasSixHourComparison
    ? Math.round(average(currentSixHours) - average(previousSixHours))
    : null;
  const risingTransitions = currentHour
    .slice(1)
    .filter(
      (sample, index) =>
        sample.count > currentHour[index].count,
    ).length;
  const hourlyTransitions = Math.max(0, currentHour.length - 1);
  const risingPersistence =
    hourlyTransitions > 0 ? risingTransitions / hourlyTransitions : 0;
  const hourlyGrowth =
    currentHour.length > 1
      ? currentHour.at(-1).count - currentHour[0].count
      : 0;
  const availabilityScore =
    Math.min(count / SIGNAL_TIDE_MIN_ACTIVE, 1) * 35;
  const shortTrendScore =
    change1h == null ? 0 : clamp(change1h / 15, -1, 1) * 30;
  const longTrendScore =
    change6h == null ? 0 : clamp(change6h / 25, -1, 1) * 20;
  const persistenceScore =
    hasOneHourComparison && hourlyGrowth > 0
      ? risingPersistence * clamp(hourlyGrowth / 12, 0, 1) * 15
      : 0;
  const rawScore = clamp(
    availabilityScore + shortTrendScore + longTrendScore + persistenceScore,
    0,
    100,
  );
  const score = Math.round(
    count < SIGNAL_TIDE_MIN_ACTIVE ? Math.min(rawScore, 49) : rawScore,
  );

  let state = "steady";
  if (count < SIGNAL_TIDE_MIN_ACTIVE) state = "quiet";
  else if (!hasOneHourComparison) state = "warming";
  else if (change1h <= -3) state = "cooling";
  else if (score >= 75 && risingTransitions >= 3) state = "surge";
  else if (score >= 55 && change1h > 0) state = "rising";
  else state = "steady";

  return {
    activeCount: count,
    score,
    state,
    change1h,
    change6h,
    risingTransitions,
    hourlyTransitions,
    risingPersistence,
    hasHistory: samples.length > 0,
    hasOneHourComparison,
    hasSixHourComparison,
  };
}

function getIndexTimeline(samples, currentReading, now) {
  const timeline = samples.map((sample, index) => {
    const historicalSamples = samples.slice(0, index + 1);
    const reading = calculateReading(sample.count, historicalSamples, sample.time);
    return {
      time: sample.time,
      score: reading.score,
    };
  });

  if (timeline.length && timeline.at(-1).time !== now) {
    timeline.push({
      time: now,
      score: currentReading.score,
    });
  }

  return timeline.map((point, index) => {
    const previousScore = index > 0 ? timeline[index - 1].score : null;
    const scoreJump =
      previousScore != null && point.score - previousScore >= DISTURBANCE_SCORE_JUMP;
    const entersHighRange =
      point.score >= 75 && (previousScore == null || previousScore < 75);

    return {
      time: point.time,
      score: point.score,
      disturbance:
        entersHighRange ||
        (point.score >= DISTURBANCE_SCORE_FLOOR && scoreJump),
    };
  });
}

export function getSignalTideReading(activeCount, history = [], now = Date.now()) {
  if (activeCount == null || !Array.isArray(history)) return null;
  const count = Number(activeCount);
  if (!Number.isFinite(count) || count < 0) return null;

  const samples = history
    .map((sample) => ({
      time: Date.parse(sample?.timestamp),
      count: Number(sample?.active_count),
    }))
    .filter(
      (sample) =>
        Number.isFinite(sample.time) &&
        Number.isFinite(sample.count) &&
        sample.count >= 0 &&
        sample.time <= now &&
        sample.time >= now - HISTORY_WINDOW_MS,
    )
    .sort((left, right) => left.time - right.time);
  const reading = calculateReading(count, samples, now);

  return {
    ...reading,
    indexTimeline: getIndexTimeline(samples, reading, now),
  };
}
