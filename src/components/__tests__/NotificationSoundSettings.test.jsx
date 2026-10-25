import { render, screen } from "@testing-library/react";
import NotificationSoundSettings from "../NotificationSoundSettings";
import { AuthContext } from "../../contexts/authState";

function renderSettings(features) {
  return render(
    <AuthContext.Provider
      value={{
        user: { role: "member", features },
        updateNotificationSoundPreferences: vi.fn(),
      }}
    >
      <NotificationSoundSettings />
    </AuthContext.Provider>,
  );
}

test("Kairos members can configure Kairos sounds but not trade sounds", () => {
  renderSettings(["signals", "kairos", "trade_notifications"]);

  expect(
    screen.getByRole("combobox", { name: "Kairos index peak" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("combobox", { name: "Kairos convergence" }),
  ).toBeInTheDocument();
  expect(
    screen.queryByRole("combobox", { name: "Trade opened" }),
  ).not.toBeInTheDocument();
  expect(
    screen.queryByRole("combobox", { name: "Trade closed" }),
  ).not.toBeInTheDocument();
});

test("Cosmos members can configure all notification sounds", () => {
  renderSettings([
    "signals",
    "kairos",
    "trade_notifications",
    "bot_trades",
    "indicators",
  ]);

  expect(
    screen.getByRole("combobox", { name: "Trade opened" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("combobox", { name: "Trade closed" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("combobox", { name: "Kairos index peak" }),
  ).toBeInTheDocument();
  expect(
    screen.getByRole("combobox", { name: "Kairos convergence" }),
  ).toBeInTheDocument();
});
