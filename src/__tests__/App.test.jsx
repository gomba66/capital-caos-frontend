import { cleanup, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "../App";
import AppRoot from "../AppRoot";

vi.mock("../api/version", () => ({
  getBackendVersion: vi.fn().mockResolvedValue(null),
}));

vi.mock("../utils/currencyConverter", () => ({
  initializeExchangeRates: vi.fn().mockResolvedValue(undefined),
}));

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
});

test("shows the landing page when the current session is unauthorized", async () => {
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url) => {
      if (url === "/api/auth/me") {
        return { ok: false, status: 401 };
      }
      throw new Error(`Unexpected request: ${url}`);
    }),
  );

  render(<App />);

  expect(
    await screen.findByRole("heading", {
      name: "A clearer read on the markets.",
    }),
  ).toBeInTheDocument();
});

test("applies a theme changed on another device without writing it back", async () => {
  const account = {
    id: 1,
    email: "a@b.c",
    role: "user",
    features: [],
    plan_code: "free",
    language_preference: "en",
    theme_mode: "dark",
    theme_palette: "classic",
  };
  const saves = [];
  vi.stubGlobal(
    "fetch",
    vi.fn(async (url, options = {}) => {
      if (url === "/api/auth/preferences") {
        saves.push(JSON.parse(options.body));
        return { ok: true, status: 200, json: async () => ({
          theme_mode: saves.at(-1).mode,
          theme_palette: saves.at(-1).palette,
        }) };
      }
      if (url === "/api/auth/me") {
        return { ok: true, status: 200, json: async () => ({ ...account }) };
      }
      return { ok: true, status: 200, json: async () => ({}) };
    }),
  );

  render(<AppRoot />);
  await waitFor(() =>
    expect(document.documentElement.dataset.theme).toBe("dark"),
  );
  saves.length = 0;

  account.theme_mode = "light";
  window.dispatchEvent(new Event("focus"));

  await waitFor(() =>
    expect(document.documentElement.dataset.theme).toBe("light"),
  );
  await new Promise((resolve) => setTimeout(resolve, 100));
  expect(saves).toEqual([]);
});
