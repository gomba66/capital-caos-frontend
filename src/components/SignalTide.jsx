import { useEffect, useMemo, useRef, useState } from "react";
import { Activity, Cog, Orbit } from "lucide-react";
import { useTranslation } from "react-i18next";
import { getSignalTideReading } from "../utils/signalTide";

const TIMELINE_WINDOW_MS = 24 * 60 * 60 * 1000;
const CURRENT_EVENT_WINDOW_MS = 5 * 60 * 1000;
const PREVIEW_SCORE_TRANSITION_MS = 2200;

function gaugePoint(progress, radius = 91) {
  const angle = Math.PI * (1 - progress);
  return {
    x: 124 + Math.cos(angle) * radius,
    y: 112 - Math.sin(angle) * radius,
  };
}

function gaugeArc(score) {
  const points = Array.from({ length: 64 }, (_, index) =>
    gaugePoint((score / 100) * (index / 63)),
  );
  return points
    .map(
      (point, index) =>
        `${index === 0 ? "M" : "L"}${point.x.toFixed(2)},${point.y.toFixed(2)}`,
    )
    .join(" ");
}

function changeLabel(value, t) {
  if (value == null) return t("signalTide.collecting");
  if (value === 0) return t("signalTide.noChange");
  return `${value > 0 ? "+" : ""}${value}`;
}

function timelinePoint(point, index, points) {
  const timelineEnd = points.at(-1).time;
  const timelineStart = timelineEnd - TIMELINE_WINDOW_MS;
  const x = ((point.time - timelineStart) / TIMELINE_WINDOW_MS) * 100;
  const y = 30 - (point.score / 100) * 25;
  return { x, y, key: `${point.time}-${index}`, disturbance: point.disturbance };
}

function timelinePath(points) {
  return points
    .map((point, index) => {
      const { x, y } = timelinePoint(point, index, points);
      return `${index === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
}

export default function SignalTide({
  activeCount,
  history,
  preview = false,
  now = Date.now(),
}) {
  const { t } = useTranslation();
  const reading = useMemo(
    () => getSignalTideReading(activeCount, history, now),
    [activeCount, history, now],
  );
  const targetScore = reading?.score;
  const [previewScore, setPreviewScore] = useState(() => reading?.score ?? 0);
  const previewScoreRef = useRef(previewScore);
  const widgetRef = useRef(null);

  useEffect(() => {
    if (targetScore == null) return undefined;
    if (!preview) {
      previewScoreRef.current = targetScore;
      setPreviewScore(targetScore);
      return undefined;
    }

    const startScore = previewScoreRef.current;
    const scoreDelta = targetScore - startScore;
    if (scoreDelta === 0) return undefined;

    let startTime;
    let frameId;
    const animateScore = (timestamp) => {
      startTime ??= timestamp;
      const progress = Math.min(
        (timestamp - startTime) / PREVIEW_SCORE_TRANSITION_MS,
        1,
      );
      const easedProgress =
        progress < 0.5
          ? 4 * progress ** 3
          : 1 - (-2 * progress + 2) ** 3 / 2;
      const nextScore = Math.round(startScore + scoreDelta * easedProgress);
      previewScoreRef.current = nextScore;
      setPreviewScore(nextScore);

      if (progress < 1) frameId = window.requestAnimationFrame(animateScore);
    };

    frameId = window.requestAnimationFrame(animateScore);
    return () => window.cancelAnimationFrame(frameId);
  }, [preview, targetScore]);

  useEffect(() => {
    if (preview || reading?.state !== "surge") return undefined;

    const updateGlowOrigin = () => {
      const bounds = widgetRef.current?.getBoundingClientRect();
      if (!bounds) return;

      document.body.style.setProperty(
        "--signal-tide-glow-x",
        `${bounds.left + bounds.width / 2}px`,
      );
      document.body.style.setProperty(
        "--signal-tide-glow-y",
        `${bounds.top + bounds.height / 2}px`,
      );
    };

    updateGlowOrigin();
    window.addEventListener("resize", updateGlowOrigin);
    window.addEventListener("scroll", updateGlowOrigin, true);

    return () => {
      window.removeEventListener("resize", updateGlowOrigin);
      window.removeEventListener("scroll", updateGlowOrigin, true);
      document.body.style.removeProperty("--signal-tide-glow-x");
      document.body.style.removeProperty("--signal-tide-glow-y");
    };
  }, [preview, reading?.state]);

  if (!reading) return null;

  const displayedScore = preview ? previewScore : reading.score;
  const needleRotation = (displayedScore / 100) * 180 - 90;
  const timeline = reading.indexTimeline;
  const timelineLine = timelinePath(timeline);
  const latestReading = timeline.at(-1);
  const previousReading = timeline.at(-2);
  const lastTimelinePoint = latestReading
    ? {
        ...timelinePoint(latestReading, timeline.length - 1, timeline),
        disturbance:
          latestReading.disturbance ||
          (latestReading.score >= 75 &&
            previousReading?.disturbance &&
            latestReading.time - previousReading.time <= CURRENT_EVENT_WINDOW_MS),
      }
    : null;

  return (
    <section
      ref={widgetRef}
      className={`signal-tide signal-tide--${reading.state}${preview ? " signal-tide--preview" : ""}`}
      aria-label={t("signalTide.title")}
    >
      <div className="signal-tide-main">
        <header className="signal-tide-heading">
          <span className="signal-tide-mark" aria-hidden="true">
            <Orbit size={16} />
          </span>
          <div>
            <h2>{t("signalTide.title")}</h2>
          </div>
          {!preview && (
            <span className="signal-tide-live">
              <i />
              {t("signalTide.live")}
            </span>
          )}
        </header>

        <div
          className="signal-tide-gauge"
          role="img"
          aria-label={t("signalTide.gaugeLabel", {
            score: reading.score,
            status: t(`signalTide.states.${reading.state}`),
          })}
        >
          <svg viewBox="0 0 248 132" aria-hidden="true">
            <defs>
              <linearGradient
                id="signal-tide-gradient"
                gradientUnits="userSpaceOnUse"
                x1="33"
                y1="112"
                x2="215"
                y2="112"
              >
                <stop offset="0%" stopColor="var(--coral)" />
                <stop offset="38%" stopColor="var(--amber)" />
                <stop offset="72%" stopColor="var(--brand-mark)" />
                <stop offset="100%" stopColor="var(--green)" />
              </linearGradient>
            </defs>
            <path className="signal-tide-gauge-track" d={gaugeArc(100)} />
            <path
              className="signal-tide-gauge-value"
              d={gaugeArc(100)}
              pathLength="100"
              strokeDasharray={`${displayedScore} 100`}
            />
            <g
              className={`signal-tide-needle${reading.state === "warming" || preview ? " signal-tide-needle--calibrating" : ""}`}
              style={{ transform: `rotate(${needleRotation}deg)` }}
            >
              <g className="signal-tide-needle-wobble">
                <line x1="124" y1="112" x2="124" y2="44" />
              </g>
            </g>
            <circle className="signal-tide-hub" cx="124" cy="112" r="5" />
            <text className="signal-tide-score" x="124" y="91">
              {displayedScore}
            </text>
            <text className="signal-tide-score-unit" x="124" y="105">
              {t("signalTide.index")}
            </text>
            <text className="signal-tide-scale" x="27" y="128">
              0
            </text>
            <text className="signal-tide-scale" x="221" y="128">
              100
            </text>
          </svg>
        </div>

        <div className="signal-tide-state">
          <strong className="signal-tide-state-label">
            {reading.state === "warming" && (
              <Cog className="signal-tide-calibrating-gear" size={13} aria-hidden="true" />
            )}
            {t(`signalTide.states.${reading.state}`)}
          </strong>
          <span>{t(`signalTide.guidance.${reading.state}`)}</span>
        </div>
      </div>

      <div className="signal-tide-context">
        <div className="signal-tide-comparisons">
          <div className="signal-tide-comparison">
            <span>{t("signalTide.window1h")}</span>
            <strong>{changeLabel(reading.change1h, t)}</strong>
          </div>
          <div className="signal-tide-comparison">
            <span>{t("signalTide.window6h")}</span>
            <strong>{changeLabel(reading.change6h, t)}</strong>
          </div>
          <div className="signal-tide-comparison">
            <span>{t("signalTide.repeatedRisesLabel")}</span>
            <strong>
              {reading.hasOneHourComparison
                ? t("signalTide.repeatedRisesValue", {
                    rises: reading.risingTransitions,
                    scans: reading.hourlyTransitions,
                  })
                : t("signalTide.collecting")}
            </strong>
          </div>
        </div>

        <div className="signal-tide-history">
          <div className="signal-tide-history-heading">
            <span>
              <Activity size={12} aria-hidden="true" />
              {t("signalTide.historyLabel")}
            </span>
            <small>{t("signalTide.window24h")}</small>
          </div>
          {timeline.length ? (
            <>
              <svg
                className="signal-tide-sparkline"
                viewBox="0 0 100 32"
                preserveAspectRatio="none"
                role="img"
                aria-label={t("signalTide.indexTimelineLabel")}
              >
                <path className="signal-tide-timeline-threshold" d="M0,11.25 H100" />
                <path
                  className="signal-tide-timeline-line"
                  d={timelineLine}
                  pathLength="1"
                />
                {timeline.map((point, index) => {
                  if (!point.disturbance) return null;
                  const { x, y, key } = timelinePoint(point, index, timeline);
                  return (
                    <g key={key} className="signal-tide-disturbance">
                      <circle
                        className="signal-tide-disturbance-point"
                        cx={x}
                        cy={y}
                        r="1.4"
                      />
                    </g>
                  );
                })}
                {lastTimelinePoint && (
                  <g>
                    {lastTimelinePoint.disturbance && (
                      <circle
                        className="signal-tide-current-wave"
                        cx={lastTimelinePoint.x}
                        cy={lastTimelinePoint.y}
                        r="2"
                      />
                    )}
                    <circle
                      className="signal-tide-sparkline-point"
                      cx={lastTimelinePoint.x}
                      cy={lastTimelinePoint.y}
                      r="1.6"
                    />
                  </g>
                )}
              </svg>
              <div className="signal-tide-timeline-axis" aria-hidden="true">
                <span>{t("signalTide.timelineStart")}</span>
                <span>{t("signalTide.timelineNow")}</span>
              </div>
            </>
          ) : (
            <p className="signal-tide-warming">{t("signalTide.warmingUp")}</p>
          )}
          {(!reading.hasOneHourComparison ||
            !reading.hasSixHourComparison) && (
            <p className="signal-tide-warming">{t("signalTide.buildingHistory")}</p>
          )}
        </div>
        <p className="signal-tide-credo">{t("signalTide.credo")}</p>
      </div>
    </section>
  );
}
