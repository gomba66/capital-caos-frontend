import { createElement } from "react";
import { useEffect, useRef, useState } from "react";
import {
  Activity,
  ArrowRight,
  AudioLines,
  CandlestickChart,
  ChartNoAxesCombined,
  Check,
  CircleDot,
  ScanLine,
  ShieldCheck,
  Sparkles,
  Waves,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import SignalTide from "../components/SignalTide";
import { getSignalTideReading } from "../utils/signalTide";
import { PLAN_IDENTITIES } from "../utils/planIdentity";
import "../landing.css";

const platformCards = [
  { key: "scanner", Icon: ScanLine },
  { key: "kairos", Icon: Waves },
  { key: "workspace", Icon: CandlestickChart },
];
const principles = [
  { key: "context", Icon: CircleDot },
  { key: "process", Icon: ChartNoAxesCombined },
  { key: "risk", Icon: ShieldCheck },
];
const approachSteps = ["observe", "interpret", "decide"];
const pricingPlans = [
  { key: "signals", featureCount: 3 },
  { key: "whatsapp", featureCount: 3 },
  { key: "complete", featureCount: 3, featured: true },
];
const initialPnlPoints = [
  145, 139, 126, 134, 145, 129, 105, 113, 136, 120, 92, 103, 132, 115,
  84, 96, 124, 94, 62, 76, 51, 38, 55, 43, 68, 58, 83, 101, 89, 145,
];
const chartCycleWidth = 520;
const chartWidth = chartCycleWidth * 2;
const pointsPerCycle = initialPnlPoints.length;
const kairosActivityCycle = [
  18, 17, 19, 21, 24, 28, 33, 39, 43, 44, 45, 46, 47, 47, 46, 47, 46, 47,
  46, 47, 46, 45, 44, 42, 38, 32, 26, 20,
];
const kairosTickIntervalMs = 4000;
const kairosTimeStepMs = 15 * 60 * 1000;
const kairosToastDurationMs = 5000;
const kairosToastLimit = 2;
const kairosTradeExamples = [
  { symbol: "BTC/USDT", side: "long" },
  { symbol: "ETH/USDT", side: "short" },
  { symbol: "SOL/USDT", side: "long" },
];

function createSimulatedKairosHistory(now) {
  return Array.from({ length: 97 }, (_, index) => {
    const hoursAgo = 24 - index * 0.25;
    let activeCount;

    if (hoursAgo > 6) {
      activeCount = 5 + Math.round(Math.sin(index * 0.8) * 2);
    } else if (hoursAgo > 2) {
      activeCount = 8 + Math.round((6 - hoursAgo) * 1.5);
    } else if (hoursAgo > 1) {
      activeCount = 16 + Math.round((2 - hoursAgo) * 3);
    } else {
      activeCount = 25 + Math.round((1 - hoursAgo) * 14);
    }

    return {
      timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
      active_count: activeCount,
    };
  });
}

function getChartPath(points, width) {
  const pointSpacing = width / (points.length - 1);
  let path = `M 0 ${points[0]}`;

  for (let index = 1; index < points.length; index += 1) {
    const previousX = (index - 1) * pointSpacing;
    const currentX = index * pointSpacing;
    const middleX = (previousX + currentX) / 2;
    const middleY = (points[index - 1] + points[index]) / 2;
    path += ` Q ${previousX} ${points[index - 1]} ${middleX} ${middleY}`;
  }

  return `${path} T ${width} ${points[points.length - 1]}`;
}

function getChartYAtX(points, x, width) {
  const pointSpacing = width / (points.length - 1);
  const pointIndex = Math.min(Math.floor(x / pointSpacing), points.length - 2);
  const progress = (x - pointIndex * pointSpacing) / pointSpacing;
  return (
    points[pointIndex] +
    (points[pointIndex + 1] - points[pointIndex]) * progress
  );
}

function generateNextPnlPoint(previousPoint) {
  const upwardBias = -0.45 + (85 - previousPoint) * 0.006;
  const random = Math.random() - 0.5;
  const spike = Math.abs(random) > 0.4 ? Math.sign(random) * 22 : 0;
  const randomMovement = random * 52 + spike;
  return Math.max(32, Math.min(150, previousPoint + upwardBias + randomMovement));
}

function generateNextCycle(points) {
  const nextPoints = points.slice(pointsPerCycle);
  for (let index = 0; index < pointsPerCycle; index += 1) {
    nextPoints.push(generateNextPnlPoint(nextPoints[nextPoints.length - 1]));
  }
  return nextPoints;
}

function AnimatedPnlChart() {
  const trackRef = useRef(null);
  const waveRef = useRef(null);
  const fillRef = useRef(null);
  const endpointRef = useRef(null);
  const animationFrameRef = useRef(null);
  const scrollOffsetRef = useRef(0);
  const pointsRef = useRef(null);
  const [points, setPoints] = useState(() => {
    const initialPoints = [...initialPnlPoints];
    while (initialPoints.length < pointsPerCycle * 2 + 1) {
      initialPoints.push(
        generateNextPnlPoint(initialPoints[initialPoints.length - 1]),
      );
    }
    pointsRef.current = initialPoints;
    return initialPoints;
  });
  const chartPath = getChartPath(points, chartWidth);
  const fillPath = `${chartPath} L ${chartWidth} 180 L 0 180 Z`;

  useEffect(() => {
    const motionPreference = window.matchMedia?.(
      "(prefers-reduced-motion: reduce)",
    );

    const updateAnimation = () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
      if (motionPreference?.matches) {
        scrollOffsetRef.current = 0;
        trackRef.current.setAttribute("transform", "translate(0 0)");
        endpointRef.current.setAttribute(
          "cy",
          getChartYAtX(pointsRef.current, 516, chartWidth),
        );
        return;
      }
      if (document.hidden) return;

      let previousTimestamp;
      const animateChart = (timestamp) => {
        if (previousTimestamp !== undefined) {
          scrollOffsetRef.current +=
            ((timestamp - previousTimestamp) * chartCycleWidth) / 32_000;
          while (scrollOffsetRef.current >= chartCycleWidth) {
            scrollOffsetRef.current -= chartCycleWidth;
            const nextPoints = generateNextCycle(pointsRef.current);
            pointsRef.current = nextPoints;
            const nextPath = getChartPath(nextPoints, chartWidth);
            waveRef.current.setAttribute("d", nextPath);
            fillRef.current.setAttribute(
              "d",
              `${nextPath} L ${chartWidth} 180 L 0 180 Z`,
            );
            setPoints(nextPoints);
          }
        }
        previousTimestamp = timestamp;

        const offset = scrollOffsetRef.current;
        trackRef.current.setAttribute("transform", `translate(${-offset} 0)`);
        const chartX = offset + 516;
        const wave = waveRef.current;
        let endpointY = getChartYAtX(pointsRef.current, chartX, chartWidth);

        if (
          typeof wave.getTotalLength === "function" &&
          typeof wave.getPointAtLength === "function"
        ) {
          let low = 0;
          let high = wave.getTotalLength();
          for (let index = 0; index < 12; index += 1) {
            const middle = (low + high) / 2;
            if (wave.getPointAtLength(middle).x < chartX) {
              low = middle;
            } else {
              high = middle;
            }
          }
          endpointY = wave.getPointAtLength((low + high) / 2).y;
        }

        endpointRef.current.setAttribute("cy", endpointY);
        animationFrameRef.current =
          window.requestAnimationFrame(animateChart);
      };

      animationFrameRef.current =
        window.requestAnimationFrame(animateChart);
    };

    updateAnimation();
    motionPreference?.addEventListener("change", updateAnimation);
    document.addEventListener("visibilitychange", updateAnimation);
    return () => {
      window.cancelAnimationFrame(animationFrameRef.current);
      motionPreference?.removeEventListener("change", updateAnimation);
      document.removeEventListener("visibilitychange", updateAnimation);
    };
  }, []);

  return (
    <svg
      viewBox="0 0 520 180"
      preserveAspectRatio="none"
      aria-hidden="true"
      data-testid="landing-chart"
    >
      <defs>
        <linearGradient id="landing-wave-fill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="currentColor" stopOpacity=".28" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0" />
        </linearGradient>
      </defs>
      <g
        className="landing-preview-chart-track"
        data-testid="landing-chart-track"
        ref={trackRef}
      >
        <path
          className="landing-preview-wave-fill"
          d={fillPath}
          ref={fillRef}
        />
        <path className="landing-preview-wave" d={chartPath} ref={waveRef} />
      </g>
      <circle
        className="landing-preview-wave-end"
        cx="516"
        cy={getChartYAtX(points, 516, chartWidth)}
        r="4"
        ref={endpointRef}
      />
    </svg>
  );
}

function Brand({ footer = false }) {
  const { t } = useTranslation();
  return (
    <Link
      className={`landing-brand${footer ? " landing-brand--footer" : ""}`}
      to="/"
      aria-label={t("brand.home")}
    >
      <span className="landing-brand-mark" aria-hidden="true">
        <Activity size={19} strokeWidth={2.4} />
      </span>
      <span className="landing-brand-copy">
        <strong>CIPHER DESK</strong>
        <small>BY SIGLO CAPITAL</small>
      </span>
    </Link>
  );
}

function MarketPreview() {
  const { t } = useTranslation();
  return (
    <section
      className="landing-preview"
      aria-label={t("landing.preview.alt")}
    >
      <div className="landing-preview-orbit landing-preview-orbit--outer" />
      <div className="landing-preview-orbit landing-preview-orbit--inner" />
      <div className="landing-preview-panel">
        <div className="landing-preview-topline">
          <span className="landing-preview-live">
            <i />
            {t("landing.preview.label")}
          </span>
          <span className="landing-preview-mark">
            <AudioLines size={15} />
            {t("landing.preview.mode")}
          </span>
        </div>
        <div className="landing-preview-chart-heading">
          <span>{t("landing.preview.chartLabel")}</span>
          <span>{t("landing.preview.chartWindow")}</span>
        </div>
        <div className="landing-preview-chart">
          <div className="landing-preview-chart-grid" />
          <AnimatedPnlChart />
          <span className="landing-preview-chart-label landing-preview-chart-label--start">
            {t("landing.preview.chartStart")}
          </span>
          <span className="landing-preview-chart-label landing-preview-chart-label--end">
            {t("landing.preview.chartEnd")}
          </span>
        </div>
      </div>
      <p className="landing-preview-disclaimer">
        <span className="landing-preview-dot landing-preview-dot--amber" />
        {t("landing.preview.disclaimer")}
      </p>
    </section>
  );
}

function KairosSection({ onSurgeChange }) {
  const { t } = useTranslation();
  const [simulation, setSimulation] = useState(() => {
    const now = Date.now();
    return {
      activeCount: 18,
      history: createSimulatedKairosHistory(now),
      now,
    };
  });
  const [tradeToasts, setTradeToasts] = useState([]);
  const simulationRef = useRef(simulation);
  const tradeIndexRef = useRef(0);
  const tickIndexRef = useRef(0);
  const isSurgeRef = useRef(false);

  useEffect(() => {
    const intervalId = window.setInterval(() => {
      const previous = simulationRef.current;
      const now = previous.now + kairosTimeStepMs;
      const targetCount =
        kairosActivityCycle[tickIndexRef.current % kairosActivityCycle.length];
      tickIndexRef.current += 1;
      const activeCount = Math.max(
        14,
        Math.min(
          47,
          targetCount + Math.round((Math.random() - 0.5) * 4),
        ),
      );
      const history = [
        ...previous.history.slice(-96),
        {
          timestamp: new Date(now).toISOString(),
          active_count: activeCount,
        },
      ];
      const nextSimulation = { activeCount, history, now };
      const reading = getSignalTideReading(activeCount, history, now);
      const isSurge = reading?.state === "surge";
      if (isSurge !== isSurgeRef.current) {
        isSurgeRef.current = isSurge;
        onSurgeChange(isSurge);
      }
      simulationRef.current = nextSimulation;
      setSimulation(nextSimulation);

      const tickedAt = Date.now();
      let newTradeToast = null;
      if (isSurge) {
        const trade =
          kairosTradeExamples[
            tradeIndexRef.current % kairosTradeExamples.length
          ];
        tradeIndexRef.current += 1;
        newTradeToast = {
          ...trade,
          id: tradeIndexRef.current,
          createdAt: tickedAt,
        };
      }

      setTradeToasts((currentToasts) => {
        const visibleToasts = currentToasts.filter(
          (toast) => tickedAt - toast.createdAt < kairosToastDurationMs,
        );
        if (!newTradeToast) return visibleToasts;
        return [...visibleToasts, newTradeToast].slice(-kairosToastLimit);
      });
    }, kairosTickIntervalMs);

    return () => window.clearInterval(intervalId);
  }, [onSurgeChange]);

  return (
    <section
      className="landing-kairos landing-section"
      id="kairos"
      aria-labelledby="landing-kairos-title"
    >
      <div className="landing-kairos-copy">
        <p className="landing-eyebrow">{t("landing.kairos.eyebrow")}</p>
        <h2 id="landing-kairos-title">{t("landing.kairos.title")}</h2>
        <p className="landing-kairos-description">
          {t("landing.kairos.description")}
        </p>
        <ul className="landing-kairos-points">
          {["index", "momentum", "timeline"].map((key, index) => (
            <li key={key}>
              <span>0{index + 1}</span>
              <div>
                <h3>{t(`landing.kairos.points.${key}.title`)}</h3>
                <p>{t(`landing.kairos.points.${key}.description`)}</p>
              </div>
            </li>
          ))}
        </ul>
      </div>
      <div className="landing-kairos-demo">
        <SignalTide
          activeCount={simulation.activeCount}
          history={simulation.history}
          now={simulation.now}
          preview
        />
        <p className="landing-preview-disclaimer">
          <span className="landing-preview-dot landing-preview-dot--amber" />
          {t("landing.kairos.disclaimer")}
        </p>
      </div>
      {tradeToasts.length > 0 && (
        <div
          className="landing-kairos-toast-stack"
          aria-label={t("landing.kairos.toast.region")}
        >
          {tradeToasts.map((tradeToast) => (
            <div
              key={tradeToast.id}
              className="landing-kairos-toast"
              role="status"
              aria-live="polite"
            >
              <Activity size={14} aria-hidden="true" />
              <div>
                <strong>{t("landing.kairos.toast.title")}</strong>
                <span>
                  {tradeToast.symbol} ·{" "}
                  {t(`landing.kairos.toast.${tradeToast.side}`)}
                </span>
                <small>{t("landing.kairos.toast.detail")}</small>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function Landing() {
  const { t, i18n } = useTranslation();
  const language = i18n.resolvedLanguage === "es" ? "es" : "en";
  const [isKairosSurge, setIsKairosSurge] = useState(false);

  const changeLanguage = (nextLanguage) => {
    i18n.changeLanguage(nextLanguage).catch((error) => {
      console.error("Could not change landing page language:", error);
    });
  };

  return (
    <main
      className={`landing-page${isKairosSurge ? " landing-page--surge" : ""}`}
    >
      <div className="landing-noise" aria-hidden="true" />
      <div className="landing-surge-glow" aria-hidden="true" />
      <header className="landing-header">
        <Brand />
        <nav className="landing-nav" aria-label={t("landing.nav.label")}>
          <a href="#kairos">{t("landing.kairos.nav")}</a>
          <a href="#platform">{t("landing.nav.platform")}</a>
          <a href="#approach">{t("landing.nav.approach")}</a>
          <a href="#principles">{t("landing.nav.principles")}</a>
          <a href="#pricing">{t("landing.nav.pricing")}</a>
        </nav>
        <div className="landing-header-actions">
          <div className="landing-language" aria-label={t("language.label")}>
            {["en", "es"].map((option) => (
              <button
                key={option}
                type="button"
                aria-pressed={language === option}
                onClick={() => changeLanguage(option)}
              >
                {option.toUpperCase()}
              </button>
            ))}
          </div>
          <Link className="landing-login-link" to="/login">
            {t("landing.nav.signIn")}
            <ArrowRight size={15} aria-hidden="true" />
          </Link>
        </div>
      </header>

      <section className="landing-hero" aria-labelledby="landing-title">
        <div className="landing-hero-copy">
          <p className="landing-eyebrow">
            <span />
            {t("landing.hero.eyebrow")}
          </p>
          <h1 id="landing-title">{t("landing.hero.title")}</h1>
          <p className="landing-hero-description">
            {t("landing.hero.description")}
          </p>
          <div className="landing-hero-actions">
            <a className="landing-button landing-button--primary" href="#platform">
              {t("landing.hero.primary")}
              <ArrowRight size={17} aria-hidden="true" />
            </a>
            <Link className="landing-button landing-button--secondary" to="/login">
              {t("landing.hero.secondary")}
            </Link>
          </div>
          <p className="landing-hero-footnote">
            <ShieldCheck size={15} aria-hidden="true" />
            {t("landing.hero.footnote")}
          </p>
        </div>
        <MarketPreview />
        <div className="landing-scroll-cue" aria-hidden="true">
          <span />
          {t("landing.hero.scroll")}
        </div>
      </section>

      <KairosSection onSurgeChange={setIsKairosSurge} />

      <section
        className="landing-platform landing-section"
        id="platform"
        aria-labelledby="landing-platform-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">{t("landing.platform.eyebrow")}</p>
          <h2 id="landing-platform-title">{t("landing.platform.title")}</h2>
          <p>{t("landing.platform.description")}</p>
        </div>
        <div className="landing-platform-grid">
          {platformCards.map((card, index) => (
            <article className="landing-platform-card" key={card.key}>
              <span className="landing-card-icon">
                {createElement(card.Icon, {
                  size: 20,
                  strokeWidth: 1.7,
                  "aria-hidden": "true",
                })}
              </span>
              <span className="landing-card-index">
                0{index + 1} / {t("landing.platform.cardLabel")}
              </span>
              <h3>{t(`landing.platform.cards.${card.key}.title`)}</h3>
              <p>{t(`landing.platform.cards.${card.key}.description`)}</p>
              <a href="#approach" aria-label={t("landing.platform.learnMore")}>
                <ArrowRight size={16} aria-hidden="true" />
              </a>
            </article>
          ))}
        </div>
      </section>

      <section
        className="landing-approach landing-section"
        id="approach"
        aria-labelledby="landing-approach-title"
      >
        <div className="landing-approach-intro">
          <p className="landing-eyebrow">{t("landing.approach.eyebrow")}</p>
          <h2 id="landing-approach-title">{t("landing.approach.title")}</h2>
          <p>{t("landing.approach.description")}</p>
        </div>
        <ol className="landing-steps">
          {approachSteps.map((key, index) => (
            <li key={key}>
              <span>0{index + 1}</span>
              <div>
                <h3>{t(`landing.approach.steps.${key}.title`)}</h3>
                <p>{t(`landing.approach.steps.${key}.description`)}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section
        className="landing-principles landing-section"
        id="principles"
        aria-labelledby="landing-principles-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">{t("landing.principles.eyebrow")}</p>
          <h2 id="landing-principles-title">
            {t("landing.principles.title")}
          </h2>
          <p>{t("landing.principles.description")}</p>
        </div>
        <div className="landing-principles-grid">
          {principles.map((principle) => (
            <article key={principle.key}>
              {createElement(principle.Icon, {
                size: 19,
                strokeWidth: 1.7,
                "aria-hidden": "true",
              })}
              <h3>{t(`landing.principles.items.${principle.key}.title`)}</h3>
              <p>{t(`landing.principles.items.${principle.key}.description`)}</p>
            </article>
          ))}
        </div>
        <p className="landing-disclaimer">
          <ShieldCheck size={18} aria-hidden="true" />
          <span>{t("landing.principles.disclaimer")}</span>
        </p>
      </section>

      <section
        className="landing-pricing landing-section"
        id="pricing"
        aria-labelledby="landing-pricing-title"
      >
        <div className="landing-section-heading">
          <p className="landing-eyebrow">{t("landing.pricing.eyebrow")}</p>
          <h2 id="landing-pricing-title">{t("landing.pricing.title")}</h2>
          <p>{t("landing.pricing.description")}</p>
        </div>
        <div className="landing-pricing-grid">
          {pricingPlans.map((plan) => (
            <article
              className={`landing-pricing-card landing-pricing-card--${PLAN_IDENTITIES[plan.key].tone}${plan.featured ? " landing-pricing-card--featured" : ""}`}
              key={plan.key}
            >
              {plan.featured && (
                <span className="landing-pricing-badge">
                  <Sparkles size={13} aria-hidden="true" />
                  {t("landing.pricing.recommended")}
                </span>
              )}
              <span className="landing-plan-icon" aria-hidden="true">
                {createElement(PLAN_IDENTITIES[plan.key].icon, {
                  size: 18,
                  strokeWidth: 1.9,
                })}
              </span>
              <p className="landing-pricing-name">
                {t(`landing.pricing.plans.${plan.key}.name`)}
              </p>
              <p className="landing-pricing-summary">
                {t(`landing.pricing.plans.${plan.key}.summary`)}
              </p>
              <p className="landing-pricing-price">
                <strong>
                  {t(`landing.pricing.plans.${plan.key}.price`)}
                </strong>
                <span>{t("landing.pricing.perMonth")}</span>
              </p>
              <ul>
                {Array.from({ length: plan.featureCount }, (_, index) => (
                  <li key={index}>
                    <Check size={15} aria-hidden="true" />
                    {t(`landing.pricing.plans.${plan.key}.features.${index}`)}
                  </li>
                ))}
              </ul>
              <span className="landing-pricing-unavailable">
                {t("landing.pricing.notAvailable")}
              </span>
            </article>
          ))}
        </div>
        <aside className="landing-pricing-idea">
          <span className="landing-pricing-idea-icon">
            <Waves size={19} aria-hidden="true" />
          </span>
          <div>
            <span className="landing-pricing-idea-label">
              {t("landing.pricing.futureLabel")}
            </span>
            <h3>{t("landing.pricing.futureName")}</h3>
            <p>{t("landing.pricing.futureDescription")}</p>
          </div>
          <p className="landing-pricing-idea-price">
            <strong>{t("landing.pricing.futurePrice")}</strong>
          </p>
        </aside>
        <p className="landing-pricing-note">
          <ShieldCheck size={16} aria-hidden="true" />
          {t("landing.pricing.note")}
        </p>
      </section>

      <section className="landing-access" aria-labelledby="landing-access-title">
        <div>
          <p className="landing-eyebrow">{t("landing.access.eyebrow")}</p>
          <h2 id="landing-access-title">{t("landing.access.title")}</h2>
          <p>{t("landing.access.description")}</p>
        </div>
        <div className="landing-access-actions">
          <Link className="landing-button landing-button--primary" to="/login">
            {t("landing.access.signIn")}
            <ArrowRight size={17} aria-hidden="true" />
          </Link>
          <span className="landing-coming-soon">
            <CircleDot size={14} aria-hidden="true" />
            {t("landing.access.soon")}
          </span>
        </div>
      </section>

      <footer className="landing-footer">
        <Brand footer />
        <p>{t("landing.footer.disclaimer")}</p>
        <div>
          <a href="#platform">{t("landing.footer.platform")}</a>
          <Link to="/status">{t("landing.footer.status")}</Link>
          <span>© {new Date().getFullYear()} SIGLO CAPITAL</span>
        </div>
      </footer>
    </main>
  );
}
