import { act, cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import { BrowserRouter } from "react-router-dom";
import Landing from "../Landing";
import i18n from "../../i18n";

function renderLanding() {
  return render(
    <BrowserRouter>
      <Landing />
    </BrowserRouter>,
  );
}

describe("Landing", () => {
  beforeEach(async () => {
    await i18n.changeLanguage("en");
  });

  afterEach(async () => {
    cleanup();
    await i18n.changeLanguage("en");
  });

  test("presents the platform, process, access status, and account entry", () => {
    renderLanding();

    expect(
      screen.getByRole("heading", { name: "A clearer read on the markets." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", {
        name: "PnL trend preview",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "What is Cipher Kairos?" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Cipher Kairos index/ }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("img", { name: /Kairos index timeline/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("39")).not.toBeInTheDocument();
    expect(screen.queryByText("ACTIVE PAIRS")).not.toBeInTheDocument();
    expect(screen.getByText("PERFORMANCE TREND")).toBeInTheDocument();
    expect(
      screen.getByText(/Demo view · chart data does not represent live market or account activity/),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".landing-preview-panel"),
    ).not.toContainElement(screen.getByText(/Demo view/));
    expect(screen.getByTestId("landing-chart")).toBeInTheDocument();
    expect(screen.getByText("A single activity index")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Cipher Kairos" }),
    ).toHaveAttribute("href", "#kairos");
    expect(document.querySelector("#kairos .signal-tide")).toBeInTheDocument();
    expect(document.querySelector("#kairos .landing-preview-chart")).toBeNull();
    expect(document.querySelector(".landing-preview .signal-tide")).toBeNull();
    expect(
      screen.getByRole("heading", { name: "Context before action." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Pricing" }),
    ).toHaveAttribute("href", "#pricing");
    expect(
      screen.getByRole("heading", { name: "Plans that can grow with you." }),
    ).toBeInTheDocument();
    expect(screen.getByText("$19")).toBeInTheDocument();
    expect(screen.getByText("$29")).toBeInTheDocument();
    expect(screen.getByText("$59")).toBeInTheDocument();
    expect(screen.getByText("Future integrations")).toBeInTheDocument();
    expect(screen.getByText("Scope")).toBeInTheDocument();
    expect(screen.getAllByText("Kairos")).toHaveLength(1);
    expect(screen.getByText("Cosmos")).toBeInTheDocument();
    expect(
      document.querySelector(".landing-pricing-card--scope .landing-plan-icon svg"),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".landing-pricing-card--kairos .landing-plan-icon svg"),
    ).toBeInTheDocument();
    expect(
      document.querySelector(".landing-pricing-card--cosmos .landing-plan-icon svg"),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Access to two TradingView indicators"),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/ideas for the future, not current features/),
    ).toBeInTheDocument();
    expect(
      screen.getAllByText("Payments not available yet"),
    ).toHaveLength(3);
    expect(
      screen.getByText("Access requests opening soon"),
    ).toBeInTheDocument();
    expect(
      screen.getAllByRole("link", { name: /Sign in/ })[0],
    ).toHaveAttribute("href", "/login");
    expect(
      screen.getByRole("link", { name: "System status" }),
    ).toHaveAttribute("href", "/status");
  });

  test("renders a clean Kairos widget with its demo disclosure outside the component", () => {
    renderLanding();

    expect(screen.getByRole("heading", { name: "What is Cipher Kairos?" })).toBeInTheDocument();
    expect(screen.getByText("QUIET ORBIT")).toBeInTheDocument();
    expect(screen.queryByText("SIMULATED")).not.toBeInTheDocument();
    expect(screen.getByText("KAIROS TIMELINE")).toBeInTheDocument();
    expect(
      screen.getByText(/Demo values and position events · no live market data or real orders/),
    ).toBeInTheDocument();
    expect(
      document.querySelector("#kairos .signal-tide"),
    ).not.toContainElement(screen.getByText(/Demo values and position events/));
    expect(
      document.querySelector(
        "#kairos .signal-tide-needle--calibrating .signal-tide-needle-wobble",
      ),
    ).toBeInTheDocument();
  });

  test("varies the Kairos index and announces simulated trades during surges", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-10-25T12:00:00.000Z"));
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    vi.spyOn(window, "requestAnimationFrame").mockReturnValue(1);

    try {
      renderLanding();
      const getIndexScore = () => {
        const label = screen
          .getByRole("img", { name: /Cipher Kairos index \d+ out of 100/ })
          .getAttribute("aria-label");
        return Number(label.match(/index (\d+) out of 100/)[1]);
      };
      const initialScore = getIndexScore();

      const observedSymbols = new Set();
      for (let tick = 0; tick < 13; tick += 1) {
        await act(async () => {
          await vi.advanceTimersByTimeAsync(4000);
        });
        if (tick >= 8) {
          screen
            .queryAllByText(/(?:BTC|ETH|SOL)\/USDT/)
            .forEach((symbol) =>
              observedSymbols.add(symbol.textContent.split(" ·")[0]),
            );
        }
      }

      expect(getIndexScore()).not.toBe(initialScore);
      expect(document.querySelector(".landing-page")).toHaveClass(
        "landing-page--surge",
      );
      expect(document.querySelector(".landing-surge-glow")).toHaveAttribute(
        "aria-hidden",
        "true",
      );
      expect(
        screen.getByRole("img", { name: /MOMENTUM CONVERGENCE/ }),
      ).toBeVisible();
      expect(screen.getAllByRole("status")).toHaveLength(2);
      expect(screen.getAllByText("POSITION OPENED")).toHaveLength(2);
      const toastSymbols = screen.getAllByText(/(?:BTC|ETH|SOL)\/USDT/);
      expect(toastSymbols).toHaveLength(2);
      expect(observedSymbols).toEqual(
        new Set(["BTC/USDT", "ETH/USDT", "SOL/USDT"]),
      );
      expect(
        screen.getAllByText("Market momentum threshold reached"),
      ).toHaveLength(2);
      const toastStack = document.querySelector(".landing-kairos-toast-stack");
      expect(toastStack).toBeInTheDocument();
      expect(document.querySelector(".landing-kairos-demo")).not.toContainElement(
        toastStack,
      );
    } finally {
      cleanup();
      vi.useRealTimers();
      vi.restoreAllMocks();
    }
  });

  test("keeps the simulated performance chart moving alongside Kairos", () => {
    vi.spyOn(Math, "random").mockReturnValue(0.5);
    const frames = new Map();
    let nextFrameId = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      const frameId = ++nextFrameId;
      frames.set(frameId, callback);
      return frameId;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((frameId) => {
      frames.delete(frameId);
    });

    const advanceFrame = (timestamp) => {
      const [frameId, callback] = frames.entries().next().value;
      frames.delete(frameId);
      act(() => callback(timestamp));
    };

    try {
      renderLanding();
      const track = screen.getByTestId("landing-chart-track");
      const chartLine = screen.getByTestId("landing-chart").querySelector(
        ".landing-preview-wave",
      );
      const initialPath = chartLine.getAttribute("d");

      advanceFrame(0);
      const initialTrackPosition = track.getAttribute("transform");
      advanceFrame(2400);
      expect(track.getAttribute("transform")).not.toBe(initialTrackPosition);
      expect(chartLine.getAttribute("d")).toBe(initialPath);

      advanceFrame(32_400);
      expect(chartLine.getAttribute("d")).not.toBe(initialPath);
    } finally {
      cleanup();
      vi.restoreAllMocks();
    }
  });

  test("switches the complete landing page to Spanish", async () => {
    renderLanding();

    fireEvent.click(screen.getByRole("button", { name: "ES" }));

    expect(
      await screen.findByRole("heading", {
        name: "Una lectura más clara del mercado.",
      }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "ES" }),
    ).toHaveAttribute("aria-pressed", "true");
    expect(
      screen.getByText(/no brinda asesoría financiera personalizada/),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Planes que pueden crecer contigo." }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "¿Qué es Cipher Kairos?" }),
    ).toBeInTheDocument();
    expect(screen.getByText("TENDENCIA DE RENDIMIENTO")).toBeInTheDocument();
    expect(screen.queryByText("PARES ACTIVOS")).not.toBeInTheDocument();
    expect(
      screen.getByText("HOJA DE RUTA · NO DISPONIBLE ACTUALMENTE"),
    ).toBeInTheDocument();
  });
});
