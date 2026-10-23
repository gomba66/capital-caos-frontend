import { I18nextProvider } from "react-i18next";
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import i18n from "../../i18n";
import SignalTide from "../SignalTide";

const now = Date.now();

function renderSignalTide(activeCount, history = []) {
  return render(
    <I18nextProvider i18n={i18n}>
      <SignalTide activeCount={activeCount} history={history} />
    </I18nextProvider>,
  );
}

describe("SignalTide", () => {
  it("renders the index, current signal count, and comparison warming state", () => {
    const { container } = renderSignalTide(12);

    expect(screen.getByRole("region", { name: "Cipher Kairos" })).toBeVisible();
    expect(container.querySelector(".signal-tide-eyebrow")).not.toBeInTheDocument();
    expect(screen.getByText("12")).toBeVisible();
    expect(screen.getByText("QUIET ORBIT")).toBeVisible();
    expect(screen.getAllByText("Collecting...")).toHaveLength(3);
    expect(screen.getByText(/Waiting for the first scan snapshots/)).toBeVisible();
    expect(
      screen.getByText(/waiting for the tide to prove it has turned/i),
    ).toBeVisible();
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
    expect(screen.getByText("SIGNAL CONVERGENCE")).toBeVisible();
    expect(container.querySelector(".signal-tide--surge")).toBeInTheDocument();
    expect(screen.getByRole("img", { name: /Cipher Kairos index/ })).toBeVisible();
    expect(
      screen.getByRole("img", { name: /Kairos index timeline/ }),
    ).toBeVisible();
    expect(document.querySelector(".signal-tide-disturbance")).toBeInTheDocument();
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
    expect(screen.queryByText("SIGNAL CONVERGENCE")).not.toBeInTheDocument();
  });
});
