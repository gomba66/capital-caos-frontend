import { afterEach, expect, test, vi } from "vitest";
import { showBrowserNotification } from "../browserNotifications";

afterEach(() => {
  vi.unstubAllGlobals();
});

test("shows a silent desktop notification only when the page is hidden and permission is granted", () => {
  const BrowserNotification = vi.fn(function (title, options) {
    this.title = title;
    this.options = options;
    this.close = vi.fn();
  });
  BrowserNotification.permission = "granted";
  vi.stubGlobal("Notification", BrowserNotification);
  vi.stubGlobal("document", { visibilityState: "hidden" });
  vi.stubGlobal("window", { focus: vi.fn() });

  expect(
    showBrowserNotification({
      title: "Trade opened",
      body: "LONG position",
      tag: "trade-1",
    }),
  ).toBe(true);

  expect(BrowserNotification).toHaveBeenCalledWith("Trade opened", {
    body: "LONG position",
    tag: "trade-1",
    silent: true,
  });
  const notification = BrowserNotification.mock.instances[0];
  notification.onclick();
  expect(window.focus).toHaveBeenCalledOnce();
  expect(notification.close).toHaveBeenCalledOnce();
});

test("does not show notifications when the page is visible or permission is missing", () => {
  const BrowserNotification = vi.fn();
  BrowserNotification.permission = "default";
  vi.stubGlobal("Notification", BrowserNotification);
  vi.stubGlobal("document", { visibilityState: "visible" });
  vi.stubGlobal("window", {});

  expect(showBrowserNotification({ title: "Trade", body: "Opened" })).toBe(
    false,
  );
});
