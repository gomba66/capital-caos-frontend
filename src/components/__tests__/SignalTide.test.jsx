import { I18nextProvider } from "react-i18next";
import { act, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import i18n from "../../i18n";
import SignalTide from "../SignalTide";

const now = Date.now();

function renderSignalTide(activeCount, history = [], preview = false) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SignalTide activeCount={activeCount} history={history} preview={preview} />
    </I18nextProvider>,
  );
}

describe("SignalTide", () => {
  it("renders the index and comparison warming state without exposing pair counts", () => {
    const { container } = renderSignalTide(12);

    expect(screen.getByRole("region", { name: "Cipher Kairos" })).toBeVisible();
    expect(container.querySelector(".signal-tide-eyebrow")).not.toBeInTheDocument();
    expect(container.querySelector(".signal-tide-current")).not.toBeInTheDocument();
    expect(screen.queryByText("ACTIVE PAIRS")).not.toBeInTheDocument();
    expect(screen.queryByText("12")).not.toBeInTheDocument();
    expect(screen.getByText("QUIET ORBIT")).toBeVisible();
    expect(screen.getAllByText("Collecting...")).toHaveLength(3);
    expect(screen.getByText(/Waiting for initial market readings/)).toBeVisible();
    expect(
      screen.getByText(/waiting for momentum to confirm a change/i),
    ).toBeVisible();
  });

  it("keeps preview disclosures outside the widget and animates its needle", () => {
    const { container } = renderSignalTide(25, [], true);

    expect(container.querySelector(".signal-tide-live")).not.toBeInTheDocument();
    expect(screen.queryByText("SIMULATED")).not.toBeInTheDocument();
    expect(
      container.querySelector(
        ".signal-tide-needle--calibrating .signal-tide-needle-wobble",
      ),
    ).toBeInTheDocument();
    expect(document.body.style.getPropertyValue("--signal-tide-glow-x")).toBe("");
  });

  it("renders signal momentum comparisons when historical windows are available", () => {
    const { container } = renderSignalTide(30, [
      ...[11.5, 10.5, 9.5, 8.5, 7.5, 6.5].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 0,
      })),
      ...[5.5, 4.5, 3.5, 2.5].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 2,
      })),
      {
        timestamp: new Date(now - 1.9 * 60 * 60 * 1000).toISOString(),
        active_count: 10,
      },
      {
        timestamp: new Date(now - 1.6 * 60 * 60 * 1000).toISOString(),
        active_count: 10,
      },
      {
        timestamp: new Date(now - 1.3 * 60 * 60 * 1000).toISOString(),
        active_count: 10,
      },
      ...[
        [0.8, 15],
        [0.6, 20],
        [0.4, 25],
        [0.2, 28],
      ].map(([hoursAgo, active_count]) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count,
      })),
    ]);

    expect(screen.getByText("+12")).toBeVisible();
    expect(screen.getByText("+11")).toBeVisible();
    expect(screen.getByText("3 / 3")).toBeVisible();
    expect(screen.getByText("MOMENTUM CONVERGENCE")).toBeVisible();
    expect(container.querySelector(".signal-tide--surge")).toBeInTheDocument();
    expect(
      container.querySelector(".signal-tide--surge .signal-tide-needle-wobble"),
    ).toBeInTheDocument();
    expect(document.body.style.getPropertyValue("--signal-tide-glow-x")).toBe("0px");
    expect(document.body.style.getPropertyValue("--signal-tide-glow-y")).toBe("0px");
    expect(screen.getByRole("img", { name: /Cipher Kairos index/ })).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Kairos index timeline/ }),
    ).toBeVisible();
    expect(
      container.querySelector(".signal-tide-timeline-line"),
    ).toHaveAttribute("pathLength", "1");
    expect(document.querySelector(".signal-tide-disturbance")).toBeInTheDocument();
    expect(
      container.querySelector(".signal-tide-disturbance .signal-tide-current-wave"),
    ).not.toBeInTheDocument();
  });

  it("smoothly interpolates the preview index and gauge needle", () => {
    const callbacks = new Map();
    let nextFrameId = 0;
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) => {
      const id = ++nextFrameId;
      callbacks.set(id, callback);
      return id;
    });
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) => {
      callbacks.delete(id);
    });

    const history = [
      {
        timestamp: new Date(now - 90 * 60 * 1000).toISOString(),
        active_count: 0,
      },
      {
        timestamp: new Date(now - 30 * 60 * 1000).toISOString(),
        active_count: 25,
      },
    ];
    const runNextFrame = (timestamp) => {
      const [id, callback] = callbacks.entries().next().value;
      callbacks.delete(id);
      act(() => callback(timestamp));
    };

    try {
      const { container, rerender } = renderSignalTide(12, history, true);
      const gauge = container.querySelector(".signal-tide-gauge");
      const initialScore = Number(
        container.querySelector(".signal-tide-score").textContent,
      );
      rerender(
        <I18nextProvider i18n={i18n}>
          <SignalTide
            activeCount={30}
            history={history}
            now={now}
            preview
          />
        </I18nextProvider>,
      );
      const targetScore = Number(
        gauge.getAttribute("aria-label").match(/index (\d+) out of 100/)[1],
      );

      runNextFrame(0);
      expect(
        Number(container.querySelector(".signal-tide-score").textContent),
      ).toBe(initialScore);
      runNextFrame(1100);
      const intermediateScore = Number(
        container.querySelector(".signal-tide-score").textContent,
      );
      expect(intermediateScore).toBeGreaterThan(initialScore);
      expect(intermediateScore).toBeLessThan(targetScore);
      runNextFrame(2200);
      expect(
        Number(container.querySelector(".signal-tide-score").textContent),
      ).toBe(targetScore);
    } finally {
      vi.restoreAllMocks();
    }
  });

  it("distinguishes warming history from a confirmed signal build-up", () => {
    const { container } = renderSignalTide(25, [
      {
        timestamp: new Date(now - 20 * 60 * 1000).toISOString(),
        active_count: 20,
      },
    ]);

    expect(screen.getByText("CALIBRATING")).toBeVisible();
    expect(
      container.querySelector(".signal-tide-calibrating-gear"),
    ).toBeVisible();
    expect(
      container.querySelector(".signal-tide-needle--calibrating .signal-tide-needle-wobble"),
    ).toBeInTheDocument();
    expect(screen.queryByText(/20 active pairs|entry floor/i)).not.toBeInTheDocument();
    expect(screen.queryByText("MOMENTUM CONVERGENCE")).not.toBeInTheDocument();
  });

  it("positions samples on a fixed 24-hour timeline", () => {
    const { container } = renderSignalTide(25, [
      {
        timestamp: new Date(now - 60 * 60 * 1000).toISOString(),
        active_count: 20,
      },
    ]);
    const timelineLine = container.querySelector(".signal-tide-timeline-line");
    const [, startX] = timelineLine.getAttribute("d").match(/^M([^,]+),/);

    expect(Number(startX)).toBeGreaterThan(95);
    expect(Number(startX)).toBeLessThan(97);
  });

  it("pulses a recent level-75 crossing only at the current marker", () => {
    const history = [
      ...[11.5, 10.5, 9.5, 8.5, 7.5, 6.5].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 0,
      })),
      ...[5.5, 5, 4.5, 4, 3.5, 3, 2.5].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 20,
      })),
      ...[1.8, 1.5, 1.2].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 0,
      })),
      ...[0.8, 0.5, 0.05].map((hoursAgo) => ({
        timestamp: new Date(now - hoursAgo * 60 * 60 * 1000).toISOString(),
        active_count: 20,
      })),
    ];
    const { container } = renderSignalTide(20, history);

    expect(container.querySelector(".signal-tide-current-wave")).toBeInTheDocument();
    expect(
      container.querySelector(".signal-tide-disturbance .signal-tide-current-wave"),
    ).not.toBeInTheDocument();
  });
});
