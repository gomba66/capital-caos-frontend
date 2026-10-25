import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";
import App from "../App";

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
